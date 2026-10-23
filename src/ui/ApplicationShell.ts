import type { GameScene } from '../scenes/GameScene';
import { characterProfiles } from '../systems/CharacterProfiles';
import type { CampaignCreation } from '../systems/Campaign';
import { coopSession } from '../network/CoopSession';
import { coopEndpoint } from '../network/CoopEndpoint';
import { inspectRoom, type RoomInspection } from '../network/PartyLobby';
import { roomCode, invitationLink, clearInvitation, setInvitation } from '../network/CoopInvitation';
import { CLASS_NAMES } from '../config/classes';
import { DIFFICULTIES, type DifficultyId } from '../config/difficulty';
import { CharacterSelection, type CharacterDraft } from './CharacterSelection';
import { Prologue } from './Prologue';
import { AUDIO } from '../config/audio';
import type { CharacterClass } from '../systems/CharacterProfiles';
import type { CharacterSex } from '../config/appearance';
import { LocalJourney } from '../systems/LocalJourney';
import { CoopChat } from './CoopChat';
import { MobileDisplay } from './MobileDisplay';

type Page = 'home' | 'play' | 'pause' | 'characters' | 'coop-characters' | 'create' | 'party-size' | 'difficulty' | 'coop-menu' | 'invite' | 'coop' | 'settings' | 'prologue' | 'coop-ended' | 'launching';
const LAUNCH = 'echoes-of-dante.launch-once', APPROVAL = 'echoes-of-dante.invite-character-once', SETTINGS = 'echoes-of-dante.settings.v1';

export class ApplicationShell {
  private readonly mobileDisplay: MobileDisplay;
  private readonly dialog = document.createElement('dialog');
  private readonly menuButton = document.createElement('button');
  private readonly content: HTMLElement;
  private scene?: GameScene;
  private readonly chat=new CoopChat(typing=>this.scene?.setChatTyping(typing));
  private selection?: CharacterSelection;
  private prologue?: Prologue;
  private page: Page = 'home';
  private settingsReturn: Page = 'home';
  private playing = false;
  private loadingProgress=0;
  private launching = false;
  private launchOnce = false;
  private entry?: 'create' | 'join';
  private creation: CampaignCreation = { mode: 'solo', difficulty: 'normal', size: 1 };
  private pendingCharacter?: { name: string; classId: CharacterClass; sex: CharacterSex };
  private draft?: CharacterDraft;
  private creating=false;
  private code = roomCode(location.href) ?? '';
  private pendingInvite = !!this.code;
  private lobby?: RoomInspection;
  private inspecting = false;
  private busy = false;
  private attempt = 0;
  private padPrevious: boolean[] = [];
  private padFrame = 0;
  private readonly qaAutoplay = import.meta.env.DEV && new URLSearchParams(location.search).get('qa') === 'play';
  private volumes = { master: AUDIO.master as number, music: AUDIO.music as number, sfx: AUDIO.sfx as number };

