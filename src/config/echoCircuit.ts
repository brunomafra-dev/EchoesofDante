import type {Vec2} from '../utils/math';
import type {MissionEvidence} from './missions';

export const ECHO_CIRCUIT={
 source:{x:5670,y:900},a:{x:5790,y:700},b:{x:5960,y:800},sink:{x:5840,y:870},radius:68,speed:420,
} as const;
export type CircuitNode='source'|'a'|'b';
export type CircuitPulse={at:number;path:Vec2[];success:boolean};
export const circuitFlags=(node:'a'|'b')=>[`pr-${node}-1`,`pr-${node}-2`] as const;
export function circuitTurn(node:'a'|'b',has:(id:MissionEvidence)=>boolean):number{const [one,two]=circuitFlags(node);return has(two)?2:has(one)?1:0;}
export function circuitTarget(node:'a'|'b',turn:number):Vec2{
 const p=ECHO_CIRCUIT[node];
 if(node==='a')return turn===2?ECHO_CIRCUIT.b:turn===1?{x:p.x-140,y:p.y-100}:ECHO_CIRCUIT.source;
 return turn===1?ECHO_CIRCUIT.sink:turn===2?ECHO_CIRCUIT.a:{x:p.x+50,y:p.y-125};
}
export function circuitPath(a:number,b:number):{path:Vec2[];success:boolean}{
 const path:Vec2[]=[ECHO_CIRCUIT.source,ECHO_CIRCUIT.a,circuitTarget('a',a)];
 if(a!==2)return{path,success:false};
 path.push(circuitTarget('b',b));return{path,success:b===1};
}
export const circuitLength=(path:readonly Vec2[])=>path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-path[i].x,p.y-path[i].y),0);
export function circuitPoint(path:readonly Vec2[],travelled:number):Vec2{
 for(let i=1;i<path.length;i++){const p=path[i-1],q=path[i],length=Math.hypot(q.x-p.x,q.y-p.y);if(travelled<=length){const t=Math.max(0,travelled)/Math.max(1,length);return{x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t};}travelled-=length;}
 return path.at(-1)??ECHO_CIRCUIT.source;
}
