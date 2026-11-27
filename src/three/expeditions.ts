import raw from '../config/regional-expeditions.json';
import type {BiomeId} from './biomes';
import type {Mission,Goal,NpcId} from './missions';

// Regional expeditions of the 2D (config/regional-expeditions.json), carried into the 3D regions as side missions that
// run beside the story: same people, same words and the same findings. Four of the twelve already are story missions in
// the 3D journey (dunes, frost, caldera and the valley caravan); the other eight come here. Each one has three
// discoveries guarded by residents of the region; what is found is kept in the Records of Dante.
type Raw={id:string;area:string;npc:string;requires:string;credits:number;title:string;offer:string[];report:string[];sites:{name:string;art:string;finding:string}[]};
const NPC:Record<string,NpcId>={medic:'lia',smith:'ivo',expedition:'nara'};
// 2D area -> 3D region; the story mission each one waits for in the 3D journey; where its three finds lie
const PLACE:Record<string,{biome:BiomeId;requires:string;at:[number,number][]}>={
 'exp-forest':{biome:'camp',requires:'recon',at:[[-31,10],[30,14],[-12,31]]},
 'exp-cavern':{biome:'domain',requires:'signal',at:[[-14,33],[34,6],[-34,-22]]},
 'exp-arid':{biome:'dunes',requires:'beyond',at:[[-28,14],[27,16],[30,-24]]},
 'exp-icecave':{biome:'frost',requires:'dunes',at:[[-27,16],[26,14],[-30,-24]]},
 'exp-cinder':{biome:'caldera',requires:'frost',at:[[-28,12],[27,10],[-30,-24]]},
 'exp-obsidian':{biome:'caldera',requires:'exp-cinder',at:[[16,28],[-16,28],[31,-26]]},
 'exp-springs':{biome:'springs',requires:'source',at:[[-28,14],[28,-14],[-30,-24]]},
 'exp-terraces':{biome:'springs',requires:'exp-springs',at:[[12,29],[-12,29],[31,20]]},
};
export type Art='biology'|'water'|'soil'|'mineral'|'record';
export const ART_NAMES:Record<Art,string>={biology:'Biologia',water:'Água',soil:'Solo',mineral:'Mineral',record:'Registro antigo'};
export const ART_COLORS:Record<Art,string>={biology:'#8adf7a',water:'#6ac8ff',soil:'#d0a060',mineral:'#c8b0ff',record:'#4fe6ff'};
export const EXPEDITIONS:Mission[]=(raw as Raw[]).filter(m=>PLACE[m.id]).map(m=>{const p=PLACE[m.id];return{
 id:m.id,title:m.title,npc:NPC[m.npc]??'nara',credits:m.credits,offer:m.offer,report:m.report,requires:p.requires,side:true,region:p.biome,
 goals:m.sites.map((s,i):Goal=>({id:`${m.id}-${i+1}`,label:s.name,biome:p.biome,kind:'scan',x:p.at[i][0],z:p.at[i][1],finding:s.finding,art:s.art as Art}))};});
