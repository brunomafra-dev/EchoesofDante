import Phaser from 'phaser';
import { XENOBINDER as X } from '../config/classes';
import type { AbilityUpgradeId } from '../config/abilityUpgrades';
import type { Enemy } from '../entities/Enemy';
import { moveWithCollisions,type MovementBounds,type Obstacle } from '../systems/Movement';
import { inShockwaveSweep } from './HitDetection';
import { distance,type Vec2 } from '../utils/math';

export type LinkedAlly={position:Vec2;health:{current:number;max:number};isDead:boolean};
type Hit=(enemy:Enemy,damage:number,angle:number,origin:Vec2,heavy:boolean)=>void;
type State='FOLLOW'|'ASSIST'|'COMMAND'|'RETURN';
export type XenobinderPose={bond:number;active:boolean;state:State;owner:Vec2;pet:Vec2&{frame:number;flip:boolean};
 shots:{x:number;y:number;angle:number}[];mark?:Vec2;pulse?:Vec2&{radius:number;alpha:number};heals:{x:number;y:number;amount:number}[];linked:boolean};

// One original companion and fixed presentation pools per actor. Visitors render snapshots.
export class XenobinderCombat {
 bond:number=X.bondInitial;firedUntil=0;state:State='FOLLOW';active=true;
 readonly position:Vec2;
 private lastShot=-Infinity;private lastBite=-Infinity;private biteUntil=0;private markUntil=0;private marked?:Enemy;
 private goal?:Vec2;private commandLevel=0;private commandHits=new Set<Enemy>();private travelled=0;
 private gait=0;private frame=0;private flip=false;private charging=false;private owner={x:0,y:0};private stalled=0;
 private pulse?:Vec2;private pulseRemaining=0;private heals:{x:number;y:number;amount:number}[]=[];
 private shots=Array.from({length:6},()=>({x:0,y:0,angle:0,travel:0,active:false,offset:{x:0,y:0}}));
 readonly body:Phaser.GameObjects.Image;readonly shadow:Phaser.GameObjects.Ellipse;
 private pulseView:Phaser.GameObjects.Image;private linkView:Phaser.GameObjects.Image;private markView:Phaser.GameObjects.Ellipse;
 private shotViews:Phaser.GameObjects.Image[];private healViews:Phaser.GameObjects.Text[];
 constructor(scene:Phaser.Scene,private rank:(id:AbilityUpgradeId)=>number,origin:Vec2){
  this.position={x:origin.x-55,y:origin.y+40};this.owner={...origin};
  this.body=scene.add.image(this.position.x,this.position.y+10,'dante-symbiont-motion',0).setOrigin(.5,244/256).setDisplaySize(X.companionSize,X.companionSize);
  this.shadow=scene.add.ellipse(this.position.x,this.position.y+8,55,16,0x05120e,.48);
  this.pulseView=scene.add.image(0,0,'xeno-pulse').setVisible(false);this.linkView=scene.add.image(0,0,'xeno-link').setOrigin(0,.5).setVisible(false);
  this.markView=scene.add.ellipse(0,0,36,17,0x6bb464,.12).setStrokeStyle(2,0x6bb464,.8).setVisible(false);
  this.shotViews=Array.from({length:6},()=>scene.add.image(0,0,'xeno-bolt').setVisible(false));
  this.healViews=Array.from({length:4},()=>scene.add.text(0,0,'',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#a6dc94',stroke:'#10251b',strokeThickness:2}).setOrigin(.5).setVisible(false));
 }
 get canCharge():boolean{return this.active&&this.bond>=X.commandCost&&this.state!=='COMMAND';}
 fire(now:number,origin:Vec2,angle:number,offset:Vec2={x:0,y:0}):boolean{
  if(now-this.lastShot<X.shotCooldown)return false;const shot=this.shots.find(s=>!s.active);if(!shot)return false;
  Object.assign(shot,origin,{angle,offset,travel:0,active:true});this.lastShot=now;this.firedUntil=now+180;return true;
 }
 command(now:number,origin:Vec2,angle:number,level:number,obstacles:readonly Obstacle[],bounds?:MovementBounds):boolean{
  if(!this.canCharge)return false;this.bond-=X.commandCost;this.commandLevel=level;this.commandHits.clear();
  let range=X.commandRange+X.chargedRange*level;const c=Math.cos(angle),s=Math.sin(angle);
  for(const o of obstacles)range=Math.min(range,Math.max(0,this.entry(origin,angle,o,o.radius+X.companionRadius)-4));
  if(bounds){if(c>.001)range=Math.min(range,(bounds.right-20-origin.x)/c);if(c<-.001)range=Math.min(range,(bounds.left+20-origin.x)/c);if(s>.001)range=Math.min(range,(bounds.bottom-20-origin.y)/s);if(s<-.001)range=Math.min(range,(bounds.top+20-origin.y)/s);}
  this.goal={x:origin.x+c*Math.max(0,range),y:origin.y+s*Math.max(0,range)};this.state='COMMAND';this.travelled=0;this.stalled=0;this.marked=undefined;this.firedUntil=now+220;return true;
 }
 private entry(origin:Vec2,angle:number,p:Vec2,radius:number):number{
  const dx=p.x-origin.x,dy=p.y-origin.y,c=Math.cos(angle),s=Math.sin(angle),along=dx*c+dy*s,across=-dx*s+dy*c;
  if(Math.abs(across)>radius||along+radius<0)return Infinity;
  return Math.max(0,along-Math.sqrt(radius*radius-across*across));
 }
 private blocked(a:Vec2,b:Vec2,obstacles:readonly Obstacle[],padding=0):boolean{
  const length=distance(a,b),angle=Math.atan2(b.y-a.y,b.x-a.x);return obstacles.some(o=>this.entry(a,angle,o,o.radius+padding)<Math.max(0,length-2));
 }
 update(now:number,dt:number,owner:Vec2,aim:number,dead:boolean,targets:readonly Enemy[],obstacles:readonly Obstacle[],bounds:MovementBounds|undefined,hit:Hit,allies:readonly LinkedAlly[],charging=false,solidObstacles:readonly Obstacle[]=obstacles):void{
  dt=Math.min(dt,.04);this.owner={...owner};this.charging=charging;
  if(dead){this.dormant();return;}if(!this.active){this.active=true;Object.assign(this.position,{x:owner.x-55,y:owner.y+40});}
  moveWithCollisions(this.position,{x:0,y:0},0,X.companionRadius,solidObstacles,bounds);
  this.pulseRemaining=Math.max(0,this.pulseRemaining-dt);if(!this.pulseRemaining){this.pulse=undefined;this.heals=[];}
  for(const shot of this.shots)if(shot.active){
   const step=Math.min(X.shotSpeed*dt,X.shotRange+this.rank('saberReach')*40-shot.travel);let first=step+1,target:Enemy|undefined;
   for(const o of obstacles)first=Math.min(first,this.entry(shot,shot.angle,o,o.radius+5));
   for(const e of targets)if(!e.isDead){const at=this.entry(shot,shot.angle,e.position,e.radius+5);if(at<first){first=at;target=e;}}
   if(target&&first<=step){const hp=target.health.current;hit(target,X.shotDamage+this.rank('saberArc')*3,shot.angle,owner,false);if(target.health.current<hp){this.bond=Math.min(X.bondMax,this.bond+X.bondPerHit);this.marked=target;this.markUntil=now+X.markDuration;}}
   shot.x+=Math.cos(shot.angle)*step;shot.y+=Math.sin(shot.angle)*step;shot.travel+=step;
   if(first<=step||shot.travel>=X.shotRange+this.rank('saberReach')*40||bounds&&(shot.x<bounds.left||shot.x>bounds.right||shot.y<bounds.top||shot.y>bounds.bottom))shot.active=false;
  }
  if(this.marked&&(this.marked.isDead||now>this.markUntil||!targets.includes(this.marked)||distance(owner,this.marked.position)>500))this.marked=undefined;
  const before={...this.position};
  if(this.state==='COMMAND'&&this.goal){
   const angle=Math.atan2(this.goal.y-this.position.y,this.goal.x-this.position.x),length=distance(this.position,this.goal);
   moveWithCollisions(this.position,{x:Math.cos(angle)*X.commandSpeed,y:Math.sin(angle)*X.commandSpeed},Math.min(dt,length/X.commandSpeed),X.companionRadius,solidObstacles,bounds);
   const travelled=distance(before,this.position);this.travelled+=travelled;this.stalled=travelled<1?this.stalled+dt:0;
   for(const e of targets)if(!e.isDead&&!this.commandHits.has(e)&&inShockwaveSweep(before,angle,e.position,0,Math.max(travelled,1),X.commandWidth+this.rank('chargeWidth')*6,0,e.radius)&&!this.blocked(before,e.position,obstacles)){
    this.commandHits.add(e);hit(e,Math.round(X.commandDamage+X.chargedDamage*this.commandLevel+this.rank('chargePower')*8),angle,before,true);
   }
   if(length<12||this.stalled>.16||this.travelled>680){this.state='RETURN';this.goal=undefined;this.pulse={...this.position};this.pulseRemaining=.65;this.heals=[];
    for(const ally of allies)if(!ally.isDead&&ally.health.current>0&&distance(this.position,ally.position)<=X.pulseRadius&&!this.blocked(this.position,ally.position,obstacles)){
     const amount=Math.min(ally.health.max-ally.health.current,Math.round(ally.health.max*(X.healBase+X.healCharged*this.commandLevel)));
     if(amount>0){ally.health.current+=amount;this.heals.push({...ally.position,amount});}
    }
   }
  }else if(this.marked&&!charging&&this.pulseRemaining<=0){
   this.state='ASSIST';const target=this.marked,gap=distance(this.position,target.position);
   if(gap>X.biteRange+target.radius)this.approach(target.position,dt,X.followSpeed,solidObstacles,bounds);
   else if(now-this.lastBite>=X.biteCooldown&&!this.blocked(this.position,target.position,obstacles)){
    this.lastBite=now;this.biteUntil=now+180;const hp=target.health.current,angle=Math.atan2(target.position.y-this.position.y,target.position.x-this.position.x);
    hit(target,X.biteDamage+this.rank('saberArc')*3,angle,this.position,false);if(target.health.current<hp)this.bond=Math.min(X.bondMax,this.bond+X.bondPerAssist);
   }
  }else{
   const goal={x:owner.x-Math.cos(aim)*X.followDistance,y:owner.y-Math.sin(aim)*X.followDistance+22};
   if(distance(this.position,goal)>24)this.approach(goal,dt,X.followSpeed,solidObstacles,bounds);else this.state='FOLLOW';
   // Recover a remote/offscreen companion only in quiet traversal, never through combat.
   if(distance(owner,this.position)>550&&!targets.some(e=>!e.isDead&&distance(e.position,owner)<300)){
    for(const offset of [[-55,40],[55,40],[0,70],[0,-70]]){const p={x:owner.x+offset[0],y:owner.y+offset[1]};if((!bounds||p.x>bounds.left+20&&p.x<bounds.right-20&&p.y>bounds.top+20&&p.y<bounds.bottom-20)&&solidObstacles.every(o=>distance(o,p)>o.radius+X.companionRadius+2)){Object.assign(this.position,p);break;}}
   }
  }
  const moved=distance(before,this.position);this.gait+=Math.min(moved,32)/18;
  const facing=this.goal?this.goal.x-this.position.x:this.marked?this.marked.position.x-this.position.x:owner.x-this.position.x;if(Math.abs(facing)>5)this.flip=facing<0;
  this.frame=this.state==='COMMAND'?5:this.pulseRemaining>.35?6:charging?4:now<this.biteUntil?3:moved>.1&&moved<32?1+Math.floor(this.gait)%2:0;
  this.render(this.snapshot(),1);
 }
 private approach(goal:Vec2,dt:number,speed:number,obstacles:readonly Obstacle[],bounds?:MovementBounds):void{
  const angle=Math.atan2(goal.y-this.position.y,goal.x-this.position.x),length=distance(goal,this.position),probe=Math.min(38,length);
  let best=angle,score=Infinity;
  for(const turn of [0,.65,-.65,1.15,-1.15,Math.PI/2,-Math.PI/2,2,-2]){
   const a=angle+turn,p={x:this.position.x+Math.cos(a)*probe,y:this.position.y+Math.sin(a)*probe};
   if(bounds&&(p.x<bounds.left+16||p.x>bounds.right-16||p.y<bounds.top+16||p.y>bounds.bottom-16)||obstacles.some(o=>distance(o,p)<o.radius+X.companionRadius+3))continue;
   const cost=distance(p,goal)+Math.abs(turn)*2;if(cost<score){score=cost;best=a;}if(turn===0)break;
  }
  moveWithCollisions(this.position,{x:Math.cos(best)*speed,y:Math.sin(best)*speed},Math.min(dt,length/speed),X.companionRadius,obstacles,bounds);
 }
 snapshot():XenobinderPose{return{bond:this.bond,active:this.active,state:this.state,owner:{...this.owner},pet:{...this.position,frame:this.frame,flip:this.flip},
  linked:this.charging||this.state==='COMMAND',mark:this.marked&&!this.marked.isDead?{...this.marked.position}:undefined,
  shots:this.shots.filter(s=>s.active&&s.travel>=X.muzzleDistance).map(s=>({x:s.x+s.offset.x,y:s.y+s.offset.y,angle:s.angle})),
  pulse:this.pulse?{...this.pulse,radius:X.pulseRadius,alpha:this.pulseRemaining/.65}:undefined,heals:this.heals.slice(0,4)};}
 render(pose?:XenobinderPose,dt=.016):void{
  const active=!!pose?.active;this.body.setVisible(active);this.shadow.setVisible(active);
  if(pose&&active){const gap=distance(this.body,pose.pet),t=gap>300?1:Math.min(1,dt*20);const x=Phaser.Math.Linear(this.body.x,pose.pet.x,t),y=Phaser.Math.Linear(this.body.y-10,pose.pet.y,t);
   this.body.setPosition(x,y+10).setFrame(pose.pet.frame).setFlipX(pose.pet.flip).setRotation(0).setDepth(y+1);this.shadow.setPosition(x,y+8).setDepth(y-2);
  }
  this.shotViews.forEach((v,i)=>{const s=pose?.shots[i];v.setVisible(active&&!!s);if(s)v.setPosition(s.x,s.y).setRotation(s.angle).setDisplaySize(47,19).setDepth(s.y+5)});
  this.linkView.setVisible(active&&!!pose?.linked);if(pose?.linked){const angle=Math.atan2(pose.pet.y-pose.owner.y,pose.pet.x-pose.owner.x);this.linkView.setPosition(pose.owner.x,pose.owner.y).setDisplaySize(distance(pose.owner,pose.pet),8).setRotation(angle).setAlpha(.45).setDepth(Math.max(pose.pet.y,pose.owner.y)+1);}
  this.markView.setVisible(active&&!!pose?.mark);if(pose?.mark)this.markView.setPosition(pose.mark.x,pose.mark.y+8).setDepth(pose.mark.y-2);
  this.pulseView.setVisible(active&&!!pose?.pulse);if(pose?.pulse){const p=pose.pulse;this.pulseView.setPosition(p.x,p.y).setDisplaySize(p.radius*2,p.radius*1.15).setDepth(p.y-3).setAlpha(p.alpha);}
  this.healViews.forEach((v,i)=>{const h=pose?.heals[i];v.setVisible(active&&!!h);if(h)v.setText(`+${h.amount} VIDA`).setPosition(h.x,h.y-54).setDepth(h.y+10000).setAlpha(pose?.pulse?.alpha??0)});
 }
 clear():void{this.marked=undefined;this.goal=undefined;this.state='RETURN';this.pulse=undefined;this.pulseRemaining=0;this.heals=[];this.commandHits.clear();this.shots.forEach(s=>s.active=false);this.charging=false;this.render(this.snapshot());}
 dormant():void{this.clear();this.active=false;this.render();}
 destroy():void{this.body.destroy();this.shadow.destroy();this.pulseView.destroy();this.linkView.destroy();this.markView.destroy();this.shotViews.forEach(v=>v.destroy());this.healViews.forEach(v=>v.destroy());}
}
