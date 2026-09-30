import type { MovementBounds } from '../systems/Movement';
import type { Vec2 } from '../utils/math';

// The first chamber is a compact pocket inside the existing camera world.
export const CAVERN_BOUNDS: MovementBounds = { left: 480, right: 1680, top: 380, bottom: 1120 };
export const CAVERN_ENTRY: Vec2 = { x: 630, y: 950 };
export const CAVERN_HOLLOWS: readonly Vec2[] = [{ x: 1050, y: 730 }, { x: 1260, y: 900 }];
