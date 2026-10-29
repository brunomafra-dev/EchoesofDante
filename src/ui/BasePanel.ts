import {coopSession} from '../network/CoopSession';
import Phaser from 'phaser';
import {equipmentName,EQUIPMENT,EQUIPMENT_IDS,type EquipmentSnapshot} from '../config/equipment';
import {MATERIAL_NAMES,REGION_NAMES,recipe,salePrice,POTION_PRICE,type EconomySnapshot} from '../config/economy';
import type {ServiceAction} from '../systems/BaseEconomy';
import {itemIcon} from '../systems/EquipmentDrops';
import {expeditionAtlas} from './ExpeditionAtlas';
type Tab='medic'|'smith'|'expedition'|'map'|'outpost';
type State={economy:EconomySnapshot;equipment:EquipmentSnapshot;area:keyof typeof REGION_NAMES;hp:number;maxHp:number;classId:string;returnAvailable:boolean;returnArea?:keyof typeof REGION_NAMES;canLead:boolean;missionArea?:keyof typeof REGION_NAMES;missionTitle?:string;outpostSupport?:boolean};
export class BasePanel{
 private dialog=document.createElement('dialog');private bar=document.createElement('div');private tab:Tab='map';private notice='';private frame=0;private previous:boolean[]=[];
 constructor(scene:Phaser.Scene,private read:()=>State,private act:(action:ServiceAction)=>boolean,private travel:(area:keyof typeof REGION_NAMES,resume?:boolean)=>boolean,private potion:()=>boolean,private opened:()=>void,private closed:()=>void){
  this.dialog.className='records-dialog base-dialog';this.dialog.setAttribute('aria-label','Serviços da expedição');
  this.bar.className='expedition-launcher';this.bar.innerHTML='<span class="expedition-credits" aria-label="Saldo em créditos" title="Seus créditos"><small aria-hidden="true">🪙</small><strong data-credits>0</strong></span><button data-map data-shortcut="M" aria-keyshortcuts="m" aria-label="Abrir atlas" title="Atlas · M" class="hud-icon">🌐</button><button data-potion data-shortcut="H" aria-keyshortcuts="h" class="hud-icon"><span aria-hidden="true">🧪</span><small data-potion-count>0</small></button>';
  this.bar.querySelector('[data-map]')!.addEventListener('click',()=>this.open('map'));this.bar.querySelector('[data-potion]')!.addEventListener('click',()=>{this.potion();this.refreshBar()});
  this.dialog.addEventListener('close',()=>this.closed());document.body.append(this.bar,this.dialog);window.addEventListener('keydown',this.key,true);this.frame=requestAnimationFrame(this.poll);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{cancelAnimationFrame(this.frame);window.removeEventListener('keydown',this.key,true);this.bar.remove();this.dialog.remove()});this.refreshBar();
 }
 get isOpen(){return this.dialog.open}
 refreshBar(){const state=this.read(),e=state.economy,b=this.bar.querySelector('[data-potion]')!,count=b.querySelector('[data-potion-count]')!;if(count.textContent!==String(e.potions))count.textContent=String(e.potions);b.setAttribute('data-count',String(e.potions));b.setAttribute('aria-label',`Usar poção de cura: ${e.potions} disponíveis`);b.setAttribute('title',state.classId==='astral'?'Poção: H / Gamepad X (Y alterna elemento)':'Poção: H / Gamepad Y');const c=this.bar.querySelector('[data-credits]')!,saldo=e.credits.toLocaleString('pt-BR');if(c.textContent!==saldo)c.textContent=saldo;}
 open(tab:Tab){if(this.isOpen||document.querySelector('dialog[open]'))return;this.tab=tab;this.notice='';this.previous=navigator.getGamepads?.().find(p=>p?.connected&&p.mapping==='standard')?.buttons.map(b=>b.pressed||b.value>.5)??[];this.render();this.opened();this.dialog.showModal();this.dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();requestAnimationFrame(()=>{if(!this.isOpen)return;const here=this.dialog.querySelector<HTMLElement>('[aria-current]'),viewport=this.dialog.querySelector<HTMLElement>('.atlas-viewport');if(here&&viewport){const content=this.dialog.querySelector<HTMLElement>('.base-services')!;viewport.style.maxHeight=`${Math.max(70,Math.min(viewport.clientHeight,content.getBoundingClientRect().bottom-viewport.getBoundingClientRect().top-18))}px`;viewport.scrollTop=here.offsetTop-viewport.clientHeight/2;viewport.scrollLeft=here.offsetLeft-viewport.clientWidth/2}})}
 private button(parent:Element,text:string,run:()=>void,disabled=false){const b=document.createElement('button');b.textContent=text;b.disabled=disabled;b.onclick=run;parent.append(b);return b;}
 private operation(a:ServiceAction){const index=Array.from(this.dialog.querySelectorAll('button')).indexOf(document.activeElement as HTMLButtonElement);this.notice=this.act(a)?'Operação concluída e salva.':'Não foi possível concluir. Confira recursos, espaço e armazenamento.';this.render();this.refreshBar();const buttons=Array.from(this.dialog.querySelectorAll<HTMLButtonElement>('button'));const target=buttons[Math.min(Math.max(index,0),buttons.length-1)];(target&&!target.disabled?target:buttons.find(b=>!b.disabled))?.focus()}
 private render(){
  const s=this.read(),e=s.economy,base=s.area==='base',support=this.tab==='outpost'&&s.outpostSupport===true,worn=new Set(Object.values(s.equipment.equipped??{})),bag=s.equipment.items!.filter(i=>!worn.has(i.uid));
  this.dialog.innerHTML='<header><div><small>EXPEDIÇÃO DANTE-01</small><h1></h1></div><button data-close>VOLTAR</button></header><p class="base-wallet"></p><div class="base-services"></div><p role="status" class="base-notice"></p>';
  this.dialog.querySelector('[data-close]')!.addEventListener('click',()=>this.dialog.close());
  this.dialog.querySelector('h1')!.textContent=this.tab==='outpost'?'Posto das Nascentes':this.tab==='medic'?'Enfermaria e suprimentos':this.tab==='smith'?'Oficina da expedição':this.tab==='expedition'?'Expedições e cofre':'Mapa de Dante';
  this.dialog.querySelector('.base-wallet')!.textContent=`${e.credits} créditos · ${MATERIAL_NAMES.map((n,i)=>`${n}: ${e.materials[i]}`).join(' · ')} · Poções ${e.potions}/20`;
  (this.dialog.querySelector('.base-wallet') as HTMLElement).hidden=this.tab==='map';
  const content=this.dialog.querySelector('.base-services')!;
  if(this.tab==='outpost'){
   const p=document.createElement('p');p.dataset.outpostLife='';p.textContent=support?`Apoio de campo · Vida ${s.hp}/${s.maxHp}`:'Entregue o relatório do posto a Nara e aproxime-se do depósito para usar o apoio.';content.append(p);
  }
  if(base&&this.tab==='medic'||support){
   const heal=this.button(content,'RESTAURAR VIDA · GRATUITO',()=>this.operation({kind:'heal'}),s.hp>=s.maxHp);if(support)heal.dataset.outpostHeal='';
   this.button(content,`COMPRAR POÇÃO · ${POTION_PRICE} CRÉDITOS`,()=>this.operation({kind:'buy'}),e.credits<POTION_PRICE||e.potions>=20);
   const p=document.createElement('p');p.textContent=`Cura 35% da vida máxima. Recarga de 8 segundos. Use H, o botão de poção ou ${s.classId==='astral'?'X':'Y'} no controle. Não é consumida com vida cheia.`;content.append(p);
  }
  if(base&&this.tab==='smith'){
   const h=document.createElement('h2');h.textContent='Fabricar · resultado garantido';content.append(h);
   const hint=document.createElement('p');hint.className='forge-hint';hint.textContent='Cada peça exige créditos e material regional. Criaturas deixam materiais; equipamento é um achado menos frequente. Fabricar não equipa automaticamente.';content.append(hint);
   for(const id of EQUIPMENT_IDS){
    const d=EQUIPMENT[id],r=recipe(id),owned=e.materials[r.material],row=document.createElement('div');row.className='base-item base-recipe';row.dataset.recipe=id;
    const img=document.createElement('img');img.src=`${import.meta.env.BASE_URL}assets/items/${itemIcon(id,s.classId)}.png`;img.alt='';row.append(img);
    const info=document.createElement('div');info.className='recipe-info';const name=document.createElement('strong');name.textContent=equipmentName(id,s.classId);const description=document.createElement('small');description.textContent=d.description;info.append(name,description);
    const costs=document.createElement('div');costs.className='recipe-costs';
    for(const [label,needed,have] of [['créditos',r.credits,e.credits],[MATERIAL_NAMES[r.material],r.amount,owned]] as const){const cost=document.createElement('span');cost.dataset.available=String(have>=needed);cost.textContent=`${have>=needed?'✓':'×'} ${needed} ${label} · você tem ${have.toLocaleString('pt-BR')}`;costs.append(cost)}
    info.append(costs);const status=document.createElement('small');status.className='recipe-status';const missing=[];
    if(e.credits<r.credits)missing.push(`${r.credits-e.credits} créditos`);if(owned<r.amount)missing.push(`${r.amount-owned} ${MATERIAL_NAMES[r.material]}`);
    status.textContent=bag.length>=24?'Mochila cheia · libere um espaço':missing.length?`Faltam ${missing.join(' e ')}`:'Recursos suficientes';info.append(status);row.append(info);
    this.button(row,'FABRICAR',()=>this.operation({kind:'craft',id}),missing.length>0||bag.length>=24);content.append(row);
   }
   const h2=document.createElement('h2');h2.textContent='Peças da mochila · equipadas ficam protegidas';content.append(h2);
   for(const item of bag){const row=document.createElement('div');row.className='base-item';const p=document.createElement('span');p.textContent=equipmentName(item.id,s.classId);row.append(p);this.button(row,`VENDER · ${salePrice(item.id)}`,()=>this.operation({kind:'sell',uid:item.uid}));this.button(row,'DESMONTAR · 2 MATERIAIS',()=>this.operation({kind:'dismantle',uid:item.uid}));content.append(row)}
  }
  if(this.tab==='map'||this.tab==='expedition'){
   const depart=(area:keyof typeof REGION_NAMES,resume=false)=>{if(this.travel(area,resume))this.dialog.close();else{this.notice='Não foi possível viajar. Boss ativo, personagem caído ou sala desconectada bloqueiam o retorno.';this.render()}};
   const actions=document.createElement('div');actions.className='expedition-travel';content.append(actions);
   if(!base){
    this.button(actions,'VOLTAR À BASE',()=>depart('base'),!s.returnAvailable).dataset.returnBase='';
    const p=document.createElement('p');p.textContent=s.returnAvailable?'Seu ponto fica guardado. Na base, use Retomar expedição para voltar até aqui. Em equipe, o retorno leva o grupo.':'Retorno indisponível durante boss ativo ou enquanto o personagem estiver caído.';actions.append(p);
   }else if(s.returnArea){
    this.button(actions,'RETOMAR EXPEDIÇÃO',()=>depart(s.returnArea!,true),!s.canLead||s.hp<=0).dataset.resumeExpedition='';
    const p=document.createElement('p');p.textContent=`Voltar ao ponto de onde você saiu em ${REGION_NAMES[s.returnArea]}. Escolher outra região no atlas inicia uma nova expedição e substitui esse retorno.`;actions.append(p);
   }
   content.append(expeditionAtlas(s,area=>depart(area)));
   if(base&&!s.canLead){const p2=document.createElement('p');p2.textContent='O anfitrião escolhe o destino da expedição. Seus serviços e cofre são pessoais.';content.append(p2)}
  }
  if(base&&this.tab==='expedition'||support){
   const h=document.createElement('h2');h.textContent=`Cofre pessoal · ${e.stash.length}/48`;content.append(h);
   for(const item of bag)this.button(content,`GUARDAR · ${equipmentName(item.id,s.classId)}`,()=>this.operation({kind:'deposit',uid:item.uid}),e.stash.length>=48);
   for(const item of e.stash)this.button(content,`RETIRAR · ${equipmentName(item.id,s.classId)}`,()=>this.operation({kind:'withdraw',uid:item.uid}),bag.length>=24);
  }
  this.dialog.querySelector('.base-notice')!.textContent=this.notice;
 }
 private key=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(this.isOpen){e.stopImmediatePropagation();if(e.key==='Escape'||e.key.toLowerCase()==='m'){e.preventDefault();this.dialog.close()}else if(e.key.startsWith('Arrow')){e.preventDefault();this.focus(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)}return}if(document.querySelector('dialog[open]'))return;if(e.key.toLowerCase()==='m'){e.preventDefault();e.stopImmediatePropagation();this.open('map')}else if(e.key.toLowerCase()==='h'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();this.potion();this.refreshBar()}};
 private focus(d:number){const bs=Array.from(this.dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));const i=bs.indexOf(document.activeElement as HTMLButtonElement),b=bs[(i+d+bs.length)%bs.length];b?.focus();b?.scrollIntoView({block:'nearest',inline:'nearest'})}
 private poll=()=>{const pad=navigator.getGamepads?.().find(p=>p?.connected&&p.mapping==='standard'),buttons=pad?.buttons.map(b=>b.pressed||b.value>.5)??[],edge=(i:number)=>buttons[i]&&!this.previous[i];if(coopSession.chatTyping){this.previous=buttons;this.frame=requestAnimationFrame(this.poll);return;}if(this.isOpen){if(this.tab==='outpost'){const s=this.read(),life=this.dialog.querySelector('[data-outpost-life]'),heal=this.dialog.querySelector<HTMLButtonElement>('[data-outpost-heal]'),text=`Apoio de campo · Vida ${s.hp}/${s.maxHp}`;if(!s.outpostSupport)this.dialog.close();else{if(life&&life.textContent!==text)life.textContent=text;if(heal)heal.disabled=s.hp>=s.maxHp;}}if(edge(12)||edge(14))this.focus(-1);else if(edge(13)||edge(15))this.focus(1);else if(edge(0))(document.activeElement as HTMLButtonElement)?.click();else if(edge(1))this.dialog.close()}else if((edge(2)||edge(3))&&!document.querySelector('dialog[open]')&&edge(this.read().classId==='astral'?2:3)){this.potion();this.refreshBar()}this.previous=buttons;this.frame=requestAnimationFrame(this.poll)};
}
