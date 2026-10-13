import Phaser from 'phaser';
import { ASTRAL, XENOBINDER, ELEMENT_COLORS,type AstralElement } from '../config/classes';
import { equipmentAppearance,type EquipmentSnapshot } from '../config/equipment';
import { weaponStyle,type CharacterSex,type EquipmentLook,type WeaponStyle } from '../config/appearance';
import type { KineticPose } from '../combat/KineticCharge';
import { ModularTorso } from './ModularTorso';
import { registerPaintedArmFrames } from './PaintedArmFrames';
import { clothShoulder } from './ClothShoulders';

export function preloadAstralArt(scene:Phaser.Scene):void{
 for(const sex of ['male','female'])for(const style of ['none','basic','reinforced']){const key=`wardrobe-astral-${sex}-${style}`;if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);}
 for(const tier of ['starter','current','advanced']){const key=`astral-${tier}-weapon`;if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);}
 for(const element of ['energy','fire','water','earth'])for(const [kind,width,height] of [['ground',128,128],['field',192,192],['bolt',128,96]] as const){const key=`astral-${element}-${kind}`;if(!scene.textures.exists(key))scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/visual/astral/${key}-v2.png`,{frameWidth:width,frameHeight:height});}
 if(!scene.cache.json.exists('astral-shoulders'))scene.load.json('astral-shoulders',`${import.meta.env.BASE_URL}assets/visual/characters/astral-shoulders.json`);
}
// Upright painted body, planted gait, articulated arms and a forearm instrument.
export class AstralArt {
 readonly body:Phaser.GameObjects.Image;
 private torso:ModularTorso;
 private limbs:Phaser.GameObjects.Image[];
 private gauntlet:Phaser.GameObjects.Image;
 private glow:Phaser.GameObjects.Image;
 private guide:Phaser.GameObjects.Graphics;
 private travel=0;
 private previous:{x:number;y:number};
 private style:WeaponStyle='starter';
 constructor(scene:Phaser.Scene,private view:Phaser.GameObjects.Container,x:number,y:number,sex:CharacterSex,private identity:'astral'|'xenobinder'='astral'){
  view.list.forEach(p=>(p as unknown as Phaser.GameObjects.Components.Visible).setVisible(false));
  this.body=scene.add.image(0,-19,'wardrobe-'+identity+'-'+sex+'-none').setDisplaySize(128,128);view.add(this.body);
  this.torso=new ModularTorso(scene,view,identity,sex,this.body);
  this.body.setData('clothShoulders',scene.cache.json.get(identity+'-shoulders')[sex]);
  registerPaintedArmFrames(scene);
  this.limbs=Array.from({length:4},(_,i)=>scene.add.image(0,0,'expedition-arm-kit',`anatomy-${i%2}`).setOrigin(.15,.5));
  this.gauntlet=scene.add.image(0,0,identity+'-starter-weapon').setDisplaySize(identity==='xenobinder'?30:23,18);
  this.glow=scene.add.image(0,0,identity==='xenobinder'?'xeno-bolt':'astral-energy-bolt',0).setDisplaySize(16,16).setVisible(false);
  this.guide=scene.add.graphics();view.add([...this.limbs,this.gauntlet,this.glow,this.guide]);
  this.previous={x,y};this.update(x,y,0,false,false,{phase:'READY',level:0},'energy');
 }
 setEquipment(slots:EquipmentSnapshot['slots']):void{this.torso.setLook(equipmentAppearance(slots));this.torso.setAccessory(!!slots.accessory);this.style=weaponStyle(slots.weapon);this.protection();}
 setEquipmentLook(look:EquipmentLook):void{this.torso.setLook(look);this.protection();}
 setWeaponLook(style:WeaponStyle):void{this.style=style;}
 projectileOffset(aim:number):{x:number;y:number}{
  const c=Math.cos(aim),s=Math.sin(aim),vertical=Math.abs(s)>Math.abs(c),row=vertical?(s>0?0:1):2;
  const frames=this.body.getData('clothShoulders') as {left:{x:number;y:number};right:{x:number;y:number}}[];
  const socket=frames[row*4+Number(this.body.frame.name)%4][row===1?'right':'left'];
  // Offset only the presented ray. Collision still sweeps from the player,
  // preventing the raised hand from bypassing a nearby solid obstacle.
  return{x:(socket.x-128)*this.body.scaleX*(!vertical&&c<0?-1:1)+c*(42-ASTRAL.muzzleDistance),
   y:this.body.y+(socket.y-128)*this.body.scaleY+10+s*(32*.7+10-ASTRAL.muzzleDistance)};
 }
 private protection():void{this.limbs.forEach((p,i)=>{const style=this.identity==='xenobinder'&&i%2?this.torso.look.gloves:this.torso.look.torso;p.setTexture(style==='none'?'expedition-arm-kit':style==='reinforced'?'reinforced-arm-kit':'warrior-arm-kit',`anatomy-${i%2}`)});}
 update(x:number,y:number,aim:number,firing:boolean,dash:boolean,heavy:Pick<KineticPose,'phase'|'level'>,element:AstralElement):void{
  const dx=x-this.previous.x,dy=y-this.previous.y,moved=Math.hypot(dx,dy),walking=moved>.05&&moved<32&&!dash&&heavy.phase==='READY';
  if(walking)this.travel+=moved;this.previous={x,y};
  const c=Math.cos(aim),s=Math.sin(aim),vertical=Math.abs(s)>Math.abs(c),row=vertical?(s>0?0:1):2,flip=!vertical&&c<0;
  const frame=walking?[1,0,2,0][Math.floor(this.travel/104*4)%4]:0;
  this.view.setRotation(0);this.body.setFrame(row*4+frame).setFlipX(flip);
  const a={x:0,y:0},b={x:0,y:0};clothShoulder(this.body,row===1?'right':'left',a);clothShoulder(this.body,row===1?'left':'right',b);
  const reach=heavy.phase==='CHARGING'?20+heavy.level*3:firing?32:24;
  const hand={x:a.x+c*reach,y:a.y+s*reach*.7+10};
  this.arm(0,a.x,a.y,hand.x,hand.y,-1);
  this.arm(2,b.x,b.y,b.x-c*8,b.y+21,1);
  this.gauntlet.setTexture(`${this.identity}-${this.style}-weapon`).setPosition(hand.x,hand.y).setRotation(aim).setFlipY(c<0);
  // The far arm/instrument correctly disappear behind the torso when facing away.
  if(row===1){this.limbs.forEach(p=>this.view.sendToBack(p));this.view.sendToBack(this.gauntlet);}else{this.limbs.forEach(p=>this.view.bringToTop(p));this.view.bringToTop(this.gauntlet);}
  this.view.bringToTop(this.glow);this.view.bringToTop(this.guide);
  const busy=heavy.phase==='CHARGING';this.glow.setTexture(this.identity==='xenobinder'?'xeno-bolt':`astral-${element}-bolt`,0).setDisplaySize(24,18).setPosition(hand.x+c*10,hand.y+s*10).setRotation(aim).setVisible(busy||firing).setAlpha(busy?.3+heavy.level*.6:.7);
  this.guide.clear().setVisible(busy);
  if(busy){const color=this.identity==='xenobinder'?XENOBINDER.color:ELEMENT_COLORS[element];this.guide.lineStyle(2,color,.65).beginPath().arc(0,0,44,-Math.PI/2,-Math.PI/2+Math.PI*2*heavy.level,false).strokePath();
   const distance=this.identity==='xenobinder'?XENOBINDER.commandRange+XENOBINDER.chargedRange*heavy.level:140+240*heavy.level;this.guide.lineStyle(1,color,.4).lineBetween(0,0,c*distance,s*distance).strokeCircle(c*distance,s*distance,this.identity==='xenobinder'?XENOBINDER.pulseRadius:52+24*heavy.level);}
 }
 private arm(i:number,x:number,y:number,wx:number,wy:number,side:number):void{
  const dx=wx-x,dy=wy-y,d=Math.max(1,Math.hypot(dx,dy)),bend=8*side;
  const ex=x+dx*.5-dy/d*bend,ey=y+dy*.5+dx/d*bend;
  this.segment(this.limbs[i],x,y,ex,ey,11);this.segment(this.limbs[i+1],ex,ey,wx,wy,10);
 }
 private segment(p:Phaser.GameObjects.Image,x:number,y:number,ex:number,ey:number,h:number):void{const w=Math.hypot(ex-x,ey-y)+6;p.setOrigin(4/w,.5).setPosition(x,y).setRotation(Math.atan2(ey-y,ex-x)).setDisplaySize(w,h);}
}
