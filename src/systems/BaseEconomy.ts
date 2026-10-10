import { Equipment } from './Equipment';
import { validEconomy,recipe,salePrice,POTION_PRICE,type EconomySnapshot } from '../config/economy';
import { EQUIPMENT,type EquipmentId,type EquipmentSnapshot } from '../config/equipment';
export type ServiceAction={kind:'buy'|'heal'|'craft'|'sell'|'dismantle'|'deposit'|'withdraw';id?:EquipmentId;uid?:string};
// One draft and one durable write: failed storage/capacity never spends resources.
export function transact(economy:EconomySnapshot,equipment:EquipmentSnapshot,action:ServiceAction):{economy:EconomySnapshot;equipment:EquipmentSnapshot;message:string}|undefined{
 const next=validEconomy(economy),kit=new Equipment();kit.restore(equipment);
 if(action.kind==='buy'){if(next.credits<POTION_PRICE||next.potions>=20)return;next.credits-=POTION_PRICE;next.potions++;}
 else if(action.kind==='craft'){
  if(!action.id||!EQUIPMENT[action.id]||kit.free===0)return;const cost=recipe(action.id);
  if(next.credits<cost.credits||next.materials[cost.material]<cost.amount)return;
  next.credits-=cost.credits;next.materials[cost.material]-=cost.amount;kit.acquire({uid:crypto.randomUUID(),id:action.id});
 }else if(action.kind==='withdraw'){
  const item=next.stash.find(i=>i.uid===action.uid);if(!item||kit.free===0||kit.snapshot().items!.some(i=>i.uid===item.uid))return;
  kit.acquire(item);next.stash=next.stash.filter(i=>i.uid!==item.uid);
 }else if(action.kind!=='heal'){
  const item=kit.bag.find(i=>i.uid===action.uid);if(!item)return;
  if(action.kind==='deposit'){if(next.stash.length>=48)return;next.stash.push({...item});}
  else if(action.kind==='sell')next.credits+=salePrice(item.id);
  else if(action.kind==='dismantle')next.materials[EQUIPMENT[item.id].tier-1]+=2;
  else return;
  const data=kit.snapshot();data.items=data.items!.filter(i=>i.uid!==item.uid);kit.restore(data);
 }
 return{economy:next,equipment:kit.snapshot(),message:action.kind==='heal'?'Vida restaurada gratuitamente.':'Operação concluída e salva.'};
}
