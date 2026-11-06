import{COMPANIONS,companionInfo}from'../config/companions';
import { characterProfiles, type CharacterClass, type CharacterProfile } from '../systems/CharacterProfiles';
import { DIFFICULTIES, difficultyId } from '../config/difficulty';
import { CLASS_NAMES } from '../config/classes';
import { characterSex, SEX_NAMES, type CharacterSex } from '../config/appearance';
import { PROGRESSION } from '../config/progression';
import { CharacterShowcase } from './CharacterShowcase';
import {appearance,type CharacterAppearance,type CompanionSpecies}from'../config/characterPresentation';
import './character-selection.css';

const identity = {
  warrior: { role: 'CORPO A CORPO · RESISTÊNCIA', fantasy: 'Entre na batalha. Domine o espaço próximo.', kit: 'Sabre de energia · Esquiva do vazio · Carga cinética' },
  hunter: { role: 'DISTÂNCIA · PRECISÃO', fantasy: 'Controle a distância. Encontre sua janela de disparo.', kit: 'Rifle de pulso · Passo de fase · Feixe perfurante' },
  astral: { role: 'MÉDIO ALCANCE · CONTROLE', fantasy: 'Controle o campo. Conduza as forças de Dante pela manopla.', kit: 'Manopla astral · Energia, fogo, água e terra · Campos direcionais' },
  xenobinder:{role:'DOMADOR · SIMBIOSE',fantasy:'Lute em simbiose. Oriente uma criatura de Dante e proteja sua expedição.',kit:'Condutor simbiótico · Companheiro permanente · Investida e recuperação'},
};
type Actions = { back: () => void; create: (name: string, classId: CharacterClass, sex: CharacterSex,look:CharacterAppearance) => void; play: (id: string) => void; remove: (id: string) => void; newCharacter: () => void };
export type CharacterDraft = { name: string; classId: CharacterClass; sex: CharacterSex;appearance?:CharacterAppearance;preset?:CharacterClass };
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
  private previewRefresh = 0;
  private deleteDialog?: HTMLDialogElement;
  private appearanceDialog?:HTMLDialogElement;
  private dismissAppearance?:()=>void;
  constructor(private readonly root: HTMLElement, mode: 'characters' | 'create', actions: Actions, private readonly joiningRoom = false, private readonly occupied: readonly string[] = [], private readonly context: { profiles?: readonly CharacterProfile[]; title?: string; subtitle?: string; allowCreate?: boolean; draft?: CharacterDraft; onDraft?: (draft:CharacterDraft)=>void } = {}) {
    const header = element('header', 'selection-header');
    const title = element('div', 'selection-title');
    title.append(element('small', '', 'ECHOES OF DANTE / EXPEDIÇÃO'));
    const h = element('h2', '', context.title ?? (joiningRoom ? mode === 'create' ? 'Crie seu personagem para a sala' : 'Com qual personagem você vai jogar?' : mode === 'create' ? 'Crie o seu personagem' : 'Suas expedições')); h.id = 'shell-title'; title.append(h);
    title.append(element('p', '', context.subtitle ?? (joiningRoom ? 'Use o personagem vinculado a esta campanha.' : mode === 'create' ? 'Quatro personagens com visual próprio. Escolha sua classe, gênero e nome para começar.' : 'Escolha um personagem. Sua jornada começa de onde você parou.')));
    header.append(title);
    const headerActions = element('div', 'selection-header-actions');
    headerActions.append(button('← VOLTAR', 'back', actions.back)); header.append(headerActions);
    if (mode === 'characters' && context.allowCreate !== false) {
      const create = button('+ CRIAR NOVO', 'new-character', actions.newCharacter); create.className = 'selection-primary';
      create.disabled = characterProfiles.list.length >= 6;
      if (create.disabled) create.title = 'Limite de seis personagens neste navegador'; headerActions.append(create);
    }
    root.append(header);
    if (mode === 'create') this.creation(actions); else this.characters(actions);
  }
  private stage(classId: CharacterClass, sex = characterSex(classId),look:CharacterAppearance=appearance(),species:CompanionSpecies='symbiont'): { stage: HTMLElement; preview: CharacterShowcase } {
    const stage = element('div', 'character-stage'), preview = new CharacterShowcase(classId, sex,look,species);
    stage.append(element('div', 'stage-light'), element('div', 'stage-plinth'), preview.canvas, preview.caption);
    this.previews.push(preview); return { stage, preview };
  }
  private creation(actions: Actions): void {
    const classes=['warrior','hunter','astral','xenobinder'] as const;
    // Review the independent flow before producing the missing full-body
    // weapon/pose combinations. The live game keeps all four original pairs.
    const independentReview=location.pathname.endsWith('/campaign-playtest.html')&&new URLSearchParams(location.search).get('refinement')==='201';
    const draft=this.context.draft;
    let preset:CharacterClass=draft?.preset??draft?.classId??'warrior';
    let profession:CharacterClass=draft?.classId??(classes.find(c=>!this.occupied.includes(c))??'warrior');
    if(draft)profession=draft.classId;
    if(!draft)preset=profession;
    const layout=element('div','hero-creation'),display=element('section','hero-creation-display'),controls=element('div','hero-creation-controls');
    display.setAttribute('aria-label','Personagem selecionado');
    const title=element('h3','hero-preset-title'),previewHost=element('div','hero-preview-host');
    const status=element('p','hero-combination-status');status.setAttribute('role','status');
    const role=element('p','hero-profession-role'),fantasy=element('p','hero-profession-fantasy'),kit=element('p','selection-kit');
    const detail=element('section','hero-profession-detail');detail.setAttribute('aria-label','Profissão selecionada');
    const professionTitle=element('h3','');detail.append(role,professionTitle,fantasy,kit);
    const field=(text:string,name:string)=>{const label=element('label','hero-choice',text),select=document.createElement('select');select.name=name;label.append(select);controls.append(label);return select;};
    const sexSelect=field('Gênero','character-sex');
    for(const id of ['male','female']as const){const option=document.createElement('option');option.value=id;option.textContent=SEX_NAMES[id];sexSelect.append(option);}sexSelect.value=draft?.sex??'male';
    const presetSelect=field('Personagem','character-preset');
    presetSelect.closest('label')!.hidden=!independentReview;
    const names={male:{warrior:'Pioneiro',hunter:'Batedor',astral:'Erudito',xenobinder:'Vinculado'},female:{warrior:'Pioneira',hunter:'Batedora',astral:'Erudita',xenobinder:'Vinculada'}};
    for(const id of classes){const option=document.createElement('option');option.value=id;presetSelect.append(option);}presetSelect.value=preset;
    const professionSelect=field('Profissão','character-profession');
    for(const id of classes){const option=document.createElement('option');option.value=id;option.textContent=CLASS_NAMES[id]+(this.occupied.includes(id)?' — ocupada':'');option.disabled=this.occupied.includes(id);professionSelect.append(option);}professionSelect.value=profession;
    const nameLabel=element('label','hero-choice','Nome'),input=document.createElement('input');input.name='character-name';input.maxLength=24;input.autocomplete='off';input.placeholder='Seu nome em Dante';input.value=draft?.name??'';nameLabel.append(input);controls.append(nameLabel);
    let current:CharacterShowcase|undefined;
    const available=()=>preset===profession&&!this.occupied.includes(profession);
    const create=button(this.joiningRoom?'CRIAR E ENTRAR NA SALA →':'CONTINUAR →','create',()=>{if(available()&&input.value.trim())actions.create(input.value,profession,sexSelect.value as CharacterSex,appearance());});create.className='selection-primary';
    const replay=button('DEMONSTRAR PROFISSÃO','replay',()=>current?.play(true));replay.className='hero-demonstration';
    const remember=()=>this.context.onDraft?.({name:input.value,classId:profession,preset,sex:sexSelect.value as CharacterSex});
    const update=()=>{
      const sex=sexSelect.value as CharacterSex;
      for(const option of Array.from(presetSelect.options))option.textContent=names[sex][option.value as CharacterClass];
      title.textContent=names[sex][preset];
      if(current?.classId!==preset||current.sex!==sex){current?.destroy();this.previews.length=0;const next=this.stage(preset,sex);current=next.preview;previewHost.replaceChildren(next.stage);}
      current.stop();
      professionTitle.textContent=CLASS_NAMES[profession];role.textContent=identity[profession].role;fantasy.textContent=identity[profession].fantasy;kit.textContent=identity[profession].kit;
      status.hidden=available();status.textContent=available()?'':this.occupied.includes(profession)?'Esta profissão já está ocupada na equipe. Escolha outra.':'Este personagem ainda não tem poses completas para esta profissão. A combinação está em preparação e não pode iniciar uma jornada nesta revisão.';
      replay.disabled=!available();create.disabled=!available()||!input.value.trim();
      layout.dataset.preset=preset;layout.dataset.profession=profession;layout.dataset.available=String(available());
      if(available())current.play();
      remember();
    };
    sexSelect.addEventListener('change',update);
    presetSelect.addEventListener('change',()=>{preset=presetSelect.value as CharacterClass;update();});
    professionSelect.addEventListener('change',()=>{profession=professionSelect.value as CharacterClass;if(!independentReview){preset=profession;presetSelect.value=preset;}update();});
    input.addEventListener('input',()=>{create.disabled=!available()||!input.value.trim();remember();});input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&!create.disabled)create.click();});
    display.append(title,previewHost,replay);controls.append(detail,status,create);layout.append(display,controls);this.root.append(layout);update();
  }

  private characters(actions: Actions): void {
    const profiles = this.context.profiles ?? characterProfiles.list;
    if (!profiles.length) {
      const empty = element('section', 'empty-characters');
      empty.append(element('h3', '', 'Sua próxima jornada começa aqui.'), element('p', '', 'Você ainda não tem personagens. Crie um novo para explorar Dante.'));
      this.root.append(empty); return;
    }
    const layout = element('div', 'saved-selection'), list = element('div', 'saved-characters'); list.setAttribute('role', 'group'); list.setAttribute('aria-label', 'Personagens salvos');
    const display = element('div', 'saved-display'), details = element('div', 'selection-info');
    let selected = profiles.some(p => p.id === characterProfiles.active.id) ? characterProfiles.active.id : profiles[0].id, current: CharacterShowcase | undefined;
    const play = button(this.joiningRoom ? 'ENTRAR NA SALA →' : 'CONTINUAR JORNADA →', 'play-character', () => actions.play(selected)); play.className = 'selection-primary';
    const replay = button('↻ VER EM AÇÃO', 'replay', () => current?.play(true));
    const remove = button('EXCLUIR PERSONAGEM', 'delete-character', () => this.confirmDelete(selected, actions.remove, remove));
    remove.className = 'selection-delete';
    const tools = element('div', 'saved-display-actions'); tools.append(replay, remove);
    const edit=button('ESCOLHER FERA','choose-companion',()=>{const hero=profiles.find(p=>p.id===selected);if(hero?.classId==='xenobinder'&&current)this.editPresentation(hero,current,edit,()=>show(selected));});tools.prepend(edit);
    edit.className='selection-primary';
    const show = (id: string) => {
      const hero = profiles.find(h => h.id === id); if (!hero) return;
      selected = id; current?.destroy(); this.previews.length = 0;
      play.disabled=this.occupied.includes(hero.classId);
      play.textContent=play.disabled?'CLASSE OCUPADA':this.joiningRoom?'ENTRAR NA SALA →':'CONTINUAR JORNADA →';
      edit.hidden=hero.classId!=='xenobinder';
      const entry = this.stage(hero.classId,characterSex(hero.classId,hero.sex),appearance(),hero.companion); current = entry.preview; display.replaceChildren(entry.stage, details, tools, play);
      details.replaceChildren(element('h3', '', hero.name), element('p', '', CLASS_NAMES[hero.classId]), element('small', 'selection-kit', hero.classId==='xenobinder'?companionInfo(hero.companion).name+' - Q: '+companionInfo(hero.companion).command:identity[hero.classId].kit));
      for (const b of Array.from(list.querySelectorAll<HTMLButtonElement>('button'))) b.setAttribute('aria-pressed', String(b.dataset.shell === `character-${id}`));
      current.play();
    };
    for (const hero of profiles) {
      let level = 1, region = 'Nova expedição';
      try {
        const saved = JSON.parse(localStorage.getItem(characterProfiles.keyFor(hero.id)) ?? 'null');
        if (typeof saved?.progression?.xp === 'number') level = Math.max(1, PROGRESSION.levelThresholds.filter(x => x <= saved.progression.xp).length);
        const names: Record<string, string> = { forest: 'Floresta', cavern: 'Cavernas', warden: 'Guardião', valley: 'Vale', arid: 'Siroco', dunes: 'Dunas', sandpit: 'Bacia Soterrada', frost: 'Fratura Boreal', icecave: 'Galerias do Degelo', icenest: 'Ninho da Geada' };
        if (saved) region = names[saved.area] ?? 'Expedição';
      } catch { /* A corrupt journey safely starts through LocalJourney. */ }
      const card = button('', `character-${hero.id}`, () => show(hero.id)); card.className = 'saved-character'; card.setAttribute('aria-pressed', 'false');
      card.append(element('strong', '', hero.name), element('span', '', `${CLASS_NAMES[hero.classId]} · NV ${level}`), element('small', '', `${region} · ${hero.campaign?.mode === 'coop' ? `Equipe de ${hero.campaign.size}` : 'Solo'} · ${DIFFICULTIES[difficultyId(hero.campaign?.difficulty)].name}`)); list.append(card);
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
    if(hero.campaign?.mode==='coop'&&hero.campaign.crew.length)description.textContent+=' A equipe original não poderá continuar sem este personagem; outra classe ou outro personagem não poderá substituí-lo.';
    const dismiss = () => { this.cancelDeletion(); if (trigger.isConnected) trigger.focus({ preventScroll: true }); };
    const cancel = button('CANCELAR', 'cancel-delete', dismiss);
    const confirm = button('EXCLUIR', 'confirm-delete', () => { dismiss(); remove(id); }); confirm.className = 'selection-delete';
    const controls = element('div', 'delete-confirm-controls'); controls.append(cancel, confirm);
    dialog.append(title, description, controls); this.root.append(dialog); this.deleteDialog = dialog;
    dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
    dialog.showModal(); cancel.focus();
  }
  private editPresentation(hero:CharacterProfile,preview:CharacterShowcase,trigger:HTMLButtonElement,saved:()=>void):void{
    if(this.appearanceDialog)return;
    let species=hero.companion??'symbiont';
    const dialog=document.createElement('dialog');dialog.className='character-delete-dialog character-appearance-dialog';dialog.setAttribute('aria-labelledby','appearance-title');
    const title=element('h3','','Fera de '+hero.name);title.id='appearance-title';
    const status=element('p','shell-status','');status.setAttribute('role','status');
    const stage=preview.canvas.closest<HTMLElement>('.character-stage'),parent=stage?.parentElement;
    const restore=()=>{preview.setCompanion(hero.companion??'symbiont');if(stage&&parent?.isConnected)parent.prepend(stage);dialog.close();dialog.remove();this.appearanceDialog=undefined;this.dismissAppearance=undefined;if(trigger.isConnected)trigger.focus();};
    this.dismissAppearance=restore;
    dialog.append(title);
    if(stage)dialog.append(stage);
    if(hero.classId==='xenobinder'){
      const label=element('label','companion-choice','Companheiro ativo'),select=document.createElement('select');select.name='companion-species';
      for(const[id,info]of Object.entries(COMPANIONS)){const option=document.createElement('option');option.value=id;option.disabled=!characterProfiles.canChooseCompanion(hero.id,id as CompanionSpecies);option.textContent=info.name+' - '+info.role+(option.disabled?' (bloqueado)':'');select.append(option);}
      select.value=species;const note=element('p','appearance-note','');const describe=()=>{const info=companionInfo(species);note.textContent=info.description+' '+info.unlock+' Uma fera ativa por vez; troca fora de combate.';};describe();select.addEventListener('change',()=>{species=select.value as CompanionSpecies;preview.setCompanion(species);describe();});label.append(select);dialog.append(label,note,button('VER COMANDO DA FERA','preview-companion',()=>preview.play(true)));
    }
    const actions=element('div','delete-confirm-controls');actions.append(button('CANCELAR','cancel-appearance',restore),button('SALVAR','save-appearance',()=>{if(!characterProfiles.updatePresentation(hero.id,hero.appearance,species)){status.textContent='Não foi possível salvar. Confira a pesquisa e o armazenamento do navegador.';return;}restore();saved();}));
    dialog.append(status,actions);this.root.append(dialog);this.appearanceDialog=dialog;dialog.addEventListener('cancel',e=>{e.preventDefault();restore();});dialog.showModal();dialog.querySelector('select')?.focus();
  }
  get confirmingDeletion(): boolean { return !!(this.deleteDialog?.open||this.appearanceDialog?.open); }
  cancelDeletion(): boolean {
    if(this.appearanceDialog){this.dismissAppearance?.();return true;}
    if (!this.deleteDialog) return false;
    this.deleteDialog.close(); this.deleteDialog.remove(); this.deleteDialog = undefined; return true;
  }
  destroy(): void { cancelAnimationFrame(this.previewRefresh); this.cancelDeletion(); for (const p of this.previews) p.destroy(); this.previews.length = 0; }
}