  constructor() {
    const hero = characterProfiles.active;
    // An explicit navigation carries the selected journey across the page load.
    // Storage of the journey and the request to start it are independent: browsers
    // may allow localStorage while rejecting the old sessionStorage launch flag.
    const url=new URL(location.href),requested=url.searchParams.get('iniciar');
    this.launchOnce=requested===hero.id&&characterProfiles.list.some(p=>p.id===hero.id);
    if(this.launchOnce&&this.pendingInvite)this.entry='join';
    if(requested!==null){url.searchParams.delete('iniciar');history.replaceState(history.state,'',url);}
    try {
      this.launchOnce ||= sessionStorage.getItem(LAUNCH) === hero.id; sessionStorage.removeItem(LAUNCH);
      const approved = JSON.parse(sessionStorage.getItem(APPROVAL) ?? 'null'); sessionStorage.removeItem(APPROVAL);
      if (this.pendingInvite && approved?.code === this.code && approved?.id === hero.id) this.entry = 'join';
      const saved = JSON.parse(localStorage.getItem(SETTINGS) ?? 'null');
      for (const k of ['master','music','sfx'] as const) if (typeof saved?.[k] === 'number' && Number.isFinite(saved[k])) this.volumes[k] = Math.max(0, Math.min(1, saved[k]));
    } catch { /* A menu remains available when browser storage is blocked. */ }
    if (this.launchOnce && hero.campaign?.mode === 'coop' && hero.campaign.introSeen) {
      if (hero.campaign.hostId === hero.id) this.entry = 'create'; else this.page = 'invite';
    }
    if (this.pendingInvite && !this.entry) this.page = 'invite';
    if(this.launchOnce)this.page='launching';
    this.menuButton.className = 'main-menu-button hud-icon'; this.menuButton.type = 'button'; this.menuButton.textContent = '☰';this.menuButton.setAttribute('aria-label','Abrir menu');this.menuButton.title='Menu · Esc';
    this.menuButton.setAttribute('aria-label', 'Abrir menu — Esc'); this.menuButton.onclick = () => this.openPause();
    this.menuButton.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { e.preventDefault(); this.openPause(); } });
    this.dialog.className = 'application-shell'; this.dialog.setAttribute('aria-labelledby', 'shell-title');
    this.dialog.innerHTML = '<div class="shell-layout"><section class="shell-brand"><small>DANTE · EXPEDIÇÃO</small><h1>ECHOES<br>OF DANTE</h1><p>O planeta ainda está à escuta.</p></section><section class="shell-content"></section></div>';
    this.content = this.dialog.querySelector('.shell-content')!;
    this.dialog.addEventListener('cancel', e => { e.preventDefault(); this.back(); });
    document.body.append(this.menuButton, this.dialog);
    window.addEventListener('keydown', this.keyDown, true); window.addEventListener('keydown', this.editableKey); window.addEventListener('keyup', this.editableKey);
    window.addEventListener('dante-coop', this.coopChanged);
    this.render(); this.dialog.showModal(); document.body.classList.add('shell-open'); this.pollPad();
    this.mobileDisplay = new MobileDisplay();
    // The approved film must not wait for every world texture to download.
    if(this.launchOnce&&hero.campaign&&!hero.campaign.introSeen)this.showPrologue();
  }
  reportLoading(progress:number):void{
    this.loadingProgress=Math.round(Math.max(0,Math.min(1,progress))*100);
    const label=this.content.querySelector('[data-world-loading]');if(label)label.textContent=`Carregando o mundo · ${this.loadingProgress}%`;
  }
  bind(scene: GameScene): void {
    this.scene = scene; this.applyVolumes();
    if(this.playing&&!coopSession.endedMessage){if(characterProfiles.active.campaign?.mode==='coop'&&!coopSession.campaignRunning)this.scene.setPartyWaiting(true);return;}
    const campaign=characterProfiles.active.campaign;
    if(!coopSession.endedMessage&&((this.launchOnce&&(!campaign||campaign.mode==='solo'&&campaign.introSeen))||this.qaAutoplay)){
      // During Scene.create Phaser queues pause operations. Do not enqueue a
      // title pause when this launch has already selected an existing journey.
      this.playing=true;this.dialog.close();document.body.classList.remove('shell-open');return;
    }
    scene.pauseForShell();
    if (coopSession.endedMessage) { this.ended(); return; }
    if (!this.selection&&!this.prologue) this.render();
    if (characterProfiles.active.campaign && !characterProfiles.active.campaign.introSeen && this.launchOnce) this.showPrologue();
    else if (this.entry) { const entry = this.entry; this.entry = undefined; this.show('coop'); void this.connect(entry); }
  }
  private keyDown = (event: KeyboardEvent): void => {
    if (event.code !== 'Escape' || event.repeat || document.querySelector('dialog[open]:not(.application-shell)')) return;
    event.preventDefault(); event.stopImmediatePropagation(); if (this.dialog.open) this.back(); else this.openPause();
  };
  private editableKey = (event: KeyboardEvent): void => { if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable="true"]')) event.stopImmediatePropagation(); };
  private openPause(): void { if (this.dialog.open || !this.scene?.pauseForShell()) return; this.show('pause'); this.open(); }
  private open(): void { if (!this.dialog.open) this.dialog.showModal(); document.body.classList.add('shell-open'); }
  private resume(): void {
    if (!this.scene || coopSession.endedMessage || !characterProfiles.list.length) return;
    const campaign = characterProfiles.active.campaign;
    if (campaign && !campaign.introSeen) { this.showPrologue(); return; }
    if (campaign?.mode === 'coop' && !coopSession.campaignRunning) { this.show('coop'); this.open(); return; }
    this.selection?.destroy(); this.selection = undefined; this.playing = true;
    this.dialog.close(); document.body.classList.remove('shell-open'); this.scene.setPartyWaiting(false); this.scene.resumeFromShell(); if(!this.chat.typing)this.scene.game.canvas.focus({ preventScroll: true });
  }
  private show(page: Page): void { this.page = page; this.render(); if(!this.chat.typing)this.content.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true }); }
  private heading(title: string, subtitle: string): void { const h = document.createElement('h2'); h.id = 'shell-title'; h.textContent = title; const p = document.createElement('p'); p.textContent = subtitle; this.content.append(h, p); }
  private action(label: string, id: string, action: () => void): HTMLButtonElement { const b = document.createElement('button'); b.type = 'button'; b.dataset.shell = id; b.textContent = label; b.onclick = action; this.content.append(b); return b; }
  private status(text: string): void { let p = this.content.querySelector('.shell-status'); if (!p) { p = document.createElement('p'); p.className = 'shell-status'; p.setAttribute('role', 'status'); this.content.append(p); } p.textContent = text; }
  private back(): void {
    if (this.selection?.confirmingDeletion) { this.selection.cancelDeletion(); return; }
    if (this.page === 'prologue' || this.page === 'coop-ended' || this.page==='launching') return;
    if (this.page === 'settings') {
      if (this.settingsReturn === 'prologue' && this.prologue) { this.page = 'prologue'; this.render(); this.prologue.resume(); }
      else this.show(this.settingsReturn); return;
    }
    if (this.page === 'pause') { this.resume(); return; }
    if (this.page === 'coop') { if (coopSession.role !== 'offline' || this.busy) { this.returnHome(); return; } this.show('coop-menu'); return; }
    const destination: Partial<Record<Page, Page>> = { play:'home', characters:'play', 'coop-characters':'coop-menu', difficulty:this.creation.mode==='coop'?'party-size':'create', 'party-size':'create', create:this.pendingInvite ? 'invite':this.creation.mode === 'solo' ? 'play':'coop-menu', 'coop-menu':'play', invite:'coop-menu' };
    if (this.page === 'create' && !this.pendingInvite) this.pendingCharacter = undefined;
    if (this.page === 'invite' || this.page === 'coop-characters') { this.pendingInvite = false; clearInvitation(); }
    this.show(destination[this.page] ?? 'home');
  }
  private settings(): void { this.settingsReturn = this.page; this.prologue?.pause(); this.show('settings'); }
  private beginNew(mode: 'solo' | 'coop'): void { this.pendingInvite = false; this.lobby = undefined; this.pendingCharacter = undefined; this.draft=undefined;clearInvitation(); this.creation = { mode, difficulty:'normal', size:mode === 'coop' ? 2:1 }; this.show('create'); }
  private startNewCampaign(): void {
    const pending = this.pendingCharacter;
    if (!pending || this.launching || this.creating || this.playing || coopSession.role!=='offline') return;
    this.creating=true;
    const hero = characterProfiles.create(pending.name, pending.classId, pending.sex, this.creation);
    if (!hero) { this.creating=false;this.status('Não foi possível criar o personagem. Confira o nome, o limite de personagens e o armazenamento do navegador.'); return; }
    this.pendingCharacter = undefined;
    this.launch(hero.id);
  }
  private launch(id: string): void {
    if (this.launching || this.playing || coopSession.role !== 'offline') return;
    const hero = characterProfiles.list.find(p => p.id === id); if (!hero) return;
    if (this.pendingInvite && (!this.lobby || hero.campaign?.id !== this.lobby.campaign.id)) { this.status('Selecione o personagem original desta equipe.'); return; }
    this.scene?.flushForShell();
    if (!characterProfiles.select(id)) { this.status('Não foi possível guardar a seleção. Libere o armazenamento do navegador.'); return; }
    this.launching = true;
    try {
      if (this.pendingInvite) { setInvitation(this.code); sessionStorage.setItem(APPROVAL, JSON.stringify({ code:this.code, id })); }
    } catch { /* The explicit start request below does not require session storage. */ }
    const target=new URL(location.href);target.searchParams.set('iniciar',id);
    if(this.pendingInvite)target.searchParams.set('sala',this.code);
    location.replace(target.href);
  }
  private showPrologue(replay = false): void {
    if (this.prologue) return;
    const replayReturn=this.settingsReturn;
    this.prologue = new Prologue(() => {
      this.prologue?.destroy(); this.prologue = undefined;
      if (replay) { this.settingsReturn=replayReturn;this.show('settings'); return; }
      this.completeArrival();
    }, () => this.settings());
    this.page = 'prologue'; this.render(); this.applyVolumes(); this.open(); this.prologue.resume();
  }
  private completeArrival():void {
    if(!characterProfiles.markIntroSeen(characterProfiles.active.id)){
      this.show('launching');this.status('Não foi possível salvar a chegada. Libere o armazenamento e tente novamente.');
      this.action('TENTAR NOVAMENTE','retry-arrival',()=>this.completeArrival());return;
    }
    if(!this.scene){this.entry=characterProfiles.active.campaign?.mode==='coop'?(this.pendingInvite?'join':'create'):undefined;this.show('launching');return;}
    if(characterProfiles.active.campaign?.mode==='coop'){this.show('coop');void this.connect(this.pendingInvite?'join':'create');}
    else this.resume();
  }
  private async inspect(): Promise<void> {
    const code = roomCode(this.code); if (!code) { this.status('Cole o convite ou o código de 10 letras/números.'); return; }
    if (this.inspecting) return; this.inspecting = true; this.status('Consultando a equipe…');
    try {
      const lobby = await inspectRoom(await coopEndpoint(), code);
      if (this.page !== 'invite') return;
      this.code = code; this.pendingInvite = true; this.lobby = lobby; setInvitation(code);
      if (lobby.campaign.crew.length || characterProfiles.list.some(p=>p.campaign?.id===lobby.campaign.id)) this.show('coop-characters');
      else { this.creation = { mode:'coop', difficulty:lobby.campaign.difficulty, size:lobby.campaign.size, joining:lobby.campaign }; this.show('create'); }
    } catch (e) { this.status(e instanceof Error ? e.message : 'Não foi possível consultar a sala.'); }
    finally { this.inspecting = false; }
  }
  private async connect(mode: 'create' | 'join'): Promise<void> {
    if (!this.scene || this.busy || coopSession.role !== 'offline') return;
    const campaign = characterProfiles.active.campaign;
    if (!campaign?.introSeen) return;
    const code = roomCode(this.code); if (mode === 'join' && !code) { this.show('invite'); return; }
    this.scene.flushForShell(); this.busy = true; const attempt = ++this.attempt; this.render(); this.status('Reunindo a expedição…');
    try {
      const endpoint = await coopEndpoint(); if (attempt !== this.attempt) return;
      await coopSession.connect(endpoint, mode, characterProfiles.active, this.scene.coopArea(), code ?? '');
      if (attempt !== this.attempt) return; this.busy = false; this.pendingInvite = false; clearInvitation();
      if (!this.playing&&this.page!=='settings') this.show('coop');
    } catch (e) { if (attempt !== this.attempt) return; this.busy = false; this.show('coop'); this.status(e instanceof Error ? e.message : 'Não foi possível reunir a equipe.'); }
  }
  private coopChanged = (): void => {
    if (coopSession.endedMessage) { this.ended(); return; }
    if (coopSession.role === 'offline' || coopSession.role === 'connecting') {
      if(this.playing&&characterProfiles.active.campaign?.mode==='coop'&&coopSession.role==='offline'){this.scene?.setPartyWaiting(true);this.show('coop');this.status(coopSession.message);this.open();}
      return;
    }
    if (!coopSession.campaignRunning) {
      if (this.playing) this.scene?.setPartyWaiting(true);
      if (this.page !== 'settings') { this.show('coop'); this.open(); }
    } else {
      this.scene?.setPartyWaiting(false);
      if (!this.playing || this.page === 'coop') { if (this.page !== 'settings') this.resume(); }
    }
  };
  private ended(): void { this.busy = false; this.attempt++; this.scene?.setPartyWaiting(true); this.show('coop-ended'); this.open(); }
  private returnHome(): void {
    if (this.launching) return;
    const saved=this.scene?.flushForShell();
    if(this.playing&&coopSession.role==='offline'&&!saved){this.status('Não foi possível salvar sua jornada. Libere o armazenamento e tente novamente.');return;}
    if (!coopSession.disconnect(false)) {this.status('Libere o armazenamento para guardar as recompensas antes de sair.');return;}
    this.attempt++; this.busy = false;
    clearInvitation(); try { sessionStorage.removeItem(LAUNCH); sessionStorage.removeItem(APPROVAL); } catch { /* No auto launch. */ }
    this.launching = true; location.reload();
  }
  private render(): void {
    this.selection?.destroy(); this.selection = undefined; this.content.replaceChildren();
    const characters = ['characters','coop-characters','create'].includes(this.page);
    this.dialog.classList.toggle('is-character-page', characters); this.dialog.classList.toggle('is-prologue', this.page === 'prologue');
    this.dialog.classList.toggle('is-coop-page',this.page==='coop');
    if(this.page==='launching'){this.heading('Iniciando expedição', 'Preparando sua chegada a Dante…');const progress=document.createElement('p');progress.dataset.worldLoading='';progress.textContent=`Carregando o mundo · ${this.loadingProgress}%`;progress.setAttribute('role','status');this.content.append(progress);return;}
    if (this.page === 'prologue' && this.prologue) { this.content.append(this.prologue.view); return; }
    if (this.page === 'home') {
      this.heading('Sua próxima descoberta', 'Uma expedição. Um planeta ainda desconhecido.'); this.action('JOGAR','play', () => this.show('play'));
    } else if (this.page === 'play') {
      this.heading('Jogar', 'Cada personagem guarda sua própria jornada neste navegador.');
      this.action('NOVO JOGO','new-game', () => this.beginNew('solo'));
      if(this.savedSoloProfiles().length)this.action('CONTINUAR EXPEDIÇÃO','continue', () => this.show('characters'));
      this.action('COOPERATIVO','coop', () => this.show('coop-menu')); this.action('VOLTAR','back', () => this.back());
    } else if (this.page === 'pause') {
      this.heading('Expedição pausada', `${characterProfiles.active.name} · ${CLASS_NAMES[characterProfiles.active.classId]}`);
      this.action('RETOMAR','continue', () => this.resume()); this.action('MAPA DA EXPEDIÇÃO','expedition', () => { this.resume(); this.scene?.openExpedition(); });
      this.action('MOCHILA E EQUIPAMENTOS','equipment', () => { this.resume(); this.scene?.openEquipment(); }); this.action('VOLTAR À TELA INICIAL','home', () => this.returnHome());
    } else if (this.page === 'difficulty') {
      this.heading('Dificuldade', '');
      for (const id of ['easy','normal','hard'] as DifficultyId[]) {
        const d = DIFFICULTIES[id], b = this.action(d.name, `difficulty-${id}`, () => { this.creation.difficulty = id; this.startNewCampaign(); });
        b.className = 'difficulty-choice';b.disabled=!this.pendingCharacter||this.creating||this.launching;
      }
      this.action('VOLTAR','back', () => this.back());
    } else if(this.page==='party-size'){
      this.heading('Sua equipe', 'Quantos exploradores vão jogar juntos?');
        const label = document.createElement('label'); label.textContent = 'Tamanho da equipe original'; const select = document.createElement('select'); select.name = 'party-size';
        for (const size of [2,3,4]) { const option = document.createElement('option'); option.value = String(size); option.textContent = `${size} jogadores · classes diferentes`; select.append(option); }
        select.value = String(this.creation.size); select.onchange = () => { this.creation.size = Number(select.value); }; label.append(select); this.content.append(label);
        const p = document.createElement('p'); p.textContent = 'Para continuar depois, todos os personagens originais deverão voltar. Sem substituições e sem continuar solo.'; this.content.append(p);
      this.action('ESCOLHER DIFICULDADE →','choose-difficulty',()=>this.show('difficulty'));
      this.action('VOLTAR','back', () => this.back());
    } else if (characters) {
      const cooperative = this.page === 'coop-characters';
      const profiles = cooperative?characterProfiles.list.filter(p => p.campaign?.mode === 'coop' && (!this.pendingInvite || p.campaign.id === this.lobby?.campaign.id&&(!this.lobby.campaign.crew.length||this.lobby.campaign.crew.some(m=>m.id===p.id)))):this.savedSoloProfiles();
      this.selection = new CharacterSelection(this.content, this.page === 'create' ? 'create':'characters', {
        back: () => this.back(), newCharacter: () => this.beginNew(cooperative ? 'coop':'solo'), play: id => this.launch(id),
        remove: id => {
          if (coopSession.role !== 'offline') return;
          const active = characterProfiles.active.id === id; this.scene?.flushForShell();
          if (!characterProfiles.remove(id)) { this.status('Não foi possível excluir o personagem.'); return; }
          if (active) this.returnHome(); else this.render();
        },
        create: (name, classId, sex) => {
          if (this.launching) return;
          if (this.pendingInvite) {
            const hero = characterProfiles.create(name, classId, sex, this.creation);
            if (hero) this.launch(hero.id); else this.status('Informe um nome e verifique o espaço de personagens e o armazenamento do navegador.');
            return;
          }
          this.pendingCharacter = { name, classId, sex };
          this.show(this.creation.mode==='coop'?'party-size':'difficulty');
        },
      }, this.pendingInvite, this.pendingInvite && this.page==='create' ? this.lobby?.members.map(m => m.profile.classId):[], {
        profiles, title: cooperative ? 'Continuar com a equipe original':undefined,
        subtitle: cooperative ? 'O anfitrião reúne a sala. Os demais entram pelo novo convite com os mesmos personagens.':undefined,
        allowCreate: !cooperative,
        draft:this.draft,onDraft:draft=>{this.draft=draft;},
      });
      if (cooperative && !profiles.length) this.status('Nenhum personagem desta equipe neste navegador. Use o navegador original; personagens solo não podem substituí-lo.');
    } else if (this.page === 'coop-menu') {
      this.heading('Cooperativo', 'Crie uma sala no computador, celular ou tablet. Até quatro exploradores, uma classe de cada.'); this.action('CRIAR SALA E CONVIDAR','coop-new', () => this.beginNew('coop'));
      if(characterProfiles.list.some(p=>p.campaign?.mode==='coop'&&new LocalJourney(p.id).load()))this.action('CONTINUAR JOGANDO COM AMIGOS','coop-continue', () => { this.pendingInvite = false; this.show('coop-characters'); });
      this.action('ENTRAR POR CONVITE','invite', () => this.show('invite')); this.action('VOLTAR','back', () => this.back());
    } else if (this.page === 'invite') {
      this.heading('Reunir a equipe', 'Cole o convite. Uma campanha iniciada aceita somente seus personagens originais.');
      const input = document.createElement('input'); input.name = 'coop-code'; input.value = this.code; input.placeholder = 'Link ou código da sala'; input.maxLength = 2048; input.setAttribute('aria-label','Link ou código da sala'); input.oninput = () => { this.code = input.value; }; this.content.append(input);
      this.action('CONSULTAR SALA','coop-join', () => { void this.inspect(); }).disabled = this.inspecting;
      this.action('VOLTAR','back', () => this.back());
      if (this.pendingInvite && !this.lobby && !this.inspecting) void this.inspect();
    } else if (this.page === 'coop') {
      const c = characterProfiles.active.campaign;
      this.heading('Expedição cooperativa', c ? `${DIFFICULTIES[c.difficulty].name} · equipe original de ${c.size}`:'Selecione uma campanha cooperativa.');
      if (coopSession.role === 'offline' || coopSession.role === 'connecting') {
        if (c?.hostId === characterProfiles.active.id) this.action(this.busy ? 'REUNINDO…':'REUNIR EQUIPE E CONVIDAR','coop-create', () => { void this.connect('create'); }).disabled = this.busy || !this.scene;
        else this.action('ENTRAR PELO CONVITE DO ANFITRIÃO','invite', () => this.show('invite'));
      } else {
        if(!coopSession.campaignRunning){
          const waiting=document.createElement('p');waiting.className='lobby-wait';waiting.dataset.lobbyWaiting=coopSession.role;
          waiting.setAttribute('role','status');waiting.textContent=coopSession.role==='host'?coopSession.members.filter(m=>m.connected).length===c?.size?'Equipe pronta para iniciar':'Aguardando convidados':!coopSession.campaign?.started?'Aguardando líder':'Aguardando a equipe original';this.content.append(waiting);
        }
        this.roster();
        if(coopSession.role==='host'&&!coopSession.campaign?.started)this.action('INICIAR EXPEDIÇÃO','coop-start',()=>coopSession.startCampaign()).disabled=!coopSession.campaignSaved||coopSession.members.filter(m=>m.connected).length!==c?.size;
        const input = document.createElement('input'); input.name = 'coop-invite'; input.readOnly = true; input.value = invitationLink(coopSession.code); input.setAttribute('aria-label','Convite da equipe'); this.content.append(input);
        if(typeof navigator.share==='function')this.action('CONVIDAR AMIGOS','coop-share',()=>{void this.shareInvite(input,true);});
        this.action('COPIAR CONVITE','coop-copy',()=>{void this.shareInvite(input);});
        if (!coopSession.campaignSaved) this.action('TENTAR SALVAR EQUIPE','coop-save', () => coopSession.retryCampaignSave());
        if (coopSession.campaignRunning) this.action('RETOMAR EXPEDIÇÃO','continue', () => this.resume());
        else this.status(coopSession.campaignSaved ? `${coopSession.members.filter(m=>m.connected).length}/${c?.size} conectados. ${coopSession.role==='host'?'Quando todos chegarem, toque em Iniciar expedição.':'O líder inicia a expedição quando a equipe estiver reunida.'}`:'Não foi possível salvar a equipe. Libere o armazenamento e tente novamente.');
      }
      this.action('VOLTAR À TELA INICIAL','home', () => this.returnHome());
    } else if (this.page === 'coop-ended') {
      this.heading('Expedição interrompida', coopSession.endedMessage); this.status('Seu personagem continua vinculado à equipe. Reúna os mesmos exploradores para continuar.'); this.action('VOLTAR À TELA INICIAL','coop-home', () => this.returnHome());
    } else if (this.page === 'settings') {
      this.heading('Configurações', 'Preferências deste navegador.');
      for (const [key, title] of [['master','Volume geral'],['music','Música'],['sfx','Efeitos']] as const) {
        const label = document.createElement('label'); label.textContent = title; const input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = '100'; input.value = String(Math.round(this.volumes[key] * 100)); input.dataset.volume = key;
        input.oninput = () => { this.volumes[key] = Number(input.value) / 100; this.applyVolumes(); try { localStorage.setItem(SETTINGS, JSON.stringify(this.volumes)); } catch { this.status('Volume aplicado; não foi possível salvar a preferência.'); } }; label.append(input); this.content.append(label);
      }
      if (!this.playing && !this.prologue) this.action('REVER A CHEGADA A DANTE','prologue-replay', () => this.showPrologue(true));
      this.action('VOLTAR','back', () => this.back());
    }
    if (this.page !== 'settings') this.action('CONFIGURAÇÕES','settings', () => this.settings());
  }
  private async shareInvite(input:HTMLInputElement,native=false):Promise<void>{
    try{
      if(native&&typeof navigator.share==='function'){await navigator.share({title:'Echoes of Dante',text:'Venha desbravar Dante com a nossa equipe.',url:input.value});return;}
      if(navigator.clipboard){await navigator.clipboard.writeText(input.value);this.status('Convite copiado. Envie o link aos seus amigos.');return;}
    }catch(e){if(native&&e instanceof DOMException&&e.name==='AbortError')return;}
    input.focus();input.select();input.setSelectionRange(0,input.value.length);this.status('Link selecionado. Toque e segure para copiar o convite.');
  }
  private savedSoloProfiles(){return characterProfiles.list.filter(p=>p.campaign?.mode!=='coop'&&new LocalJourney(p.id).load()!==undefined);}
  private roster(): void {
    const roster = document.createElement('section'); roster.className = 'party-lobby'; roster.setAttribute('aria-label','Equipe original');
    const crew = coopSession.campaign?.crew ?? [];
    for (const classId of ['warrior','hunter','astral','xenobinder'] as const) {
      const member = coopSession.members.find(m => m.profile.classId === classId), expected = crew.find(m => m.classId === classId);
      const slot = document.createElement('div'); slot.dataset.partyClass = classId; const name = document.createElement('strong'), state = document.createElement('span'); name.textContent = CLASS_NAMES[classId];
      state.textContent = member ? `${member.profile.name} · ${member.connected ? 'conectado':'aguardando retorno'}` : expected ? `${expected.name} · aguardando retorno`: crew.length ? 'FORA DESTA EQUIPE':'VAGA LIVRE'; slot.append(name,state); roster.append(slot);
    }
    this.content.append(roster);
  }
  private applyVolumes(): void { this.scene?.setShellVolumes(this.volumes.master,this.volumes.music,this.volumes.sfx); this.prologue?.volumes(this.volumes.master,this.volumes.music,this.volumes.sfx); }
  private pollPad = (): void => {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find(p => p?.connected && p.mapping === 'standard'), down = pad ? pad.buttons.map(b => b.pressed || b.value > .5):[];
    if(this.chat.frame(document.querySelector<HTMLElement>('dialog[open]:not(.application-shell)')??(this.dialog.open?this.dialog:document.body),down,this.padPrevious)){this.padPrevious=down;this.padFrame=requestAnimationFrame(this.pollPad);return;}
    if (down[9] && !this.padPrevious[9] && !document.querySelector('dialog[open]:not(.application-shell)')) { if (this.dialog.open) this.back(); else this.openPause(); }
    if (this.dialog.open) {
      const buttons = Array.from((this.content.querySelector('.character-delete-dialog[open]') ?? this.content).querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),input:not(:disabled)'));
      const index = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
      const horizontal=(down[15]&&!this.padPrevious[15]?1:0)-(down[14]&&!this.padPrevious[14]?1:0),focused=document.activeElement;
      if(horizontal&&focused instanceof HTMLSelectElement){focused.selectedIndex=Math.max(0,Math.min(focused.options.length-1,focused.selectedIndex+horizontal));focused.dispatchEvent(new Event('change'));}
      else if(horizontal&&focused instanceof HTMLInputElement&&focused.type==='range'){focused.value=String(Math.max(0,Math.min(100,Number(focused.value)+horizontal*5)));focused.dispatchEvent(new Event('input'));}
      else if(horizontal)buttons[(index+horizontal+buttons.length)%buttons.length]?.focus();
      if (down[13] && !this.padPrevious[13]) buttons[(index + 1) % buttons.length]?.focus();
      if (down[12] && !this.padPrevious[12]) buttons[(index + buttons.length - 1) % buttons.length]?.focus();
      if (down[0] && !this.padPrevious[0]) (document.activeElement as HTMLElement)?.click?.();
      if (down[1] && !this.padPrevious[1]) this.back();
    }
    this.padPrevious = down; this.padFrame = requestAnimationFrame(this.pollPad);
  };
  destroy(): void { this.mobileDisplay.destroy();this.chat.destroy();this.selection?.destroy(); this.prologue?.destroy(); cancelAnimationFrame(this.padFrame); window.removeEventListener('keydown',this.keyDown,true); window.removeEventListener('keyup',this.editableKey); window.removeEventListener('keydown',this.editableKey); window.removeEventListener('dante-coop',this.coopChanged); this.dialog.remove(); this.menuButton.remove(); }
}
