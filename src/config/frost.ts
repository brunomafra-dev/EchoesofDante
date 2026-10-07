import type { Obstacle } from '../systems/Movement';
export type FrostKind = 'frostPouncer' | 'frostSpitter';
export const FROST = {
  width: 3000, height: 1800,
  bounds: { left: 170, right: 2810, top: 330, bottom: 1430 },
  entry: { x: 440, y: 1000 }, returnPortal: { x: 250, y: 1000 },
  checkpoint: { x: 1630, y: 900 },
  relay: { x: 1730, y: 610, radius: 145 },
  frontier: { x: 2640, y: 930, radius: 130 },
} as const;
export const FROST_ROUTES = [
  { id: 'frost-warm-vein', name: 'Veio Morno', x: 990, y: 520, radius: 100 },
  { id: 'frost-root-bed', name: 'Raízes Fossilizadas', x: 2110, y: 1320, radius: 100 },
] as const;
export const FROST_ROCKS: readonly Obstacle[] = [
  { x: 810, y: 730, radius: 65 }, { x: 920, y: 735, radius: 54 },
  { x: 1290, y: 1160, radius: 55 }, { x: 1430, y: 1190, radius: 57 },
  { x: 2160, y: 730, radius: 57 }, { x: 2300, y: 680, radius: 63 },
  { x: 1730, y: 575, radius: 43 },
];
export const FROST_ENCOUNTERS: readonly { id: number; kind: FrostKind; x: number; y: number }[] = [
  { id: 1200, kind: 'frostPouncer', x: 790, y: 1090 },
  { id: 1201, kind: 'frostSpitter', x: 1110, y: 510 },
  { id: 1202, kind: 'frostPouncer', x: 1310, y: 710 },
  { id: 1203, kind: 'frostSpitter', x: 1540, y: 1280 },
  { id: 1204, kind: 'frostPouncer', x: 1910, y: 1000 },
  { id: 1205, kind: 'frostPouncer', x: 2040, y: 1240 },
  { id: 1206, kind: 'frostSpitter', x: 2390, y: 1110 },
  { id: 1207, kind: 'frostPouncer', x: 2530, y: 540 },
];
