import type { GameScene } from '../scenes/GameScene';
import { characterProfiles } from '../systems/CharacterProfiles';
import { coopSession, COOP_AREAS } from '../network/CoopSession';
import { coopEndpoint } from '../network/CoopEndpoint';
import { roomCode, invitationLink, clearInvitation, setInvitation } from '../network/CoopInvitation';
import { CLASS_NAMES } from '../config/classes';
import { CharacterSelection } from './CharacterSelection';
import { AUDIO } from '../config/audio';

type Page = 'home' | 'pause' | 'characters' | 'create' | 'settings' | 'coop' | 'coop-ended';
type Volumes = { master: number; music: number; sfx: number };
const LAUNCH_KEY = 'echoes-of-dante.launch-once';
const CHARACTERS_ONCE_KEY = 'echoes-of-dante.characters-once';
const INVITE_CHARACTER_KEY = 'echoes-of-dante.invite-character-once';
const SETTINGS_KEY = 'echoes-of-dante.settings.v1';

export class ApplicationShell {
  private readonly dialog = document.createElement('dialog');
  private readonly menuButton = document.createElement('button');
  private readonly content: HTMLElement;
  private scene?: GameScene;
  private selection?: CharacterSelection;
  private launchOnce = false;
  private launching = false;
  private page: Page = 'home';
  private playing = false;
  private readonly invitation = new URL(location.href).searchParams.get('sala');
  private coopCode = roomCode(location.href) ?? '';
  private inviteAttempted = false;
  private pendingJoin = this.invitation !== null && !!this.coopCode;
  private inviteApproved = false;
  private waitingForFriend = false;
  private coopBusy = false;
  private connectionAttempt = 0;
  private padPrevious: boolean[] = [];
  private padFrame = 0;
  private readonly qaAutoplay = import.meta.env.DEV && new URLSearchParams(location.search).get('qa') === 'play';
  private volumes: Volumes = { master: AUDIO.master, music: AUDIO.music, sfx: AUDIO.sfx };

