export type EquipmentSlot='weapon'|'armor'|'accessory';
export const SLOT_NAMES:Record<EquipmentSlot,string>={weapon:'Arma',armor:'Armadura',accessory:'Acessório'};
export const EQUIPMENT = {
  'forest-emitter':{slot:'weapon',tier:1,name:'Emissor de ressonância',description:'+10% ao dano da arma e das habilidades.',damage:.10},
  'forest-armor':{slot:'armor',tier:1,name:'Colete de explorador',description:'+12 de vida máxima e 3% de redução de dano.',hp:12,resistance:.03},
  'forest-focus':{slot:'accessory',tier:1,name:'Fragmento sintonizado',description:'+10% ao dano de Q carregado.',charge:.10},
  'sirocco-emitter':{slot:'weapon',tier:2,name:'Emissor âmbar',description:'+16% ao dano da arma e das habilidades.',damage:.16},
  'sirocco-armor':{slot:'armor',tier:2,name:'Carapaça do Siroco',description:'+20 de vida máxima e 5% de redução de dano.',hp:20,resistance:.05},
  'sirocco-focus':{slot:'accessory',tier:2,name:'Prisma soterrado',description:'+16% ao dano de Q carregado.',charge:.16},
  'glacier-emitter':{slot:'weapon',tier:3,name:'Emissor boreal',description:'+22% ao dano da arma e das habilidades.',damage:.22},
  'glacier-armor':{slot:'armor',tier:3,name:'Couraça de geada',description:'+28 de vida máxima e 7% de redução de dano.',hp:28,resistance:.07},
  'glacier-focus':{slot:'accessory',tier:3,name:'Coração do degelo',description:'+22% ao dano de Q carregado.',charge:.22},
} as const;
export type EquipmentId=keyof typeof EQUIPMENT;
export type EquipmentSnapshot={owned:EquipmentId[];slots:Partial<Record<EquipmentSlot,EquipmentId>>};
export const EQUIPMENT_IDS=Object.keys(EQUIPMENT) as EquipmentId[];
export function validEquipment(raw:unknown):EquipmentSnapshot {
  const data=raw as Partial<EquipmentSnapshot>|undefined;
  const owned=Array.isArray(data?.owned)?[...new Set(data.owned.filter((id):id is EquipmentId=>EQUIPMENT_IDS.includes(id)))]:[];
  const slots:EquipmentSnapshot['slots']={};
  for(const slot of ['weapon','armor','accessory'] as const){const id=data?.slots?.[slot];if(id&&owned.includes(id)&&EQUIPMENT[id].slot===slot)slots[slot]=id;}
  return{owned,slots};
}
export function equipmentStats(slots:EquipmentSnapshot['slots']) {
  const stats={hp:0,resistance:0,damage:0,charge:0};
  for(const slot of ['weapon','armor','accessory'] as const){const id=slots[slot];if(!id||!EQUIPMENT_IDS.includes(id)||EQUIPMENT[id].slot!==slot)continue;
    const item=EQUIPMENT[id];for(const key of Object.keys(stats) as (keyof typeof stats)[])if(key in item)stats[key]+=(item as unknown as Record<string,number>)[key];}
  return stats;
}
