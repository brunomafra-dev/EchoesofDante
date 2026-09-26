import { PLAYER } from '../config/game';
import { inMeleeArc } from './HitDetection';
import type { Vec2 } from '../utils/math';

export class SaberAttack {
  private lastAt = -Infinity;

  canUse(now: number): boolean { return now - this.lastAt >= PLAYER.attackCooldown; }

  use(now: number, origin: Vec2, facing: number, targets: ReadonlyArray<{ position: Vec2; radius: number; isDead: boolean }>): number[] {
    if (!this.canUse(now)) return [];
    this.lastAt = now;
    const hits: number[] = [];
    targets.forEach((target, index) => {
      if (!target.isDead && inMeleeArc(origin, facing, target.position, PLAYER.attackRange, PLAYER.attackHalfAngle, target.radius)) hits.push(index);
    });
    return hits;
  }
}
