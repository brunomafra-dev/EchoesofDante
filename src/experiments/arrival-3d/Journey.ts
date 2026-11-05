import {Missions,validMissions,type MissionSnapshot} from '../../systems/Missions';
import {MISSIONS,SURVEY_POINTS,missionById,type MissionId,type MissionEvidence} from '../../config/missions';
import {REGIONAL_SITES,REGIONAL_RESIDENTS,EARLY_ROUTE_RESIDENTS} from '../../config/regionalExpeditions';
import {CAVERN_ENTRY,CAVERN_DEPTH_OPENING,DEEP_AREA,CAVERN_HOLLOWS,DEEP_HOLLOWS} from '../../config/cavern';
import {EXPANSION,EXPANSION_ENCOUNTERS} from '../../config/expansion';
import {WARDEN_PREPARATION} from '../../config/wardenPreparation';
import type {Trial,Zone} from './model';

export const QUEST_IDS:MissionId[]=['recon','survival','signal','beyond','exp-forest','exp-cavern'];
export const QUESTS=MISSIONS.filter(m=>QUEST_IDS.includes(m.id));
export const SITES=REGIONAL_SITES.filter(s=>s.area==='forest'||s.area==='cavern');
export type JourneyState={schema:1;missions:MissionSnapshot;receipts:MissionId[];credits:number;spent:number;tracked?:MissionId|null;depth:boolean;deepSignal:boolean;fragment:boolean;firstEcho:boolean;gate:boolean;warden:boolean;checkpoint:'entry'|'depth'|'exterior'|'echo'};
export const newJourney=():JourneyState=>({schema:1,missions:validMissions(null),receipts:[],credits:0,spent:0,depth:false,deepSignal:false,fragment:false,firstEcho:false,gate:false,warden:false,checkpoint:'entry'});
export function validJourney(raw:unknown,passage:boolean):JourneyState{
 const d=raw as Partial<JourneyState>|undefined,j=newJourney();
 if(d?.schema!==1)return j;
 const m=validMissions(d.missions);j.missions={schema:1,accepted:m.accepted.filter(id=>QUEST_IDS.includes(id)),completed:m.completed.filter(id=>QUEST_IDS.includes(id)),evidence:m.evidence.filter(id=>QUESTS.some(q=>q.goals.some(g=>g.id===id)))};
 j.receipts=Array.isArray(d.receipts)?[...new Set(d.receipts.filter(id=>j.missions.completed.includes(id)))]:[];
 // Credits are receipts, not a client-supplied balance. No reward is written to the 2D save.
 const earned=j.receipts.reduce((n,id)=>n+missionById(id).credits,0);j.spent=typeof d.spent==='number'&&Number.isInteger(d.spent)?Math.max(0,Math.min(earned,d.spent)):0;j.credits=earned-j.spent;
 j.tracked=d.tracked===null?null:QUEST_IDS.includes(d.tracked as MissionId)?d.tracked:undefined;
 j.depth=passage&&d.depth===true;j.deepSignal=j.depth&&d.deepSignal===true;j.fragment=j.deepSignal&&d.fragment===true;j.firstEcho=j.fragment&&d.firstEcho===true;j.gate=j.firstEcho&&d.gate===true;j.warden=j.gate&&d.warden===true;
 j.missions.evidence=j.missions.evidence.filter(id=>id!=='warden'||j.warden).filter(id=>id!=='first-echo'||j.firstEcho);if(!j.warden)j.missions.completed=j.missions.completed.filter(id=>id!=='beyond');j.receipts=j.receipts.filter(id=>j.missions.completed.includes(id));const total=j.receipts.reduce((n,id)=>n+missionById(id).credits,0);j.spent=Math.min(j.spent,total);j.credits=total-j.spent;
 j.checkpoint=j.firstEcho?'echo':j.fragment?'exterior':j.depth?'depth':'entry';return j;
}
export const CAVE={entry:CAVERN_ENTRY,depth:CAVERN_DEPTH_OPENING,signal:{x:DEEP_AREA.signalX,y:DEEP_AREA.signalY},continuation:DEEP_AREA.end,fragment:EXPANSION.fragment,echo:WARDEN_PREPARATION.echo,threshold:WARDEN_PREPARATION.threshold};
export const ZONE_NAMES:Record<Zone,string>={base:'Acampamento de pouso',forest:'Floresta de Dante',cavern:'Cavernas de Dante',warden:'Domínio do Guardião'};
export type Target={zone:Zone;x:number;y:number;name:string;instruction:string;radius?:number};
const npcIndex={medic:0,smith:1,expedition:2};
const npcPoints=[{x:320,y:700,name:'Dra. Lia'},{x:760,y:690,name:'Ivo'},{x:1000,y:465,name:'Nara'}];
export function missionEngine(trial:Trial){const m=new Missions();m.restore(trial.journey.missions);m.tracked=trial.journey.tracked;return m;}
export function currentQuest(m:Missions):MissionId|undefined{
 if(m.tracked===null)return;
 if(m.tracked&&QUEST_IDS.includes(m.tracked)&&['active','ready','available'].includes(m.status(m.tracked)))return m.tracked;
 return QUEST_IDS.find(id=>['active','ready'].includes(m.status(id)))??QUEST_IDS.find(id=>m.status(id)==='available');
}
export function questTarget(t:Trial,m:Missions):Target|undefined{
 const id=currentQuest(m);if(!id)return exploration(t);
 const q=missionById(id),status=m.status(id);
 if(status==='ready'||status==='available')return{zone:'base',...npcPoints[npcIndex[q.npc]],instruction:status==='ready'?'Converse para entregar o relatório.':'Converse para aceitar a missão.'};
 const missing=q.goals.filter(g=>!m.has(g.id));
 if(id==='recon'||id==='survival'){const g=missing[0],p=SURVEY_POINTS.find(p=>p.id===g?.id);if(p)return{zone:'forest',...p,name:g.label,instruction:p.kind==='walk'?'Explore a área indicada.':'Aproxime-se e analise com E / A.'};}
 if(id==='signal')return exploration(t);
 if(id==='beyond')return t.journey.firstEcho?{zone:'warden',x:1170,y:735,name:'O Warden',instruction:t.journey.warden?'Retorne a Nara.':'Atravesse o limiar e enfrente o guardião.'}:exploration(t);
 const site=SITES.find(s=>s.id===missing[0]?.id);if(site)return{zone:site.area as Zone,...site,instruction:'Analise a descoberta com E / A.'};
}
export function exploration(t:Trial):Target|undefined{
 if(t.zone==='base')return{zone:'forest',x:790,y:920,name:'Floresta de Dante',instruction:'Siga pela saída a leste.'};
 if(!t.mechanism){const points=[{id:'northern-ruin',x:1500,y:285,name:'Ruína do norte'},{id:'mineral-signal',x:1870,y:995,name:'Sinal mineral'},{id:'unknown-trace',x:560,y:620,name:'Vestígio entre as raízes'}];const p=points.find(p=>!t.echoes.includes(p.id));if(p)return{zone:'forest',...p,instruction:'Analise o vestígio com E / A.'};return{zone:'forest',x:t.source?1670:1870,y:t.source?230:245,name:t.source?'Mecanismo da fissura':'Origem do sinal',instruction:'Examine com E / A.'};}
 const j=t.journey;if(!j.depth)return{zone:'cavern',...CAVE.depth,name:'Passagem às profundezas',instruction:'Investigue a abertura ao norte da primeira câmara.'};
 if(!j.deepSignal)return{zone:'cavern',...CAVE.signal,name:'Sinal sob a pedra',instruction:'Examine as inscrições junto ao conduto.'};
 if(!j.fragment)return{zone:'cavern',...CAVE.fragment,name:'Fragmento exterior',instruction:'Siga pelo túnel e examine o fragmento.'};
 if(!j.firstEcho)return{zone:'cavern',...CAVE.echo,name:'Primeiro Eco',instruction:'Analise a inscrição que respondeu ao fragmento.'};
 if(!j.gate)return{zone:'cavern',...CAVE.threshold,name:'Limiar do Guardião',instruction:'Investigue a passagem original.'};
 if(!j.warden)return{zone:'warden',x:1170,y:735,name:'O Warden',instruction:'Entre no domínio e enfrente o guardião.'};
 return{zone:'base',...npcPoints[2],instruction:'Relate a descoberta a Nara.'};
}
// Route only to existing passages; a selected remote objective never opens a gate.
export function routeTarget(t:Trial,target:Target):Target{
 if(target.zone===t.zone){if(t.zone==='cavern'&&target.x>1680&&!t.journey.depth)return{zone:'cavern',...CAVE.depth,name:'Abertura das profundezas',instruction:'Investigue antes de seguir.'};if(t.zone==='cavern'&&target.x>2470&&!t.journey.deepSignal)return{zone:'cavern',...CAVE.signal,name:'Sinal sob a pedra',instruction:'Examine antes de avançar.'};return target;}
 if(t.zone==='base')return{zone:'base',x:1240,y:800,name:'Saída para a Floresta',instruction:'E / A para seguir pela trilha.'};
 if(t.zone==='forest')return target.zone==='base'?{zone:'forest',x:400,y:1285,name:'Acampamento de pouso',instruction:'Volte para conversar com a tripulação.'}:{...exploration({...t,zone:'forest'})!,zone:'forest',...(t.mechanism?{x:1870,y:245,name:'Fissura aberta',instruction:'E / A para descer às cavernas.'}:{})};
 if(t.zone==='warden')return{zone:'warden',x:540,y:760,name:'Retorno às cavernas',instruction:t.journey.warden?'Volte pelas cavernas até o acampamento.':'Retorne antes de iniciar o confronto, ou conclua a batalha.'};
 if(target.zone==='warden')return exploration(t)??target;
 return{zone:'cavern',...CAVE.entry,name:'Subida para a floresta',instruction:'Retorne pela entrada da caverna.'};
}
export type Resident={id:number;zone:'forest'|'cavern';kind:'crawler'|'skitter'|'spitter';x:number;y:number;maxHp:number};
export const residents=(spawns:readonly {x:number;y:number}[]):Resident[]=>[
 ...spawns.map((p,id)=>({...p,id,zone:'forest' as const,kind:'crawler' as const,maxHp:68})),
 ...CAVERN_HOLLOWS.map((p,i)=>({...p,id:8+i,zone:'cavern' as const,kind:'crawler' as const,maxHp:68})),
 ...DEEP_HOLLOWS.map((p,i)=>({...p[0],id:10+i,zone:'cavern' as const,kind:'crawler' as const,maxHp:68})),
 ...EXPANSION_ENCOUNTERS.flatMap(g=>g.residents as readonly {kind:'crawler'|'skitter'|'spitter';x:number;y:number}[]).map((p,i)=>({...p,id:12+i,zone:'cavern' as const,maxHp:p.kind==='spitter'?85:p.kind==='skitter'?42:68})),
 ...[...REGIONAL_RESIDENTS,...EARLY_ROUTE_RESIDENTS].filter(p=>p.area==='forest'||p.area==='cavern').map(p=>({...p,zone:p.area as 'forest'|'cavern',kind:p.kind as Resident['kind'],maxHp:p.kind==='spitter'?85:p.kind==='skitter'?42:68})),
];
export function syncEvidence(t:Trial,m:Missions){m.observe({echoes:t.echoes.length,passage:t.mechanism,firstEcho:t.journey.firstEcho,warden:t.journey.warden});t.journey.missions=validMissions(m.snapshot());}
export function record(t:Trial,m:Missions,id:MissionEvidence){m.record(id);syncEvidence(t,m);}
