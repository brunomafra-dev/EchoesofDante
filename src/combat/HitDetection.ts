import { angleDifference, distance, type Vec2 } from '../utils/math';

export function inMeleeArc(origin: Vec2, facing: number, target: Vec2, range: number, halfAngle: number, targetRadius = 0): boolean {
  const separation = distance(origin, target);
  if (separation > range + targetRadius) return false;
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  return Math.abs(angleDifference(angle, facing)) <= halfAngle + Math.asin(Math.min(1, targetRadius / Math.max(separation, targetRadius)));
}

// A moving crosswise slash: cover the whole distance travelled since the last frame.
export function inShockwaveSweep(origin: Vec2, facing: number, target: Vec2, from: number, to: number, halfWidth: number, thickness: number, targetRadius = 0): boolean {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const forward = dx * Math.cos(facing) + dy * Math.sin(facing);
  const sideways = -dx * Math.sin(facing) + dy * Math.cos(facing);
  return Math.abs(sideways) <= halfWidth + targetRadius
    && forward >= from - thickness / 2 - targetRadius
    && forward <= to + thickness / 2 + targetRadius;
}
