import type {Vec2} from '../utils/math';
import type {Obstacle,MovementBounds} from '../systems/Movement';
import {moveWithCollisions} from '../systems/Movement';

export const WIND_SURVEY={start:{x:2420,y:810},dock:{x:2710,y:770},read:{x:2660,y:770},radius:24,speed:100,dockRadius:23,
 bounds:{left:2330,right:2790,top:695,bottom:880} satisfies MovementBounds} as const;
export type SurveyPusher={position:Vec2;velocity?:Vec2;isDead:boolean;isDashing?:boolean;rotation?:number;walkSpeedLimit?:number};
export function surveyContact(position:Vec2,a:SurveyPusher):boolean{
 if(a.isDead||a.isDashing||!a.velocity||![a.position.x,a.position.y,a.velocity.x,a.velocity.y].every(Number.isFinite))return false;
 const dx=position.x-a.position.x,dy=position.y-a.position.y,d=Math.hypot(dx,dy),speed=Math.hypot(a.velocity.x,a.velocity.y);
 return d>0&&d<57&&speed>20&&(dx*a.velocity.x+dy*a.velocity.y)/(d*speed)>.45;
}
export function pushSurvey(position:Vec2,actors:readonly SurveyPusher[],dt:number,solids:readonly Obstacle[],geometry:{radius:number;speed:number;bounds:MovementBounds}=WIND_SURVEY):boolean{
 const candidates=actors.filter(a=>surveyContact(position,a)).map(a=>{
  const dx=position.x-a.position.x,dy=position.y-a.position.y,d=Math.hypot(dx,dy),speed=Math.hypot(a.velocity!.x,a.velocity!.y);
  return{a,dx,dy,d,speed,toward:speed&&d?(dx*a.velocity!.x+dy*a.velocity!.y)/(speed*d):0};
 }).filter(c=>c.d<57&&c.speed>20&&c.toward>.45).sort((a,b)=>a.d-b.d);
 if(!candidates.length||!Number.isFinite(dt)||dt<=0)return false;
 // Contact decides who can push; actual walking direction steers the support.
 // Radial force amplified tiny contact offsets and made straight pushes drift.
 const force=candidates.reduce((sum,p)=>({x:sum.x+p.a.velocity!.x/p.speed,y:sum.y+p.a.velocity!.y/p.speed}),{x:0,y:0}),length=Math.hypot(force.x,force.y);
 if(length<.01)return false;
 const before={...position},speed=Math.min(geometry.speed,...candidates.map(p=>p.speed))*Math.min(1,length/candidates.length);
 moveWithCollisions(position,{x:force.x/length*speed,y:force.y/length*speed},Math.min(.04,dt),geometry.radius,solids,geometry.bounds);
 return Math.hypot(position.x-before.x,position.y-before.y)>.01;
}
export function surveyDocked(position:Vec2):boolean{return Number.isFinite(position.x)&&Number.isFinite(position.y)&&Math.hypot(position.x-WIND_SURVEY.dock.x,position.y-WIND_SURVEY.dock.y)<=WIND_SURVEY.dockRadius;}
