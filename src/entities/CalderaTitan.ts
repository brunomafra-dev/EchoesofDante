import {createCreatureShadow,type CreatureShadow} from '../visual/CreatureArt';
import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inMeleeArc } from '../combat/HitDetection';
import { PLAYER } from '../config/game';
import { TITAN as B,type TitanAttack } from '../config/caldera';
import { moveWithCollisions,type Obstacle } from '../systems/Movement';
import { clamp,distance,type Vec2 } from '../utils/math';
import { TitanBasalt } from '../visual/TitanBasalt';
import type { Enemy,EnemyImpact } from './Enemy';
export type TitanCue='intro'|'warning'|'strike'|'break'|'phase'|'death';

// Host-authoritative forging cycle. Falling stones become physical shelters;
// the pressure front consumes them, leaves a shadow, then vents the chest.
export class CalderaTitan implements Enemy {
 readonly health=new Health(B.hp);readonly radius=B.radius;readonly position={...B.spawn};
 readonly body:Phaser.GameObjects.Image;readonly shadow:CreatureShadow;readonly telegraph:Phaser.GameObjects.Graphics;
 readonly attackRange=B.cleave.range;readonly basalt:TitanBasalt;
 state:'DORMANT'|'INTRO'|'IDLE'|'TELEGRAPH'|'EXECUTE'|'RECOVER'|'PHASE'|'DEATH'='DORMANT';
 phase:1|2|3=1;attackName:TitanAttack|null=null;isDead=false;
 private stopped=false;private at=0;private until=0;private index=0;private angle=0;private gait=0;private left=false;private hurtUntil=0;private guardedUntil=0;
 private origin={x:0,y:0};private victims=new Set<Vec2>();private participants?:readonly Vec2[];
 private fired=false;private waveStarted=false;private waveRadius=0;private intercepted=false;private vented=false;
 private marks:{x:number;y:number;spent:boolean;view:Phaser.GameObjects.Graphics}[];
 private rocks:Phaser.GameObjects.Image[];
 get coopObjects():Phaser.GameObjects.GameObject[]{return[this.shadow,this.body,this.telegraph,...this.marks.map(m=>m.view),...this.rocks,...this.basalt.objects];}
 get coverObstacles():Obstacle[]{return this.basalt.solids;}
 get coreExposed():boolean{const age=this.scene.time.now-this.at;return this.state==='RECOVER'&&this.vented&&age>=B.openingAt&&age<B.openingMs-B.closingMs;}
 constructor(private scene:Phaser.Scene,private cue:(cue:TitanCue)=>void,private finish:()=>void){
  this.shadow=createCreatureShadow(scene,this.position.x,this.position.y+8,174,44,0x080b0d,.5);
  this.body=scene.add.image(this.position.x,this.position.y+15,'titan-motion',0).setOrigin(.5,244/256).setDisplaySize(B.size,B.size);
  this.telegraph=scene.add.graphics().setVisible(false);
  this.marks=Array.from({length:3},()=>({x:0,y:0,spent:true,view:scene.add.graphics().setVisible(false)}));
  this.rocks=Array.from({length:3},()=>scene.add.image(0,0,'world-rock').setTint(0xffbd54).setVisible(false));
  this.basalt=new TitanBasalt(scene);
 }
 get canBeHit():boolean{return !this.isDead&&!this.stopped&&!['DORMANT','INTRO','PHASE'].includes(this.state);}
 get solid():boolean{return !this.isDead;}
 receiveStrike(now:number):number{if(!this.canBeHit)return 0;if(this.coreExposed)return B.openingDamage;this.guardedUntil=now+100;return B.armoredDamage;}
 beginIntro(now:number):void{if(this.state==='DORMANT'&&!this.stopped){this.setState('INTRO',now,2200);this.cue('intro');}}
 private setState(state:typeof this.state,now:number,ms:number):void{this.state=state;this.at=now;this.until=now+ms;}
 update(now:number,dt:number,player:Vec2,dead:boolean,obstacles:readonly Obstacle[],attack:(impact?:EnemyImpact)=>void,_bounds?:unknown,participants?:readonly Vec2[]):void{
  this.participants=participants;if(this.isDead||this.stopped)return;if(dead){this.suspend();return;}dt=Math.min(dt,.04);
  const before={...this.position};this.basalt.update(now);
  if(this.state==='DORMANT'){this.render(now,0);return;}
  if(this.state==='INTRO'||this.state==='PHASE'){if(now>=this.until)this.setState('IDLE',now,B.idleMs);}
  else{
   const next=this.health.current<=this.health.max*.3?3:this.health.current<=this.health.max*.65?2:1;
   if(next>this.phase&&this.state==='IDLE'){
    this.phase=(this.phase+1) as 2|3;this.index=0;this.attackName=null;this.clear();this.setState('PHASE',now,B.phaseMs);this.cue('phase');
   }else if(this.state==='IDLE'){
    const gap=distance(player,this.position),pattern=B.patterns[this.phase],name=pattern[this.index%pattern.length];
    if(Math.abs(player.x-this.position.x)>12)this.left=player.x<this.position.x;
    // The forged shelter arrangement stays meaningful until its pressure wave.
    if(name==='boulders'&&gap>170)moveWithCollisions(this.position,{x:(player.x-this.position.x)/gap*B.speed,y:(player.y-this.position.y)/gap*B.speed},dt,this.radius,[...obstacles,...this.coverObstacles],B.bounds);
    if(now>=this.until){this.index++;this.beginAttack(now,name,player,obstacles);}
   }else if(this.state==='TELEGRAPH'&&now>=this.until)this.setState('EXECUTE',now,B[this.attackName!].duration);
   else if(this.state==='EXECUTE'&&this.attackName){
    const elapsed=now-this.at,name=this.attackName;
    if(name==='cleave'&&!this.fired&&elapsed>=B.cleave.contact){this.fired=true;this.telegraph.setVisible(false);this.basalt.impact(0,this.origin,now,480);this.cue('strike');for(const p of this.participants??[player])if(inMeleeArc(this.origin,this.angle,p,B.cleave.range,B.cleave.halfAngle,PLAYER.radius))this.hit(attack,p,B.cleave.damage);}
    if(name==='slam'){
     if(!this.fired&&elapsed>=B.slam.contact){this.fired=true;this.telegraph.setVisible(false);this.basalt.impact(0,this.origin,now,430);this.cue('strike');for(const p of this.participants??[player])if(distance(this.origin,p)<B.slam.radius+PLAYER.radius)this.hit(attack,p,B.slam.damage);}
     if(!this.stopped&&elapsed>=B.slam.waveAt){
      if(!this.waveStarted){this.waveStarted=true;this.victims.clear();this.basalt.beginWave(this.origin);this.basalt.impact(0,this.origin,now,220);this.cue('strike');}
      const radius=Math.min(B.slam.waveEnd,B.slam.waveStart+(elapsed-B.slam.waveAt)*B.slam.waveSpeed/1000),from=this.waveRadius;
      this.intercepted=this.basalt.advanceWave(this.origin,radius,now)||this.intercepted;
      for(const p of this.participants??[player]){const gap=distance(this.origin,p),padding=PLAYER.radius+radius*6/256;if(gap>=from-padding&&gap<=radius+padding&&!this.basalt.shelters(this.origin,p))this.hit(attack,p,B.slam.waveDamage);}
      this.waveRadius=radius;
     }
    }
    if(name==='fissure'||name==='boulders')this.marks.forEach((m,i)=>{
     const config=B[name],contact=config.contact+i*config.interval;
     if(!m.spent&&elapsed>=contact){
      m.spent=true;this.victims.clear();this.cue('strike');
      if(name==='boulders')this.basalt.land(i,m,now);else this.basalt.impact(i+1,m,now,210);
      for(const p of this.participants??[player])if(distance(m,p)<config.radius+PLAYER.radius)this.hit(attack,p,config.damage);
     }
     m.view.setAlpha(m.spent?Math.max(0,1-(elapsed-contact)/300):1);
     const rock=this.rocks[i];rock.setVisible(name==='boulders'&&!m.spent);if(rock.visible){const t=clamp((elapsed-contact+240)/240,0,1);rock.setPosition(m.x,m.y-210*(1-t)).setDisplaySize(180,165).setRotation(t*1.5).setDepth(m.y+5);}
    });
    if(this.stopped)return;
    if(now>=this.until){this.vented=name==='slam'&&this.intercepted;this.clear();this.setState('RECOVER',now,this.vented?B.openingMs:B[name].recovery);if(this.vented)this.cue('break');}
   }else if(this.state==='RECOVER'&&now>=this.until){this.vented=false;this.attackName=null;this.setState('IDLE',now,B.idleMs);}
  }
  if(this.stopped)return;this.basalt.update(now);this.render(now,distance(before,this.position));
 }
 private hit(callback:(impact?:EnemyImpact)=>void,victim:Vec2,damage:number):void{if(this.stopped||this.victims.has(victim))return;this.victims.add(victim);this.render(this.scene.time.now,0);callback({damage,ranged:true,victim});}
 private beginAttack(now:number,name:TitanAttack,player:Vec2,obstacles:readonly Obstacle[]=[]):void{
  this.clear();this.vented=false;this.fired=false;this.waveStarted=false;this.waveRadius=0;this.intercepted=false;this.victims.clear();this.attackName=name;Object.assign(this.origin,this.position);this.angle=Math.atan2(player.y-this.position.y,player.x-this.position.x);
  this.left=Math.cos(this.angle)<0;this.setState('TELEGRAPH',now,B[name].tell);this.cue('warning');
  const g=this.telegraph.clear().setPosition(this.origin.x,this.origin.y).setRotation(this.angle).setDepth(this.position.y-3).setAlpha(1).setVisible(true).fillStyle(0xff6a4a,.18).lineStyle(3,0xffbd54,.95);
  if(name==='cleave')g.beginPath().moveTo(0,0).arc(0,0,B.cleave.range,-B.cleave.halfAngle,B.cleave.halfAngle,false).closePath().fillPath().strokePath();
  else if(name==='slam')g.fillCircle(0,0,B.slam.radius).strokeCircle(0,0,B.slam.radius).lineBetween(-20,0,20,0).lineBetween(0,-20,0,20);
  else{
   g.setVisible(false);if(name==='boulders')this.basalt.clear();
   this.marks.forEach((m,i)=>{
    if(name==='boulders'){
     // Keep every marked landing outside the body and existing solid scenery.
     const angle=this.angle+(i-1)*B.cover.spread,candidates:Vec2[]=[];
     for(const offset of [0,.25,-.25,.5,-.5,1,-1,Math.PI])for(const radius of [B.cover.distance,310,360,190])candidates.push({x:clamp(this.origin.x+Math.cos(angle+offset)*radius,B.bounds.left+85,B.bounds.right-85),y:clamp(this.origin.y+Math.sin(angle+offset)*radius,B.bounds.top+85,B.bounds.bottom-85)});
     for(let x=B.bounds.left+85;x<B.bounds.right-85;x+=110)for(let y=B.bounds.top+85;y<B.bounds.bottom-85;y+=110)candidates.push({x,y});
     const point=candidates.find(point=>distance(point,this.origin)>this.radius+B.cover.radius+35&&obstacles.every(o=>distance(point,o)>o.radius+B.cover.radius+15)&&this.marks.slice(0,i).every(o=>distance(point,o)>B.cover.radius*2+20))!;
     m.x=point.x;m.y=point.y;
    }else{m.x=clamp(player.x+(i===0?0:i===1?-145:145),B.bounds.left+90,B.bounds.right-90);m.y=clamp(player.y+(i===0?0:i===1?85:-85),B.bounds.top+90,B.bounds.bottom-90);}
    m.spent=false;const r=B[name].radius;m.view.clear().setPosition(m.x,m.y).setDepth(-20).setVisible(true).setAlpha(1).fillStyle(0xff6a4a,.2).lineStyle(3,0xffbd54,.95).fillCircle(0,0,r).strokeCircle(0,0,r);for(let n=0;n<=i;n++)m.view.lineBetween(-i*8+n*16,-16,-i*8+n*16,0);
   });
  }
 }
 private render(now:number,travel:number):void{
  this.gait+=travel/22;const age=now-this.at;
  const winding=this.state==='EXECUTE'&&this.attackName&&age<B[this.attackName].contact;
  const frame=this.vented?6:winding?3:this.state==='EXECUTE'?this.attackName==='cleave'?5:this.attackName==='boulders'?6:4:this.state==='TELEGRAPH'?3:travel>.1?1+Math.floor(this.gait)%2:0;
  this.body.setFrame(frame).setPosition(this.position.x,this.position.y+15).setFlipX(this.left).setRotation(0).setDepth(this.position.y).setScale(B.size/256);
  if(now<this.hurtUntil)this.body.setTintFill(0xffe5bf);else if(this.vented&&age>=B.openingAt&&age<B.openingMs-B.closingMs)this.body.setTint(0xffe5a9);else if(now<this.guardedUntil)this.body.setTint(0xc9b9a1);else this.body.clearTint();
  this.shadow.setPosition(this.position.x,this.position.y+8).setDepth(this.position.y-2);
 }
 private clear():void{this.telegraph.setVisible(false);this.marks.forEach(m=>{m.spent=true;m.view.setVisible(false)});this.rocks.forEach(r=>r.setVisible(false));this.basalt.endWave();}
 hurt(now:number):void{if(this.canBeHit)this.hurtUntil=now+120;}
 suspend():void{this.stopped=true;this.vented=false;this.clear();this.basalt.clear();}
 die():void{if(this.isDead)return;this.isDead=true;this.vented=false;this.health.current=0;this.state='DEATH';this.clear();this.basalt.clear();this.body.setFrame(7).clearTint();this.cue('death');this.scene.tweens.add({targets:this.body,alpha:.58,duration:1800});this.scene.time.delayedCall(1800,this.finish);}
}
