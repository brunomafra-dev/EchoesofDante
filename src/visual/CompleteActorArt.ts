import Phaser from 'phaser';
import { equipmentLook, weaponStyle, type CharacterSex, type EquipmentLook, type WeaponStyle } from '../config/appearance';
import { equipmentAppearance, type EquipmentSnapshot } from '../config/equipment';
import { ASTRAL,ELEMENT_COLORS,XENOBINDER,type AstralElement,type PlayableClass } from '../config/classes';
import type { KineticPose } from '../combat/KineticCharge';
import {preloadPixelFX}from'./PixelFX';
import{preloadCompanionArt}from'./CompanionArt';
import {preloadCharacterAppearance,applyCharacterAppearance}from'./CharacterAppearance';
import {appearance,companion,type CharacterAppearance,type CompanionSpecies}from'../config/characterPresentation';
import{companionInfo,GUARDIAN_RADIUS,glacialRadius}from'../config/companions';
import {preloadCompleteSource,completeSource}from'./CompleteActorSources';
import { COMPLETE_DISPLAY,COMPLETE_FEET,COMPLETE_FRAME,COMPLETE_COLUMNS,COMPLETE_STYLES,completeAsset,completeFrameCount,completeFrame,completeKey,completeMuzzle,composeCompleteAtlas,stableCompleteDirection } from './CompleteActorFrames';

