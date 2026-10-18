import Phaser from 'phaser';
import { equipmentLook, weaponStyle, type CharacterSex, type EquipmentLook, type WeaponStyle } from '../config/appearance';
import { equipmentAppearance, type EquipmentSnapshot } from '../config/equipment';
import { ASTRAL,ELEMENT_COLORS,XENOBINDER,type AstralElement,type PlayableClass } from '../config/classes';
import type { KineticPose } from '../combat/KineticCharge';
import { COMPLETE_DISPLAY,COMPLETE_FEET,COMPLETE_FRAME,COMPLETE_STYLES,completeFrame,completeKey,completeMuzzle,composeCompleteAtlas } from './CompleteActorFrames';

let serial=0;
export function preloadCompleteActors(scene:Phaser.Scene):void {
 for(const cls of ['warrior','hunter','astral','xenobinder'] as const)for(const sex of ['male','female'])for(const style of COMPLETE_STYLES){
  const key=completeKey(cls,sex,style);
  if(!scene.textures.exists(key))scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/visual/complete-actors/${cls}-${sex}-${style}.png`,{frameWidth:COMPLETE_FRAME,frameHeight:COMPLETE_FRAME});
 }
 // Existing ability/pet assets; the retired articulated wardrobes are not loaded.
 for(const element of ['energy','fire','water','earth'])for(const [kind,width,height] of [['ground',128,128],['field',192,192],['bolt',128,96]] as const){
  const key=`astral-${element}-${kind}`;if(!scene.textures.exists(key))scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/visual/astral/${key}-v2.png`,{frameWidth:width,frameHeight:height});
 }
 for(const key of ['xeno-bolt','xeno-link','xeno-pulse'])if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/xenobinder/${key}.png`);
 if(!scene.textures.exists('dante-symbiont-motion'))scene.load.spritesheet('dante-symbiont-motion',`${import.meta.env.BASE_URL}assets/visual/characters/dante-symbiont-motion.png`,{frameWidth:256,frameHeight:256});
}

export class CompleteActorArt {
 readonly body:Phaser.GameObjects.Image;
 readonly identity:PlayableClass;
 readonly sex:CharacterSex;
 private previous:{x:number;y:number};private travel=0;
 private look=equipmentLook();private style:WeaponStyle='starter';private signature='';
 private readonly texture:Phaser.Textures.CanvasTexture;
 private readonly guide:Phaser.GameObjects.Graphics;
 private guideVisible=false;private hurtUntil=0;
 bakeCount=0;
 constructor(private scene:Phaser.Scene,private view:Phaser.GameObjects.Container,x:number,y:number,sex:CharacterSex,identity:PlayableClass){
  this.identity=identity;this.sex=sex;this.previous={x,y};
  view.list.forEach(part=>(part as unknown as Phaser.GameObjects.Components.Visible).setVisible(false));
  const key=`complete-dressed-${identity}-${sex}-${++serial}`;
  this.texture=scene.textures.createCanvas(key,COMPLETE_FRAME*4,COMPLETE_FRAME*8)!;
  for(let f=0;f<32;f++)this.texture.add(f,0,f%4*COMPLETE_FRAME,Math.floor(f/4)*COMPLETE_FRAME,COMPLETE_FRAME,COMPLETE_FRAME);
  this.body=scene.add.image(0,39,key,0).setOrigin(.5,COMPLETE_FEET/COMPLETE_FRAME).setDisplaySize(COMPLETE_DISPLAY,COMPLETE_DISPLAY);
  this.guide=scene.add.graphics().setVisible(false);view.add([this.body,this.guide]);view.setData('completeActor',this);
  this.body.once(Phaser.GameObjects.Events.DESTROY,()=>{if(scene.textures.exists(key))scene.textures.remove(key);});
  this.bake();this.update(x,y,Math.PI/2,false);
 }
 setEquipment(slots:EquipmentSnapshot['slots']):void{this.look=equipmentAppearance(slots);this.style=weaponStyle(slots.weapon);this.bake();}
 setEquipmentLook(look:EquipmentLook):void{this.look={...look};this.bake();}
 setWeaponLook(style:WeaponStyle):void{this.style=style;this.bake();}
 private bake():void{
  const signature=JSON.stringify([this.look,this.style]);if(signature===this.signature)return;this.signature=signature;
  const sources=Object.fromEntries(COMPLETE_STYLES.map(style=>[style,this.scene.textures.get(completeKey(this.identity,this.sex,style)).getSourceImage()])) as Record<typeof COMPLETE_STYLES[number],HTMLImageElement>;
  composeCompleteAtlas(this.texture.context,sources,this.look,this.style,this.identity,this.sex);this.texture.refresh();this.bakeCount++;
 }
 muzzle(aim:number):{x:number;y:number}{return completeMuzzle(this.identity,aim,this.sex,this.look.torso);}
 projectileOffset(aim:number):{x:number;y:number}{const p=this.muzzle(aim);return{x:p.x-Math.cos(aim)*ASTRAL.muzzleDistance,y:p.y-Math.sin(aim)*ASTRAL.muzzleDistance};}
 flashHurt():void{this.hurtUntil=this.scene.time.now+140;}
 update(x:number,y:number,aim:number,firing:boolean,dash=false,heavy:Pick<KineticPose,'phase'|'level'>={phase:'READY',level:0},element:AstralElement='energy'):void{
  const dx=x-this.previous.x,dy=y-this.previous.y,moved=Math.hypot(dx,dy);
  const walking=moved>.05&&moved<32&&!dash&&heavy.phase==='READY';
  if(walking)this.travel+=(dx*Math.cos(aim)+dy*Math.sin(aim)<-.05?-1:1)*moved;
  this.previous.x=x;this.previous.y=y;
  this.view.setRotation(0);this.body.setFrame(completeFrame(aim,this.travel,walking,firing||heavy.phase!=='READY',this.identity)).setRotation(0).setFlip(false,false);
  if(this.scene.time.now<this.hurtUntil)this.body.setTint(0xffac98);else this.body.clearTint();
  const busy=heavy.phase==='CHARGING';
  if(busy&&this.identity!=='warrior'){
   const color=this.identity==='astral'?ELEMENT_COLORS[element]:this.identity==='xenobinder'?XENOBINDER.color:0x5fe6d8,c=Math.cos(aim),s=Math.sin(aim);
   const distance=this.identity==='xenobinder'?XENOBINDER.commandRange+XENOBINDER.chargedRange*heavy.level:this.identity==='hunter'?180:140+240*heavy.level;
   this.guide.clear().setVisible(true).lineStyle(2,color,.7).beginPath().arc(0,0,44,-Math.PI/2,-Math.PI/2+Math.PI*2*heavy.level,false).strokePath();
   this.guide.lineStyle(1,color,.4).lineBetween(0,0,c*distance,s*distance);
   if(this.identity!=='hunter')this.guide.strokeCircle(c*distance,s*distance,this.identity==='xenobinder'?XENOBINDER.pulseRadius:52+24*heavy.level);
   this.guideVisible=true;
  }else if(this.guideVisible){this.guide.clear().setVisible(false);this.guideVisible=false;}
 }
}
