import { PLAYER } from '../config/game';
import { inMeleeArc } from './HitDetection';
import type { Vec2 } from '../utils/math';

export type SaberPhase = 'READY' | 'WINDUP' | 'SWING' | 'RECOVERY';

export type SaberPose = {
  phase: SaberPhase;
  relativeAngle: number;
  worldAngle: number;
  swingProgress: number;
};

type AttackTarget = { position: Vec2; radius: number; isDead: boolean };

const WINDUP_MS = 32;
const SWING_MS = 128;
const RECOVERY_MS = 94;
const READY_ANGLE = -0.42;
const START_ANGLE = -PLAYER.attackHalfAngle;
const END_ANGLE = PLAYER.attackHalfAngle;

export class SaberAttack {
  private lastAt = -Infinity;
  private lastSweepProgress = 0;
  private hitTargets = new Set<AttackTarget>();

  canUse(now: number): boolean { return now - this.lastAt >= PLAYER.attackCooldown; }

  start(now: number): boolean {
    if (!this.canUse(now)) return false;
    this.lastAt = now;
    this.lastSweepProgress = 0;
    this.hitTargets.clear();
    return true;
  }

  pose(now: number, facing: number): SaberPose {
    const elapsed = now - this.lastAt;
    let phase: SaberPhase = 'READY';
    let relativeAngle = READY_ANGLE;
    let swingProgress = 0;

    if (elapsed >= 0 && elapsed < WINDUP_MS) {
      phase = 'WINDUP';
      relativeAngle = READY_ANGLE + (START_ANGLE - READY_ANGLE) * (elapsed / WINDUP_MS);
    } else if (elapsed >= WINDUP_MS && elapsed < WINDUP_MS + SWING_MS) {
      phase = 'SWING';
      swingProgress = (elapsed - WINDUP_MS) / SWING_MS;
      relativeAngle = START_ANGLE + (END_ANGLE - START_ANGLE) * swingProgress;
    } else if (elapsed >= WINDUP_MS + SWING_MS && elapsed < WINDUP_MS + SWING_MS + RECOVERY_MS) {
      phase = 'RECOVERY';
      swingProgress = 1;
      relativeAngle = END_ANGLE + (READY_ANGLE - END_ANGLE) * ((elapsed - WINDUP_MS - SWING_MS) / RECOVERY_MS);
    }

    return { phase, relativeAngle, worldAngle: facing + relativeAngle, swingProgress };
  }

  advance<T extends AttackTarget>(now: number, origin: Vec2, facing: number, targets: ReadonlyArray<T>): { pose: SaberPose; hits: T[] } {
    const pose = this.pose(now, facing);
    if (!Number.isFinite(this.lastAt)) return { pose, hits: [] };
    const progress = Math.min(1, Math.max(0, (now - this.lastAt - WINDUP_MS) / SWING_MS));
    if (progress <= this.lastSweepProgress) return { pose, hits: [] };

    // Cover the entire angular distance since the last frame so slow frames cannot skip targets.
    const fromAngle = START_ANGLE + (END_ANGLE - START_ANGLE) * this.lastSweepProgress;
    const toAngle = START_ANGLE + (END_ANGLE - START_ANGLE) * progress;
    const middle = facing + (fromAngle + toAngle) / 2;
    const halfWidth = (toAngle - fromAngle) / 2 + 0.10;
    const hits: T[] = [];
    for (const target of targets) {
      if (target.isDead || this.hitTargets.has(target)) continue;
      if (inMeleeArc(origin, middle, target.position, PLAYER.attackRange, halfWidth, target.radius)) {
        this.hitTargets.add(target);
        hits.push(target);
      }
    }
    this.lastSweepProgress = progress;
    return { pose, hits };
  }
}
