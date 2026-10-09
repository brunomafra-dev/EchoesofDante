import { EQUIPMENT, EQUIPMENT_IDS, validEquipment, type EquipmentId, type EquipmentSlot, type EquipmentSnapshot } from '../config/equipment';

// A small collection, no random affixes or duplicated item stacks.
export class Equipment {
  private data:EquipmentSnapshot={owned:[],slots:{}};
  restore(raw:unknown):void{this.data=validEquipment(raw);}
  snapshot():EquipmentSnapshot{return{owned:[...this.data.owned],slots:{...this.data.slots}};}
  has(id:EquipmentId):boolean{return this.data.owned.includes(id);}
  grant(id:EquipmentId):boolean{if(!EQUIPMENT_IDS.includes(id)||this.has(id))return false;this.data.owned.push(id);return true;}
  equip(slot:EquipmentSlot,id?:EquipmentId):boolean {
    if(id&&(!this.has(id)||EQUIPMENT[id].slot!==slot))return false;
    if(id)this.data.slots[slot]=id;else delete this.data.slots[slot];return true;
  }
}
