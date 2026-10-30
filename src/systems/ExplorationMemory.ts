import type {JourneyArea} from './LocalJourney';
import type {Vec2} from '../utils/math';

export type ExplorationSnapshot=Partial<Record<JourneyArea,number[]>>;
export type ExplorationRegion={has(point:Vec2):boolean;reveal(point:Vec2):void};
const AREAS:readonly JourneyArea[]=['base','forest','cavern','warden','valley','arid','dunes','sandpit','frost','icecave','icenest','cinder','obsidian','caldera','springs','terraces'];
export const EXPLORATION_CELL=48;
const STRIDE=1024,OFFSET=128,MAX_REGION=16384,MAX_TOTAL=65536;
function cell(point:Vec2):number|undefined{
 const x=Math.floor(point.x/EXPLORATION_CELL)+OFFSET,y=Math.floor(point.y/EXPLORATION_CELL)+OFFSET;
 return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<STRIDE&&y<STRIDE?y*STRIDE+x:undefined;
}
export function validExploration(raw:unknown):ExplorationSnapshot{
 const result:ExplorationSnapshot={};let remaining=MAX_TOTAL;
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
 for(const area of AREAS){const values=(raw as Record<string,unknown>)[area];if(!Array.isArray(values))continue;
  const seen=[...new Set(values.slice(0,MAX_REGION).filter((v):v is number=>Number.isSafeInteger(v)&&v>=0&&v<STRIDE*STRIDE))].slice(0,remaining);
  if(seen.length){result[area]=seen;remaining-=seen.length;}
 }
 return result;
}
// Discovery is monotonic for an existing character save. An older checkpoint
// (including a legacy writer omitting fog data) cannot close revealed terrain.
// Reserve the stored cells first, even when the global safety cap is reached.
export function mergeExploration(stored:unknown,incoming:unknown):ExplorationSnapshot{
 const result=validExploration(stored),next=validExploration(incoming);
 let remaining=MAX_TOTAL-Object.values(result).reduce((n,cells)=>n+cells.length,0);
 for(const area of AREAS){
  const seen=new Set(result[area]??[]);
  for(const key of next[area]??[])if(remaining>0&&seen.size<MAX_REGION&&!seen.has(key)){seen.add(key);remaining--;}
  if(seen.size)result[area]=[...seen].sort((a,b)=>a-b);
 }
 return result;
}
// World coordinates, independent of the navigator's current grid/bounds. A
// new house or arena boundary can rebuild geometry without erasing discovery.
export class ExplorationMemory{
 private regions=new Map<JourneyArea,Set<number>>();
 private total=0;
 revision=0;
 region(area:JourneyArea):ExplorationRegion{
  return {has:p=>{const key=cell(p);return key!==undefined&&!!this.regions.get(area)?.has(key)},reveal:p=>{
   const key=cell(p);if(key===undefined||this.total>=MAX_TOTAL)return;
   let seen=this.regions.get(area);if(!seen){seen=new Set();this.regions.set(area,seen);}
   if(!seen.has(key)&&seen.size<MAX_REGION){seen.add(key);this.total++;this.revision++;}
  }};
 }
 snapshot():ExplorationSnapshot{return Object.fromEntries([...this.regions].map(([area,seen])=>[area,[...seen].sort((a,b)=>a-b)]));}
 restore(raw:unknown):void{this.regions.clear();this.total=0;for(const[area,seen]of Object.entries(validExploration(raw))){this.regions.set(area as JourneyArea,new Set(seen));this.total+=seen.length;}this.revision++;}
}
