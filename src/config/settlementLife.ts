import {BASE} from './base';
import {PERMANENCE_RESIDENTS} from './permanence';
import type {Vec2} from '../utils/math';

export type NpcId='ivo'|'lia'|'nara'|'caio'|'elisa'|'mara'|'tomas';
export type NpcPose={id:NpcId;x:number;y:number;frame:number;flip:boolean;talkUntil?:number};
export type NpcDefinition={id:NpcId;name:string;role:string;position:Vec2;route?:readonly Vec2[];text?:string;service?:boolean};
export const NPC_SHEETS:Record<NpcId,string>={ivo:'ivo-work-r1',lia:'lia-work-r1',nara:'nara-work-r1',caio:'caio-motion-r2',elisa:'elisa-motion-r3',mara:'mara-motion-r1',tomas:'tomas-motion-r1'};
export const BASE_WORKERS:readonly NpcDefinition[]=BASE.services.map(s=>({id:s.id==='smith'?'ivo':s.id==='medic'?'lia':'nara',name:s.name.split(' · ')[0],role:'',position:{x:s.x,y:s.y},service:true}));
export function firstSettlers(base:boolean):readonly NpcDefinition[]{
 return [
  {id:'caio',name:'Tio Gui',role:'Infraestrutura',position:base?{x:380,y:500}:{x:2010,y:920},route:base?[{x:380,y:500},{x:300,y:495},{x:330,y:510}]:[{x:2010,y:920},{x:1920,y:880},{x:1900,y:815}],text:base?'Separei as ferramentas para o primeiro abrigo. Quando a rota estiver pronta, levo tudo para os Terraços.':'Estou conferindo as conexões do módulo. Água e energia ficam em circuitos separados; Ivo não abre mão disso.'},
  {id:'elisa',name:'Elisa',role:'Mudas da nave',position:base?{x:820,y:490}:{x:2380,y:915},route:base?[{x:820,y:490},{x:870,y:535},{x:790,y:500}]:[{x:2380,y:915},{x:2360,y:1020},{x:2300,y:1030}],text:base?'As mudas vieram da nave. Estou separando o que podemos levar para o canteiro sem misturar com as plantas de Dante.':'Estou cuidando das mudas da nave e anotando como reagem ao solo. As plantas da margem continuam separadas para a pesquisa da Lia.'},
 ];
}
export const SECOND_SETTLERS:readonly NpcDefinition[]=PERMANENCE_RESIDENTS.map((r,i)=>({id:i===0?'mara':'tomas',name:r.name,role:r.role,position:{x:r.x,y:r.y},text:r.text,route:i===0?[{x:450,y:820},{x:420,y:930},{x:450,y:1020}]:[{x:720,y:780},{x:830,y:850},{x:760,y:930}]}));
