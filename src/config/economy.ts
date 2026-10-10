import { EQUIPMENT, validItem, type InventoryItem, type EquipmentId } from './equipment';
export const MATERIAL_NAMES=['Liga da floresta','Carapaça âmbar','Núcleo boreal'] as const;
export const REGION_NAMES={base:'Base de pouso',forest:'Floresta de Dante',cavern:'Cavernas e Exterior',warden:'Domínio do Guardião',valley:'Vale da Ressonância',arid:'Bacia do Siroco',dunes:'Dunas Interiores',sandpit:'Bacia Soterrada',frost:'Fratura Boreal',icecave:'Galerias Glaciais',icenest:'Ninho de Vésper'} as const;
export type EconomyReceipt={id:string;credits:number;materials:number[];used:number};
export type EconomySnapshot={schema:1;credits:number;materials:number[];potions:number;potionReadyAt:number;stash:InventoryItem[];visited:(keyof typeof REGION_NAMES)[];receipts:EconomyReceipt[];claimed:string[]};
const count=(n:unknown,max=1e9)=>Number.isSafeInteger(n)&&Number(n)>=0?Math.min(max,Number(n)):0;
export function validEconomy(raw:unknown,starter=false):EconomySnapshot{
 const d=raw as Partial<EconomySnapshot>|undefined;
 const stash:InventoryItem[]=[];for(const i of Array.isArray(d?.stash)?d!.stash:[])if(validItem(i)&&!stash.some(v=>v.uid===i.uid)&&stash.length<48)stash.push({...i});
 return{claimed:Array.isArray(d?.claimed)?[...new Set(d!.claimed.filter(v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,96}$/.test(v)))].slice(-4096):[],schema:1,credits:count(d?.credits),materials:[0,1,2].map(i=>count(d?.materials?.[i])),potions:d?count(d.potions,20):starter?3:0,potionReadyAt:count(d?.potionReadyAt,9e15),stash,
 visited:[...new Set(['base','forest',...(Array.isArray(d?.visited)?d!.visited.filter(v=>typeof v==='string'&&Object.hasOwn(REGION_NAMES,v)):[])])] as EconomySnapshot['visited'],
 receipts:Array.isArray(d?.receipts)?d!.receipts.filter(r=>r&&/^[a-f0-9]{32}$/.test(r.id)).slice(-32).map(r=>({id:r.id,credits:count(r.credits),materials:[0,1,2].map(i=>count(r.materials?.[i])),used:count(r.used)})):[]};
}
export function recipe(id:EquipmentId){const tier=EQUIPMENT[id].tier;return{credits:35*tier,material:tier-1,amount:4+2*tier};}
export const salePrice=(id:EquipmentId)=>10*EQUIPMENT[id].tier;
export const POTION_PRICE=12;
