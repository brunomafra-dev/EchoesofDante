import { BAG_SIZE,EQUIPMENT,EQUIPMENT_IDS,validEquipment,validItem,type EquipmentId,type EquipmentSlot,type EquipmentSnapshot,type InventoryItem } from '../config/equipment';
export class Equipment {
 private data=validEquipment(undefined);
 restore(raw:unknown):void{this.data=validEquipment(raw);}
 snapshot():EquipmentSnapshot{return structuredClone(this.data);}
 get bag():InventoryItem[]{const worn=new Set(Object.values(this.data.equipped!));return this.data.items!.filter(i=>!worn.has(i.uid));}
 get free():number{return BAG_SIZE-this.bag.length;}
 has(id:EquipmentId):boolean{return this.data.owned.includes(id);}
 acquire(item:InventoryItem):boolean {
  if(!validItem(item))return false;if(this.data.items!.some(i=>i.uid===item.uid))return true;
  if(this.free<=0)return false;this.data.items!.push({...item});this.data.owned=[...new Set(this.data.items!.map(i=>i.id))];return true;
 }
 grant(id:EquipmentId):boolean{if(!EQUIPMENT_IDS.includes(id)||this.has(id))return false;return this.acquire({uid:`legacy-${id}`,id});}
 equip(slot:EquipmentSlot,id?:EquipmentId,uid?:string):boolean {
  const old=this.data.equipped![slot];
  if(!id){if(old&&this.free<=0)return false;delete this.data.slots[slot];delete this.data.equipped![slot];return true;}
  const item=this.data.items!.find(i=>i.id===id&&(!uid||i.uid===uid));
  if(!item||EQUIPMENT[id].slot!==slot)return false;
  this.data.slots[slot]=id;this.data.equipped![slot]=item.uid;return true;
 }
}
