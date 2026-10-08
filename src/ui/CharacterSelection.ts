import { characterProfiles, type CharacterClass } from '../systems/CharacterProfiles';
import { CLASS_NAMES } from '../config/classes';
import { PROGRESSION } from '../config/progression';
import { CharacterShowcase } from './CharacterShowcase';
import './character-selection.css';

const identity = {
  warrior: { role: 'CORPO A CORPO · RESISTÊNCIA', fantasy: 'Entre na batalha. Domine o espaço próximo.', kit: 'Sabre de energia · Esquiva do vazio · Carga cinética' },
  hunter: { role: 'DISTÂNCIA · PRECISÃO', fantasy: 'Controle a distância. Encontre sua janela de disparo.', kit: 'Rifle de pulso · Passo de fase · Feixe perfurante' },
};
type Actions = { back: () => void; create: (name: string, classId: CharacterClass) => void; play: (id: string) => void; remove: (id: string) => void; newCharacter: () => void };
function button(text: string, id: string, action: () => void): HTMLButtonElement {
  const el = document.createElement('button'); el.type = 'button'; el.textContent = text; el.dataset.shell = id;
  el.addEventListener('click', action); return el;
}
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag); el.className = className; el.textContent = text; return el;
}

// Presentation only: selecting a display never mutates a saved character.
export class CharacterSelection {
  private readonly previews: CharacterShowcase[] = [];
  private deleteDialog?: HTMLDialogElement;
  constructor(private readonly root: HTMLElement, mode: 'characters' | 'create', actions: Actions, private readonly joiningRoom = false) {
    const header = element('header', 'selection-header');
    const title = element('div', 'selection-title');
    title.append(element('small', '', 'ECHOES OF DANTE / EXPEDIÇÃO'));
    const h = element('h2', '', joiningRoom ? mode === 'create' ? 'Crie seu personagem para a sala' : 'Com qual personagem você vai jogar?' : mode === 'create' ? 'Escolha quem você será' : 'Suas expedições'); h.id = 'shell-title'; title.append(h);
    title.append(element('p', '', joiningRoom ? 'Escolha seu personagem para entrar com seu amigo. Sua jornada solo será preservada.' : mode === 'create' ? 'Selecione uma classe para ver seu estilo de combate.' : 'Escolha um personagem. Sua jornada começa de onde você parou.'));
    header.append(title);
    const headerActions = element('div', 'selection-header-actions');
    headerActions.append(button('← VOLTAR', 'back', actions.back)); header.append(headerActions);
    if (mode === 'characters') {
      const create = button('+ CRIAR NOVO', 'new-character', actions.newCharacter); create.className = 'selection-primary';
      create.disabled = characterProfiles.list.length >= 6;
      if (create.disabled) create.title = 'Limite de seis personagens neste navegador'; headerActions.append(create);
    }
    root.append(header);
    if (mode === 'create') this.creation(actions); else this.characters(actions);
  }
  private stage(classId: CharacterClass): { stage: HTMLElement; preview: CharacterShowcase } {
    const stage = element('div', 'character-stage'), preview = new CharacterShowcase(classId);
    stage.append(element('div', 'stage-light'), element('div', 'stage-plinth'), preview.canvas, preview.caption);
    this.previews.push(preview); return { stage, preview };
  }
  private creation(actions: Actions): void {
    const gallery = element('div', 'class-gallery'); gallery.setAttribute('role', 'group'); gallery.setAttribute('aria-label', 'Classes disponíveis');
    const selectedTitle = element('h3', '', 'Uma identidade. Uma nova jornada.');
    const description = element('p', '', 'Duas classes disponíveis. Escolha a sua para começar.');
    const kit = element('small', 'selection-kit');
    const info = element('div', 'selection-info'); info.append(selectedTitle, description, kit);
    const replay = button('↻ VER EM AÇÃO', 'replay', () => selected && this.previews.find(p => p.classId === selected)?.play(true)); replay.disabled = true;
    const label = element('label', 'selection-name', 'Nome do personagem');
    const input = document.createElement('input'); input.name = 'character-name'; input.maxLength = 24; input.placeholder = 'Seu nome em Dante'; input.autocomplete = 'off'; input.disabled = true; label.append(input);
    let selected: CharacterClass | undefined;
    const create = button(this.joiningRoom ? 'CRIAR E ENTRAR NA SALA →' : 'COMEÇAR EXPEDIÇÃO →', 'create', () => { if (selected) actions.create(input.value, selected); });
    create.className = 'selection-primary'; create.disabled = true;
    input.addEventListener('input', () => create.disabled = !selected || !input.value.trim());
    input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing && !create.disabled) { event.preventDefault(); create.click(); } });
    for (const classId of ['warrior', 'hunter'] as const) {
      const card = button('', `choose-${classId}`, () => {
        selected = classId;
        for (const b of Array.from(gallery.querySelectorAll<HTMLButtonElement>('[data-class]'))) b.setAttribute('aria-pressed', String(b.dataset.class === classId));
        for (const p of this.previews) p.classId === classId ? p.play() : p.stop();
        selectedTitle.textContent = CLASS_NAMES[classId]; description.textContent = identity[classId].fantasy; kit.textContent = identity[classId].kit;
        input.disabled = false; replay.disabled = false; create.disabled = !input.value.trim();
      });
      card.className = 'class-display'; card.dataset.class = classId; card.setAttribute('aria-pressed', 'false');
      card.setAttribute('aria-label', `Selecionar ${CLASS_NAMES[classId]}`);
      card.append(this.stage(classId).stage, element('strong', 'class-name', CLASS_NAMES[classId]), element('small', 'class-role', identity[classId].role)); gallery.append(card);
    }
    for (const [name, subtitle] of [['Manipulador Astral', 'CONTROLE ELEMENTAL'], ['Espaço futuro', 'UMA NOVA IDENTIDADE']]) {
      const card = button('', 'future-class', () => {}); card.className = 'class-display class-future'; card.disabled = true;
      const stage = element('div', 'character-stage'); stage.append(element('div', 'stage-light'), element('div', 'stage-plinth'), element('span', 'stage-empty', '◇'), element('span', 'showcase-caption', 'EM BREVE'));
      card.append(stage, element('strong', 'class-name', name), element('small', 'class-role', subtitle)); gallery.append(card);
    }
    const footer = element('div', 'creation-footer'), controls = element('div', 'selection-controls'); controls.append(label, create);
    const detail = element('div', 'selection-detail'); detail.append(info, replay);
    footer.append(detail, controls); this.root.append(gallery, footer);
  }
  private characters(actions: Actions): void {
    if (!characterProfiles.list.length) {
      const empty = element('section', 'empty-characters');
      empty.append(element('h3', '', 'Sua próxima jornada começa aqui.'), element('p', '', 'Você ainda não tem personagens. Crie um novo para explorar Dante.'));
      this.root.append(empty); return;
    }
    const layout = element('div', 'saved-selection'), list = element('div', 'saved-characters'); list.setAttribute('role', 'group'); list.setAttribute('aria-label', 'Personagens salvos');
    const display = element('div', 'saved-display'), details = element('div', 'selection-info');
    let selected = characterProfiles.active.id, current: CharacterShowcase | undefined;
    const play = button(this.joiningRoom ? 'ENTRAR NA SALA →' : 'CONTINUAR JORNADA →', 'play-character', () => actions.play(selected)); play.className = 'selection-primary';
    const replay = button('↻ VER EM AÇÃO', 'replay', () => current?.play(true));
    const remove = button('EXCLUIR PERSONAGEM', 'delete-character', () => this.confirmDelete(selected, actions.remove, remove));
    remove.className = 'selection-delete';
    const tools = element('div', 'saved-display-actions'); tools.append(replay, remove);
    const show = (id: string) => {
      const hero = characterProfiles.list.find(h => h.id === id); if (!hero) return;
      selected = id; current?.destroy(); this.previews.length = 0;
      const entry = this.stage(hero.classId); current = entry.preview; display.replaceChildren(entry.stage, details, tools, play);
      details.replaceChildren(element('h3', '', hero.name), element('p', '', CLASS_NAMES[hero.classId]), element('small', 'selection-kit', identity[hero.classId].kit));
      for (const b of Array.from(list.querySelectorAll<HTMLButtonElement>('button'))) b.setAttribute('aria-pressed', String(b.dataset.shell === `character-${id}`));
      current.play();
    };
    for (const hero of characterProfiles.list) {
      let level = 1, region = 'Nova expedição';
      try {
        const saved = JSON.parse(localStorage.getItem(characterProfiles.keyFor(hero.id)) ?? 'null');
        if (typeof saved?.progression?.xp === 'number') level = Math.max(1, PROGRESSION.levelThresholds.filter(x => x <= saved.progression.xp).length);
        const names: Record<string, string> = { forest: 'Floresta', cavern: 'Cavernas', warden: 'Guardião', valley: 'Vale', arid: 'Siroco', dunes: 'Dunas', sandpit: 'Bacia Soterrada', frost: 'Fratura Boreal' };
        if (saved) region = names[saved.area] ?? 'Expedição';
      } catch { /* A corrupt journey safely starts through LocalJourney. */ }
      const card = button('', `character-${hero.id}`, () => show(hero.id)); card.className = 'saved-character'; card.setAttribute('aria-pressed', 'false');
      card.append(element('strong', '', hero.name), element('span', '', `${CLASS_NAMES[hero.classId]} · NV ${level}`), element('small', '', `${region}${hero.id === characterProfiles.active.id ? ' · ATUAL' : ''}`)); list.append(card);
    }
    layout.append(list, display); this.root.append(layout); show(selected);
    if (characterProfiles.list.length >= 6) this.root.append(element('p', 'shell-status', 'Seis personagens salvos neste navegador. Limite de criação atingido.'));
  }
  private confirmDelete(id: string, remove: Actions['remove'], trigger: HTMLButtonElement): void {
    const hero = characterProfiles.list.find(p => p.id === id); if (!hero || this.deleteDialog) return;
    const dialog = document.createElement('dialog'); dialog.className = 'character-delete-dialog';
    dialog.setAttribute('aria-labelledby', 'character-delete-title'); dialog.setAttribute('aria-describedby', 'character-delete-description');
    const title = element('h3', '', `Excluir “${hero.name}”?`); title.id = 'character-delete-title';
    const description = element('p', '', 'O personagem e toda a sua jornada salva serão apagados deste navegador. Esta ação não pode ser desfeita.'); description.id = 'character-delete-description';
    const dismiss = () => { this.cancelDeletion(); if (trigger.isConnected) trigger.focus({ preventScroll: true }); };
    const cancel = button('CANCELAR', 'cancel-delete', dismiss);
    const confirm = button('EXCLUIR', 'confirm-delete', () => { dismiss(); remove(id); }); confirm.className = 'selection-delete';
    const controls = element('div', 'delete-confirm-controls'); controls.append(cancel, confirm);
    dialog.append(title, description, controls); this.root.append(dialog); this.deleteDialog = dialog;
    dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
    dialog.showModal(); cancel.focus();
  }
  get confirmingDeletion(): boolean { return this.deleteDialog?.open ?? false; }
  cancelDeletion(): boolean {
    if (!this.deleteDialog) return false;
    this.deleteDialog.close(); this.deleteDialog.remove(); this.deleteDialog = undefined; return true;
  }
  destroy(): void { this.cancelDeletion(); for (const p of this.previews) p.destroy(); this.previews.length = 0; }
}
