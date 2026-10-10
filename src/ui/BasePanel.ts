import Phaser from 'phaser';
import {EQUIPMENT,EQUIPMENT_IDS,type EquipmentSnapshot} from '../config/equipment';
import {MATERIAL_NAMES,REGION_NAMES,recipe,salePrice,POTION_PRICE,type EconomySnapshot} from '../config/economy';
import type {ServiceAction} from '../systems/BaseEconomy';
import {itemIcon} from '../systems/EquipmentDrops';
import {expeditionAtlas} from './ExpeditionAtlas';
type Tab='medic'|'smith'|'expedition'|'map';
type State={economy:EconomySnapshot;equipment:EquipmentSnapshot;area:keyof typeof REGION_NAMES;hp:number;maxHp:number;classId:string;returnAvailable:boolean;canLead:boolean};
export class BasePanel{
 private dialog=document.createElement('dialog');private bar=document.createElement('div');private tab:Tab='map';private notice='';private frame=0;private previous:boolean[]=[];
 constructor(scene:Phaser.Scene,private read:()=>State,private act:(action:ServiceAction)=>boolean,private travel:(area:keyof typeof REGION_NAMES)=>boolean,private potion:()=>boolean,private opened:()=>void,private closed:()=>void){
  this.dialog.className='records-dialog base-dialog';this.dialog.setAttribute('aria-label','Serviços da expedição');
  this.bar.className='expedition-launcher';this.bar.innerHTML='<button data-map>MAPA · M</button><button data-potion>POÇÃO · H</button>';
  this.bar.querySelector('[data-map]')!.addEventListener('click',()=>this.open('map'));this.bar.querySelector('[data-potion]')!.addEventListener('click',()=>{this.potion();this.refreshBar()});
  this.dialog.addEventListener('close',()=>this.closed());document.body.append(this.bar,this.dialog);window.addEventListener('keydown',this.key,true);this.frame=requestAnimationFrame(this.poll);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{cancelAnimationFrame(this.frame);window.removeEventListener('keydown',this.key,true);this.bar.remove();this.dialog.remove()});this.refreshBar();
 }
 get isOpen(){return this.dialog.open}
 refreshBar(){const b=this.bar.querySelector('[data-potion]')!,text=`POÇÃO · ${this.read().economy.potions} · H`;if(b.textContent!==text)b.textContent=text;}
 open(tab:Tab){if(this.isOpen||document.querySelector('dialog[open]'))return;this.tab=tab;this.notice='';this.previous=navigator.getGamepads?.().find(p=>p?.connected&&p.mapping==='standard')?.buttons.map(b=>b.pressed||b.value>.5)??[];this.render();this.opened();this.dialog.showModal();this.dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();requestAnimationFrame(()=>{if(this.isOpen)this.dialog.querySelector('[aria-current]')?.scrollIntoView({block:'nearest',inline:'nearest'})})}
 private button(parent:Element,text:string,run:()=>void,disabled=false){const b=document.createElement('button');b.textContent=text;b.disabled=disabled;b.onclick=run;parent.append(b);return b;}
 private operation(a:ServiceAction){const index=Array.from(this.dialog.querySelectorAll('button')).indexOf(document.activeElement as HTMLButtonElement);this.notice=this.act(a)?'Operação concluída e salva.':'Não foi possível concluir. Confira recursos, espaço e armazenamento.';this.render();this.refreshBar();const buttons=Array.from(this.dialog.querySelectorAll<HTMLButtonElement>('button'));const target=buttons[Math.min(Math.max(index,0),buttons.length-1)];(target&&!target.disabled?target:buttons.find(b=>!b.disabled))?.focus()}
 private render(){
  const s=this.read(),e=s.economy,base=s.area==='base',worn=new Set(Object.values(s.equipment.equipped??{})),bag=s.equipment.items!.filter(i=>!worn.has(i.uid));
  this.dialog.innerHTML='<header><div><small>EXPEDIÇÃO DANTE-01</small><h1></h1></div><button data-close>VOLTAR</button></header><p class="base-wallet"></p><div class="base-services"></div><p role="status" class="base-notice"></p>';
  this.dialog.querySelector('[data-close]')!.addEventListener('click',()=>this.dialog.close());
  this.dialog.querySelector('h1')!.textContent=this.tab==='medic'?'Enfermaria e suprimentos':this.tab==='smith'?'Oficina da expedição':this.tab==='expedition'?'Expedições e cofre':'Mapa de Dante';
  this.dialog.querySelector('.base-wallet')!.textContent=`${e.credits} créditos · ${MATERIAL_NAMES.map((n,i)=>`${n}: ${e.materials[i]}`).join(' · ')} · Poções ${e.potions}/20`;
  (this.dialog.querySelector('.base-wallet') as HTMLElement).hidden=this.tab==='map';
  const content=this.dialog.querySelector('.base-services')!;
  if(base&&this.tab==='medic'){
   this.button(content,'RESTAURAR VIDA · GRATUITO',()=>this.operation({kind:'heal'}),s.hp>=s.maxHp);
   this.button(content,`COMPRAR POÇÃO · ${POTION_PRICE} CRÉDITOS`,()=>this.operation({kind:'buy'}),e.credits<POTION_PRICE||e.potions>=20);
   const p=document.createElement('p');p.textContent='Cura 35% da vida máxima. Recarga de 8 segundos. Use H, o botão de poção ou Y no controle. Não é consumida com vida cheia.';content.append(p);
  }
  if(base&&this.tab==='smith'){
   const h=document.createElement('h2');h.textContent='Fabricar · resultado garantido';content.append(h);
   for(const id of EQUIPMENT_IDS){const d=EQUIPMENT[id],r=recipe(id);const row=document.createElement('div');row.className='base-item';const img=document.createElement('img');img.src=`${import.meta.env.BASE_URL}assets/items/${itemIcon(id,s.classId)}.png`;img.alt='';row.append(img);const p=document.createElement('span');p.textContent=`${d.name} · ${d.description} · ${r.credits} créditos + ${r.amount} ${MATERIAL_NAMES[r.material]}`;row.append(p);this.button(row,'FABRICAR',()=>this.operation({kind:'craft',id}),e.credits<r.credits||e.materials[r.material]<r.amount||bag.length>=24);content.append(row)}
   const h2=document.createElement('h2');h2.textContent='Peças da mochila · equipadas ficam protegidas';content.append(h2);
   for(const item of bag){const row=document.createElement('div');row.className='base-item';const p=document.createElement('span');p.textContent=EQUIPMENT[item.id].name;row.append(p);this.button(row,`VENDER · ${salePrice(item.id)}`,()=>this.operation({kind:'sell',uid:item.uid}));this.button(row,'DESMONTAR · 2 MATERIAIS',()=>this.operation({kind:'dismantle',uid:item.uid}));content.append(row)}
  }
  if(this.tab==='map'||this.tab==='expedition'){
   content.append(expeditionAtlas(s,area=>{if(this.travel(area))this.dialog.close();else{this.notice='Aproxime-se do ponto de retorno. Boss ativo bloqueia a retirada.';this.render()}}));
   if(!base){const p2=document.createElement('p');p2.textContent=s.returnAvailable?'Ponto de retorno próximo: você pode retornar à base.':'Retorne ao terminal na entrada da região para viajar à base. Durante um boss, a retirada fica bloqueada.';content.append(p2);}
   if(base&&!s.canLead){const p2=document.createElement('p');p2.textContent='O anfitrião escolhe o destino da expedição. Seus serviços e cofre são pessoais.';content.append(p2)}
  }
  if(base&&this.tab==='expedition'){
   const h=document.createElement('h2');h.textContent=`Cofre pessoal · ${e.stash.length}/48`;content.append(h);
   for(const item of bag)this.button(content,`GUARDAR · ${EQUIPMENT[item.id].name}`,()=>this.operation({kind:'deposit',uid:item.uid}),e.stash.length>=48);
   for(const item of e.stash)this.button(content,`RETIRAR · ${EQUIPMENT[item.id].name}`,()=>this.operation({kind:'withdraw',uid:item.uid}),bag.length>=24);
  }
  this.dialog.querySelector('.base-notice')!.textContent=this.notice;
 }
 private key=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(this.isOpen){e.stopImmediatePropagation();if(e.key==='Escape'||e.key.toLowerCase()==='m'){e.preventDefault();this.dialog.close()}else if(e.key.startsWith('Arrow')){e.preventDefault();this.focus(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)}return}if(document.querySelector('dialog[open]'))return;if(e.key.toLowerCase()==='m'){e.preventDefault();e.stopImmediatePropagation();this.open('map')}else if(e.key.toLowerCase()==='h'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();this.potion();this.refreshBar()}};
 private focus(d:number){const bs=Array.from(this.dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));const i=bs.indexOf(document.activeElement as HTMLButtonElement),b=bs[(i+d+bs.length)%bs.length];b?.focus();b?.scrollIntoView({block:'nearest',inline:'nearest'})}
 private poll=()=>{const pad=navigator.getGamepads?.().find(p=>p?.connected&&p.mapping==='standard'),buttons=pad?.buttons.map(b=>b.pressed||b.value>.5)??[],edge=(i:number)=>buttons[i]&&!this.previous[i];if(this.isOpen){if(edge(12)||edge(14))this.focus(-1);else if(edge(13)||edge(15))this.focus(1);else if(edge(0))(document.activeElement as HTMLButtonElement)?.click();else if(edge(1))this.dialog.close()}else if(edge(3)&&!document.querySelector('dialog[open]')){this.potion();this.refreshBar()}this.previous=buttons;this.frame=requestAnimationFrame(this.poll)};
}
