import type { Obstacle } from '../systems/Movement';
import type { CreatureKind } from './expansion';

export const SIROCCO = {
  cameraWidth: 5250,
  worldHeight: 1500,
  bounds: { left: 150, right: 5100, top: 330, bottom: 1190 },
  entry: { x: 470, y: 805 },
  returnPortal: { x: 315, y: 805 },
  checkpoint: { x: 1510, y: 805 },
  frontierCheckpoint: { x: 3090, y: 805 },
  signal: { x: 2240, y: 740, radius: 145 },
  frontierEntryX: 3020,
  end: { x: 4880, y: 805, radius: 145 },
  exitPortal: { x: 4990, y: 805 },
} as const;

export type SiroccoKind = Extract<CreatureKind, 'dunePouncer' | 'glassSpitter'>;

// Fixed habitats remain avoidable and never unlock the exit.
export const SIROCCO_ENCOUNTERS = [
  { id: 1000, kind: 'dunePouncer', x: 780, y: 690 },
  { id: 1001, kind: 'dunePouncer', x: 1020, y: 1010 },
  { id: 1002, kind: 'glassSpitter', x: 1400, y: 590 },
  { id: 1003, kind: 'dunePouncer', x: 1605, y: 895 },
  { id: 1004, kind: 'glassSpitter', x: 1970, y: 1010 },
  { id: 1005, kind: 'dunePouncer', x: 2490, y: 665 },
  { id: 1006, kind: 'dunePouncer', x: 3310, y: 640 },
  { id: 1007, kind: 'glassSpitter', x: 3520, y: 1030 },
  { id: 1008, kind: 'dunePouncer', x: 4170, y: 920 },
  { id: 1009, kind: 'glassSpitter', x: 4590, y: 610 },
] as const;

export const SIROCCO_RENEWAL = { delayMs: 90_000, safeDistance: 480 } as const;

// A quiet, optional northern detour. It uses the existing one-time route XP path.
export const SIROCCO_ROUTES = [
  { id: 'sirocco-needle-shelf', name: 'Prateleira das Agulhas', x: 3750, y: 690, radius: 90,
    hint: 'Um desvio ao norte contorna a crista mineral.', residents: 'Um Cuspidor vítreo observa a margem.',
    tactic: 'A formação ancestral oferece espaço para contornar o disparo.' },
] as const;

export const SIROCCO_ROCKS: readonly Obstacle[] = [
  { x: 690, y: 480, radius: 48 }, { x: 1010, y: 970, radius: 55 },
  { x: 1190, y: 735, radius: 47 }, { x: 1510, y: 510, radius: 62 },
  { x: 1730, y: 1020, radius: 60 }, { x: 1900, y: 535, radius: 48 },
  { x: 2150, y: 945, radius: 55 }, { x: 2240, y: 786, radius: 34 },
  { x: 2460, y: 1000, radius: 70 }, { x: 2610, y: 550, radius: 50 },
  { x: 3190, y: 795, radius: 56 }, { x: 3420, y: 900, radius: 62 },
  { x: 3570, y: 720, radius: 48 }, { x: 3890, y: 970, radius: 72 },
  { x: 4050, y: 625, radius: 54 }, { x: 4310, y: 930, radius: 65 },
  { x: 4540, y: 770, radius: 56 }, { x: 4760, y: 555, radius: 62 },
  { x: 4750, y: 1060, radius: 66 },
];

export const SIROCCO_BORDERS: readonly Obstacle[] = [
  ...[440, 760, 1090, 1410, 1730, 2060, 2400, 2710, 3040, 3370, 3720, 4080, 4450, 4820]
    .map((x, i) => ({ x, y: 370 + (i % 3) * 13, radius: 58 })),
  ...[460, 820, 1180, 1520, 1870, 2220, 2570, 3050, 3430, 3820, 4210, 4610, 4890]
    .map((x, i) => ({ x, y: 1155 - (i % 2) * 16, radius: 64 })),
  { x: 5160, y: 535, radius: 78 }, { x: 5160, y: 1070, radius: 78 },
];
