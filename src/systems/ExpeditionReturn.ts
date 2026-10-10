import { REGION_NAMES } from '../config/economy';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/game';
import type { JourneyArea } from './LocalJourney';
import type { MovementBounds, Obstacle } from './Movement';
import type { Vec2 } from '../utils/math';

// One personal destination, independent of combat checkpoints and inventories.
export type ExpeditionReturn = { area: Exclude<JourneyArea, 'base'>; position: Vec2 };
export function validExpeditionReturn(raw: unknown): ExpeditionReturn | undefined {
  const p = raw as { area?: JourneyArea; position?: Vec2 } | undefined;
  if (!p || !p.area || p.area === 'base' || !Object.hasOwn(REGION_NAMES, p.area) ||
      !p.position || !Number.isFinite(p.position.x) || !Number.isFinite(p.position.y) ||
      p.position.x < 0 || p.position.x > 20000 || p.position.y < 0 || p.position.y > 20000) return;
  return { area: p.area, position: { x: p.position.x, y: p.position.y } };
}

// Test the original point first. Small local offsets handle occupied/changed ground;
// a normal region entry is the fallback, never a new respawn checkpoint.
export function safeExpeditionPosition(point: Vec2, radius: number, obstacles: readonly Obstacle[], bounds?: MovementBounds): Vec2 | undefined {
  const b = bounds ?? { left: 56, right: WORLD_WIDTH - 56, top: 56, bottom: WORLD_HEIGHT - 56 };
  const clear = (p: Vec2) => p.x >= b.left + radius && p.x <= b.right - radius &&
    p.y >= b.top + radius && p.y <= b.bottom - radius && obstacles.every(o => Math.hypot(p.x - o.x, p.y - o.y) >= radius + o.radius + 2);
  if (clear(point)) return { ...point };
  for (const reach of [32, 64, 96, 128, 160]) for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI / 8, p = { x: point.x + Math.cos(angle) * reach, y: point.y + Math.sin(angle) * reach };
    if (clear(p)) return p;
  }
}
