import Phaser from 'phaser';
import { ASTRAL,ASTRAL_ELEMENTS,type AstralElement } from '../config/classes';
import type { AbilityUpgradeId } from '../config/abilityUpgrades';
import type { Enemy } from '../entities/Enemy';
import type { MovementBounds,Obstacle } from '../systems/Movement';
import type { Vec2 } from '../utils/math';

type Shot={x:number;y:number;angle:number;travel:number;active:boolean;element:AstralElement;offset?:Vec2};
type Zone={x:number;y:number;radius:number;element:AstralElement;angle:number;remaining:number;duration:number;tick:number;first:boolean;damage:number};
export type AstralPose={energy:number;element:AstralElement;shots:{x:number;y:number;angle:number;element?:AstralElement;frame?:number}[];zones:{x:number;y:number;radius:number;element:AstralElement;alpha:number;age?:number;angle?:number}[]};
type Hit=(enemy:Enemy,damage:number,angle:number,heavy:boolean,element:AstralElement,origin:Vec2,knockback:number)=>void;
// Shared by solo and the authoritative party actor. Fixed pools; no second guest simulation.
export class AstralCombat {
 energy:number=ASTRAL.energyMax;
 element:AstralElement='energy';
 firedUntil=0;
 private lastShot=-Infinity;
 private pending?:{origin:Vec2;angle:number;level:number;element:AstralElement};
 private shots:Shot[]=Array.from({length:8},()=>({x:0,y:0,angle:0,travel:0,active:false,element:'energy'}));
 private zones:Zone[]=[];
 private controls=new WeakMap<Enemy,{until:number;scale:number}>();
 private shotViews:Phaser.GameObjects.Image[];
 private zoneViews:Phaser.GameObjects.Image[];
 private formViews:Phaser.GameObjects.Image[];
 constructor(scene:Phaser.Scene,private rank:(id:AbilityUpgradeId)=>number){
  this.shotViews=Array.from({length:8},()=>scene.add.image(0,0,'astral-energy-bolt',0).setVisible(false));
  this.zoneViews=Array.from({length:4},()=>scene.add.image(0,0,'astral-energy-ground',0).setVisible(false));
  this.formViews=Array.from({length:4},()=>scene.add.image(0,0,'astral-energy-field',0).setVisible(false));
 }
 get canCharge():boolean{return this.energy>=ASTRAL.castCost;}
 cycle():void{this.element=ASTRAL_ELEMENTS[(ASTRAL_ELEMENTS.indexOf(this.element)+1)%4];}
 fire(now:number,origin:Vec2,angle:number,offset?:Vec2):boolean{
  if(now-this.lastShot<ASTRAL.shotCooldown)return false;
  const shot=this.shots.find(s=>!s.active);if(!shot)return false;
  Object.assign(shot,origin,{angle,travel:0,active:true,offset,element:this.element});this.lastShot=now;this.firedUntil=now+160;return true;
 }
 cast(now:number,origin:Vec2,angle:number,level:number):boolean{
  if(!this.canCharge)return false;this.energy-=ASTRAL.castCost;
  this.pending={origin:{...origin},angle,level,element:this.element};this.firedUntil=now+260;return true;
 }
 // Circular surface intersection along a ray, shared by bolts and placement.
 private entry(origin:Vec2,angle:number,p:Vec2,radius:number):number{
  const dx=p.x-origin.x,dy=p.y-origin.y,c=Math.cos(angle),s=Math.sin(angle),along=dx*c+dy*s,across=-dx*s+dy*c;
  if(Math.abs(across)>radius||along+radius<0)return Infinity;
  return Math.max(0,along-Math.sqrt(radius*radius-across*across));
 }
 update(now:number,dt:number,targets:readonly Enemy[],obstacles:readonly Obstacle[],bounds:MovementBounds|undefined,hit:Hit,charging=false):void{
  if(!charging)this.energy=Math.min(ASTRAL.energyMax,this.energy+dt*ASTRAL.energyRegen);
  const cast=this.pending;this.pending=undefined;
  if(cast){
   let range=ASTRAL.castRange+ASTRAL.chargedRange*cast.level;
   for(const o of obstacles)range=Math.min(range,Math.max(0,this.entry(cast.origin,cast.angle,o,o.radius+8)-8));
   const c=Math.cos(cast.angle),s=Math.sin(cast.angle);
   if(bounds){if(c>.001)range=Math.min(range,(bounds.right-cast.origin.x)/c);if(c<-.001)range=Math.min(range,(bounds.left-cast.origin.x)/c);if(s>.001)range=Math.min(range,(bounds.bottom-cast.origin.y)/s);if(s<-.001)range=Math.min(range,(bounds.top-cast.origin.y)/s);}
   const duration=cast.element==='fire'?3:cast.element==='water'?2.5:cast.element==='earth'?.85:1.35;
   if(this.zones.length===4)this.zones.shift();
   this.zones.push({x:cast.origin.x+c*Math.max(0,range),y:cast.origin.y+s*Math.max(0,range),element:cast.element,angle:cast.angle,
    radius:ASTRAL.radius+ASTRAL.chargedRadius*cast.level+this.rank('chargeWidth')*6,duration,remaining:duration,tick:0,first:true,
    damage:Math.round((cast.element==='energy'?56+30*cast.level:cast.element==='earth'?40+26*cast.level:cast.element==='water'?30+22*cast.level:18+16*cast.level)+this.rank('chargePower')*(4+2*cast.level))});
  }
  for(const shot of this.shots)if(shot.active){
   const travel=Math.min(ASTRAL.shotSpeed*dt,ASTRAL.shotRange+this.rank('saberReach')*40-shot.travel);
   let first=travel+1,target:Enemy|undefined;
   for(const o of obstacles)first=Math.min(first,this.entry(shot,shot.angle,o,o.radius+5));
   for(const e of targets)if(!e.isDead){const at=this.entry(shot,shot.angle,e.position,e.radius+5);if(at<first){first=at;target=e;}}
   if(target&&first<=travel){hit(target,ASTRAL.shotDamage+this.rank('saberArc')*3,shot.angle,false,shot.element,shot,0);this.energy=Math.min(ASTRAL.energyMax,this.energy+ASTRAL.energyPerHit);}
   shot.x+=Math.cos(shot.angle)*travel;shot.y+=Math.sin(shot.angle)*travel;shot.travel+=travel;
   if(first<=travel||shot.travel>=ASTRAL.shotRange+this.rank('saberReach')*40||bounds&&(shot.x<bounds.left||shot.x>bounds.right||shot.y<bounds.top||shot.y>bounds.bottom))shot.active=false;
  }
  for(const zone of this.zones){
   zone.remaining-=dt;zone.tick-=dt;
   const risen=zone.element!=='earth'||zone.duration-zone.remaining>=ASTRAL.earthRise;
   const pulse=zone.first&&risen||!zone.first&&zone.element==='fire'&&zone.tick<=0;
   if(pulse)zone.tick=.5;
   for(const e of targets)if(!e.isDead&&Math.hypot(e.position.x-zone.x,e.position.y-zone.y)<zone.radius+e.radius){
    const length=Math.hypot(e.position.x-zone.x,e.position.y-zone.y),angle=Math.atan2(e.position.y-zone.y,e.position.x-zone.x);
    if(obstacles.some(o=>this.entry(zone,angle,o,o.radius)<Math.max(0,length-e.radius)))continue;
    if(pulse){
     const origin=length<1?{x:zone.x-Math.cos(zone.angle)*8,y:zone.y-Math.sin(zone.angle)*8}:zone;
     hit(e,zone.first?zone.damage:12,Math.atan2(e.position.y-origin.y,e.position.x-origin.x),true,zone.element,origin,zone.element==='earth'&&zone.first&&e.radius<=35?ASTRAL.earthPush:0);
    }
    // Large boss bodies resist control, but still receive damage. No AI/stat rewrite.
    if(e.radius<=35&&zone.element==='water')this.controls.set(e,{until:now+180,scale:.55});
   }
   if(pulse)zone.first=false;
  }
  this.zones=this.zones.filter(z=>z.remaining>0);this.render(this.snapshot());
 }
 movementScale(enemy:Enemy,now:number):number{const c=this.controls.get(enemy);return c&&now<c.until?c.scale:1;}
 snapshot():AstralPose{return{energy:this.energy,element:this.element,shots:this.shots.filter(s=>s.active&&s.travel>=ASTRAL.muzzleDistance).map(s=>({x:s.x+(s.offset?.x??0),y:s.y+(s.offset?.y??0),angle:s.angle,element:s.element,frame:Math.floor(s.travel/24)%4})),zones:this.zones.map(z=>({x:z.x,y:z.y,radius:z.radius,element:z.element,alpha:Math.min(1,z.remaining/.4),age:z.duration-z.remaining,angle:z.angle}))};}
 render(pose?:AstralPose):void{
  this.shotViews.forEach((v,i)=>{const s=pose?.shots[i];v.setVisible(!!s);if(s){const element=s.element??pose!.element;v.setTexture(`astral-${element}-bolt`,s.frame??0).setDisplaySize(element==='energy'?74:42,element==='energy'?26:34).setOrigin(.72,.5).setPosition(s.x,s.y).setRotation(s.angle).setDepth(s.y+5);}});
  this.zoneViews.forEach((v,i)=>{
   const z=pose?.zones[i],form=this.formViews[i];v.setVisible(!!z);form.setVisible(!!z);if(!z)return;
   const age=z.age??.2,frame=Math.floor(age*10)%4,size=z.radius*2;
   v.setTexture(`astral-${z.element}-ground`,frame).setDisplaySize(size,size).setPosition(z.x,z.y+12).setDepth(8).setAlpha(z.alpha);
   form.setTexture(`astral-${z.element}-field`,z.element==='earth'?Math.min(3,Math.floor(age/.18*4)):frame)
    .setOrigin(.5,z.element==='energy'?.75:.92).setDisplaySize(size,size).setPosition(z.x,z.y+12).setRotation(0).setDepth(z.y+4).setAlpha(z.alpha*.9);
   if(z.element==='water'){const surge=Math.min(1,age/.18),travel=Math.min(24,age*30);form.setDisplaySize(size*(.65+.35*surge),size*(.65+.35*surge)).setOrigin(.5,.75).setPosition(z.x+Math.cos(z.angle??0)*travel,z.y+Math.sin(z.angle??0)*travel).setRotation((z.angle??0)+Math.PI/2).setAlpha(z.alpha*Math.max(0,1-age/1.15)*.8);}
  });
 }
 clear():void{this.pending=undefined;this.zones=[];this.shots.forEach(s=>s.active=false);this.controls=new WeakMap();this.render();}
 destroy():void{this.shotViews.forEach(v=>v.destroy());this.zoneViews.forEach(v=>v.destroy());this.formViews.forEach(v=>v.destroy());}
}
