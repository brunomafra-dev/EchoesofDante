import type { GameScene } from '../scenes/GameScene';
import { characterProfiles } from '../systems/CharacterProfiles';
import { coopSession, COOP_AREAS } from '../network/CoopSession';
import { CLASS_NAMES } from '../config/classes';
import type { CharacterClass } from '../systems/CharacterProfiles';
import { AUDIO } from '../config/audio';
import { PROGRESSION } from '../config/progression';

type Page = 'home' | 'pause' | 'characters' | 'create' | 'settings' | 'coop';
type Volumes = { master: number; music: number; sfx: number };
const SETTINGS_KEY = 'echoes-of-dante.settings.v1';

export class ApplicationShell {
  private readonly dialog = document.createElement('dialog');
  private readonly menuButton = document.createElement('button');
  private readonly content: HTMLElement;
  private scene?: GameScene;
  private page: Page = 'home';
  private playing = false;
  private padPrevious: boolean[] = [];
  private padFrame = 0;
  private readonly qaAutoplay = import.meta.env.DEV && new URLSearchParams(location.search).get('qa') === 'play';
  private volumes: Volumes = { master: AUDIO.master, music: AUDIO.music, sfx: AUDIO.sfx };

  constructor() {
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
    this.dialog.addEventListener('cancel', e => { e.preventDefault(); if (this.playing) this.resume(); });
    document.body.append(this.menuButton, this.dialog);
    window.addEventListener('keydown', this.keyDown, true);
    window.addEventListener('dante-coop', this.coopChanged);
    this.render();
    if (!this.qaAutoplay) { this.dialog.showModal(); document.body.classList.add('shell-open'); }
    this.pollPad();
  }

