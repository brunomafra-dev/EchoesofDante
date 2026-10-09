import Phaser from 'phaser';
import { EQUIPMENT, SLOT_NAMES, type EquipmentId, type EquipmentSlot, type EquipmentSnapshot } from '../config/equipment';

export class EquipmentDialog {
  private dialog=document.createElement('dialog');
  private frame=0;
  private previous:boolean[]=[];
  constructor(scene:Phaser.Scene,private read:()=>EquipmentSnapshot,private choose:(slot:EquipmentSlot,id?:EquipmentId)=>boolean,close:()=>void){
    this.dialog.className='records-dialog equipment-dialog';this.dialog.setAttribute('aria-label','Equipamentos');
    this.dialog.addEventListener('close',()=>{cancelAnimationFrame(this.frame);document.body.classList.remove('records-open');close();});
    window.addEventListener('keydown',this.keyDown,true);document.body.append(this.dialog);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{cancelAnimationFrame(this.frame);window.removeEventListener('keydown',this.keyDown,true);this.dialog.remove();document.body.classList.remove('records-open');});
  }
  get isOpen():boolean{return this.dialog.open;}
  open():void {if(this.isOpen)return;this.render();document.body.classList.add('records-open');this.dialog.showModal();this.dialog.querySelector<HTMLButtonElement>('button')?.focus();this.previous=navigator.getGamepads?.().find(p=>p?.connected)?.buttons.map(b=>b.pressed)??[];this.frame=requestAnimationFrame(this.poll);}
  private render():void {
    const data=this.read();this.dialog.innerHTML='<header><div><small>EQUIPAMENTO PESSOAL</small><h1>Prepare sua expedição</h1></div><button type="button" data-close>VOLTAR</button></header><div class="records-content"><p>Coleta por aproximação. Na dupla, cada jogador recebe sua cópia. Escolha um item por slot.</p><div class="equipment-slots"></div><small>Emissores aprimoram a arma da sua classe; não substituem o sabre ou o rifle. Equipar não cura.</small></div>';
    this.dialog.querySelector('[data-close]')!.addEventListener('click',()=>this.dialog.close());
    const content=this.dialog.querySelector('.equipment-slots')!;
    for(const slot of ['weapon','armor','accessory'] as const){
      const section=document.createElement('section');section.innerHTML=`<h2>${SLOT_NAMES[slot]}</h2><p>${data.slots[slot]?EQUIPMENT[data.slots[slot]!].name:'Sem equipamento'}</p>`;
      const items=data.owned.filter(id=>EQUIPMENT[id].slot===slot);
      if(!items.length){const text=document.createElement('p');text.textContent='Explore e derrote criaturas para encontrar itens.';section.append(text);}
      for(const id of items){const button=document.createElement('button');button.type='button';button.className='ability-upgrade-option';button.dataset.item=id;
        button.innerHTML=`<strong>${EQUIPMENT[id].name}</strong><span>${EQUIPMENT[id].description}</span><b>${data.slots[slot]===id?'EQUIPADO':'EQUIPAR'}</b>`;
        button.disabled=data.slots[slot]===id;button.addEventListener('click',()=>{if(this.choose(slot,id)){this.render();this.dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();}});section.append(button);}
      if(data.slots[slot]){const remove=document.createElement('button');remove.type='button';remove.textContent='RETIRAR';remove.onclick=()=>{this.choose(slot);this.render();};section.append(remove);}
      content.append(section);
    }
  }
  private keyDown=(event:KeyboardEvent):void=>{
    if(!this.isOpen)return;event.stopImmediatePropagation();
    if(event.key==='Escape'){event.preventDefault();this.dialog.close();}
    else if(event.key.startsWith('Arrow')){event.preventDefault();this.focus(event.key==='ArrowUp'||event.key==='ArrowLeft'?-1:1);}
  };
  private focus(delta:number):void{const buttons=Array.from(this.dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));const current=buttons.indexOf(document.activeElement as HTMLButtonElement);buttons[(current+delta+buttons.length)%buttons.length]?.focus();}
  private poll=():void=>{if(!this.isOpen)return;const pad=navigator.getGamepads?.().find(p=>p?.connected&&p.mapping==='standard');const buttons=pad?.buttons.map(b=>b.pressed||b.value>.5)??[];const edge=(i:number)=>buttons[i]&&!this.previous[i];
    if(edge(12)||edge(14))this.focus(-1);else if(edge(13)||edge(15))this.focus(1);else if(edge(0))(document.activeElement as HTMLButtonElement)?.click();else if(edge(1))this.dialog.close();this.previous=buttons;if(this.isOpen)this.frame=requestAnimationFrame(this.poll);};
}
