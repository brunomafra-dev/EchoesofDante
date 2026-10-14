import Phaser from 'phaser';
import { ASTRAL, XENOBINDER, ELEMENT_COLORS,type AstralElement } from '../config/classes';
import { equipmentAppearance,type EquipmentSnapshot } from '../config/equipment';
import { weaponStyle,type CharacterSex,type EquipmentLook,type WeaponStyle } from '../config/appearance';
import type { KineticPose } from '../combat/KineticCharge';
import { ModularTorso } from './ModularTorso';
import { preloadCasterArms,registerPaintedArmFrames } from './PaintedArmFrames';
import { clothShoulder,type ShoulderSockets } from './ClothShoulders';
import { CASTER_COLUMNS,CASTER_WALK,CASTER_INSTRUMENTS,casterTargets,type ArmPose,type CasterIdentity } from './CasterPose';

export function preloadAstralArt(scene:Phaser.Scene):void{
 preloadCasterArms(scene,'astral');
 for(const sex of ['male','female'])for(const style of ['none','basic','reinforced']){const key=`wardrobe-astral-${sex}-${style}`;if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);}
 for(const tier of ['starter','current','advanced']){const key=`astral-${tier}-weapon`;if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);}
 for(const element of ['energy','fire','water','earth'])for(const [kind,width,height] of [['ground',128,128],['field',192,192],['bolt',128,96]] as const){const key=`astral-${element}-${kind}`;if(!scene.textures.exists(key))scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/visual/astral/${key}-v2.png`,{frameWidth:width,frameHeight:height});}
 if(!scene.cache.json.exists('astral-shoulders'))scene.load.json('astral-shoulders',`${import.meta.env.BASE_URL}assets/visual/characters/astral-shoulders.json`);
}
const armPose=():ArmPose=>({shoulder:{x:0,y:0},elbow:{x:0,y:0},wrist:{x:0,y:0}});
// Shared visual rig only. Fixed bones, registered wrists, a free hand and cached layering.
export class AstralArt {
 readonly body:Phaser.GameObjects.Image;
 private torso:ModularTorso;
 private limbs:Phaser.GameObjects.Image[];
 private freeHand:Phaser.GameObjects.Image;
 private gauntlet:Phaser.GameObjects.Image;
 private glow:Phaser.GameObjects.Image;
 private guide:Phaser.GameObjects.Graphics;
 private travel=0;
 private previous:{x:number;y:number};
 private style:WeaponStyle='starter';
 private layer=-1;
 private socketStyles:Record<string,ShoulderSockets[]>;
 private main=armPose();private other=armPose();
 private shoulder={x:0,y:0};private otherShoulder={x:0,y:0};
 private muzzle={x:0,y:0};private guideVisible=false;
 constructor(scene:Phaser.Scene,private view:Phaser.GameObjects.Container,x:number,y:number,sex:CharacterSex,private identity:CasterIdentity='astral'){
  view.list.forEach(p=>(p as unknown as Phaser.GameObjects.Components.Visible).setVisible(false));
  this.body=scene.add.image(0,-19,'wardrobe-'+identity+'-'+sex+'-none').setDisplaySize(128,128);view.add(this.body);
  this.torso=new ModularTorso(scene,view,identity,sex,this.body);
  const registration=scene.cache.json.get(identity+'-shoulders');this.socketStyles=registration.byStyle[sex];
  this.body.setData('clothShoulders',this.socketStyles.none);
  registerPaintedArmFrames(scene);
  this.limbs=Array.from({length:4},(_,i)=>scene.add.image(0,0,identity+'-arm-none',`anatomy-${i%2}`));
  this.freeHand=scene.add.image(0,0,identity+'-arm-none','anatomy-2').setOrigin(.15,.5).setDisplaySize(8,9);
  this.gauntlet=scene.add.image(0,0,identity+'-starter-weapon');
  this.glow=scene.add.image(0,0,identity==='xenobinder'?'xeno-bolt':'astral-energy-bolt',0).setVisible(false);
  this.guide=scene.add.graphics();view.add([...this.limbs,this.freeHand,this.gauntlet,this.glow,this.guide]);
  this.previous={x,y};this.update(x,y,0,false,false,{phase:'READY',level:0},'energy');
 }
 setEquipment(slots:EquipmentSnapshot['slots']):void{this.torso.setLook(equipmentAppearance(slots));this.torso.setAccessory(!!slots.accessory);this.style=weaponStyle(slots.weapon);this.protection();}
 setEquipmentLook(look:EquipmentLook):void{this.torso.setLook(look);this.protection();}
 setWeaponLook(style:WeaponStyle):void{this.style=style;}
 projectileOffset(aim:number):{x:number;y:number}{
  // Only the presented ray moves to the muzzle. Collision still starts at the player.
  const c=Math.cos(aim),s=Math.sin(aim),row=Math.abs(s)>Math.abs(c)?s>0?0:1:2,flip=row===2&&c<0;
  const socket=this.socketStyles[this.torso.look.torso][row*CASTER_COLUMNS+Number(this.body.frame.name)%CASTER_COLUMNS][row===1?'right':'left'];
  const sx=(socket.x-128)*.5*(flip?-1:1),sy=this.body.y+(socket.y-128)*.5;
  const scratch=armPose(),off=armPose();casterTargets(sx,sy,0,0,aim,true,false,0,scratch,off);
  const p=CASTER_INSTRUMENTS[this.identity][this.style],length=Math.hypot(p.muzzle.x-p.wrist.x,p.muzzle.y-p.wrist.y)*p.width/128;
  return{x:scratch.wrist.x+c*(length-ASTRAL.muzzleDistance),y:scratch.wrist.y+s*(length-ASTRAL.muzzleDistance)};
 }
 private protection():void{
  this.body.setData('clothShoulders',this.socketStyles[this.torso.look.torso]);
  this.limbs.forEach((p,i)=>{const style=i%2?this.torso.look.gloves:this.torso.look.torso;p.setTexture(`${this.identity}-arm-${style}`,`anatomy-${i%2}`)});
  this.freeHand.setTexture(`${this.identity}-arm-${this.torso.look.gloves}`,'anatomy-2');this.layer=-1;
 }
 update(x:number,y:number,aim:number,firing:boolean,dash:boolean,heavy:Pick<KineticPose,'phase'|'level'>,element:AstralElement):void{
  const dx=x-this.previous.x,dy=y-this.previous.y,moved=Math.hypot(dx,dy),walking=moved>.05&&moved<32&&!dash&&heavy.phase==='READY';
  const c=Math.cos(aim),s=Math.sin(aim),vertical=Math.abs(s)>Math.abs(c),row=vertical?(s>0?0:1):2,flip=!vertical&&c<0;
  if(walking)this.travel+=(dx*c+dy*s<-.05?-1:1)*moved;this.previous.x=x;this.previous.y=y;
  const phase=((this.travel/104)%1+1)%1,frame=walking?CASTER_WALK[Math.floor(phase*4)]:0;
  this.view.setRotation(0);this.body.setFrame(row*CASTER_COLUMNS+frame).setFlipX(flip);
  clothShoulder(this.body,row===1?'right':'left',this.shoulder);clothShoulder(this.body,row===1?'left':'right',this.otherShoulder);
  casterTargets(this.shoulder.x,this.shoulder.y,this.otherShoulder.x,this.otherShoulder.y,aim,firing,heavy.phase==='CHARGING',walking?Math.sin(phase*Math.PI*2):0,this.main,this.other);
  this.arm(0,this.main);this.arm(2,this.other);
  this.freeHand.setPosition(this.other.wrist.x,this.other.wrist.y).setRotation(Math.atan2(this.other.wrist.y-this.other.elbow.y,this.other.wrist.x-this.other.elbow.x)).setFlipY(flip);
  const p=CASTER_INSTRUMENTS[this.identity][this.style],left=c<0,angle=aim-Math.atan2((p.muzzle.y-p.wrist.y)*(left?-1:1),p.muzzle.x-p.wrist.x);
  this.gauntlet.setTexture(`${this.identity}-${this.style}-weapon`).setOrigin(p.wrist.x/128,left?1-p.wrist.y/96:p.wrist.y/96).setDisplaySize(p.width,p.width*96/128).setPosition(this.main.wrist.x,this.main.wrist.y).setRotation(angle).setFlipY(left);
  const length=Math.hypot(p.muzzle.x-p.wrist.x,p.muzzle.y-p.wrist.y)*p.width/128;this.muzzle.x=this.main.wrist.x+c*length;this.muzzle.y=this.main.wrist.y+s*length;
  if(this.layer!==row){this.layer=row;const outer=row===1?3:0;this.limbs.forEach((v,i)=>v.setFrame(`anatomy-${outer+i%2}`));this.freeHand.setFrame(`anatomy-${outer+2}`);
   const [upper,fore,otherUpper,otherFore]=this.limbs;
   const order=row===1?[otherUpper,otherFore,upper,fore,this.freeHand,this.gauntlet,this.body,this.torso.image]:row===2?[otherUpper,otherFore,this.freeHand,this.body,this.torso.image,upper,fore,this.gauntlet]:[this.body,this.torso.image,otherUpper,upper,otherFore,fore,this.freeHand,this.gauntlet];
   for(const v of [...order,this.glow,this.guide])this.view.bringToTop(v);
  }
  const busy=heavy.phase==='CHARGING';this.glow.setTexture(this.identity==='xenobinder'?'xeno-bolt':`astral-${element}-bolt`,0).setDisplaySize(17,12).setPosition(this.muzzle.x,this.muzzle.y).setRotation(aim).setVisible(busy||firing).setAlpha(busy?.3+heavy.level*.6:.7);
  if(busy){this.guide.clear().setVisible(true);this.guideVisible=true;const color=this.identity==='xenobinder'?XENOBINDER.color:ELEMENT_COLORS[element];this.guide.lineStyle(2,color,.65).beginPath().arc(0,0,44,-Math.PI/2,-Math.PI/2+Math.PI*2*heavy.level,false).strokePath();
   const distance=this.identity==='xenobinder'?XENOBINDER.commandRange+XENOBINDER.chargedRange*heavy.level:140+240*heavy.level;this.guide.lineStyle(1,color,.4).lineBetween(0,0,c*distance,s*distance).strokeCircle(c*distance,s*distance,this.identity==='xenobinder'?XENOBINDER.pulseRadius:52+24*heavy.level);
  }else if(this.guideVisible){this.guide.clear().setVisible(false);this.guideVisible=false;}
 }
 private arm(i:number,p:ArmPose):void{this.segment(this.limbs[i],p.shoulder,p.elbow,12,5);this.segment(this.limbs[i+1],p.elbow,p.wrist,10.5,2);}
 private segment(p:Phaser.GameObjects.Image,a:{x:number;y:number},b:{x:number;y:number},h:number,overlap:number):void{const length=Math.hypot(b.x-a.x,b.y-a.y),w=length+overlap+1;p.setOrigin(overlap/w,.5).setPosition(a.x,a.y).setRotation(Math.atan2(b.y-a.y,b.x-a.x)).setDisplaySize(w,h);}
}
