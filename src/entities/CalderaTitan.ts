import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inMeleeArc,inShockwaveSweep } from '../combat/HitDetection';
import { PLAYER } from '../config/game';
import { TITAN as B,type TitanAttack } from '../config/caldera';
import { moveWithCollisions,type Obstacle } from '../systems/Movement';
import { clamp,distance,type Vec2 } from '../utils/math';
import type { Enemy,EnemyImpact } from './Enemy';
export type TitanCue='intro'|'warning'|'strike'|'phase'|'death';

// Explicit heavy encounter on the established Enemy and party damage contracts.
export class CalderaTitan implements Enemy {
 readonly health=new Health(B.hp);readonly radius=B.radius;readonly position={...B.spawn};
 readonly body:Phaser.GameObjects.Image;readonly shadow:Phaser.GameObjects.Ellipse;readonly telegraph:Phaser.GameObjects.Graphics;
 readonly attackRange=B.cleave.range;
 state:'DORMANT'|'INTRO'|'IDLE'|'TELEGRAPH'|'EXECUTE'|'RECOVER'|'PHASE'|'DEATH'='DORMANT';
 phase:1|2|3=1;attackName:TitanAttack|null=null;isDead=false;
 private stopped=false;private at=0;private until=0;private index=0;private angle=0;private gait=0;private left=false;private hurtUntil=0;
 private origin={x:0,y:0};private victims=new Set<Vec2>();private participants?:readonly Vec2[];
 private marks:{x:number;y:number;spent:boolean;view:Phaser.GameObjects.Graphics}[];
 private shots:{x:number;y:number;angle:number;travel:number;active:boolean;view:Phaser.GameObjects.Image}[];
 get coopObjects():Phaser.GameObjects.GameObject[]{return[this.shadow,this.body,this.telegraph,...this.marks.map(m=>m.view),...this.shots.map(s=>s.view)];}
 constructor(private scene:Phaser.Scene,private cue:(cue:TitanCue)=>void,private finish:()=>void){
  this.shadow=scene.add.ellipse(this.position.x,this.position.y+8,174,44,0x080b0d,.5);
  this.body=scene.add.image(this.position.x,this.position.y+15,'titan-motion',0).setOrigin(.5,244/256).setDisplaySize(B.size,B.size);
  this.telegraph=scene.add.graphics().setVisible(false);
  this.marks=Array.from({length:3},()=>({x:0,y:0,spent:true,view:scene.add.graphics().setVisible(false)}));
  this.shots=Array.from({length:3},()=>({x:0,y:0,angle:0,travel:0,active:false,view:scene.add.image(0,0,'world-rock').setTint(0xffbd54).setVisible(false)}));
 }
 get canBeHit():boolean{return !this.isDead&&!this.stopped&&!['DORMANT','INTRO','PHASE'].includes(this.state);}
 get solid():boolean{return !this.isDead;}
 beginIntro(now:number):void{if(this.state==='DORMANT'&&!this.stopped){this.setState('INTRO',now,2200);this.cue('intro');}}
 private setState(state:typeof this.state,now:number,ms:number):void{this.state=state;this.at=now;this.until=now+ms;}
 update(now:number,dt:number,player:Vec2,dead:boolean,obstacles:readonly Obstacle[],attack:(impact?:EnemyImpact)=>void,_bounds?:unknown,participants?:readonly Vec2[]):void{
  this.participants=participants;if(this.isDead||this.stopped)return;if(dead){this.suspend();return;}dt=Math.min(dt,.04);
  const before={...this.position};
  if(this.state==='DORMANT'){this.render(now,0);return;}
  if(this.state==='INTRO'||this.state==='PHASE'){if(now>=this.until)this.setState('IDLE',now,750);}
  else{
   const next=this.health.current<=this.health.max*.3?3:this.health.current<=this.health.max*.65?2:1;
   if(next>this.phase&&this.state!=='TELEGRAPH'&&this.state!=='EXECUTE'){
    this.phase=next;this.index=0;this.attackName=null;this.clear();this.setState('PHASE',now,1500);this.cue('phase');
   }else if(this.state==='IDLE'){
    const gap=distance(player,this.position);if(Math.abs(player.x-this.position.x)>12)this.left=player.x<this.position.x;
    if(gap>155)moveWithCollisions(this.position,{x:(player.x-this.position.x)/gap*B.speed,y:(player.y-this.position.y)/gap*B.speed},dt,this.radius,obstacles,B.bounds);
    if(now>=this.until){const pattern=B.patterns[this.phase];let name=pattern[this.index++%pattern.length];if(gap>340&&name==='cleave')name='boulders';this.beginAttack(now,name,player);}
   }else if(this.state==='TELEGRAPH'&&now>=this.until){
    this.setState('EXECUTE',now,B[this.attackName!].duration);this.cue('strike');
    if(this.attackName==='boulders')this.shots.forEach((s,i)=>{s.x=this.position.x+Math.cos(this.angle)*(this.radius+8);s.y=this.position.y+Math.sin(this.angle)*(this.radius+8);s.angle=this.angle+(i-1)*B.boulders.spread;s.travel=0;s.active=true;});
   }else if(this.state==='EXECUTE'&&this.attackName){
    const elapsed=now-this.at,name=this.attackName;
    if(name==='cleave'&&elapsed<170)for(const p of this.participants??[player])if(inMeleeArc(this.origin,this.angle,p,B.cleave.range,B.cleave.halfAngle,PLAYER.radius))this.hit(attack,p);
    if(name==='slam'&&elapsed<170)for(const p of this.participants??[player])if(distance(this.origin,p)<B.slam.radius+PLAYER.radius)this.hit(attack,p);
    if(name==='fissure')this.marks.forEach((m,i)=>{if(!m.spent&&elapsed>=i*B.fissure.interval){m.spent=true;for(const p of this.participants??[player])if(distance(m,p)<B.fissure.radius+PLAYER.radius)this.hit(attack,p);}m.view.setAlpha(m.spent?Math.max(0,1-(elapsed-i*B.fissure.interval)/350):1)});
    if(name==='boulders')for(const s of this.shots)if(s.active){
     const from={x:s.x,y:s.y},step=B.boulders.speed*dt;s.x+=Math.cos(s.angle)*step;s.y+=Math.sin(s.angle)*step;s.travel+=step;
     const blocked=obstacles.some(o=>inShockwaveSweep(from,s.angle,o,0,step,B.boulders.radius,0,o.radius));
     const contacts=(this.participants??[player]).filter(p=>!blocked&&inShockwaveSweep(from,s.angle,p,0,step,B.boulders.radius,0,PLAYER.radius));
     contacts.forEach(p=>this.hit(attack,p));s.active=!blocked&&!contacts.length&&s.travel<B.boulders.range&&s.x>B.bounds.left&&s.x<B.bounds.right&&s.y>B.bounds.top&&s.y<B.bounds.bottom;
     s.view.setVisible(s.active).setPosition(s.x,s.y).setRotation(s.travel*.012).setDisplaySize(42,36).setDepth(s.y+2);
    }
    if(now>=this.until){this.clear();this.setState('RECOVER',now,B[name].recovery);}
   }else if(this.state==='RECOVER'&&now>=this.until){this.attackName=null;this.setState('IDLE',now,this.phase===3?450:750);}
  }
  this.render(now,distance(before,this.position));
 }
 private hit(callback:(impact?:EnemyImpact)=>void,victim:Vec2):void{if(!this.attackName||this.victims.has(victim))return;this.victims.add(victim);callback({damage:B[this.attackName].damage,ranged:true,victim});}
 private beginAttack(now:number,name:TitanAttack,player:Vec2):void{
  this.clear();this.victims.clear();this.attackName=name;Object.assign(this.origin,this.position);this.angle=Math.atan2(player.y-this.position.y,player.x-this.position.x);
  this.left=Math.cos(this.angle)<0;this.setState('TELEGRAPH',now,B[name].tell);this.cue('warning');
  const g=this.telegraph.clear().setPosition(this.origin.x,this.origin.y).setRotation(this.angle).setDepth(this.position.y-3).setAlpha(1).setVisible(true);
  g.fillStyle(0xff6a4a,.18).lineStyle(3,0xffbd54,.95);
  if(name==='cleave'){g.beginPath().moveTo(0,0).arc(0,0,B.cleave.range,-B.cleave.halfAngle,B.cleave.halfAngle,false).closePath().fillPath().strokePath();g.lineBetween(80,-12,110,0).lineBetween(80,12,110,0);}
  else if(name==='slam'){g.fillCircle(0,0,B.slam.radius).strokeCircle(0,0,B.slam.radius).lineBetween(-20,0,20,0).lineBetween(0,-20,0,20);}
  else if(name==='boulders'){for(let i=-1;i<=1;i++){const a=i*B.boulders.spread;g.lineBetween(Math.cos(a)*70,Math.sin(a)*70,Math.cos(a)*530,Math.sin(a)*530);}}
  else{g.setVisible(false);this.marks.forEach((m,i)=>{m.x=clamp(player.x+(i-1)*170,B.bounds.left+90,B.bounds.right-90);m.y=clamp(player.y+(i===1?0:50),B.bounds.top+90,B.bounds.bottom-90);m.spent=false;m.view.clear().setPosition(m.x,m.y).setDepth(m.y-3).setVisible(true).setAlpha(1).fillStyle(0xff6a4a,.2).lineStyle(3,0xffbd54,.95).fillCircle(0,0,B.fissure.radius).strokeCircle(0,0,B.fissure.radius).lineBetween(-14,0,14,0).lineBetween(0,-14,0,14);});}
 }
 private render(now:number,travel:number):void{
  this.gait+=travel/22;
  const frame=this.state==='EXECUTE'?this.attackName==='cleave'?5:this.attackName==='boulders'?6:4:this.state==='TELEGRAPH'?3:travel>.1?1+Math.floor(this.gait)%2:0;
  // Painted alternating support poses; feet share a registered anchor, no body spin.
  this.body.setFrame(frame).setPosition(this.position.x,this.position.y+15).setFlipX(this.left).setRotation(0).setDepth(this.position.y).setScale(B.size/256,B.size/256*(1+Math.sin(now/650)*.006));
  if(now<this.hurtUntil)this.body.setTintFill(0xffe5bf);else this.body.clearTint();
  this.shadow.setPosition(this.position.x,this.position.y+8).setDepth(this.position.y-2);
 }
 private clear():void{this.telegraph.setVisible(false);this.marks.forEach(m=>{m.spent=true;m.view.setVisible(false)});this.shots.forEach(s=>{s.active=false;s.view.setVisible(false)});}
 hurt(now:number):void{if(this.canBeHit)this.hurtUntil=now+120;}
 suspend():void{this.stopped=true;this.clear();}
 die():void{if(this.isDead)return;this.isDead=true;this.health.current=0;this.state='DEATH';this.clear();this.body.setFrame(7).clearTint();this.cue('death');this.scene.tweens.add({targets:this.body,alpha:.58,duration:1800});this.scene.time.delayedCall(1800,this.finish);}
}