  constructor() {
    try {
      this.launchOnce = sessionStorage.getItem(LAUNCH_KEY) === characterProfiles.active.id;
      sessionStorage.removeItem(LAUNCH_KEY);
      if (sessionStorage.getItem(CHARACTERS_ONCE_KEY)) { this.page = 'characters'; this.launchOnce = false; }
      sessionStorage.removeItem(CHARACTERS_ONCE_KEY);
    } catch { /* Storage unavailable: the ordinary start menu stays accessible. */ }
    try {
      const approval = JSON.parse(sessionStorage.getItem(INVITE_CHARACTER_KEY) ?? 'null');
      sessionStorage.removeItem(INVITE_CHARACTER_KEY);
      this.inviteApproved = this.pendingJoin && approval?.code === this.coopCode && approval?.id === characterProfiles.active.id;
    } catch { /* Without a one-use approval, ask for the character again. */ }
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
      for (const k of ['master', 'music', 'sfx'] as const) if (typeof saved?.[k] === 'number' && Number.isFinite(saved[k]))
        this.volumes[k] = Math.max(0, Math.min(1, saved[k]));
    } catch { /* Defaults are playable. */ }
    this.menuButton.className = 'main-menu-button'; this.menuButton.textContent = 'MENU';
    this.menuButton.type = 'button'; this.menuButton.setAttribute('aria-label', 'Abrir menu — Esc');
    this.menuButton.addEventListener('click', () => this.openPause());
    this.menuButton.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { e.preventDefault(); this.openPause(); } });
    this.menuButton.addEventListener('touchend', e => e.preventDefault(), { passive: false });
    this.dialog.className = 'application-shell'; this.dialog.setAttribute('aria-labelledby', 'shell-title');
    this.dialog.style.backgroundImage = `linear-gradient(105deg,#061512e8,#071310e8), url('${import.meta.env.BASE_URL}assets/visual/environment/dunes-ground.webp')`;
    this.dialog.innerHTML = `<div class="shell-layout"><section class="shell-brand"><small>DANTE · EXPEDIÇÃO</small><h1>ECHOES<br>OF DANTE</h1><p>O planeta ainda está à escuta.</p></section><section class="shell-content"></section></div>`;
    this.content = this.dialog.querySelector('.shell-content')!;
    this.dialog.addEventListener('cancel', e => { e.preventDefault(); if (this.playing && this.page !== 'coop-ended') this.resume(); });
    document.body.append(this.menuButton, this.dialog);
    window.addEventListener('keydown', this.keyDown, true);
    // Phaser's keyboard captures are global even while the scene is paused.
    // Run after the field's own handlers, before Phaser's window listeners;
    // preserve text input, Enter submission, accents, paste and browser defaults.
    window.addEventListener('keydown', this.editableKey);
    window.addEventListener('keyup', this.editableKey);
    window.addEventListener('dante-coop', this.coopChanged);
    if (this.invitation !== null) { this.page = this.pendingJoin && !this.inviteApproved ? 'characters' : 'coop'; this.launchOnce = false; }
    if (!characterProfiles.list.length) this.page = this.invitation !== null ? 'create' : 'characters';
    this.render();
    if (this.invitation !== null || this.page === 'characters' || (!this.qaAutoplay && !this.launchOnce)) { this.dialog.showModal(); document.body.classList.add('shell-open'); }
    this.pollPad();
  }

  bind(scene: GameScene): void {
    this.scene = scene; this.applyVolumes();
    if (coopSession.endedMessage) { this.showEndedVisit(); return; }
    if (this.dialog.open) scene.pauseForShell();
    else if (this.qaAutoplay || this.launchOnce) this.playing = true;
    // Asset loading may finish after the player has selected a preview or begun
    // typing. These forms do not depend on scene readiness: keep their state.
    if (!this.selection) {
      this.render();
      if (this.dialog.open) (this.content.querySelector('button:not(:disabled)') as HTMLButtonElement)?.focus();
    }
    if (this.page === 'coop' && this.invitation !== null && !this.inviteAttempted && characterProfiles.list.length && (!this.coopCode || this.inviteApproved)) {
      this.inviteAttempted = true;
      if (this.coopCode) this.connectCoop('join');
      else this.status('Este convite está incompleto. Peça um novo link ao seu amigo ou cole o código da sala.');
    }
  }
  private keyDown = (event: KeyboardEvent): void => {
    if (event.code !== 'Escape' || event.repeat) return;
    if (document.querySelector('dialog[open]:not(.application-shell)')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (this.dialog.open) { if (this.playing && this.page !== 'coop-ended') this.resume(); }
    else this.openPause();
  };
  private openPause(): void {
    if (this.dialog.open || !this.scene?.pauseForShell()) return;
    this.page = 'pause'; this.render(); this.dialog.showModal(); document.body.classList.add('shell-open');
    (this.content.querySelector('button') as HTMLButtonElement)?.focus();
  }
  private resume(): void {
    if (coopSession.endedMessage) return;
    if (!characterProfiles.list.length) { this.show('create'); return; }
    if (!this.scene) return;
    if (this.pendingJoin && !this.inviteAttempted) this.cancelInvitation();
    if (this.coopBusy || coopSession.role === 'connecting') {
      this.connectionAttempt++; this.coopBusy = false; this.inviteAttempted = true;
      clearInvitation(); coopSession.disconnect(false);
    }
    this.selection?.destroy(); this.selection = undefined;
    this.waitingForFriend = false;
    this.playing = true; this.dialog.close(); document.body.classList.remove('shell-open');
    this.scene.resumeFromShell(); this.scene.game.canvas.focus({ preventScroll: true });
  }
  private show(page: Page): void {
    this.page = page; this.render();
    const selector = page === 'create' ? '[data-class="warrior"]' : page === 'characters' ? '.saved-character[aria-pressed="true"]' : 'button:not(:disabled)';
    (this.content.querySelector<HTMLButtonElement>(selector) ?? this.content.querySelector<HTMLButtonElement>('[data-shell="new-character"]'))?.focus({ preventScroll: true });
  }
  private action(label: string, id: string, callback: () => void): HTMLButtonElement {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.dataset.shell = id;
    b.addEventListener('click', callback); this.content.append(b); return b;
  }
  private heading(title: string, subtitle: string): void {
    const h = document.createElement('h2'); h.id = 'shell-title'; h.textContent = title;
    const p = document.createElement('p'); p.textContent = subtitle; this.content.append(h, p);
  }
  private status(text: string): void {
    let p = this.content.querySelector('.shell-status');
    if (!p) { p = document.createElement('p'); p.className = 'shell-status'; p.setAttribute('role', 'status'); this.content.append(p); }
    p.textContent = text;
  }
  private launchCharacter(id: string): void {
    if (this.launching) return;
    const joining = this.pendingJoin && !this.inviteAttempted;
    if (id === characterProfiles.active.id) {
      if (joining) { this.inviteApproved = true; this.show('coop'); void this.connectCoop('join'); }
      else this.resume();
      return;
    }
    this.scene?.flushForShell();
    if (!characterProfiles.select(id)) { this.status('Não foi possível trocar o personagem. Seu progresso atual foi mantido.'); return; }
    this.launching = true;
    try {
      if (joining) sessionStorage.setItem(INVITE_CHARACTER_KEY, JSON.stringify({ code: this.coopCode, id }));
      else sessionStorage.setItem(LAUNCH_KEY, id);
    } catch { /* Start/confirm manually when session storage is blocked. */ }
    location.reload();
  }
  private deleteCharacter(id: string): void {
    if (this.launching || coopSession.role !== 'offline') return;
    const active = characterProfiles.active.id === id;
    this.scene?.flushForShell();
    if (!characterProfiles.remove(id)) { this.status('Não foi possível excluir. O personagem e sua jornada foram mantidos.'); return; }
    if (!active) { this.show('characters'); return; }
    this.launching = true;
    try { sessionStorage.removeItem(LAUNCH_KEY); sessionStorage.setItem(CHARACTERS_ONCE_KEY, '1'); } catch { /* The ordinary menu remains accessible after reload. */ }
    location.reload();
  }
  private async connectCoop(mode: 'create' | 'join'): Promise<void> {
    if (!this.scene || this.coopBusy || coopSession.role !== 'offline') return;
    const code = roomCode(this.coopCode);
    if (mode === 'join' && !code) { this.status('Cole o link do convite ou o código de 10 letras/números enviado pelo seu amigo.'); return; }
    const saved = this.scene.flushForShell();
    if (mode === 'join' && !saved) { this.status('Não foi possível guardar sua jornada solo. Libere o armazenamento do navegador antes de entrar.'); return; }
    if (mode === 'join' && !this.inviteApproved) {
      this.coopCode = code!; this.pendingJoin = true; this.inviteAttempted = false;
      setInvitation(this.coopCode); this.show(characterProfiles.list.length ? 'characters' : 'create');
      return;
    }
    this.inviteAttempted = true;
    const hero = characterProfiles.active;
    this.coopBusy = true;
    const attempt = ++this.connectionAttempt;
    this.render();
    this.status(mode === 'create' ? 'Criando sua sala…' : 'Entrando na sala do seu amigo…');
    try {
      const endpoint = await coopEndpoint();
      if (attempt !== this.connectionAttempt) return;
      await coopSession.connect(endpoint, mode, { name: hero.name, classId: hero.classId }, this.scene.coopArea(), code ?? '');
      if (attempt !== this.connectionAttempt) return;
      this.coopBusy = false;
      this.pendingJoin = false; this.inviteApproved = false;
      clearInvitation();
      if (this.page !== 'coop' || !this.dialog.open) return;
      if (mode === 'join') this.resume();
      else {
        this.waitingForFriend = true; this.render();
        if (coopSession.peerConnected) this.resume();
      }
    } catch (error) {
      if (attempt !== this.connectionAttempt) return;
      this.coopBusy = false;
      this.waitingForFriend = false;
      this.pendingJoin = false; this.inviteApproved = false;
      if (this.page === 'coop' && this.dialog.open) { this.render(); this.status(error instanceof Error ? error.message : 'Não foi possível entrar na sala. Tente novamente.'); }
    }
  }
  private async copyInvite(input: HTMLInputElement): Promise<void> {
    try {
      if (!navigator.clipboard) throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(input.value);
      this.status('Link copiado. Seu amigo abre o convite e escolhe o personagem para entrar.');
    } catch {
      input.focus(); input.select(); input.setSelectionRange(0, input.value.length);
      this.status('Convite selecionado. Copie o link e envie ao seu amigo.');
    }
  }
  private render(): void {
    this.selection?.destroy(); this.selection = undefined;
    this.dialog.classList.toggle('is-character-page', this.page === 'characters' || this.page === 'create');
    this.content.replaceChildren();
    if (this.page === 'coop-ended') {
      this.heading('Sala encerrada', coopSession.endedMessage);
      this.action('INICIAR JOGO SOLO', 'coop-solo', () => this.returnToSolo(true));
      this.action('VOLTAR AO MENU', 'coop-home', () => this.returnToSolo(false));
      this.status(coopSession.rewardSaved ? 'Continue sua própria jornada. O XP ganho na dupla foi preservado.' : 'O XP ainda não foi salvo. Libere o armazenamento do navegador e tente continuar novamente.');
    } else if (this.page === 'home' || this.page === 'pause') {
      const hero = characterProfiles.active;
      const hasCharacters = characterProfiles.list.length > 0;
      this.heading(this.page === 'pause' ? 'Expedição pausada' : 'Sua próxima descoberta', hasCharacters ? `${hero.name} · ${CLASS_NAMES[hero.classId]}` : 'Crie seu personagem para começar a explorar Dante.');
      const play = this.action(!hasCharacters ? 'CRIAR NOVO PERSONAGEM' : this.page === 'pause' ? 'VOLTAR AO JOGO' : 'CONTINUAR EXPEDIÇÃO', 'continue', () => this.resume());
      if(this.page==='pause')this.action('EQUIPAMENTO','equipment',()=>{this.resume();this.scene?.openEquipment();});
      play.disabled = !this.scene;
      this.action('PERSONAGENS', 'characters', () => this.show('characters')).disabled = coopSession.role !== 'offline';
      this.action('JOGAR COM AMIGO', 'coop', () => this.show('coop')).disabled = !hasCharacters;
      this.action('CONFIGURAÇÕES', 'settings', () => this.show('settings'));
      if (this.page === 'pause') this.action('VOLTAR À TELA INICIAL', 'home', () => this.show('home'));
      this.status('Progresso salvo neste navegador. Jogue em landscape no celular.');
    } else if (this.page === 'characters' || this.page === 'create') {
      this.selection = new CharacterSelection(this.content, this.page, {
        back: () => {
          if (this.page === 'create') this.show('characters');
          else { this.cancelInvitation(); this.show(this.playing ? 'pause' : 'home'); }
        },
        newCharacter: () => this.show('create'),
        play: id => this.launchCharacter(id),
        remove: id => this.deleteCharacter(id),
        create: (name, classId) => {
          if (this.launching) return;
          this.scene?.flushForShell();
          const hero = characterProfiles.create(name, classId);
          if (!hero) { this.status('Informe um nome. Se o armazenamento estiver bloqueado, continue com seu personagem atual.'); return; }
          this.launchCharacter(hero.id);
        },
      }, this.pendingJoin && !this.inviteAttempted);
      if (this.pendingJoin && !this.inviteAttempted) this.status('Seu convite está aguardando. Escolha ou crie um personagem para entrar na sala.');
    } else if (this.page === 'coop') {
      this.heading('Jogar com amigo', 'Crie uma sala e envie o link. Seu amigo escolhe o personagem e entra pelo convite.');
      if (coopSession.role === 'offline' || coopSession.role === 'connecting') {
        const busy = this.coopBusy || coopSession.role === 'connecting';
        const create = this.action('CRIAR SALA E CONVIDAR', 'coop-create', () => this.connectCoop('create'));
        create.disabled = busy || !this.scene || !COOP_AREAS.includes(this.scene.coopArea());
        const label = document.createElement('label'); label.textContent = 'Recebeu um convite?';
        const code = document.createElement('input'); code.name = 'coop-code'; code.placeholder = 'Cole o link ou o código da sala'; code.value = this.coopCode; code.maxLength = 2048; code.autocomplete = 'off'; code.spellcheck = false;
        code.setAttribute('aria-label', 'Link ou código da sala'); code.disabled = busy;
        code.addEventListener('input', () => { this.coopCode = code.value; }); label.append(code); this.content.append(label);
        this.action(busy ? 'CONECTANDO…' : 'ENTRAR NA SALA', 'coop-join', () => this.connectCoop('join')).disabled = busy || !this.scene;
        if (!busy && create.disabled && this.scene) this.status('Você pode criar uma sala em qualquer região da campanha.');
      } else {
        this.status('SALA ' + coopSession.code + ' · ' + coopSession.message);
        const invite = document.createElement('input'); invite.name = 'coop-invite'; invite.readOnly = true;
        invite.value = invitationLink(coopSession.code); invite.setAttribute('aria-label', 'Link de convite da sala');
        invite.addEventListener('click', () => invite.select()); this.content.append(invite);
        this.action('COPIAR LINK DE CONVITE', 'coop-copy', () => { void this.copyInvite(invite); });
        if (navigator.share) this.action('ENVIAR CONVITE', 'coop-share', () => {
          void navigator.share({ title: 'Echoes of Dante · jogue comigo', url: invite.value })
            .catch(error => { if (error.name !== 'AbortError') void this.copyInvite(invite); });
        });
        this.action('JOGAR', 'coop-play', () => this.resume());
        this.action('ENCERRAR / SAIR DA SALA', 'coop-leave', () => { this.waitingForFriend = false; coopSession.disconnect(); this.render(); });
      }
      this.action('VOLTAR', 'back', () => {
        this.cancelInvitation(); this.waitingForFriend = false;
        this.connectionAttempt++; this.coopBusy = false;
        if (coopSession.role === 'connecting') coopSession.disconnect(false);
        this.show(this.playing ? 'pause' : 'home');
      });
    } else {
      this.heading('Configurações', 'Ajuste o som da sua expedição.');
      for (const [key, title] of [['master','Volume geral'],['music','Música'],['sfx','Efeitos']] as const) {
        const label = document.createElement('label'); label.textContent = title;
        const input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = '100'; input.value = String(Math.round(this.volumes[key] * 100)); input.dataset.volume = key;
        input.addEventListener('input', () => { this.volumes[key] = Number(input.value) / 100; this.applyVolumes();
          try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.volumes)); } catch { this.status('Volumes aplicados nesta sessão; não foi possível salvar a preferência.'); } });
        label.append(input); this.content.append(label);
      }
      this.action('VOLTAR', 'back', () => this.show(this.playing ? 'pause' : 'home'));
    }
  }
  private coopChanged = (): void => {
    if (coopSession.endedMessage) { this.showEndedVisit(); return; }
    if (!this.dialog.open || this.page !== 'coop') return;
    if (this.waitingForFriend && coopSession.role === 'host' && coopSession.peerConnected) { this.resume(); return; }
    this.status((coopSession.code ? 'SALA ' + coopSession.code + ' · ' : '') + coopSession.message);
  };
  private editableKey = (event: KeyboardEvent): void => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input, textarea, [contenteditable="true"]')) event.stopImmediatePropagation();
  };
  private cancelInvitation(): void {
    this.pendingJoin = false; this.inviteApproved = false; this.inviteAttempted = true; clearInvitation();
    try { sessionStorage.removeItem(INVITE_CHARACTER_KEY); } catch { /* No pending approval is required. */ }
  }
  private showEndedVisit(): void {
    this.connectionAttempt++; this.coopBusy = false; this.waitingForFriend = false; this.cancelInvitation();
    this.scene?.pauseForShell(); this.page = 'coop-ended'; this.render();
    if (!this.dialog.open) this.dialog.showModal();
    document.body.classList.add('shell-open');
    this.content.querySelector<HTMLButtonElement>('[data-shell="coop-solo"]')?.focus();
  }
  private returnToSolo(play: boolean): void {
    if (this.launching || !coopSession.disconnect(false)) return;
    this.launching = true;
    try {
      sessionStorage.removeItem(LAUNCH_KEY);
      if (play) sessionStorage.setItem(LAUNCH_KEY, characterProfiles.active.id);
    } catch { /* The ordinary menu still offers the restored solo journey. */ }
    location.reload();
  }
  private applyVolumes(): void { this.scene?.setShellVolumes(this.volumes.master, this.volumes.music, this.volumes.sfx); }
  private pollPad = (): void => {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find(p => p?.connected && p.mapping === 'standard');
    const down = pad ? pad.buttons.map(b => b.pressed || b.value > .5) : [];
    if (down[9] && !this.padPrevious[9] && !this.scene?.shellPlayerDead()) {
      if (this.selection?.confirmingDeletion) this.selection.cancelDeletion();
      else if (this.dialog.open) { if (this.playing && this.page !== 'coop-ended') this.resume(); } else this.openPause();
    }
    if (this.dialog.open) {
      const activeMenu = this.content.querySelector('.character-delete-dialog[open]') ?? this.content;
      const buttons = Array.from(activeMenu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const index = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
      if ((down[13] && !this.padPrevious[13]) || (down[15] && !this.padPrevious[15])) buttons[(index + 1) % buttons.length]?.focus();
      if ((down[12] && !this.padPrevious[12]) || (down[14] && !this.padPrevious[14])) buttons[(index + buttons.length - 1) % buttons.length]?.focus();
      if (down[0] && !this.padPrevious[0]) (document.activeElement as HTMLButtonElement)?.click?.();
      if (down[1] && !this.padPrevious[1]) {
        if (this.selection?.confirmingDeletion) this.selection.cancelDeletion();
        else if (this.page === 'coop-ended') { /* Choose solo/menu explicitly. */ }
        else if (this.pendingJoin && !this.inviteAttempted) { this.cancelInvitation(); this.show(this.playing ? 'pause' : 'home'); }
        else if (this.page === 'home' || this.page === 'pause') { if (this.playing) this.resume(); } else this.show(this.playing ? 'pause' : 'home');
      }
    }
    this.padPrevious = down; this.padFrame = requestAnimationFrame(this.pollPad);
  };
  destroy(): void { this.selection?.destroy(); cancelAnimationFrame(this.padFrame); window.removeEventListener('keydown', this.keyDown, true); window.removeEventListener('keydown', this.editableKey); window.removeEventListener('keyup', this.editableKey); window.removeEventListener('dante-coop', this.coopChanged); this.dialog.remove(); this.menuButton.remove(); }
}
