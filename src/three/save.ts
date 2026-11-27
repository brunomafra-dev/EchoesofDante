import {DEFAULT_LOOK,OUTFITS,type Look} from './character';
import {isPet,type PetId} from './pets';

// Saved characters of the new 3D, on this device: a name chosen by the player, the look, the class (from the
// weapon), the Domador's companion, and their own mission journal (key 'dante3d.missions.<id>').
export interface HeroSave{id:string;name:string;look:Look;pet:PetId;created:number;played:number}
interface Roster{list:HeroSave[];current:string|null}
const KEY='dante3d.heroes';
export const NAME_MAX=18;
export const cleanName=(s:string)=>s.replace(/\s+/g,' ').trim().slice(0,NAME_MAX);
function fixLook(l:Partial<Look>|null|undefined):Look{const o={...DEFAULT_LOOK,...(l??{})};if(!OUTFITS.some(x=>x[0]===o.outfit))o.outfit=DEFAULT_LOOK.outfit;return o;}
function read<T>(k:string):T|null{try{const s=localStorage.getItem(k);return s?JSON.parse(s) as T:null;}catch{return null;}}
export function loadRoster():Roster{
 const r=read<Roster>(KEY);
 if(r&&Array.isArray(r.list)){r.list=r.list.filter(h=>h&&h.id&&h.name).map(h=>({...h,look:fixLook(h.look),pet:isPet(h.pet)?h.pet:'symbiont'}));if(!r.list.some(h=>h.id===r.current))r.current=r.list[0]?.id??null;return r;}
 // first run after characters got names: the look and the progress already on this device become one
 // character (the old keys stay untouched)
 const oldLook=read<Partial<Look>>('dante3d.look'),oldJournal=localStorage.getItem?.('dante3d.missions')??null;
 const roster:Roster={list:[],current:null};
 if(oldLook||oldJournal){
  const h:HeroSave={id:newId(),name:'Explorador',look:fixLook(oldLook),pet:'symbiont',created:Date.now(),played:Date.now()};
  try{if(oldJournal)localStorage.setItem(journalKey(h.id),oldJournal);}catch{/* ignore */}
  roster.list.push(h);roster.current=h.id;saveRoster(roster);
 }
 return roster;
}
export function saveRoster(r:Roster){try{localStorage.setItem(KEY,JSON.stringify(r));}catch{/* private mode */}}
export function newId(){return'h'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);}
export const journalKey=(id:string)=>'dante3d.missions.'+id;
export const gearKey=(id:string)=>'dante3d.gear.'+id;
export function forget(id:string){try{localStorage.removeItem(journalKey(id));localStorage.removeItem(gearKey(id));}catch{/* ignore */}}
