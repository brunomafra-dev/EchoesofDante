import Phaser from 'phaser';
import type { CharacterClass } from '../systems/CharacterProfiles';
import { characterSex,type CharacterSex } from '../config/appearance';
import { ASTRAL_ELEMENTS } from '../config/classes';
import { CharacterPreviewScene } from './CharacterPreviewScene';

// Finite, input-free previews using actual campaign actor/combat views.
export class CharacterShowcase {
 readonly canvas=document.createElement('canvas');readonly caption=document.createElement('span');
 private game:Phaser.Game;private scene:CharacterPreviewScene;
 private disposed=false;private pending=false;private pendingManual=false;private elementIndex=0;
 constructor(readonly classId:CharacterClass,readonly sex:CharacterSex=characterSex(classId)){
  this.canvas.className='showcase-canvas';this.canvas.dataset.representation='complete';this.canvas.setAttribute('role','img');
  this.canvas.setAttribute('aria-label',({warrior:'Guerreiro Galáctico',hunter:'Star Hunter',astral:'Manipulador Astral',xenobinder:'Domador de feras'})[classId]);
  this.caption.className='showcase-caption';this.caption.textContent='PREPARANDO PRÉVIA';
  this.scene=new CharacterPreviewScene(classId,sex,(phase,caption,frame)=>{
   this.canvas.dataset.demoPhase=phase;this.canvas.dataset.frame=String(frame);this.canvas.dataset.facing=phase==='idle'?'front':'right';this.caption.textContent=caption;
  },()=>{if(this.disposed)return;if(this.pending)this.play(this.pendingManual);});
  this.game=new Phaser.Game({type:Phaser.CANVAS,canvas:this.canvas,width:320,height:360,transparent:true,banner:false,autoFocus:false,
   audio:{noAudio:true},input:{keyboard:false,mouse:false,touch:false,gamepad:false},fps:{target:30},scene:[this.scene],
   callbacks:{postBoot:game=>{game.canvas.style.width='100%';game.canvas.style.height='100%';}}});
  if(import.meta.env.DEV)Object.assign(this.canvas,{__preview:this.scene,__previewGame:this.game});
 }
 play(manual=false):void{
  if(this.disposed)return;this.pending=true;this.pendingManual=manual;if(!this.scene.ready)return;
  if(!manual&&matchMedia('(prefers-reduced-motion: reduce)').matches){this.scene.idle();return;}
  const element=ASTRAL_ELEMENTS[this.elementIndex%4];if(manual&&this.classId==='astral')this.elementIndex++;
  this.scene.begin(element);
 }
 stop():void{this.pending=false;if(!this.disposed&&this.scene.ready){this.game.loop.wake();this.scene.idle();}}
 destroy():void{if(this.disposed)return;this.disposed=true;this.pending=false;this.game.destroy(true);this.game.loop.wake();}
}
