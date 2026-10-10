import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { SaberAttack, type SaberPose } from '../combat/Attack';
import { KineticCharge } from '../combat/KineticCharge';
import { HunterCombat } from '../combat/HunterCombat';
import { HunterArt } from '../visual/HunterArt';
import type { Enemy } from '../entities/Enemy';
import type { MovementBounds, Obstacle } from '../systems/Movement';
import type { Vec2 } from '../utils/math';
import type { PartyInput, PartyProfile, PartyPose } from './CoopSession';
import type { AbilityUpgradeId } from '../config/abilityUpgrades';
import { KINETIC_CHARGE } from '../config/game';

export class PartyActor {
 readonly player: Player;
 readonly attack: SaberAttack;
 readonly charge: KineticCharge;
 readonly hunter?: HunterCombat;
 private readonly art?: HunterArt;
 private readonly label: Phaser.GameObjects.Text;
 private readonly wave: Phaser.GameObjects.Ellipse;
  private pose: SaberPose = { phase:'READY',relativeAngle:-.42,worldAngle:0,swingProgress:0 };
  private now = 0;
 private appearanceKey='';
 constructor(scene:Phaser.Scene, readonly profile:PartyProfile, position:Vec2, maxHp:number, rank:(id:AbilityUpgradeId)=>number=()=>0) {
  this.attack=new SaberAttack(rank);this.charge=new KineticCharge(rank);
  this.player=new Player(scene,position.x,position.y,maxHp,false,true,rank,profile.classId,profile.sex);
  if(profile.classId==='hunter'){this.hunter=new HunterCombat(scene,rank);this.art=new HunterArt(scene,this.player.view,position.x,position.y,profile.sex);}
  this.label=scene.add.text(position.x,position.y-75,profile.name,{fontSize:'13px',color:'#d9e6ca',stroke:'#080e0c',strokeThickness:2}).setOrigin(.5).setDepth(10003);
  this.wave=scene.add.ellipse(0,0,10,80,0x5fe6d8,.6).setVisible(false).setDepth(14999);
 }
 update(now:number,dt:number,input:PartyInput,targets:readonly Enemy[],obstacles:readonly Obstacle[],bounds:MovementBounds|undefined,
  hit:(targets:Enemy[],damage:number,angle:number,origin:Vec2,heavy:boolean)=>void,solidObstacles:readonly Obstacle[]=obstacles):void {
  this.setAppearance();
  this.now = now;
  if(this.player.isDead){this.hunter?.clear();this.charge.stop();this.wave.setVisible(false);return;}
  this.charge.tick(now);if(input.cancel)this.charge.stop();
  if(input.charge&&!this.player.isDashing)this.charge.start(now);
  if((input.release||this.charge.phase==='CHARGING'&&!input.held)&&this.charge.release(now,input.aim,this.player.position))
   this.hunter?.fire(now,this.player.position,input.aim,this.charge.damage);
  if(this.charge.phase==='READY'){
   if(input.dash)this.player.startDash(now,{x:input.x,y:input.y});
   if(input.attack){if(this.hunter)this.hunter.fire(now,this.player.position,input.aim);else this.attack.start(now);}
  }
  const heavy=this.charge.pose(now),aim=heavy.phase==='RELEASE'?this.charge.angle:input.aim;
  this.pose=this.attack.pose(now,aim);
  this.player.update(now,dt,{x:input.x,y:input.y},aim,solidObstacles,this.pose,heavy,bounds);
  this.art?.update(this.player.position.x,this.player.position.y,aim,now<(this.hunter?.firedUntil??0),this.player.isDashing,heavy);
  if(this.hunter){
   this.charge.takeHits(now,[]);
   this.hunter.update(dt,this.player.position,Math.hypot(this.player.velocity.x,this.player.velocity.y)>1,targets,obstacles,bounds,
    (enemy,damage,angle,precision)=>hit([enemy],damage,angle,this.player.position,precision));
  }else{
   const sweep=this.attack.advance(now,this.player.position,aim,targets);if(sweep.hits.length)hit(sweep.hits,this.player.attackDamage,aim,this.player.position,false);
   const hits=this.charge.takeHits(now,targets);if(hits.length)hit(hits,this.charge.damage,this.charge.angle,this.charge.origin,true);
   const progress=this.charge.waveProgress(now),range=KINETIC_CHARGE.waveStart+progress*KINETIC_CHARGE.waveTravel;
   this.wave.setVisible(this.charge.waveVisible(now)).setDisplaySize(KINETIC_CHARGE.waveThickness,this.charge.waveHalfWidth*2)
    .setPosition(this.charge.origin.x+Math.cos(this.charge.angle)*range,this.charge.origin.y+Math.sin(this.charge.angle)*range).setRotation(this.charge.angle);
  }
  this.label.setPosition(this.player.position.x,this.player.position.y-75);
 }
 snapshot():PartyPose {
  const p=this.player;
  return{x:p.position.x,y:p.position.y,aim:p.rotation,hp:p.hp,maxHp:p.maxHp,dead:p.isDead,dash:p.isDashing,
   phase:this.charge.phase,level:this.charge.pose(this.now).level,firing:this.pose.phase!=='READY'||(this.hunter?.firedUntil??0)>this.now,
   dashReady:p.dashProgress,chargeReady:this.charge.getProgress(this.now),momentum:this.hunter?.momentum,beam:this.hunter?.beamPose(),
   wave:this.wave.visible?{x:this.wave.x,y:this.wave.y,rotation:this.wave.rotation,width:this.wave.displayWidth,height:this.wave.displayHeight}:undefined};
 }
 cancelCharge():void{this.charge.stop();this.hunter?.clear();this.wave.setVisible(false);}
 private setAppearance():void {const slots=this.profile.equipment??{},key=JSON.stringify(slots);if(key===this.appearanceKey)return;this.appearanceKey=key;this.player.setEquipmentAppearance(slots);this.art?.setEquipment(slots);}
 render(pose:PartyPose,now:number,dt:number):void {
  this.setAppearance();
  this.player.health.current=pose.hp;
  const gap=Math.hypot(pose.x-this.player.position.x,pose.y-this.player.position.y),t=gap>300?1:Math.min(1,dt*18);
  const position={x:Phaser.Math.Linear(this.player.position.x,pose.x,t),y:Phaser.Math.Linear(this.player.position.y,pose.y,t)};
  this.player.renderRemote(position,pose.aim,{phase:pose.firing?'SWING':'READY',relativeAngle:0,worldAngle:pose.aim,swingProgress:.5},
    {phase:pose.phase as 'READY'|'CHARGING'|'RELEASE',level:pose.level,swingProgress:0},pose.dash,pose.dead);
  this.art?.update(position.x,position.y,pose.aim,pose.firing,pose.dash,{phase:pose.phase as 'READY'|'CHARGING'|'RELEASE',level:pose.level});
  this.hunter?.beamView.render(pose.beam);
  this.label.setPosition(position.x,position.y-75);void now;
  this.wave.setVisible(!!pose.wave);if(pose.wave)this.wave.setPosition(pose.wave.x,pose.wave.y).setRotation(pose.wave.rotation).setDisplaySize(pose.wave.width,pose.wave.height);
 }
 destroy():void {
  this.hunter?.destroy(); this.player.destroy();
  this.label.destroy();this.wave.destroy();
 }
}
