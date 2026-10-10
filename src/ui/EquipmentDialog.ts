import Phaser from 'phaser';
import { BAG_SIZE,EQUIPMENT,EQUIPMENT_SLOTS,SLOT_NAMES,RARITY_COLORS,equipmentStats,type EquipmentId,type EquipmentSlot,type EquipmentSnapshot } from '../config/equipment';
import { itemIcon } from '../systems/EquipmentDrops';
export class EquipmentDialog {
 private dialog=document.createElement('dialog');private launcher=document.createElement('button');
 private frame=0;private previous:boolean[]=[];private selected='';private notice='';
 constructor(scene:Phaser.Scene,private read:()=>EquipmentSnapshot,private choose:(slot:EquipmentSlot,id?:EquipmentId,uid?:string)=>boolean,close:()=>void,private launch:()=>void,private classId='warrior'){
  this.dialog.className='records-dialog equipment-dialog';this.dialog.setAttribute('aria-label','Mochila e equipamentos');
  this.launcher.className='inventory-launcher';this.launcher.textContent='MOCHILA · I';this.launcher.onclick=this.launch;
  this.dialog.addEventListener('close',()=>{document.body.classList.remove('inventory-open');close();});
  window.addEventListener('keydown',this.keyDown,true);document.body.append(this.dialog,this.launcher);this.frame=requestAnimationFrame(this.poll);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{cancelAnimationFrame(this.frame);window.removeEventListener('keydown',this.keyDown,true);this.dialog.remove();this.launcher.remove();document.body.classList.remove('inventory-open');});
 }
 get isOpen():boolean{return this.dialog.open;}
 open():void {if(this.isOpen)return;this.notice='';this.render();document.body.classList.add('inventory-open');this.dialog.showModal();this.dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();}
 private icon(id:EquipmentId):HTMLImageElement {const img=document.createElement('img');img.src=`${import.meta.env.BASE_URL}assets/items/${itemIcon(id,this.classId)}.png`;img.alt='';return img;}
 private render():void {
  const data=this.read(),worn=new Set(Object.values(data.equipped??{})),bag=(data.items??[]).filter(i=>!worn.has(i.uid));
  this.dialog.innerHTML='<header><div><small>EQUIPAMENTO PESSOAL</small><h1>Mochila da expedição</h1></div><button type="button" data-close>VOLTAR</button></header><div class="inventory-layout"><section><h2>Equipado</h2><div class="inventory-equipped"></div><p class="inventory-totals"></p></section><section><h2 class="bag-title"></h2><div class="inventory-grid"></div><p>Escolha uma peça para comparar. Itens no chão: aproxime-se e use COLETAR.</p></section><aside class="inventory-details" aria-live="polite"></aside></div><p class="inventory-notice" role="status"></p>';
  this.dialog.querySelector('[data-close]')!.addEventListener('click',()=>this.dialog.close());
  this.dialog.querySelector('.bag-title')!.textContent=`Mochila · ${bag.length}/${BAG_SIZE}`;
  const stats=equipmentStats(data.slots);this.dialog.querySelector('.inventory-totals')!.textContent=`Bônus: +${stats.hp} vida · ${Math.round(stats.resistance*100)}% proteção · +${Math.round(stats.damage*100)}% dano · +${Math.round(stats.charge*100)}% Q`;
  const equipped=this.dialog.querySelector('.inventory-equipped')!;
  for(const slot of EQUIPMENT_SLOTS){const id=data.slots[slot],button=document.createElement('button');button.type='button';button.dataset.slot=slot;button.className='inventory-slot';
   if(id)button.append(this.icon(id));const label=document.createElement('span');label.textContent=SLOT_NAMES[slot];button.append(label);button.title=id?EQUIPMENT[id].name:'Sem equipamento';
   button.onclick=()=>{this.selected=data.equipped?.[slot]??'';this.showDetails();};equipped.append(button);}
  const grid=this.dialog.querySelector('.inventory-grid')!;
  for(let i=0;i<BAG_SIZE;i++){const item=bag[i],button=document.createElement('button');button.type='button';button.className='inventory-cell';
   button.disabled=!item;if(item){button.dataset.item=item.id;button.dataset.uid=item.uid;button.style.setProperty('--rarity',RARITY_COLORS[EQUIPMENT[item.id].rarity]);button.append(this.icon(item.id));button.title=EQUIPMENT[item.id].name;button.setAttribute('aria-label',button.title);button.onclick=()=>{this.selected=item.uid;this.showDetails();};}else button.setAttribute('aria-label','Espaço vazio');grid.append(button);}
  this.showDetails();
 }
 private showDetails():void {
  const data=this.read(),item=data.items?.find(i=>i.uid===this.selected),panel=this.dialog.querySelector('.inventory-details')!;panel.replaceChildren();
  this.dialog.querySelector('.inventory-notice')!.textContent=this.notice;
  for(const cell of Array.from(this.dialog.querySelectorAll<HTMLElement>('[data-uid]')))cell.classList.toggle('selected',cell.dataset.uid===this.selected);
  if(!item){panel.textContent='Selecione um equipamento para ver atributos e comparar.';return;}
  const d=EQUIPMENT[item.id],worn=data.equipped?.[d.slot]===item.uid;
  const title=document.createElement('h2');title.textContent=d.name;title.style.color=RARITY_COLORS[d.rarity];panel.append(this.icon(item.id),title);
  const kind=document.createElement('small');kind.textContent=`${SLOT_NAMES[d.slot]} · ${d.rarity} · ${worn?'equipado':'na mochila'}`;panel.append(kind);
  const desc=document.createElement('p');desc.textContent=d.description;panel.append(desc);
  const current=data.slots[d.slot],comparison=document.createElement('p');comparison.textContent=`Atual: ${current?EQUIPMENT[current].name:'sem equipamento'}`;panel.append(comparison);
  const before=equipmentStats(data.slots),after=equipmentStats({...data.slots,[d.slot]:worn?undefined:item.id});
  const delta=document.createElement('p');delta.className='inventory-comparison';delta.textContent=(Object.keys(before) as (keyof typeof before)[]).filter(k=>Math.abs(after[k]-before[k])>.0001).map(k=>{const value=k==='hp'?after[k]-before[k]:Math.round((after[k]-before[k])*100);return `${value>0?'+':''}${value}${k==='hp'?' vida':k==='resistance'?'% proteção':k==='damage'?'% dano':'% Q'}`;}).join(' · ')||'Mesmos atributos';panel.append(delta);
  const button=document.createElement('button');button.type='button';button.dataset.equip=item.uid;button.textContent=worn?'RETIRAR PARA A MOCHILA':'EQUIPAR';button.onclick=()=>{
   if(this.choose(d.slot,worn?undefined:item.id,item.uid)){this.notice=worn?'Peça retirada.':'Peça equipada. Equipar não restaura vida.';this.render();this.dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();}
   else{this.notice=worn?'Não foi possível retirar: confira o espaço na mochila e o armazenamento do navegador.':'Não foi possível salvar a troca. O equipamento anterior foi preservado.';this.showDetails();}};panel.append(button);
 }
 private keyDown=(event:KeyboardEvent):void=>{
  if(!this.isOpen){if(event.key.toLowerCase()==='i'&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLTextAreaElement)&&!document.querySelector('dialog[open]')){event.preventDefault();event.stopImmediatePropagation();this.launch();}return;}
  event.stopImmediatePropagation();if(event.key==='Escape'||event.key.toLowerCase()==='i'){event.preventDefault();this.dialog.close();}
  else if(event.key.startsWith('Arrow')){event.preventDefault();this.focus(event.key==='ArrowUp'||event.key==='ArrowLeft'?-1:1);}
 };
 private focus(delta:number):void{const buttons=Array.from(this.dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));const current=buttons.indexOf(document.activeElement as HTMLButtonElement);buttons[(current+delta+buttons.length)%buttons.length]?.focus();}
 private poll=():void=>{const pad=navigator.getGamepads?.().find(p=>p?.connected&&p.mapping==='standard'),buttons=pad?.buttons.map(b=>b.pressed||b.value>.5)??[],edge=(i:number)=>buttons[i]&&!this.previous[i];
  if(this.isOpen){if(edge(12)||edge(14))this.focus(-1);else if(edge(13)||edge(15))this.focus(1);else if(edge(0))(document.activeElement as HTMLButtonElement)?.click();else if(edge(1)||edge(9))this.dialog.close();}
  else if(edge(9)&&!document.querySelector('.application-shell')&&!document.querySelector('dialog[open]'))this.launch();this.previous=buttons;this.frame=requestAnimationFrame(this.poll);};
}
