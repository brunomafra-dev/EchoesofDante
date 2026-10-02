import type { MovementBounds, Obstacle } from '../systems/Movement';
import type { Vec2 } from '../utils/math';

// The first chamber is a compact pocket inside the existing camera world.
export const CAVERN_BOUNDS: MovementBounds = { left: 480, right: 1680, top: 380, bottom: 1120 };
export const CAVERN_ENTRY: Vec2 = { x: 630, y: 950 };
export const CAVERN_HOLLOWS: readonly Vec2[] = [{ x: 1010, y: 990 }, { x: 1350, y: 750 }];
export const CAVERN_DEPTH_OPENING = { x: 1620, y: 490, radius: 110 } as const;
export const DEEP_AREA = {
  right: 2470,
  cameraWidth: 2700,
  signalX: 2190,
  signalY: 635,
  signalRadius: 150,
  collapseX: 1715,
  collapseY: 488,
  entry: { x: 1870, y: 580 },
  entryX: 1850,
  end: { x: 2425, y: 735, radius: 90 },
} as const;
export const DEEP_OBSTACLES = [
  { x: 1760, y: 775, radius: 96 },
  { x: 1875, y: 1035, radius: 90 },
  { x: 2110, y: 1090, radius: 105 },
  { x: 2220, y: 652, radius: 72 }, // The buried structure has a physical footprint.
  { x: 2350, y: 1015, radius: 88 },
  { x: 2180, y: 355, radius: 93 },
  { x: 2470, y: 379, radius: 82 },
  { x: 1995, y: 740, radius: 38 }, // Divides the routes, with room on both sides.
  { x: 2010, y: 1025, radius: 40 }, // Mineral basin's exposed base.
  { x: 2500, y: 738, radius: 36 }, // Visible buried lip at the uncharted limit.
  { x: 2420, y: 1115, radius: 40 }, // Foreground formation's lower physical base.
] as const;

// Two residents, separate habitats. Existing chase/patrol and XP rules apply.
export const DEEP_HOLLOWS: readonly (readonly Vec2[])[] = [
  [{ x: 2110, y: 845 }, { x: 2160, y: 870 }, { x: 2180, y: 817 }],
  [{ x: 2350, y: 660 }, { x: 2330, y: 710 }, { x: 2360, y: 765 }],
];

// Authored wall masses share visual placement and compact base footprints.
export const DEEP_RIDGES: readonly { x: number; y: number; width: number; height: number; angle: number; bases: readonly Obstacle[] }[] = [
  { x: 1910, y: 416, width: 250, height: 145, angle: -8, bases: [{ x: 1850, y: 435, radius: 46 }, { x: 1970, y: 441, radius: 46 }] },
  { x: 2130, y: 405, width: 265, height: 145, angle: 5, bases: [{ x: 2070, y: 429, radius: 46 }, { x: 2190, y: 432, radius: 48 }] },
  { x: 2390, y: 459, width: 250, height: 140, angle: 8, bases: [{ x: 2330, y: 482, radius: 43 }, { x: 2450, y: 487, radius: 45 }] },
  { x: 1900, y: 1024, width: 220, height: 135, angle: -5, bases: [{ x: 1850, y: 1040, radius: 43 }, { x: 1950, y: 1045, radius: 43 }] },
  { x: 2245, y: 1050, width: 325, height: 160, angle: 4, bases: [{ x: 2180, y: 1068, radius: 58 }, { x: 2315, y: 1070, radius: 58 }] },
];
