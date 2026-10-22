import Phaser from 'phaser';
import { XENOBINDER as X } from '../config/classes';
import type { XenobinderPose } from '../combat/XenobinderCombat';
import type { KineticPhase } from '../combat/KineticCharge';
export class XenobinderPanel {
 private readonly root=document.createElement('output');private signature='';
 constructor(scene:Phaser.Scene){this.root.className='astral-panel xenobinder-panel';this.root.setAttribute('aria-label','Vínculo com o companheiro');document.body.append(this.root);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.root.remove());}
 update(pose:XenobinderPose,phase:KineticPhase,dead:boolean):void{
  const value=Math.floor(pose.bond),key=`${value}:${pose.state}:${phase}:${dead}`;if(key===this.signature)return;this.signature=key;
  const state=dead?'RECOLHIDO':phase==='CHARGING'?'AGUARDANDO DIREÇÃO':({FOLLOW:'ACOMPANHANDO',ASSIST:'ASSISTINDO',COMMAND:'INVESTIDA',RETURN:'RETORNANDO'}[pose.state]);
  this.root.innerHTML=`<span>VÍNCULO<span class="desktop-control-hint"> · ${state}</span></span><small>${value}/${X.bondMax}<span class="desktop-control-hint"> · Q: ${X.commandCost}${value<X.commandCost?' · RECUPERE COM ACERTOS':''}</span></small><meter min="0" max="100" value="${value}" aria-label="Vínculo"></meter>`;
 }
}
