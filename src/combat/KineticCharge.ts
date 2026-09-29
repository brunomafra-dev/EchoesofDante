import { KINETIC_CHARGE } from '../config/game';
import type { Vec2 } from '../utils/math';
import { inMeleeArc } from './HitDetection';

type ChargeTarget = { position: Vec2; radius: number; isDead: boolean };

export class KineticCharge {
  private lastAt = -Infinity;
  private activeUntil = -Infinity;
  private readonly hitTargets = new Set<ChargeTarget>();
  readonly direction: Vec2 = { x: 1, y: 0 };
  angle = 0;

  start(now: number, aim: number): boolean {
    if (this.active(now) || now - this.lastAt < KINETIC_CHARGE.cooldown) return false;
    this.lastAt = now;
    this.activeUntil = now + KINETIC_CHARGE.duration;
    this.angle = aim;
    this.direction.x = Math.cos(aim);
    this.direction.y = Math.sin(aim);
    this.hitTargets.clear();
    return true;
  }

  active(now: number): boolean { return now < this.activeUntil; }

  stop(): void { this.activeUntil = -Infinity; }

  getProgress(now: number): number {
    return Math.min(1, (now - this.lastAt) / KINETIC_CHARGE.cooldown);
  }

  advance<T extends ChargeTarget>(before: Vec2, after: Vec2, targets: ReadonlyArray<T>): T[] {
    const hits: T[] = [];
    for (const target of targets) {
      if (target.isDead || this.hitTargets.has(target)) continue;
      // Check both ends of this frame's actual, collision-resolved movement.
      if (inMeleeArc(before, this.angle, target.position, KINETIC_CHARGE.hitRange, KINETIC_CHARGE.hitHalfAngle, target.radius)
        || inMeleeArc(after, this.angle, target.position, KINETIC_CHARGE.hitRange, KINETIC_CHARGE.hitHalfAngle, target.radius)) {
        this.hitTargets.add(target);
        hits.push(target);
      }
    }
    return hits;
  }
}
