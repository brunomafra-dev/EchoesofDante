import type {Vec2} from '../utils/math';
import {moveWithCollisions,type MovementBounds,type Obstacle} from './Movement';

export type ResidentMode='walk'|'settle'|'work'|'rise'|'talk';
const approach=(value:number,target:number,amount:number)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount);
export class ResidentMotion{
 velocity:Vec2={x:0,y:0};mode:ResidentMode='rise';phase=1;gait=0;stalled=0;yieldUntil=0;moving=0;
 constructor(readonly offset:number){}
 step(position:Vec2,target:Vec2,dt:number,stop:boolean,obstacles:readonly Obstacle[],bounds:MovementBounds,now:number):number{
  const dx=target.x-position.x,dy=target.y-position.y,d=Math.hypot(dx,dy),maxSpeed=31+this.offset%5;
  // Human starts/stops; gait advances only by actual distance, including slides.
  const speed=now<this.yieldUntil?0:stop?Math.min(maxSpeed,Math.sqrt(Math.max(0,d-1)*100)):maxSpeed;
  let x=d>.01?dx/d*speed:0,y=d>.01?dy/d*speed:0;
  // Slow near people/obstacles instead of walking in place against a collider.
  const ahead=obstacles.find(o=>{const vx=o.x-position.x,vy=o.y-position.y;return Math.hypot(vx,vy)<o.radius+38&&vx*dx+vy*dy>0});
  if(ahead&&d>18){const side=(dx*(ahead.y-position.y)-dy*(ahead.x-position.x))>0?-1:1;x+=-dy/Math.max(d,1)*15*side;y+=dx/Math.max(d,1)*15*side;const length=Math.hypot(x,y);x*=speed/Math.max(speed,length,1);y*=speed/Math.max(speed,length,1);}
  this.velocity.x=approach(this.velocity.x,x,90*dt);this.velocity.y=approach(this.velocity.y,y,90*dt);
  const before={...position};moveWithCollisions(position,this.velocity,dt,14,obstacles,bounds);
  const moved=Math.hypot(position.x-before.x,position.y-before.y);
  this.moving=dt>0?moved/dt:0;this.gait+=moved/30;this.stalled=speed>8&&moved<dt*3?this.stalled+dt:0;
  if(this.stalled>.55){this.yieldUntil=now+650+this.offset%400;this.stalled=0;}
  return moved;
 }
 brake(position:Vec2,dt:number,obstacles:readonly Obstacle[],bounds:MovementBounds):void{
  this.velocity.x=approach(this.velocity.x,0,130*dt);this.velocity.y=approach(this.velocity.y,0,130*dt);moveWithCollisions(position,this.velocity,dt,14,obstacles,bounds);
 }
 get speed():number{return Math.hypot(this.velocity.x,this.velocity.y)}
 get frame():number{
  // Select the low-clearance poses; the two exaggerated knee lifts stay unused.
  if(this.mode==='walk')return this.moving<4?8:[0,2,1,5,4,6,5,1][Math.floor(this.gait*8)%8];
  if(this.mode==='work')return [12,13,14,15,14,13][Math.floor(this.phase*5)%6];
  if(this.mode==='settle')return 8+Math.min(3,Math.floor(this.phase*4));
  if(this.mode==='rise')return 11-Math.min(3,Math.floor(this.phase*4));
  return 8;
 }
}

type Sample={time:number;x:number;y:number;frame:number;flip:boolean};
// Bounded presentation buffer only. The host still owns physics and interactions.
export class ResidentPresentation{
 private samples:Sample[]=[];private receivedAt=0;private hostAt=0;private clock=0;private renderedAt?:number;
 push(sample:Sample,localNow:number):void{
  if(!Number.isFinite(sample.time)||sample.time<=this.hostAt&&this.samples.length)return;
  this.hostAt=sample.time;this.receivedAt=localNow;this.samples.push({...sample});if(this.samples.length>12)this.samples.shift();
  if(this.samples.length===1)this.clock=sample.time;
 }
 at(localNow:number):Sample|undefined{
  if(!this.samples.length)return;
  const target=Math.min(this.hostAt,this.hostAt+Math.min(120,Math.max(0,localNow-this.receivedAt))-90);
  const elapsed=this.renderedAt===undefined?0:Math.max(0,Math.min(80,localNow-this.renderedAt));this.renderedAt=localNow;
  // Recover packet bursts by catching up gently, not by jumping the playhead.
  this.clock=Math.max(this.clock,Math.min(target,this.clock+elapsed*1.25));
  while(this.samples.length>2&&this.samples[1].time<this.clock)this.samples.shift();
  const a=this.samples[0],b=this.samples[1]??a,t=b.time>a.time?Math.max(0,Math.min(1,(this.clock-a.time)/(b.time-a.time))):1;
  return{time:this.clock,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,frame:t<.5?a.frame:b.frame,flip:t<.5?a.flip:b.flip};
 }
}
