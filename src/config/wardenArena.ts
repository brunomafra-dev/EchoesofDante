import type { MovementBounds, Obstacle } from '../systems/Movement';

// A separate, compact place beyond the exterior threshold. The camera model and
// combat scale are unchanged; all solid formations stay around the fighting floor.
export const WARDEN_ARENA = {
  bounds: { left: 480, right: 1680, top: 380, bottom: 1120 } satisfies MovementBounds,
  entry: { x: 650, y: 760 },
  home: { x: 1170, y: 735 },
  introductionX: 850,
  return: { x: 540, y: 760, radius: 100 },
} as const;

export const WARDEN_ARENA_FOOTPRINTS: readonly Obstacle[] = [
  { x: 560, y: 406, radius: 55 },
  { x: 805, y: 418, radius: 55 },
  { x: 1120, y: 412, radius: 52 },
  { x: 1420, y: 419, radius: 62 },
  { x: 1650, y: 464, radius: 62 },
  { x: 1680, y: 715, radius: 48 },
  { x: 1660, y: 940, radius: 52 },
  { x: 1600, y: 1070, radius: 64 },
  { x: 1320, y: 1088, radius: 58 },
  { x: 940, y: 1100, radius: 60 },
  { x: 620, y: 1080, radius: 65 },
  { x: 490, y: 560, radius: 48 },
  { x: 490, y: 980, radius: 48 },
];

// Bases only: the thin roots and embedded floor fragments remain traversable.
export const WARDEN_ARENA_MINERAL_BASES: readonly Obstacle[] = [
  { x: 821, y: 481, radius: 26 },
  { x: 1218, y: 465, radius: 26 },
  { x: 1602, y: 640, radius: 29 },
  { x: 1572, y: 1015, radius: 25 },
  { x: 1301, y: 1090, radius: 32 },
  { x: 702, y: 1105, radius: 26 },
];
