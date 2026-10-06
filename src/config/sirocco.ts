import type { Obstacle } from '../systems/Movement';
import type { CreatureKind } from './expansion';

export const SIROCCO = {
  cameraWidth: 3000,
  worldHeight: 1500,
  bounds: { left: 150, right: 2850, top: 330, bottom: 1190 },
  entry: { x: 470, y: 805 },
  returnPortal: { x: 315, y: 805 },
  checkpoint: { x: 1510, y: 805 },
  signal: { x: 2240, y: 740, radius: 145 },
  end: { x: 2760, y: 805, radius: 120 },
} as const;

export type SiroccoKind = Extract<CreatureKind, 'dunePouncer' | 'glassSpitter'>;

export const SIROCCO_ENCOUNTERS = [
  { id: 1000, kind: 'dunePouncer', x: 780, y: 690 },
  { id: 1001, kind: 'dunePouncer', x: 1020, y: 1010 },
  { id: 1002, kind: 'glassSpitter', x: 1400, y: 590 },
  { id: 1003, kind: 'dunePouncer', x: 1605, y: 895 },
  { id: 1004, kind: 'glassSpitter', x: 1970, y: 1010 },
  { id: 1005, kind: 'dunePouncer', x: 2490, y: 665 },
] as const;

export const SIROCCO_ROCKS: readonly Obstacle[] = [
  { x: 690, y: 480, radius: 48 }, { x: 1010, y: 970, radius: 55 },
  { x: 1190, y: 735, radius: 47 }, { x: 1510, y: 510, radius: 62 },
  { x: 1730, y: 1020, radius: 60 }, { x: 1900, y: 535, radius: 48 },
  { x: 2150, y: 945, radius: 55 }, { x: 2240, y: 786, radius: 34 },
  { x: 2460, y: 1000, radius: 70 }, { x: 2610, y: 550, radius: 50 },
];

export const SIROCCO_BORDERS: readonly Obstacle[] = [
  ...[440, 760, 1090, 1410, 1730, 2060, 2400, 2710].map((x, i) => ({ x, y: 370 + (i % 3) * 13, radius: 58 })),
  ...[460, 820, 1180, 1520, 1870, 2220, 2570].map((x, i) => ({ x, y: 1155 - (i % 2) * 16, radius: 64 })),
  { x: 2815, y: 540, radius: 70 }, { x: 2815, y: 790, radius: 70 }, { x: 2815, y: 1040, radius: 70 },
];
