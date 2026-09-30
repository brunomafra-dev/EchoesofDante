import type { MovementBounds } from '../systems/Movement';
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
} as const;
export const DEEP_OBSTACLES = [
  { x: 1760, y: 775, radius: 96 },
  { x: 1875, y: 1035, radius: 90 },
  { x: 2110, y: 1090, radius: 105 },
  { x: 2220, y: 652, radius: 72 }, // The buried structure has a physical footprint.
  { x: 2350, y: 1015, radius: 88 },
  { x: 2180, y: 355, radius: 93 },
  { x: 2470, y: 379, radius: 82 },
] as const;
