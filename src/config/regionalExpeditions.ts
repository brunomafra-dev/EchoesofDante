import raw from './regional-expeditions.json';
import type {JourneyArea} from '../systems/LocalJourney';
import type {MissionDefinition,MissionId,MissionNpc} from './missions';
import type {SpeciesId} from './bestiary';

export const REGIONAL_IDS=['exp-forest','exp-cavern','exp-valley','exp-arid','exp-dunes','exp-frost','exp-icecave','exp-cinder','exp-obsidian','exp-caldera','exp-springs','exp-terraces'] as const;
export type RegionalMissionId=typeof REGIONAL_IDS[number];
export type RegionalEvidence=`${RegionalMissionId}-${1|2|3}`;
export type RegionalArt='biology'|'water'|'soil'|'mineral'|'record';
export type RegionalSite={id:RegionalEvidence;mission:RegionalMissionId;area:JourneyArea;name:string;x:number;y:number;radius:number;art:RegionalArt;finding:string};
export const REGIONAL_SITES:readonly RegionalSite[]=raw.flatMap(m=>m.sites.map((s,i)=>({...s,id:`${m.id}-${i+1}` as RegionalEvidence,mission:m.id as RegionalMissionId,area:m.area as JourneyArea,radius:85,art:s.art as RegionalArt})));
export const REGIONAL_EVIDENCE=[...REGIONAL_SITES.map(s=>s.id),'after-soterrado','after-vesper'] as const;
export const REGIONAL_MISSIONS:readonly MissionDefinition[]=raw.map(m=>({id:m.id as MissionId,title:m.title,npc:m.npc as MissionNpc,requires:m.requires as MissionId,unlock:m.unlock as 'after-soterrado'|'after-vesper'|undefined,credits:m.credits,offer:m.offer,report:m.report,regional:true,region:m.area as JourneyArea,goals:REGIONAL_SITES.filter(s=>s.mission===m.id).map(s=>({id:s.id,label:s.name,area:s.area}))}));
// IDs 1900–1971 are finite residents, outside existing habitats/party reserves.
// Each pair lives beside a discovery; no wave loop or kill quota.
export const REGIONAL_RESIDENTS=raw.flatMap((m,region)=>m.sites.flatMap((s,site)=>m.kinds.map((kind,i)=>({id:1900+region*6+site*2+i,site:`${m.id}-${site+1}` as RegionalEvidence,area:m.area as JourneyArea,kind:kind as SpeciesId,x:s.x+(i===0?-100:100),y:s.y+(i===0?70:-70)}))));
