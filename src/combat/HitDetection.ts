import { angleDifference, distance, type Vec2 } from '../utils/math';

export function inMeleeArc(origin: Vec2, facing: number, target: Vec2, range: number, halfAngle: number, targetRadius = 0): boolean {
  const separation = distance(origin, target);
  if (separation > range + targetRadius) return false;
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  return Math.abs(angleDifference(angle, facing)) <= halfAngle + Math.asin(Math.min(1, targetRadius / Math.max(separation, targetRadius)));
}
