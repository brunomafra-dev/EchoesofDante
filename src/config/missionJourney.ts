import type {JourneyArea,JourneyFlags} from '../systems/LocalJourney';
import type {ExplorationTarget} from '../ui/ExplorationGuide';
import {BASE} from './base';import {COLONY,COLONY_BRANCH} from './colonization';
import {VALLEY} from './valley';import {SIROCCO} from './sirocco';import {DUNES} from './dunes';
import {FROST} from './frost';import {GLACIER,VESPER} from './glacier';import {VOLCANIC} from './volcanic';
import {CALDERA,TITAN} from './caldera';import {SANDPIT} from './soterrado';
import {FOREST_ECHOES,NORTHERN_DISCOVERY,SIGNAL_THRESHOLD} from './discovery';
import {CAVERN_DEPTH_OPENING,DEEP_AREA} from './cavern';import {EXPANSION} from './expansion';
import {WARDEN_PREPARATION as W} from './wardenPreparation';
const CHAIN:JourneyArea[]=['base','forest','cavern','warden','valley','arid','dunes','sandpit','frost','icecave','icenest','cinder','obsidian','caldera'];
export function missionNextRegion(from:JourneyArea,to:JourneyArea):JourneyArea|undefined{
 if(from===to)return;
 const adjacent=(a:JourneyArea):JourneyArea[]=>a==='springs'?['valley','terraces']:a==='terraces'?['springs']:a==='valley'?['warden','arid','springs']:CHAIN.filter((_,i)=>Math.abs(i-CHAIN.indexOf(a))===1);
 const queue:JourneyArea[][]=[[from]],seen=new Set<JourneyArea>([from]);
 for(const route of queue)for(const next of adjacent(route.at(-1)!)){if(seen.has(next))continue;const path=[...route,next];if(next===to)return path[1];seen.add(next);queue.push(path);}
}
type Facts={area:JourneyArea;destination:JourneyArea;flags:Partial<JourneyFlags>;passage:boolean;source:boolean;echoes:ReadonlySet<string>;x:number};
// Read-only references to the ORIGINAL journey. No flags, atlas entries or
// boss victories are granted by choosing a route in the journal.
export function missionJourneyTarget(s:Facts):ExplorationTarget|undefined{
 const next=missionNextRegion(s.area,s.destination),f=s.flags;
 const point=(p:{x:number;y:number;radius?:number},name:string,action:ExplorationTarget['action']='enter'):ExplorationTarget=>({...p,radius:p.radius??110,name,instruction:action==='investigate'?'Investigue este requisito da passagem original.':'Siga esta passagem da jornada original.',action});
 if(s.area==='base')return point(BASE.exit,'Saída para a Floresta');
 if(s.area==='springs')return next==='terraces'?point(COLONY.springs.exit,'Passagem para os Terraços'):point(COLONY.springs.back,'Retorno ao Vale');
 if(s.area==='terraces')return point(COLONY.terraces.back,'Retorno à Bacia das Nascentes');
 if(s.area==='valley'){
  if(next==='springs')return point(COLONY_BRANCH,'Trilha para a Bacia das Nascentes');
  if(next==='warden')return point(VALLEY.portal,'Retorno ao domínio do guardião','investigate');
  if(!f.valleyLandmarkSeen)return point(VALLEY.landmark,'Crescimento ancestral','investigate');
  if(!f.valleyEndSeen)return point(VALLEY.end,'Sinal além das rochas','walk');
  if(!f.valleyFrontierReached)return point(VALLEY.frontier.threshold,'Passagem na crista','walk');
  if(!f.valleyFrontierSignalSeen)return point(VALLEY.frontier.signal,'Estrutura de escuta','investigate');
  if(!f.valleyFrontierEndSeen)return point(VALLEY.frontier.end,'Fenda na escarpa','walk');
  return point(VALLEY.frontier.portal,'Portal para o Siroco');
 }
 if(s.area==='forest'){
  const missing=[{id:'northern-ruin',...NORTHERN_DISCOVERY,name:'Ruína do norte'},{...FOREST_ECHOES.mineral,name:'Sinal mineral'},{...FOREST_ECHOES.trace,name:'Vestígio desconhecido'}].find(p=>!s.echoes.has(p.id));
  if(missing)return point(missing,missing.name,'investigate');
  if(!s.source)return point(SIGNAL_THRESHOLD,'Fissura ancestral','investigate');
  if(!s.passage)return point({x:SIGNAL_THRESHOLD.mechanismX,y:SIGNAL_THRESHOLD.mechanismY,radius:SIGNAL_THRESHOLD.mechanismRadius},'Mecanismo ancestral','investigate');
  return point(SIGNAL_THRESHOLD,'Passagem aberta para as cavernas','walk');
 }
 if(s.area==='cavern'){
  if(!f.deepPassageOpen)return point(CAVERN_DEPTH_OPENING,'Sinal entre as pedras','walk');
  if(s.x<EXPANSION.deeperX)return point(DEEP_AREA.end,'Túnel profundo','walk');
  if(s.x<EXPANSION.exteriorX)return point({x:4400,y:740},'Luz além da caverna','walk');
  if(!f.fragmentSeen)return point(EXPANSION.fragment,'Fragmento ancestral','investigate');
  if(!f.firstEchoSeen)return point(W.echo,'Arquivo do Primeiro Eco','investigate');
  return point(W.threshold,'Limiar do guardião',f.wardenGateOpen?'walk':'investigate');
 }
 if(s.area==='arid')return next==='valley'?point(SIROCCO.returnPortal,'Retorno ao Vale'):!f.aridSignalSeen?point(SIROCCO.signal,'Relé original do Siroco','investigate'):!f.aridFrontierReached?point(SIROCCO.end,'Passagem entre as cristas','walk'):point(SIROCCO.exitPortal,'Portal para as Dunas');
 if(s.area==='dunes')return next==='arid'?point(DUNES.returnPortal,'Retorno ao Siroco'):!f.dunesRuinsSeen?point(DUNES.ruin,'Ruínas das Dunas','investigate'):point(DUNES.hollow,'Descida para a bacia','investigate');
 if(s.area==='sandpit')return next==='dunes'?point(SANDPIT.ascent,'Subida para as Dunas'):f.soterradoDefeated?point(SANDPIT.clue,'Passagem sob a areia',f.soterradoClueSeen?'enter':'investigate'):point(SANDPIT.spawn,'Bacia do Soterrado','observe');
 if(s.area==='frost')return next==='sandpit'?point(FROST.returnPortal,'Retorno ao Siroco'):!f.frostSignalSeen?point(FROST.relay,'Registro sob o gelo','investigate'):point(FROST.frontier,'Passagem para as Galerias');
 if(s.area==='icecave')return next==='frost'?point(GLACIER.icecave.back,'Retorno à Fratura Boreal'):!f.icecaveSignalSeen?point(GLACIER.icecave.relay,'Registro do degelo','investigate'):point(GLACIER.icecave.exit,'Passagem para o Ninho');
 if(s.area==='icenest')return next==='icecave'?point(GLACIER.icenest.back,'Retorno às Galerias'):!f.vesperDefeated?point(VESPER.spawn,'Ninho de Vésper','observe'):!f.vesperClueSeen?point(GLACIER.icenest.relay,'Registro do ninho','investigate'):point(GLACIER.icenest.exit,'Passagem para a Costa das Cinzas');
 if(s.area==='cinder'||s.area==='obsidian'){const c=VOLCANIC[s.area],back=next===(s.area==='cinder'?'icenest':'cinder'),seen=s.area==='cinder'?f.cinderSignalSeen:f.obsidianSignalSeen;return back?point(c.back,'Retorno pela passagem'):!seen?point(c.relay,'Registro de basalto','investigate'):point(c.exit,'Passagem adiante');}
 if(s.area==='caldera')return next==='obsidian'?point(CALDERA.back,'Retorno à Garganta'):!f.calderaRelaySeen?point(CALDERA.relay,'Registro da caldeira','investigate'):point(TITAN.spawn,'Forjas da Caldeira','observe');
}