  bind(scene: GameScene): void {
    this.scene = scene; this.applyVolumes();
    if (this.dialog.open) scene.pauseForShell();
    else if (this.qaAutoplay) this.playing = true;
    this.render();
    if (this.dialog.open) (this.content.querySelector('button:not(:disabled)') as HTMLButtonElement)?.focus();
  }
  private keyDown = (event: KeyboardEvent): void => {
    if (event.code !== 'Escape' || event.repeat) return;
    if (document.querySelector('dialog[open]:not(.application-shell)')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (this.dialog.open) { if (this.playing) this.resume(); }
    else this.openPause();
  };
  private openPause(): void {
    if (this.dialog.open || !this.scene?.pauseForShell()) return;
    this.page = 'pause'; this.render(); this.dialog.showModal(); document.body.classList.add('shell-open');
    (this.content.querySelector('button') as HTMLButtonElement)?.focus();
  }
  private resume(): void {
    if (!this.scene) return;
    this.playing = true; this.dialog.close(); document.body.classList.remove('shell-open');
    this.scene.resumeFromShell(); this.scene.game.canvas.focus({ preventScroll: true });
  }
  private show(page: Page): void { this.page = page; this.render(); }
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
  private render(): void {
    this.content.replaceChildren();
    if (this.page === 'home' || this.page === 'pause') {
      const hero = characterProfiles.active;
      this.heading(this.page === 'pause' ? 'Expedição pausada' : 'Sua próxima descoberta', `${hero.name} · ${CLASS_NAMES[hero.classId]}`);
      const play = this.action(this.page === 'pause' ? 'VOLTAR AO JOGO' : 'CONTINUAR EXPEDIÇÃO', 'continue', () => this.resume());
      play.disabled = !this.scene;
      this.action('PERSONAGENS', 'characters', () => this.show('characters')).disabled = coopSession.role !== 'offline';
      this.action('COOPERATIVO · 2 PESSOAS', 'coop', () => this.show('coop'));
      this.action('CONFIGURAÇÕES', 'settings', () => this.show('settings'));
      if (this.page === 'pause') this.action('VOLTAR À TELA INICIAL', 'home', () => this.show('home'));
      this.status('Progresso salvo neste navegador. Jogue em landscape no celular.');
    } else if (this.page === 'characters') {
      this.heading('Personagens', 'Cada personagem tem sua própria jornada e seus aperfeiçoamentos.');
      for (const hero of characterProfiles.list) {
        let level = 1, region = 'Nova expedição';
        try {
          const saved = JSON.parse(localStorage.getItem(characterProfiles.keyFor(hero.id)) ?? 'null');
          if (typeof saved?.progression?.xp === 'number') level = PROGRESSION.levelThresholds.filter(x => x <= saved.progression.xp).length;
          const names: Record<string, string> = { forest: 'Floresta', cavern: 'Cavernas', warden: 'Guardião', valley: 'Vale', arid: 'Siroco', dunes: 'Dunas', sandpit: 'Bacia Soterrada', frost: 'Fratura Boreal' };
          if (saved) region = names[saved.area] ?? 'Expedição';
        } catch { /* Missing/corrupt journey starts safely through LocalJourney. */ }
        this.action(`${hero.name} · ${CLASS_NAMES[hero.classId]} · NV ${level} · ${region}${hero.id === characterProfiles.active.id ? ' · ATUAL' : ''}`,
          `character-${hero.id}`, () => {
            if (hero.id === characterProfiles.active.id) { this.resume(); return; }
            this.scene?.flushForShell();
            if (characterProfiles.select(hero.id)) location.reload(); else this.status('Não foi possível trocar o personagem. Seu progresso atual foi mantido.');
          });
      }
      const create = this.action('NOVO PERSONAGEM', 'new-character', () => this.show('create'));
      create.disabled = characterProfiles.list.length >= 6;
      this.action('VOLTAR', 'back', () => this.show(this.playing ? 'pause' : 'home'));
    } else if (this.page === 'create') {
      this.heading('Uma nova expedição', 'Escolha sua identidade. A jornada do personagem atual permanece guardada.');
      const label = document.createElement('label'); label.textContent = 'Nome do personagem';
      const input = document.createElement('input'); input.name = 'character-name'; input.maxLength = 24; input.placeholder = 'Seu nome em Dante'; label.append(input); this.content.append(label);
      const choice = document.createElement('select'); choice.name = 'character-class'; choice.setAttribute('aria-label', 'Classe');
      for (const [value, name] of Object.entries(CLASS_NAMES)) { const option = document.createElement('option'); option.value = value; option.textContent = name; choice.append(option); }
      this.content.append(choice);
      const card = document.createElement('article'); card.className = 'shell-class-card';
      card.innerHTML = '<strong>GUERREIRO GALÁCTICO</strong><p>Sabre de energia · Esquiva do vazio · Carga cinética</p><small>Combate próximo, mobilidade e ondas direcionais.</small>'; this.content.append(card);
      choice.addEventListener('change', () => { card.innerHTML = choice.value === 'hunter' ? '<strong>STAR HUNTER</strong><p>Rifle de pulso · Passo de fase · Tiro concentrado</p><small>Precisão e distância. Movimente-se em combate para gerar Momentum, que fortalece os disparos. Menor resistência.</small>' : '<strong>GUERREIRO GALÁCTICO</strong><p>Sabre de energia · Esquiva do vazio · Carga cinética</p><small>Combate próximo, resistência e ondas direcionais.</small>'; });
      this.action('COMEÇAR EXPEDIÇÃO', 'create', () => {
        this.scene?.flushForShell(); const hero = characterProfiles.create(input.value, choice.value as CharacterClass);
        if (!hero) { this.status('Informe um nome. Se o armazenamento estiver bloqueado, continue com seu personagem atual.'); return; }
        if (characterProfiles.select(hero.id)) location.reload();
      });
      this.action('VOLTAR', 'back', () => this.show('characters'));
    } else if (this.page === 'coop') {
      this.heading('Expedição em dupla', 'Explorem e enfrentem criaturas na mesma região. Chefes e viagens entre regiões continuam solo nesta primeira etapa.');
      if (coopSession.role === 'offline') {
        const label = document.createElement('label'); label.textContent = 'Servidor de salas'; const server = document.createElement('input'); server.name = 'coop-server'; server.value = import.meta.env.VITE_COOP_URL || (location.protocol === 'https:' ? 'wss://' + location.host + '/coop' : 'ws://' + location.hostname + ':5190'); label.append(server); this.content.append(label);
        const code = document.createElement('input'); code.name = 'coop-code'; code.placeholder = 'Código da sala'; code.maxLength = 10; code.setAttribute('aria-label', 'Código da sala'); this.content.append(code);
        const join = (mode: 'create' | 'join') => {
          const hero = characterProfiles.active; this.scene?.flushForShell();
          coopSession.connect(server.value, mode, {name:hero.name,classId:hero.classId}, this.scene!.coopArea(), code.value.trim())
            .then(() => this.render()).catch(error => this.status(error.message));
        };
        const create = this.action('CRIAR SALA', 'coop-create', () => join('create')); create.disabled = !this.scene || !COOP_AREAS.includes(this.scene.coopArea());
        this.action('ENTRAR NA SALA', 'coop-join', () => join('join'));
      } else {
        this.status('SALA ' + coopSession.code + ' · ' + coopSession.message);
        this.action('VOLTAR À EXPEDIÇÃO', 'coop-play', () => this.resume());
        this.action('ENCERRAR / SAIR DA SALA', 'coop-leave', () => {coopSession.disconnect(); this.render();});
      }
      this.action('VOLTAR', 'back', () => this.show(this.playing ? 'pause' : 'home'));
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
  private coopChanged = (): void => { if (this.dialog.open && this.page === 'coop') this.status((coopSession.code ? 'SALA ' + coopSession.code + ' · ' : '') + coopSession.message); };
  private applyVolumes(): void { this.scene?.setShellVolumes(this.volumes.master, this.volumes.music, this.volumes.sfx); }
  private pollPad = (): void => {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find(p => p?.connected && p.mapping === 'standard');
    const down = pad ? pad.buttons.map(b => b.pressed || b.value > .5) : [];
    if (down[9] && !this.padPrevious[9] && !this.scene?.shellPlayerDead()) {
      if (this.dialog.open) { if (this.playing) this.resume(); } else this.openPause();
    }
    if (this.dialog.open) {
      const buttons = Array.from(this.content.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const index = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
      if (down[13] && !this.padPrevious[13]) buttons[(index + 1) % buttons.length]?.focus();
      if (down[12] && !this.padPrevious[12]) buttons[(index + buttons.length - 1) % buttons.length]?.focus();
      if (down[0] && !this.padPrevious[0]) (document.activeElement as HTMLButtonElement)?.click?.();
      if (down[1] && !this.padPrevious[1]) { if (this.page === 'home' || this.page === 'pause') { if (this.playing) this.resume(); } else this.show(this.playing ? 'pause' : 'home'); }
    }
    this.padPrevious = down; this.padFrame = requestAnimationFrame(this.pollPad);
  };
  destroy(): void { cancelAnimationFrame(this.padFrame); window.removeEventListener('keydown', this.keyDown, true); window.removeEventListener('dante-coop', this.coopChanged); this.dialog.remove(); this.menuButton.remove(); }
}