let serial=0;
export function preloadCompleteActors(scene:Phaser.Scene,cast?:readonly {classId:PlayableClass;sex:CharacterSex}[]):void {
 preloadPixelFX(scene);
 if(!cast||cast.some(p=>p.classId==='xenobinder'))preloadCompanionArt(scene);
 for(const cls of ['warrior','hunter','astral','xenobinder'] as const)for(const sex of ['male','female']as const)for(const style of COMPLETE_STYLES){
  if(cast&&!cast.some(actor=>actor.classId===cls&&actor.sex===sex))continue;
  if(style==='none')preloadCharacterAppearance(scene,sex,cls);
  const key=completeKey(cls,sex,style);
  preloadCompleteSource(scene,key,completeAsset(cls,sex,style));
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
 private walking=false;private facing?:number;
 private movementAim=0;
 private aimingUntil=0;
 private contacts:{x:number;y:number}[][]=[];
 private look=equipmentLook();private style:WeaponStyle='starter';private signature='';
 private appearance:CharacterAppearance=appearance();
 private species:CompanionSpecies='symbiont';
 private readonly texture:Phaser.Textures.CanvasTexture;
 private readonly guide:Phaser.GameObjects.Graphics;
 private guideVisible=false;private hurtUntil=0;
 bakeCount=0;
 constructor(private scene:Phaser.Scene,private view:Phaser.GameObjects.Container,x:number,y:number,sex:CharacterSex,identity:PlayableClass,private readonly commandWidthRank:()=>number=()=>0){
  this.identity=identity;this.sex=sex;this.previous={x,y};
  view.list.forEach(part=>(part as unknown as Phaser.GameObjects.Components.Visible).setVisible(false));
  const key=`complete-dressed-${identity}-${sex}-${++serial}`;
  const count=completeFrameCount(identity);
  this.texture=scene.textures.createCanvas(key,COMPLETE_FRAME*COMPLETE_COLUMNS,COMPLETE_FRAME*Math.ceil(count/COMPLETE_COLUMNS))!;
  for(let f=0;f<count;f++)this.texture.add(f,0,f%COMPLETE_COLUMNS*COMPLETE_FRAME,Math.floor(f/COMPLETE_COLUMNS)*COMPLETE_FRAME,COMPLETE_FRAME,COMPLETE_FRAME);
  this.body=scene.add.image(0,39,key,0).setOrigin(.5,COMPLETE_FEET/COMPLETE_FRAME).setDisplaySize(COMPLETE_DISPLAY,COMPLETE_DISPLAY);
  this.guide=scene.add.graphics().setVisible(false);view.add([this.body,this.guide]);view.setData('completeActor',this);
  this.body.once(Phaser.GameObjects.Events.DESTROY,()=>{if(scene.textures.exists(key))scene.textures.remove(key);});
  this.bake();this.update(x,y,Math.PI/2,false);
 }
 setEquipment(slots:EquipmentSnapshot['slots']):void{this.look=equipmentAppearance(slots);this.style=weaponStyle(slots.weapon);this.bake();}
 setEquipmentLook(look:EquipmentLook):void{this.look={...look};this.bake();}
 setWeaponLook(style:WeaponStyle):void{this.style=style;this.bake();}
 setAppearance(value?:unknown):void{this.appearance=appearance(value);this.bake();}
 setCompanion(value?:unknown):void{this.species=companion(value);}
 private bake():void{
  const signature=JSON.stringify([this.look,this.style,this.appearance]);if(signature===this.signature)return;this.signature=signature;
  const sources=Object.fromEntries(COMPLETE_STYLES.map(style=>[style,completeSource(this.scene,completeKey(this.identity,this.sex,style))])) as Record<typeof COMPLETE_STYLES[number],CanvasImageSource>;
  composeCompleteAtlas(this.texture.context,sources,this.look,this.style,this.identity,this.sex);applyCharacterAppearance(this.scene,this.texture.context,this.identity,this.sex,this.look,this.appearance);this.texture.refresh();this.bakeCount++;
  this.contacts=[];
  for(let f=0;f<completeFrameCount(this.identity);f++){
   const pixels=this.texture.context.getImageData(f%COMPLETE_COLUMNS*COMPLETE_FRAME+30,Math.floor(f/COMPLETE_COLUMNS)*COMPLETE_FRAME+160,135,24).data;
   let floor=23;while(floor>0&&!Array.from({length:135},(_,x)=>pixels[(floor*135+x)*4+3]).some(a=>a>128))floor--;
   const groups:number[][]=[];let group:number[]=[];
   for(let x=0;x<135;x++){const solid=pixels[(floor*135+x)*4+3]>128;if(solid)group.push(x+30);else if(group.length){groups.push(group);group=[];}}if(group.length)groups.push(group);
   this.contacts.push(groups.filter(g=>g.length>=3).map(g=>({x:(g.reduce((a,b)=>a+b,0)/g.length-96)*COMPLETE_DISPLAY/COMPLETE_FRAME,y:39+(160+floor-COMPLETE_FEET)*COMPLETE_DISPLAY/COMPLETE_FRAME})));
  }
 }
 contactPoint(step:number):{x:number;y:number}{const points=this.contacts[Number(this.body.frame.name)]??[];return points.length?points[step%points.length]:{x:0,y:39};}
 muzzle(aim:number):{x:number;y:number}{return completeMuzzle(this.identity,aim,this.sex,this.look.torso);}
 projectileOffset(aim:number):{x:number;y:number}{const p=this.muzzle(aim);return{x:p.x-Math.cos(aim)*ASTRAL.muzzleDistance,y:p.y-Math.sin(aim)*ASTRAL.muzzleDistance};}
 flashHurt():void{this.hurtUntil=this.scene.time.now+140;}
 update(x:number,y:number,aim:number,firing:boolean,dash=false,heavy:Pick<KineticPose,'phase'|'level'>={phase:'READY',level:0},element:AstralElement='energy'):void{
  const dx=x-this.previous.x,dy=y-this.previous.y,moved=Math.hypot(dx,dy);
  this.walking=moved>.05&&moved<32&&!dash&&heavy.phase==='READY';
  if(this.walking){this.travel+=moved;this.movementAim=Math.atan2(dy,dx);}
  this.previous.x=x;this.previous.y=y;
  this.present(aim,firing,dash,heavy,element);
 }
 // Aim/attack events can redraw between simulation ticks. They must not sample
 // zero displacement and turn a moving Warrior back into idle for one frame.
 present(aim:number,firing:boolean,dash=false,heavy:Pick<KineticPose,'phase'|'level'>={phase:'READY',level:0},element:AstralElement='energy'):void{
  if(firing||heavy.phase!=='READY')this.aimingUntil=this.scene.time.now+650;
  const facingAim=this.walking&&!dash&&heavy.phase==='READY'&&this.scene.time.now>=this.aimingUntil?this.movementAim:aim;
  this.facing=stableCompleteDirection(facingAim,this.facing);
  const visualAim=this.facing===undefined?aim:Math.PI/2-this.facing*Math.PI/4;
  this.view.setRotation(0);this.body.setFrame(completeFrame(visualAim,this.travel,this.walking&&!dash,firing||heavy.phase!=='READY',this.identity)).setRotation(0).setFlip(false,false);
  if(this.scene.time.now<this.hurtUntil)this.body.setTint(0xffac98);else this.body.clearTint();
  const busy=heavy.phase==='CHARGING';
  if(busy&&this.identity!=='warrior'){
   const color=this.identity==='astral'?ELEMENT_COLORS[element]:this.identity==='xenobinder'?companionInfo(this.species).color:0x5fe6d8,c=Math.cos(aim),s=Math.sin(aim);
   const distance=this.identity==='xenobinder'?XENOBINDER.commandRange+XENOBINDER.chargedRange*heavy.level:this.identity==='hunter'?180:140+240*heavy.level;
   this.guide.clear().setVisible(true).lineStyle(2,color,.7).beginPath().arc(0,0,44,-Math.PI/2,-Math.PI/2+Math.PI*2*heavy.level,false).strokePath();
   const guardian=this.identity==='xenobinder'&&this.species==='bulwark',reach=guardian?0:this.identity==='xenobinder'&&this.species==='frostling'?240+240*heavy.level:distance;
   if(!guardian)this.guide.lineStyle(1,color,.4).lineBetween(0,0,c*reach,s*reach);
   if(this.identity!=='hunter')this.guide.strokeCircle(c*reach,s*reach,guardian?GUARDIAN_RADIUS:this.identity==='xenobinder'?this.species==='frostling'?glacialRadius(heavy.level,this.commandWidthRank()):XENOBINDER.pulseRadius:52+24*heavy.level);
   this.guideVisible=true;
  }else if(this.guideVisible){this.guide.clear().setVisible(false);this.guideVisible=false;}
 }
}
