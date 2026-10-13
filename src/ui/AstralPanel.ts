import Phaser from 'phaser';
import { ASTRAL,ELEMENT_NAMES,type AstralElement } from '../config/classes';
import type { KineticPhase } from '../combat/KineticCharge';
export class AstralPanel {
 private readonly root=document.createElement('button');
 private signature='';
 constructor(scene:Phaser.Scene,cycle:()=>void){
  this.root.className='astral-panel';this.root.type='button';this.root.title='Trocar elemento: F / Y no controle / toque. Q: segurar, mirar e soltar.';
  this.root.addEventListener('click',cycle);document.body.append(this.root);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.root.remove());
 }
 update(energy:number,element:AstralElement,phase:KineticPhase,dead:boolean,blocked=false):void{
  const value=Math.floor(energy),key=`${value}:${element}:${phase}:${dead}:${blocked}`;if(key===this.signature)return;this.signature=key;
  this.root.disabled=dead||blocked||phase!=='READY';this.root.dataset.element=element;
  this.root.innerHTML=`<span>F / Y · ${ELEMENT_NAMES[element]} ↻</span><small>Energia Astral ${value}/${ASTRAL.energyMax} · Q: ${ASTRAL.castCost}${value<ASTRAL.castCost?' · RECUPERE COM ACERTOS':''}</small><meter min="0" max="100" value="${value}" aria-label="Energia Astral"></meter>`;
 }
}
