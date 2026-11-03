import layout from './layout.json';
export type Zone='base'|'forest';
export type ClassId='warrior'|'hunter'|'astral'|'xenobinder';
export type Gender='male'|'female';
export type Appearance={name:string;gender:Gender;classId:ClassId;hair:number;beard:boolean;skin:string;hairColor:string;cloth:string};
export type Trial={hero:Appearance|null;zone:Zone;hp:number;potions:number;defeated:number[];echoes:string[];source:boolean;mechanism:boolean};
export const STORAGE_KEY='dante.arrival3d.v1';
export const CLASS_NAMES=layout.classes.CLASS_NAMES;
export const SKIN=['#e2bfa2','#c69776','#936b50','#5e4032'];
export const HAIR=['#30251f','#67503b','#b89b68','#8f8880','#8d4b30'];
export const CLOTH=['#74806b','#536c78','#867752','#6e637e','#a09c8a','#48535d'];
export const defaults=():Appearance=>({name:'Explorador',gender:'male',classId:'warrior',hair:1,beard:false,skin:SKIN[1],hairColor:HAIR[0],cloth:CLOTH[0]});
export const fresh=():Trial=>({hero:null,zone:'base',hp:100,potions:3,defeated:[],echoes:[],source:false,mechanism:false});
export function maxHp(id:ClassId){return id==='hunter'?80:id==='astral'?85:id==='xenobinder'?90:100;}
export function parseTrial(raw:string|null):Trial{
 if(!raw)return fresh();try{const d=JSON.parse(raw);if(!d||typeof d!=='object'||!['base','forest'].includes(d.zone))return fresh();
 const h=d.hero;if(!h||!['male','female'].includes(h.gender)||!['warrior','hunter','astral','xenobinder'].includes(h.classId)||!Number.isInteger(h.hair)||h.hair<0||h.hair>3||![h.skin,h.hairColor,h.cloth].every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)))return fresh();
 const hero:Appearance={name:String(h.name??'Explorador').replace(/[\x00-\x1f<>]/g,'').slice(0,24).trim()||'Explorador',gender:h.gender,classId:h.classId,hair:h.hair,beard:h.beard===true,skin:h.skin,hairColor:h.hairColor,cloth:h.cloth};
 const echoIds=['northern-ruin','mineral-signal','unknown-trace'];const echoes=Array.isArray(d.echoes)?[...new Set<string>(d.echoes.filter((e:unknown)=>typeof e==='string'&&echoIds.includes(e)))]:[];
 return{hero,zone:d.zone,hp:Number.isFinite(d.hp)?Math.max(0,Math.min(maxHp(hero.classId),d.hp)):maxHp(hero.classId),potions:Number.isInteger(d.potions)?Math.max(0,Math.min(3,d.potions)):3,defeated:Array.isArray(d.defeated)?[...new Set<number>(d.defeated.filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<8))]:[],echoes,source:echoes.length===3&&d.source===true,mechanism:echoes.length===3&&d.source===true&&d.mechanism===true};
 }catch{return fresh();}
}
export type Point={x:number;y:number};
export function distanceToSegment(x:number,z:number,a:Point,b:Point){const dx=b.x-a.x,dz=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.y)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a.x-t*dx,z-a.y-t*dz);}
export function inPolygon(x:number,z:number,points:readonly Point[]){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>z)!==(b.y>z)&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export {layout};
