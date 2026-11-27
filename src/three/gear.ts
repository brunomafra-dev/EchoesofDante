import {PROGRESSION} from '../config/progression';
import {EQUIPMENT,EQUIPMENT_IDS,equipmentStats,type EquipmentId,type EquipmentSlot,type EquipmentSnapshot} from '../config/equipment';
import {validEconomy,EQUIPMENT_DROP_INTERVAL,type EconomySnapshot} from '../config/economy';
import {Equipment} from '../systems/Equipment';
import {transact,type ServiceAction} from '../systems/BaseEconomy';
import type {BiomeId} from './biomes';

// Progression, backpack and wallet of one saved character of the new 3D (key 'dante3d.gear.<id>').
// The rules are the 2D game's own: the XP curve and life per level (config/progression), the equipment
// catalogue and backpack (config/equipment, systems/Equipment), prices, recipes, potions and the vault
// (config/economy, systems/BaseEconomy). Only the 3D regions are mapped onto them here.

// XP of a regular resident, tier of the material it leaves and tier of the equipment found there, after the
// matching 2D areas (config/threat, GameScene). Springs and valley come last in the 3D journey, so their
// finds follow the late regions while the material stays the green one of their 2D maps.
export const REGION_LOOT:Record<BiomeId,{xp:number;mat:1|2|3;gear:1|2|3}>={
 camp:{xp:15,mat:1,gear:1},domain:{xp:18,mat:1,gear:1},dunes:{xp:25,mat:2,gear:2},
 frost:{xp:30,mat:3,gear:3},caldera:{xp:36,mat:2,gear:3},springs:{xp:36,mat:1,gear:3},valley:{xp:36,mat:1,gear:3},
};
// guardians, once each (2D Progression.defeatWarden/Soterrado/Vesper/Titan)
export const BOSS_XP:Record<string,number>={warden:120,soterrado:180,vesper:220,titan:260};
export const MAX_LEVEL=PROGRESSION.levelThresholds.length;
export const POTION_HEAL=.35,POTION_CD=8;
// readings of a mission: an Echo is worth the 2D Echo XP, any other registered point the XP of a 2D route
export const GOAL_XP={echo:PROGRESSION.echoXp,route:PROGRESSION.valleyRouteXp};

interface Saved{xp:number;economy:EconomySnapshot;equipment:EquipmentSnapshot;lootKills:number;bosses:string[]}
export interface Stats{hp:number;resistance:number;damage:number;charge:number}

export class Gear{
 xp=0;lootKills=0;bosses=new Set<string>();economy:EconomySnapshot;kit=new Equipment();
 // without a key (creator preview) the gear lives only in memory
 constructor(private key:string|null,startCredits=0){
  let s:Partial<Saved>|null=null;
  try{if(key)s=JSON.parse(localStorage.getItem(key)??'null');}catch{/* private mode */}
  if(s){this.xp=Math.max(0,Math.floor(Number(s.xp)||0));this.lootKills=Math.max(0,Math.floor(Number(s.lootKills)||0));this.bosses=new Set((s.bosses??[]).filter(b=>typeof b==='string'));
   this.economy=validEconomy(s.economy);this.kit.restore(s.equipment);}
  else{
   // first time this character opens a backpack: the 2D starter kit (three potions) and the credits
   // already earned from mission reports
   this.economy=validEconomy(undefined,true);this.economy.credits=startCredits;this.save();
  }
 }
 save(){if(!this.key)return;try{localStorage.setItem(this.key,JSON.stringify({xp:this.xp,economy:this.economy,equipment:this.kit.snapshot(),lootKills:this.lootKills,bosses:[...this.bosses]} satisfies Saved));}catch{/* ignore */}}
 // ----- level -----
 get level(){let l=1;for(let i=1;i<MAX_LEVEL;i++)if(this.xp>=PROGRESSION.levelThresholds[i])l=i+1;return l;}
 get levelFloor(){return PROGRESSION.levelThresholds[this.level-1];}
 get levelNext():number|null{return PROGRESSION.levelThresholds[this.level]??null;}
 /** adds XP and returns how many levels were gained */
 award(xp:number){const before=this.level;this.xp=Math.min(1e9,this.xp+Math.max(0,Math.round(xp)));this.save();return this.level-before;}
 // the 2D life curve (+10 per level up to 5, then +5) scaled to the class' own life
 maxHp(classHp:number){
  const l=this.level,early=Math.min(l-1,PROGRESSION.legacyHpThroughLevel-1),late=Math.max(0,l-PROGRESSION.legacyHpThroughLevel);
  const curve=(PROGRESSION.baseMaxHp+early*PROGRESSION.maxHpPerLevel+late*PROGRESSION.laterMaxHpPerLevel)/PROGRESSION.baseMaxHp;
  return Math.round(classHp*curve)+this.stats().hp;
 }
 // ----- equipment -----
 stats():Stats{return equipmentStats(this.kit.snapshot().slots);}
 get slots(){return this.kit.snapshot().slots;}
 worn(slot:EquipmentSlot){const s=this.kit.snapshot();const uid=s.equipped?.[slot];return uid?s.items!.find(i=>i.uid===uid)??null:null;}
 get bag(){return this.kit.bag;}
 get free(){return this.kit.free;}
 equip(uid:string){const it=this.kit.bag.find(i=>i.uid===uid);if(!it)return false;const ok=this.kit.equip(EQUIPMENT[it.id].slot,it.id,uid);if(ok)this.save();return ok;}
 unequip(slot:EquipmentSlot){const ok=this.kit.equip(slot);if(ok)this.save();return ok;}
 /** a found item goes to the backpack; false when it is full */
 take(id:EquipmentId){const ok=this.kit.acquire({uid:crypto.randomUUID(),id});if(ok)this.save();return ok;}
 // ----- loot -----
 /** material left by a defeated creature (2D ResourceDrops: 4 credits per tier, 6 pieces and 25 per tier from a guardian) */
 material(biome:BiomeId,boss:boolean){const t=REGION_LOOT[biome].mat;return{tier:t,credits:(boss?25:4)*t,amount:boss?6:1};}
 collect(m:{tier:number;credits:number;amount:number}){this.economy.credits=Math.min(1e9,this.economy.credits+m.credits);this.economy.materials[m.tier-1]=Math.min(1e9,this.economy.materials[m.tier-1]+m.amount);this.save();}
 /** occasional equipment find: one item every 12 defeats, cycling the region's tier; a guardian's first defeat leaves its accessory */
 drop(biome:BiomeId,boss:string|null):EquipmentId|null{
  const tier=REGION_LOOT[biome].gear,pool=EQUIPMENT_IDS.filter(id=>EQUIPMENT[id].tier===tier);
  if(boss&&!this.bosses.has(boss)){this.bosses.add(boss);this.save();return pool.find(id=>EQUIPMENT[id].slot==='accessory')??null;}
  if(++this.lootKills%EQUIPMENT_DROP_INTERVAL!==0){this.save();return null;}
  this.save();return pool[(Math.floor(this.lootKills/EQUIPMENT_DROP_INTERVAL)-1)%pool.length];
 }
 bossXp(kind:string){return this.bosses.has(kind)?0:BOSS_XP[kind]??0;}
 // ----- base services (2D BaseEconomy.transact: one draft, nothing spent if it fails) -----
 service(a:ServiceAction){const r=transact(this.economy,this.kit.snapshot(),a);if(!r)return false;this.economy=r.economy;this.kit.restore(r.equipment);this.save();return true;}
 get potions(){return this.economy.potions;}
 drink(){if(this.economy.potions<=0)return false;this.economy.potions--;this.save();return true;}
}
