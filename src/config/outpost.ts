import {COLONY_ENCOUNTERS,HABITAT,HABITAT_SOLIDS} from './colonization';
import {PARTY_ENCOUNTERS} from './partyEncounters';
import {REGIONAL_RESIDENTS} from './regionalExpeditions';
import type {NpcDefinition} from './settlementLife';

export const OUTPOST={x:2240,y:910,width:300,height:212,name:'Posto das Nascentes'} as const;
export const OUTPOST_SOLIDS=HABITAT_SOLIDS.map(o=>({x:OUTPOST.x+(o.x-HABITAT.x)*OUTPOST.width/HABITAT.width,y:OUTPOST.y+(o.y-HABITAT.y)*OUTPOST.height/HABITAT.height,radius:o.radius*OUTPOST.width/HABITAT.width}));
// These are the existing, finite inhabitants, including the original team's
// reserves. A cleared region is remembered; no new wave or kill quota is added.
export const outpostThreats=(partySize:number):number[]=>[...COLONY_ENCOUNTERS.springs.map(h=>h.id),...REGIONAL_RESIDENTS.filter(h=>h.area==='springs').map(h=>h.id),...(PARTY_ENCOUNTERS.springs??[]).filter(h=>h.minParty<=partySize).map(h=>h.id)];
export const OUTPOST_SETTLERS:readonly NpcDefinition[]=[
 {id:'mara',name:'Mara',role:'Posto · Manutenção',position:{x:2070,y:960},task:'repair',text:'Trouxe meu kit dos Terraços. Estou conferindo as conexões do posto; o regulador da nave continua separado da água e das estruturas antigas.'},
 {id:'tomas',name:'Choco',role:'Posto · Suprimentos',position:{x:1950,y:860},task:'inventory',route:[{x:1950,y:860},{x:1920,y:930},{x:1940,y:1000}],text:'As caixas lacradas ficam deste lado. Saímos do segundo alojamento para assumir este posto; agora há um lugar seco para descansar entre o Vale e os Terraços.'},
];
