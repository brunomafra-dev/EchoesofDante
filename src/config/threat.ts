import type { JourneyArea } from '../systems/LocalJourney';
import type { Enemy } from '../entities/Enemy';

// Fixed regional tuning. Equipment, level and potions never change these values.
export const REGIONAL_THREAT = {
  base: { hp:1, damage:1, xp:0 }, forest: { hp:1, damage:1, xp:15 },
  cavern: { hp:1.12, damage:1.08, xp:18 }, warden: { hp:1.25, damage:1.15, xp:120 },
  valley: { hp:1.3, damage:1.12, xp:22 }, arid: { hp:1.4, damage:1.2, xp:25 },
  dunes: { hp:1.55, damage:1.25, xp:28 }, sandpit: { hp:1.45, damage:1.25, xp:180 },
  frost: { hp:1.6, damage:1.3, xp:30 }, icecave: { hp:1.75, damage:1.35, xp:34 },
  icenest: { hp:1.6, damage:1.4, xp:220 },
} satisfies Record<JourneyArea,{hp:number;damage:number;xp:number}>;
export function regionalThreat(area:JourneyArea,x=0) {
  if(area==='cavern'&&x>=2550)return {hp:1.35,damage:1.15,xp:22};
  if(area==='cavern'&&x>=1800)return {hp:1.22,damage:1.1,xp:20};
  return REGIONAL_THREAT[area];
}
// Applied once when each actor is created, including renewed habitats.
export function tuneEnemy(enemy:Enemy,area:JourneyArea):void {
  const max=Math.round(enemy.health.max*regionalThreat(area,enemy.position.x).hp);
  enemy.health.max=max;enemy.health.current=max;
}
export const deathCreditLoss=(credits:number):number=>Math.floor(credits*.1);
