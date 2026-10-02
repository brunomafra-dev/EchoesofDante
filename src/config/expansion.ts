import type { Obstacle } from '../systems/Movement';

export const EXPANSION = {
  right: 5350,
  cameraWidth: 5580,
  deeperX: 2550,
  exteriorX: 4370,
  deeperRespawn: { x: 2580, y: 980 },
  exteriorRespawn: { x: 4600, y: 740 },
  fragment: { x: 4870, y: 620, radius: 140 },
  approach: { x: 5210, y: 740, radius: 95 },
} as const;

export type CreatureKind = 'skitter' | 'spitter';
export const CREATURES = {
  skitter: { hp: 42, speed: 175, radius: 14, detection: 280, range: 60, damage: 9, cooldown: 1150, windup: 320, lungeSpeed: 310, lungeMs: 140 },
  spitter: { hp: 85, speed: 65, radius: 22, detection: 390, range: 300, damage: 10, cooldown: 2300, windup: 700, retreatRange: 150, shotSpeed: 240, shotRange: 520, shotRadius: 7 },
} as const;

// Fixed run IDs start after Forest (0–7), first Cavern (8–9), Deep Cavern (10–11).
// Groups are habitats, never unlock conditions. Quiet gaps and a lower side loop remain.
export const EXPANSION_ENCOUNTERS = [
  { name: 'presentation', x: 2850, residents: [
    { kind: 'skitter', x: 2840, y: 590 }, { kind: 'skitter', x: 2890, y: 800 },
  ] },
  { name: 'first-combination', x: 3230, residents: [
    { kind: 'spitter', x: 3220, y: 555 }, { kind: 'crawler', x: 3220, y: 760 }, { kind: 'skitter', x: 3310, y: 820 },
  ] },
  { name: 'buried-ribs', x: 3790, residents: [
    { kind: 'spitter', x: 3730, y: 570 }, { kind: 'crawler', x: 3810, y: 690 },
    { kind: 'skitter', x: 3780, y: 835 }, { kind: 'skitter', x: 3870, y: 860 },
  ] },
  { name: 'ascent', x: 4140, residents: [
    { kind: 'spitter', x: 4110, y: 560 }, { kind: 'crawler', x: 4140, y: 865 },
    { kind: 'crawler', x: 4220, y: 820 }, { kind: 'skitter', x: 4210, y: 640 },
  ] },
  { name: 'exterior-edge', x: 4900, residents: [
    // Southern habitats leave the direct discovery route quiet; both remain avoidable.
    { kind: 'skitter', x: 4750, y: 1090 }, { kind: 'crawler', x: 4900, y: 1095 },
  ] },
] as const;

export type WallMass = { x: number; y: number; width: number; height: number; angle: number; bases: readonly Obstacle[] };
const wall = (x: number, y: number, width: number, height: number, angle = 0): WallMass => ({
  x, y, width, height, angle,
  bases: [{ x: x - width * 0.22, y: y + 15, radius: width * 0.21 }, { x: x + width * 0.22, y: y + 15, radius: width * 0.21 }],
});
export const EXPANSION_WALLS = [
  wall(2655, 480, 310, 190, -7), wall(2910, 445, 350, 180, 5),
  wall(3160, 430, 320, 180, -6), wall(3470, 475, 330, 195, 9),
  wall(3740, 430, 370, 195, -3), wall(4060, 445, 330, 180, 6),
  wall(4310, 500, 260, 180, 18),
  wall(2690, 1120, 310, 175, 3), wall(2990, 1080, 340, 170, -8),
  wall(3300, 1130, 300, 170, 4), wall(3610, 1090, 300, 170, -4),
  wall(3910, 1110, 330, 180, 8), wall(4190, 1080, 300, 175, -6),
] as const;

export const EXPANSION_ROCKS = [
  { x: 2750, y: 770, radius: 38 },
  { x: 3070, y: 700, radius: 44 },
  { x: 3440, y: 775, radius: 58 },
  { x: 3450, y: 1020, radius: 33 }, // Side basin mineral's exposed base.
  { x: 3810, y: 570, radius: 50 }, // Larger ancestral ribs' grounded base.
  { x: 3640, y: 660, radius: 42 },
  { x: 3970, y: 735, radius: 43 },
  { x: 4310, y: 880, radius: 42 },
  { x: 4620, y: 510, radius: 48 },
  { x: 4710, y: 960, radius: 48 },
  { x: 5020, y: 460, radius: 62 },
  { x: 5100, y: 980, radius: 62 },
  { x: 4870, y: 595, radius: 38 }, // Investigable remnant's base.
  { x: 4555, y: 510, radius: 38 }, { x: 4685, y: 510, radius: 38 },
  { x: 4650, y: 960, radius: 35 }, { x: 4770, y: 960, radius: 35 },
  { x: 4950, y: 460, radius: 48 }, { x: 5090, y: 460, radius: 48 },
  { x: 5030, y: 980, radius: 48 }, { x: 5170, y: 980, radius: 48 },
  { x: 5200, y: 820, radius: 55 }, { x: 5385, y: 915, radius: 58 },
  { x: 5360, y: 740, radius: 42 }, // Physical, visible buried limit beyond the approach.
] as const;
