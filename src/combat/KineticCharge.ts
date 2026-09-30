import { KINETIC_CHARGE } from '../config/game';
import type { Vec2 } from '../utils/math';
import { inMeleeArc } from './HitDetection';

type ChargeTarget = { position: Vec2; radius: number; isDead: boolean };
export type KineticPhase = 'READY' | 'CHARGING' | 'RELEASE';
export type KineticPose = { phase: KineticPhase; level: number; swingProgress: number };

export class KineticCharge {
  phase: KineticPhase = 'READY';
  angle = 0;
  damage: number = KINETIC_CHARGE.minDamage;
  private startedAt = 0;
  private releasedAt = -Infinity;
  private lastReleasedAt = -Infinity;
  private releaseLevel = 0;
  private hitResolved = false;

  tick(now: number): void {
    if (this.phase === 'RELEASE' && this.hitResolved && now - this.releasedAt >= KINETIC_CHARGE.releaseDuration) this.phase = 'READY';
  }

  start(now: number): boolean {
    if (this.phase !== 'READY' || now - this.lastReleasedAt < KINETIC_CHARGE.cooldown) return false;
    this.phase = 'CHARGING';
    this.startedAt = now;
    return true;
  }

  release(now: number, aim: number): boolean {
    if (this.phase !== 'CHARGING') return false;
    this.releaseLevel = this.level(now);
    this.damage = Math.round(KINETIC_CHARGE.minDamage + (KINETIC_CHARGE.maxDamage - KINETIC_CHARGE.minDamage) * this.releaseLevel);
    this.angle = aim;
    this.releasedAt = now;
    this.lastReleasedAt = now;
    this.hitResolved = false;
    this.phase = 'RELEASE';
    return true;
  }

  stop(): void { this.phase = 'READY'; }

  level(now: number): number {
    if (this.phase === 'RELEASE') return this.releaseLevel;
    if (this.phase !== 'CHARGING') return 0;
    return Math.max(0, Math.min(1, (now - this.startedAt - KINETIC_CHARGE.minCharge) / (KINETIC_CHARGE.maxCharge - KINETIC_CHARGE.minCharge)));
  }

  pose(now: number): KineticPose {
    return {
      phase: this.phase,
      level: this.level(now),
      swingProgress: this.phase === 'RELEASE' ? Math.min(1, (now - this.releasedAt) / KINETIC_CHARGE.releaseDuration) : 0,
    };
  }

  getProgress(now: number): number { return Math.min(1, (now - this.lastReleasedAt) / KINETIC_CHARGE.cooldown); }

  takeHits<T extends ChargeTarget>(now: number, origin: Vec2, targets: ReadonlyArray<T>): T[] {
    if (this.phase !== 'RELEASE' || this.hitResolved || now - this.releasedAt < KINETIC_CHARGE.hitDelay) return [];
    this.hitResolved = true;
    const hits: T[] = [];
    for (const target of targets) {
      if (!target.isDead && inMeleeArc(origin, this.angle, target.position, KINETIC_CHARGE.hitRange, KINETIC_CHARGE.hitHalfAngle, target.radius)) hits.push(target);
    }
    return hits;
  }
}
