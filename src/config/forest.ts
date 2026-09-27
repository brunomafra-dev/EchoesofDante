import type { Vec2 } from '../utils/math';

// Authored layout: shared by scenery and spawn placement, with no runtime spawning.
export const FOREST_ENTRY: Vec2 = { x: 400, y: 1230 };
export const FOREST_PATHS = [
  { width: 230, points: [FOREST_ENTRY, { x: 500, y: 1070 }, { x: 760, y: 930 }, { x: 1100, y: 760 }, { x: 1300, y: 590 }, { x: 1500, y: 470 }, { x: 1760, y: 280 }] },
  { width: 170, points: [{ x: 760, y: 930 }, { x: 550, y: 740 }, { x: 460, y: 530 }] },
  { width: 190, points: [{ x: 1100, y: 760 }, { x: 1410, y: 880 }, { x: 1770, y: 1010 }] },
];
export const FOREST_CLEARINGS = [
  { x: 400, y: 1210, rx: 220, ry: 150 },
  { x: 790, y: 920, rx: 240, ry: 200 },
  { x: 470, y: 530, rx: 210, ry: 180 },
  { x: 1500, y: 470, rx: 240, ry: 190 },
  { x: 1760, y: 1010, rx: 230, ry: 180 },
  { x: 1760, y: 280, rx: 170, ry: 125 },
];
export const FOREST_SPAWNS: Vec2[] = [
  { x: 800, y: 900 }, { x: 870, y: 830 },
  { x: 430, y: 540 }, { x: 540, y: 490 },
  { x: 1440, y: 500 }, { x: 1580, y: 450 },
  { x: 1770, y: 980 }, { x: 1830, y: 1050 },
];
export const FOREST_ROCKS = [
  [290, 1060, 48], [650, 1190, 58], [680, 700, 65],
  [920, 1100, 55], [990, 610, 68], [1190, 940, 60],
  [1260, 390, 55], [1450, 720, 62], [1680, 710, 70],
  [1560, 1170, 60], [1920, 850, 55], [1850, 1200, 45],
  [300, 700, 65], [650, 360, 54], [1880, 440, 58],
] as const;
