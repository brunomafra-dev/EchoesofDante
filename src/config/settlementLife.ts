import {BASE} from './base';
import {PERMANENCE_RESIDENTS} from './permanence';
import type {Vec2} from '../utils/math';

export type NpcId='ivo'|'lia'|'nara'|'caio'|'elisa'|'mara'|'tomas';
export type NpcPose={id:NpcId;x:number;y:number;frame:number;flip:boolean;talkUntil?:number};
export type NpcDefinition={id:NpcId;name:string;role:string;position:Vec2;route?:readonly Vec2[];text?:string;service?:boolean;task?:'repair'|'inventory'};
export const NPC_SHEETS:Record<NpcId,string>={ivo:'ivo-work-r1',lia:'lia-work-r1',nara:'nara-work-r1',caio:'caio-motion-r4',elisa:'elisa-motion-r5',mara:'mara-motion-r3',tomas:'tomas-motion-r3'};
export const BASE_WORKERS:readonly NpcDefinition[]=BASE.services.map(s=>({id:s.id==='smith'?'ivo':s.id==='medic'?'lia':'nara',name:s.name.split(' · ')[0],role:'',position:{x:s.x,y:s.y},service:true}));
// Durations follow the painted task, rather than sharing the smith's strike.
// Lia prepares, examines and returns the sample; Nara consults and marks a route.
export const SERVICE_ROUTINES={
 ivo:[[0,470],[1,210],[2,260],[5,120],[3,90],[4,100],[3,120],[5,160],[1,210],[0,380]],
 lia:[[0,1600],[1,850],[2,1400],[4,900],[2,900],[1,700],[5,1000],[3,1100],[5,750],[0,1500]],
 nara:[[0,2000],[5,1100],[1,1250],[5,850],[2,1700],[3,1400],[2,1250],[4,1800],[0,1400]],
} as const;
export function serviceFrameAt(id:NpcId,time:number):number{
 if(id!=='ivo'&&id!=='lia'&&id!=='nara')return 0;
 const routine=SERVICE_ROUTINES[id],duration=routine.reduce((sum,beat)=>sum+beat[1],0);
 let phase=((time%duration)+duration)%duration;
 for(const[frame,hold]of routine){if(phase<hold)return frame;phase-=hold;}
 return routine[0][0];
}
export function firstSettlers(base:boolean):readonly NpcDefinition[]{
 return [
  {id:'caio',name:'Tio Gui',role:'Infraestrutura',position:base?{x:380,y:500}:{x:2010,y:920},task:'repair',text:base?'Estou ajustando as conexões do kit do abrigo. Quando a rota estiver pronta, levo tudo para os Terraços.':'Estou revisando as conexões deste kit do módulo. Água e energia ficam em circuitos separados; Ivo não abre mão disso.'},
  {id:'elisa',name:'Elisa',role:'Mudas da nave',position:base?{x:820,y:490}:{x:2380,y:915},route:base?[{x:820,y:490},{x:870,y:535},{x:790,y:500}]:[{x:2380,y:915},{x:2360,y:1020},{x:2300,y:1030}],text:base?'As mudas vieram da nave. Estou separando o que podemos levar para o canteiro sem misturar com as plantas de Dante.':'Estou cuidando das mudas da nave e anotando como reagem ao solo. As plantas da margem continuam separadas para a pesquisa da Lia.'},
 ];
}
export const SECOND_SETTLERS:readonly NpcDefinition[]=PERMANENCE_RESIDENTS.map((r,i)=>({id:i===0?'mara':'tomas',name:r.name,role:r.role,position:{x:r.x,y:r.y},text:r.text,task:i===0?'repair':'inventory',route:i===0?undefined:[{x:720,y:780},{x:830,y:850},{x:760,y:930}]}));
