import {BASE_WORKERS,SECOND_SETTLERS,firstSettlers,type NpcDefinition} from './settlementLife';
import type {MissionId} from './missions';
import type {JourneyArea} from '../systems/LocalJourney';

export const NPC_REVIEW_STOPS=[
 {id:'base',name:'Base · serviços',area:'base',stage:'settle-water',x:650,y:780,note:'Warden e sete relatórios até o primeiro abrigo simulados. Ivo, Dra. Lia e Nara estão na base; Tio Gui e Elisa já se mudaram.'},
 {id:'departure',name:'Base · antes da mudança',area:'base',stage:'shelter',x:600,y:600,note:'Warden e seis relatórios simulados. Primeiro abrigo ainda pendente; Tio Gui e Elisa aguardam a mudança na base.'},
 {id:'camp',name:'Terraços · primeiro abrigo',area:'terraces',stage:'settle-water',x:2140,y:1110,note:'Warden e sete relatórios simulados. Primeiro abrigo instalado; Tio Gui e Elisa cuidam do acampamento. Capítulos seguintes pendentes.'},
 {id:'arrivals',name:'Terraços · segundo alojamento',area:'terraces',stage:'settle-arrivals',x:600,y:1100,note:'Warden, sete relatórios e quatro capítulos da permanência simulados. Baliza, manifesto, segundo alojamento e recepção de Mara/Choco preparados; relatório final da chegada pendente, sem sua recompensa.'},
] as const satisfies readonly {id:string;name:string;area:JourneyArea;stage:MissionId;x:number;y:number;note:string}[];
export type NpcReviewStop=typeof NPC_REVIEW_STOPS[number];
export function npcReviewLab():boolean{return location.pathname.split('/').pop()==='campaign-playtest.html'&&new URLSearchParams(location.search).has('npc-review');}
export function npcReviewPeople(stop:NpcReviewStop):readonly NpcDefinition[]{return stop.id==='base'?BASE_WORKERS:stop.id==='departure'?firstSettlers(true):stop.id==='camp'?firstSettlers(false):SECOND_SETTLERS;}
export function npcReviewSelection(id:string|null,npc?:string|null){const stop=NPC_REVIEW_STOPS.find(s=>s.id===id);if(!stop)return;return{stop,focus:npcReviewPeople(stop).find(n=>n.id===npc)};}
