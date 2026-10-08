// Optical coordinates only. Combat continues to use the ground-plane ray.
// Rifle, barrel glow, tracers and beam share this axis in every presentation.
export const HUNTER_MUZZLE_DISTANCE = 42;
export function hunterRiflePose(angle: number): { x: number; y: number; muzzleX: number; muzzleY: number } {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const x = 10 * cos - 6 * sin, y = -25 + 10 * sin;
  return { x, y, muzzleX: x + HUNTER_MUZZLE_DISTANCE * cos, muzzleY: y + HUNTER_MUZZLE_DISTANCE * sin };
}
