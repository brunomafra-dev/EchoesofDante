import type { Obstacle } from '../systems/Movement';
import type { SiroccoKind } from './sirocco';

export const DUNES = {
  width: 3200, height: 2200,
  bounds: { left: 160, right: 3020, top: 230, bottom: 1950 },
  entry: { x: 520, y: 1090 }, returnPortal: { x: 320, y: 1090 },
  checkpoint: { x: 1940, y: 1020 },
  ruin: { x: 1830, y: 850, radius: 145 },
  hollow: { x: 2640, y: 1160, radius: 215 },
} as const;

export const DUNES_ENCOUNTERS: readonly { id: number; kind: SiroccoKind; x: number; y: number }[] = [
  { id: 1010, kind: 'dunePouncer', x: 840, y: 1220 },
  { id: 1011, kind: 'glassSpitter', x: 1110, y: 560 },
  { id: 1012, kind: 'dunePouncer', x: 1280, y: 1450 },
  { id: 1013, kind: 'glassSpitter', x: 1740, y: 1650 },
  { id: 1014, kind: 'dunePouncer', x: 2120, y: 700 },
  { id: 1015, kind: 'glassSpitter', x: 2270, y: 1540 },
  { id: 1016, kind: 'dunePouncer', x: 2860, y: 620 },
];

export const DUNES_ROUTES = [
  { id: 'dunes-wind-shelf', name: 'Crista dos Ventos', x: 1290, y: 470, radius: 90 },
  { id: 'dunes-buried-vein', name: 'Veio Soterrado', x: 1550, y: 1690, radius: 100 },
] as const;

// A central broken ridge can be passed to the north or south. Decorations stay flat.
export const DUNES_ROCKS: readonly Obstacle[] = [
  { x: 780, y: 740, radius: 47 }, { x: 1010, y: 1120, radius: 55 },
  { x: 1290, y: 1160, radius: 66 }, { x: 1490, y: 1200, radius: 58 },
  { x: 1760, y: 1160, radius: 61 }, { x: 1900, y: 1330, radius: 48 },
  { x: 1830, y: 785, radius: 40 }, { x: 2270, y: 630, radius: 53 },
  { x: 2060, y: 1710, radius: 62 }, { x: 2850, y: 1660, radius: 59 },
];
