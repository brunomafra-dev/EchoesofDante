import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { SaberAttack, type SaberPose } from '../combat/Attack';
import { KineticCharge } from '../combat/KineticCharge';
import { XenobinderCombat,type LinkedAlly } from '../combat/XenobinderCombat';
import { XenobinderArt } from '../visual/XenobinderArt';
import { XENOBINDER } from '../config/classes';
import { AstralCombat } from '../combat/AstralCombat';
import { AstralArt } from '../visual/AstralArt';
import { ASTRAL, ELEMENT_COLORS, type AstralElement } from '../config/classes';
import { HunterCombat } from '../combat/HunterCombat';
import { HunterArt } from '../visual/HunterArt';
import type { Enemy } from '../entities/Enemy';
import type { MovementBounds, Obstacle } from '../systems/Movement';
import type { Vec2 } from '../utils/math';
import type { PartyInput, PartyProfile, PartyPose } from './CoopSession';
import type { AbilityUpgradeId } from '../config/abilityUpgrades';
import { Progression } from '../systems/Progression';
import { equipmentStats } from '../config/equipment';
import { HUNTER } from '../config/classes';
import { KINETIC_CHARGE } from '../config/game';

export class PartyActor {
 readonly player: Player;
 readonly attack: SaberAttack;
 readonly charge: KineticCharge;
 readonly hunter?: HunterCombat;
 readonly xeno?:XenobinderCombat;private xenoArt?:XenobinderArt;
 readonly astral?:AstralCombat;
 private astralArt?:AstralArt;
 private readonly art?: HunterArt;
 private readonly label: Phaser.GameObjects.Text;
 private readonly wave: Phaser.GameObjects.Ellipse;
  private pose: SaberPose = { phase:'READY',relativeAngle:-.42,worldAngle:0,swingProgress:0 };
  private now = 0;
 readonly progression=new Progression();
 private buildKey='';
 private appearanceKey='';
 constructor(scene:Phaser.Scene, readonly profile:PartyProfile, position:Vec2, maxHp:number) {
  this.refreshBuild();
  const rank=(id:AbilityUpgradeId)=>this.progression.upgradeRank(id);
  const hp=Math.round(this.progression.maxHp*(profile.classId==='hunter'?HUNTER.hpRatio:profile.classId==='xenobinder'?XENOBINDER.hpRatio:profile.classId==='astral'?ASTRAL.hpRatio:1))+equipmentStats(profile.equipment??{}).hp;
  this.attack=new SaberAttack(rank);this.charge=new KineticCharge(rank,profile.classId==='xenobinder'?XENOBINDER.commandCooldown:undefined);
  this.player=new Player(scene,position.x,position.y,profile.build?hp:maxHp,false,true,rank,profile.classId,profile.sex);
  if(profile.classId==='hunter'){this.hunter=new HunterCombat(scene,rank);this.art=new HunterArt(scene,this.player.view,position.x,position.y,profile.sex);}
  if(profile.classId==='xenobinder'){this.xeno=new XenobinderCombat(scene,rank,position);this.xenoArt=new XenobinderArt(scene,this.player.view,position.x,position.y,this.player.sex);}
  if(profile.classId==='astral'){this.astral=new AstralCombat(scene,rank);this.astralArt=new AstralArt(scene,this.player.view,position.x,position.y,this.player.sex);}
  this.label=scene.add.text(position.x,position.y-75,profile.name,{fontSize:'13px',color:'#d9e6ca',stroke:'#080e0c',strokeThickness:2}).setOrigin(.5).setDepth(10003);
  this.wave=scene.add.ellipse(0,0,10,80,0x5fe6d8,.6).setVisible(false).setDepth(14999);
 }
 update(now:number,dt:number,input:PartyInput,targets:readonly Enemy[],obstacles:readonly Obstacle[],bounds:MovementBounds|undefined,
  hit:(targets:Enemy[],damage:number,angle:number,origin:Vec2,heavy:boolean,knockback?:number,color?:number,element?:AstralElement)=>void,solidObstacles:readonly Obstacle[]=obstacles,allies:readonly LinkedAlly[]=[]):void {
  const oldLevel=this.progression.level;this.refreshBuild();this.setAppearance();
  const max=Math.round(this.progression.maxHp*(this.profile.classId==='hunter'?HUNTER.hpRatio:this.profile.classId==='xenobinder'?XENOBINDER.hpRatio:this.profile.classId==='astral'?ASTRAL.hpRatio:1))+equipmentStats(this.profile.equipment??{}).hp;
  if(this.player.maxHp!==max){this.player.health.max=max;this.player.health.current=!this.player.isDead&&this.progression.level>oldLevel?max:Math.min(max,this.player.hp);}
  this.now = now;
  if(this.player.isDead){this.hunter?.clear();this.astral?.clear();this.xeno?.dormant();this.charge.stop();this.wave.setVisible(false);return;}
  this.charge.tick(now);if(input.element&&this.charge.phase==='READY')this.astral?.cycle();if(input.cancel)this.cancelCharge();
  if(!input.cancel&&input.charge&&(!this.astral||this.astral.canCharge)&&(!this.xeno||this.xeno.canCharge)&&!this.player.isDashing&&this.attack.pose(now,input.aim).phase==='READY')this.charge.start(now);
  if(!input.cancel&&(input.release||this.charge.phase==='CHARGING'&&!input.held)&&this.charge.release(now,input.aim,this.player.position))
   {this.hunter?.fire(now,this.player.position,input.aim,this.charge.damage);this.astral?.cast(now,this.player.position,input.aim,this.charge.level(now));this.xeno?.command(now,this.player.position,input.aim,this.charge.level(now),obstacles,bounds);}
  if(this.charge.phase==='READY'&&!input.cancel){
   this.player.rotation=input.aim;
   if(input.dash)this.player.startDash(now,{x:input.x,y:input.y});
   if(input.attack){if(this.xeno)this.xeno.fire(now,this.player.position,input.aim,this.xenoArt!.projectileOffset(input.aim));else if(this.astral)this.astral.fire(now,this.player.position,input.aim,this.astralArt!.projectileOffset(input.aim));else if(this.hunter)this.hunter.fire(now,this.player.position,input.aim);else this.attack.start(now);}
  }
  const heavy=this.charge.pose(now),aim=heavy.phase==='RELEASE'?this.charge.angle:input.aim;
  this.pose=this.attack.pose(now,aim);
  this.player.update(now,dt,{x:input.x,y:input.y},aim,solidObstacles,this.pose,heavy,bounds);
  this.art?.update(this.player.position.x,this.player.position.y,aim,now<(this.hunter?.firedUntil??0),this.player.isDashing,heavy);
  this.astralArt?.update(this.player.position.x,this.player.position.y,aim,now<(this.astral?.firedUntil??0),this.player.isDashing,heavy,this.astral!.element);
  this.xenoArt?.update(this.player.position.x,this.player.position.y,aim,now<(this.xeno?.firedUntil??0),this.player.isDashing,heavy,'energy');
  if(this.hunter){
   this.charge.takeHits(now,[]);
   this.hunter.update(dt,this.player.position,Math.hypot(this.player.velocity.x,this.player.velocity.y)>1,targets,obstacles,bounds,
    (enemy,damage,angle,precision)=>hit([enemy],damage,angle,this.player.position,precision));
  }else if(this.xeno){this.charge.takeHits(now,[]);this.xeno.update(now,dt,this.player.position,aim,this.player.isDead,targets,obstacles,bounds,(enemy,damage,angle,origin,heavy)=>hit([enemy],damage,angle,origin,heavy,undefined,XENOBINDER.color),allies.length?allies:[this.player],heavy.phase==='CHARGING',solidObstacles);}
  else if(this.astral){this.charge.takeHits(now,[]);this.astral.update(now,dt,targets,obstacles,bounds,(enemy,damage,angle,heavy,element,origin,force)=>hit([enemy],damage,angle,origin,heavy,force,ELEMENT_COLORS[element],element),heavy.phase==='CHARGING');}
  else{
   const sweep=this.attack.advance(now,this.player.position,aim,targets);if(sweep.hits.length)hit(sweep.hits,this.player.attackDamage,sweep.pose.worldAngle,this.player.position,false);
   const hits=this.charge.takeHits(now,targets);if(hits.length)hit(hits,this.charge.damage,this.charge.angle,this.charge.origin,true);
   const progress=this.charge.waveProgress(now),range=KINETIC_CHARGE.waveStart+progress*KINETIC_CHARGE.waveTravel;
   this.wave.setVisible(this.charge.waveVisible(now)).setDisplaySize(KINETIC_CHARGE.waveThickness,this.charge.waveHalfWidth*2)
    .setPosition(this.charge.origin.x+Math.cos(this.charge.angle)*range,this.charge.origin.y+Math.sin(this.charge.angle)*range).setRotation(this.charge.angle);
  }
  this.label.setPosition(this.player.position.x,this.player.position.y-75);
 }
 snapshot():PartyPose {
  const p=this.player;
  return{strike:{...this.pose},releaseProgress:this.charge.pose(this.now).swingProgress,velocity:{...p.velocity},x:p.position.x,y:p.position.y,aim:p.rotation,hp:p.hp,maxHp:p.maxHp,dead:p.isDead,dash:p.isDashing,
   phase:this.charge.phase,level:this.charge.pose(this.now).level,xenobinder:this.xeno?.snapshot(),astral:this.astral?.snapshot(),firing:(this.xeno?.firedUntil??0)>this.now||(this.astral?.firedUntil??0)>this.now||this.pose.phase!=='READY'||(this.hunter?.firedUntil??0)>this.now,
   swingProgress:this.pose.swingProgress,dashCooldown:p.dashCooldown,chargeCooldown:this.charge.cooldown,dashReady:p.dashProgress,chargeReady:this.charge.getProgress(this.now),momentum:this.hunter?.momentum,beam:this.hunter?.beamPose(),
   wave:this.wave.visible?{x:this.wave.x,y:this.wave.y,rotation:this.wave.rotation,width:this.wave.displayWidth,height:this.wave.displayHeight}:undefined};
 }
 cancelCharge():void{this.charge.stop();this.hunter?.clear();this.astral?.clear();this.xeno?.clear();this.wave.setVisible(false);}
 private refreshBuild():void {
  const build=this.profile.build,key=JSON.stringify(build);if(key===this.buildKey)return;this.buildKey=key;
  this.progression.restore({xp:build?.xp??0,abilityUpgrades:build?.abilityUpgrades,bossRewards:build?.bossRewards,echoes:[],sourceLocated:false,passageOpen:false,rewardedHollows:[],rewardedRoutes:[]});
 }
 private setAppearance():void {const slots=this.profile.equipment??{},key=JSON.stringify(slots);if(key===this.appearanceKey)return;this.appearanceKey=key;this.player.setEquipmentAppearance(slots);this.art?.setEquipment(slots);this.astralArt?.setEquipment(slots);this.xenoArt?.setEquipment(slots);}
 render(pose:PartyPose,now:number,dt:number):void {
  this.setAppearance();
  this.player.health.max=pose.maxHp;this.player.health.current=pose.hp;
  const gap=Math.hypot(pose.x-this.player.position.x,pose.y-this.player.position.y),t=gap>300?1:Math.min(1,dt*18);
  const position={x:Phaser.Math.Linear(this.player.position.x,pose.x,t),y:Phaser.Math.Linear(this.player.position.y,pose.y,t)};
  this.player.renderRemote(position,pose.aim,pose.strike??{phase:pose.firing?'SWING':'READY',relativeAngle:0,worldAngle:pose.aim,swingProgress:pose.swingProgress??.5},
    {phase:pose.phase as 'READY'|'CHARGING'|'RELEASE',level:pose.level,swingProgress:pose.releaseProgress??0},pose.dash,pose.dead);
  this.art?.update(position.x,position.y,pose.aim,pose.firing,pose.dash,{phase:pose.phase as 'READY'|'CHARGING'|'RELEASE',level:pose.level});
  this.hunter?.beamView.render(pose.beam);this.astral?.render(pose.astral);if(pose.astral)this.astralArt?.update(position.x,position.y,pose.aim,pose.firing,pose.dash,{phase:pose.phase as 'READY'|'CHARGING'|'RELEASE',level:pose.level},pose.astral.element);
  this.xeno?.render(pose.xenobinder,dt);if(pose.xenobinder)this.xenoArt?.update(position.x,position.y,pose.aim,pose.firing,pose.dash,{phase:pose.phase as 'READY'|'CHARGING'|'RELEASE',level:pose.level},'energy');
  this.label.setPosition(position.x,position.y-75);void now;
  this.wave.setVisible(!!pose.wave);if(pose.wave)this.wave.setPosition(pose.wave.x,pose.wave.y).setRotation(pose.wave.rotation).setDisplaySize(pose.wave.width,pose.wave.height);
 }
 destroy():void {
  this.hunter?.destroy();this.astral?.destroy();this.xeno?.destroy(); this.player.destroy();
  this.label.destroy();this.wave.destroy();
 }
}
