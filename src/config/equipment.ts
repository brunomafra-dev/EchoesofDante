import catalogue from './equipment-catalog.json';
import { equipmentLook, type EquipmentLook } from './appearance';
export const EQUIPMENT_SLOTS=['weapon','helmet','armor','legs','boots','gloves','accessory'] as const;
export type EquipmentSlot=typeof EQUIPMENT_SLOTS[number];
export const SLOT_NAMES:Record<EquipmentSlot,string>={weapon:'Arma',helmet:'Capacete',armor:'Torso',legs:'Calça',boots:'Botas',gloves:'Luvas',accessory:'Acessório'};
export const RARITY_COLORS={comum:'#cad4ca',aprimorado:'#ffbd54',raro:'#a98cff'};
type ItemDefinition={slot:EquipmentSlot;tier:number;name:string;description:string;rarity:keyof typeof RARITY_COLORS;hp?:number;resistance?:number;damage?:number;charge?:number};
export type EquipmentId=keyof typeof catalogue;
export const EQUIPMENT=catalogue as Record<EquipmentId,ItemDefinition>;
export const EQUIPMENT_IDS=Object.keys(EQUIPMENT) as EquipmentId[];
export const BAG_SIZE=24;
export type InventoryItem={uid:string;id:EquipmentId};
export type EquipmentSnapshot={owned:EquipmentId[];slots:Partial<Record<EquipmentSlot,EquipmentId>>;schema?:2;items?:InventoryItem[];equipped?:Partial<Record<EquipmentSlot,string>>};
export function validItem(raw:unknown):raw is InventoryItem {
 const item=raw as InventoryItem;return !!item&&typeof item.uid==='string'&&/^[a-zA-Z0-9_-]{1,96}$/.test(item.uid)&&EQUIPMENT_IDS.includes(item.id);
}
export function validEquipment(raw:unknown):EquipmentSnapshot {
 const data=raw as EquipmentSnapshot|undefined,items:InventoryItem[]=[],equipped:NonNullable<EquipmentSnapshot['equipped']>={},slots:EquipmentSnapshot['slots']={};
 if(data?.schema===2&&Array.isArray(data.items)){
  for(const i of data.items.slice(0,31))if(validItem(i)&&!items.some(v=>v.uid===i.uid))items.push({uid:i.uid,id:i.id});
  for(const slot of EQUIPMENT_SLOTS){const i=items.find(i=>i.uid===data.equipped?.[slot]);if(i&&EQUIPMENT[i.id].slot===slot){equipped[slot]=i.uid;slots[slot]=i.id;}}
 }else{
  const owned=Array.isArray(data?.owned)?[...new Set(data.owned.filter(id=>EQUIPMENT_IDS.includes(id)))]:[];
  for(const id of owned.slice(0,31))items.push({uid:`legacy-${id}`,id});
  for(const slot of EQUIPMENT_SLOTS){const i=items.find(i=>i.id===data?.slots?.[slot]);if(i&&EQUIPMENT[i.id].slot===slot){equipped[slot]=i.uid;slots[slot]=i.id;}}
 }
 // Legacy collection has nine entries; no migration can overflow the backpack.
 const worn=new Set(Object.values(equipped));let bag=0;
 const safe=items.filter(i=>worn.has(i.uid)||bag++<BAG_SIZE);
 return{schema:2,owned:[...new Set(safe.map(i=>i.id))],slots,items:safe,equipped};
}
export function equipmentStats(slots:EquipmentSnapshot['slots']) {
 const stats={hp:0,resistance:0,damage:0,charge:0};
 for(const slot of EQUIPMENT_SLOTS){const id=slots[slot];if(!id||!EQUIPMENT_IDS.includes(id)||EQUIPMENT[id].slot!==slot)continue;
  const item=EQUIPMENT[id];for(const key of Object.keys(stats) as (keyof typeof stats)[])stats[key]+=item[key]??0;}
 return stats;
}
export function equipmentAppearance(slots:EquipmentSnapshot['slots']):EquipmentLook {
 const look=equipmentLook();for(const [slot,part]of [['helmet','helmet'],['armor','torso'],['legs','legs'],['boots','boots'],['gloves','gloves']] as const){
  const id=slots[slot];if(id&&EQUIPMENT[id]?.slot===slot)look[part]=EQUIPMENT[id].tier===1?'basic':'reinforced';}
 return look;
}
