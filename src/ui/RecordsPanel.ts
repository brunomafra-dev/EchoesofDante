import Phaser from 'phaser';
import { SPECIES, type SpeciesId } from '../config/bestiary';
import { VALLEY_ROUTES } from '../config/valley';
import type { BestiarySnapshot } from '../systems/Bestiary';
import { PROGRESSION } from '../config/progression';

type Records = { level: number; xp: number; nextLevelXp: number | null; maxHp: number; echoes: number; area: string; bestiary: BestiarySnapshot;
  routes: ReadonlySet<string>; rewardedRoutes: ReadonlySet<string>; valleyVisited: boolean; saveStatus: string };

// DOM exists once per scene; content is refreshed only when this journal opens.
export class RecordsPanel {
  private readonly button: HTMLButtonElement;
  private readonly dialog: HTMLDialogElement;
  private readonly summary: HTMLElement;
  private readonly status: HTMLElement;
  private readonly content: HTMLElement;
  private readonly confirmation: HTMLElement;
  private readonly cards = new Map<SpeciesId, HTMLElement>();
  private frame = 0;
  private padButtons: boolean[] = [];

  constructor(scene: Phaser.Scene, private readonly getRecords: () => Records,
    private readonly onOpen: () => void, private readonly onClose: () => void, private readonly onReset: () => void) {
    this.button = document.createElement('button');
    this.button.className = 'records-button';
    this.button.textContent = 'REGISTROS';
    this.button.setAttribute('aria-haspopup', 'dialog');
    this.button.addEventListener('click', () => this.open());
    // A second finger must open the journal even while the first holds a skill.
    // Browsers can suppress the compatibility click for multi-touch gestures.
    this.button.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') { event.preventDefault(); this.open(); }
    });
    // Opening a modal makes its underlying button inert. Consume the compatibility
    // click so the same finger release cannot hit a newly exposed dialog button.
    this.button.addEventListener('touchend', event => { event.preventDefault(); this.open(); }, { passive: false });
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'records-dialog';
    this.dialog.setAttribute('aria-labelledby', 'records-title');
    this.dialog.innerHTML = `<header><div><small>ARQUIVO DE EXPEDIÇÃO</small><h1 id="records-title">Registros de Dante</h1></div><button data-close aria-label="Fechar registros">VOLTAR</button></header>
      <div class="records-content"><p class="records-summary"></p><p class="records-status" role="status"></p><p class="records-progression"></p>
      <details class="records-controls"><summary>Controles</summary><p>PC: WASD move, mouse mira, clique esquerdo ataca, Espaço esquiva, Q segura e solta a carga, E investiga e B abre os registros.</p><p>Gamepad: LS move, RS mira, RT ataca, RB esquiva, LT segura e solta a carga, A investiga e Voltar abre os registros.</p><p>Touch: arraste à esquerda para mover. Toque em GOLPE ou arraste e solte para direcionar. Segure CARGA, arraste e solte. ESQUIVA segue a direção de movimento; INVESTIGAR aparece perto de uma interação.</p></details>
      <h2>Bestiário</h2><p class="records-research"></p><p>A primeira derrota libera uma observação tática. Os registros ajudam a escolher como enfrentar cada espécie, sem bônus de dano.</p><div class="records-species"></div>
      <h2>Expedições no Vale</h2><ul class="records-routes"></ul><p>A passagem começa com um Casco Errante; os desvios abrigam duplas. A margem leste reúne um Casco e dois Espinhantes. Todos podem ser contornados. Os moradores retornam após 90 segundos, quando você está longe do habitat. Cada derrota concede ${PROGRESSION.hollowXp} XP.</p>
      <footer><p>Salvo apenas neste navegador e dispositivo. Limpar os dados do site apaga o progresso.</p><button data-reset>NOVO PERCURSO</button>
      <section class="records-confirmation" hidden><p>Apagar todo o progresso local e recomeçar na floresta?</p><button data-confirm>APAGAR E RECOMEÇAR</button><button data-cancel>CONTINUAR EXPEDIÇÃO</button></section></footer>
      <small class="records-help">B / Esc: voltar · Gamepad: Voltar ou B fecha; analógico esquerdo rola; direcional escolhe; A confirma.</small></div>`;
    this.summary = this.dialog.querySelector('.records-summary')!;
    this.status = this.dialog.querySelector('.records-status')!;
    this.content = this.dialog.querySelector('.records-content')!;
    this.confirmation = this.dialog.querySelector('.records-confirmation')!;
    const list = this.dialog.querySelector('.records-species')!;
    for (const id of Object.keys(SPECIES) as SpeciesId[]) {
      const card = document.createElement('article');
      list.append(card); this.cards.set(id, card);
    }
    this.dialog.querySelector('[data-close]')!.addEventListener('click', () => this.close());
    this.dialog.querySelector('[data-reset]')!.addEventListener('click', () => {
      this.confirmation.hidden = false;
      (this.dialog.querySelector('[data-cancel]') as HTMLButtonElement).focus();
    });
    this.dialog.querySelector('[data-cancel]')!.addEventListener('click', () => { this.confirmation.hidden = true; });
    this.dialog.querySelector('[data-confirm]')!.addEventListener('click', () => this.onReset());
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
    this.dialog.addEventListener('close', () => {
      cancelAnimationFrame(this.frame);
      document.body.classList.remove('records-open');
      this.onClose();
      scene.game.canvas.tabIndex = 0;
      scene.game.canvas.focus({ preventScroll: true });
    });
    document.body.append(this.button, this.dialog);
    window.addEventListener('keydown', this.keyDown, true);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cancelAnimationFrame(this.frame);
      window.removeEventListener('keydown', this.keyDown, true);
      document.body.classList.remove('records-open');
      this.button.remove(); this.dialog.remove();
    });
  }

  get isOpen(): boolean { return this.dialog.open; }
  markDiscovery(): void {
    this.button.textContent = 'REGISTROS • NOVO';
  }
  setSaveAvailable(available: boolean): void {
    this.button.classList.toggle('save-unavailable', !available);
    this.button.title = available ? 'Progresso salvo neste navegador' : 'Não foi possível salvar; consulte os registros';
    if (this.isOpen) this.status.textContent = this.getRecords().saveStatus;
  }

  open(): void {
    if (this.isOpen) return;
    this.onOpen();
    const data = this.getRecords();
    this.summary.textContent = `${data.area} · Nível ${data.level} · ${data.xp} XP · Ecos ${data.echoes}/3`;
    this.status.textContent = data.saveStatus;
    this.dialog.querySelector('.records-progression')!.textContent = data.nextLevelXp === null
      ? `Nível ${PROGRESSION.levelThresholds.length}: limite desta etapa. ${data.maxHp} PV máximos. A exploração e os registros continuam.`
      : `${data.maxHp} PV máximos. Faltam ${Math.max(0, data.nextLevelXp - data.xp)} XP para o nível ${data.level + 1}: +${PROGRESSION.maxHpPerLevel} PV e vida restaurada. Explore novos desvios ou revisite os habitats.`;
    const entries = Object.values(data.bestiary);
    this.dialog.querySelector('.records-research')!.textContent = `${entries.filter(e => e?.seen).length}/${Object.keys(SPECIES).length} espécies observadas · ${entries.filter(e => e && e.defeats > 0).length}/${Object.keys(SPECIES).length} estudadas`;
    for (const [id, card] of this.cards) {
      const entry = data.bestiary[id], species = SPECIES[id];
      card.replaceChildren();
      const name = document.createElement('h3'); name.textContent = entry?.seen ? species.name : 'Criatura não registrada';
      const habitat = document.createElement('small'); habitat.textContent = entry?.seen ? `${species.habitat} · Derrotas: ${entry.defeats}` : 'Explore Dante para descobrir.';
      const note = document.createElement('p'); note.textContent = entry?.seen ? species.note : 'Registro ainda incompleto.';
      const study = document.createElement('p'); study.className = 'records-study';
      study.textContent = entry && entry.defeats > 0 ? `ESTUDADO · ${species.study}`
        : entry?.seen ? 'OBSERVADO · A primeira derrota completa a observação tática.' : 'OBSERVAÇÃO PENDENTE';
      card.append(name, habitat, note, study); card.classList.toggle('undiscovered', !entry?.seen);
    }
    const routes = this.dialog.querySelector('.records-routes')!; routes.replaceChildren();
    if (!data.valleyVisited) {
      const item = document.createElement('li'); item.textContent = 'O Vale fica além do portal do Guardião. Continue seguindo o sinal.'; routes.append(item);
    } else for (const route of VALLEY_ROUTES) {
      const visited = data.routes.has(route.id), item = document.createElement('li');
      const title = document.createElement('h3'); title.textContent = `${visited ? 'Registrado' : 'A explorar'}: ${route.name}`;
      const note = document.createElement('p'); note.textContent = visited ? `${route.residents} ${route.tactic} · ${data.rewardedRoutes.has(route.id) ? 'Recompensa de exploração já recebida.' : `Revisite para registrar a recompensa: +${PROGRESSION.valleyRouteXp} XP.`}`
        : `Primeira descoberta: +${PROGRESSION.valleyRouteXp} XP. ${route.hint}`;
      item.append(title, note); routes.append(item);
    }
    this.confirmation.hidden = true;
    this.content.scrollTop = 0;
    this.button.textContent = 'REGISTROS';
    document.body.classList.add('records-open');
    this.padButtons = this.readPad()?.buttons.map(b => b.pressed || b.value > 0.5) ?? [];
    this.dialog.showModal();
    (this.dialog.querySelector('[data-close]') as HTMLButtonElement).focus();
    this.frame = requestAnimationFrame(this.pollPad);
  }

  close(): void {
    if (!this.isOpen) return;
    if (!this.confirmation.hidden) { this.confirmation.hidden = true; return; }
    this.dialog.close();
  }

  private keyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen) return;
    event.stopImmediatePropagation();
    if ((event.code === 'KeyB' || event.code === 'Escape') && !event.repeat) { event.preventDefault(); this.close(); }
  };

  private readPad(): Gamepad | undefined {
    return navigator.getGamepads?.().find(pad => pad?.connected && pad.mapping === 'standard') ?? undefined;
  }
  private pollPad = (): void => {
    if (!this.isOpen) return;
    const pad = this.readPad(), buttons = pad?.buttons.map(b => b.pressed || b.value > 0.5) ?? [];
    const edge = (index: number) => buttons[index] && !this.padButtons[index];
    if (edge(8) || edge(1)) this.close();
    else if (edge(0)) (this.dialog.contains(document.activeElement) ? document.activeElement as HTMLElement : null)?.click();
    else if (edge(12) || edge(13)) {
      const focusable = Array.from(this.dialog.querySelectorAll<HTMLElement>('button, summary')).filter(b => !b.closest('[hidden]'));
      const current = focusable.indexOf(document.activeElement as HTMLButtonElement);
      focusable[(current + (edge(12) ? -1 : 1) + focusable.length) % focusable.length]?.focus();
    }
    if (pad && Math.abs(pad.axes[1] ?? 0) > 0.25) this.content.scrollTop += pad.axes[1] * 12;
    this.padButtons = buttons;
    if (this.isOpen) this.frame = requestAnimationFrame(this.pollPad);
  };
}
