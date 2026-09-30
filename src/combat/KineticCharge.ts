import { KINETIC_CHARGE } from '../config/game';
import type { Vec2 } from '../utils/math';
import { inShockwaveSweep } from './HitDetection';

type ChargeTarget = { position: Vec2; radius: number; isDead: boolean };
export type KineticPhase = 'READY' | 'CHARGING' | 'RELEASE';
export type KineticPose = { phase: KineticPhase; level: number; swingProgress: number };

export class KineticCharge {
  phase: KineticPhase = 'READY';
  angle = 0;
  readonly origin: Vec2 = { x: 0, y: 0 };
  damage: number = KINETIC_CHARGE.minDamage;
  private startedAt = 0;
  private releasedAt = -Infinity;
  private lastReleasedAt = -Infinity;
  private releaseLevel = 0;
  private waveEnabled = false;
  private lastWaveDistance = 0;
  private readonly hitTargets = new Set<ChargeTarget>();

  tick(now: number): void {
    if (this.phase === 'RELEASE' && now - this.releasedAt >= KINETIC_CHARGE.releaseDuration) this.phase = 'READY';
  }

  start(now: number): boolean {
    if (this.phase !== 'READY' || now - this.lastReleasedAt < KINETIC_CHARGE.cooldown) return false;
    this.phase = 'CHARGING';
    this.startedAt = now;
    return true;
  }

  release(now: number, aim: number, origin: Vec2): boolean {
    if (this.phase !== 'CHARGING') return false;
    this.releaseLevel = this.level(now);
    this.damage = Math.round(KINETIC_CHARGE.minDamage + (KINETIC_CHARGE.maxDamage - KINETIC_CHARGE.minDamage) * this.releaseLevel);
    this.angle = aim;
    this.origin.x = origin.x;
    this.origin.y = origin.y;
    this.releasedAt = now;
    this.lastReleasedAt = now;
    this.lastWaveDistance = 0;
    this.hitTargets.clear();
    this.waveEnabled = true;
    this.phase = 'RELEASE';
    return true;
  }

  stop(): void { this.phase = 'READY'; this.waveEnabled = false; }

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

  waveProgress(now: number): number {
    if (!Number.isFinite(this.releasedAt)) return 0;
    return Math.max(0, Math.min(1, (now - this.releasedAt - KINETIC_CHARGE.hitDelay) / KINETIC_CHARGE.waveDuration));
  }

  waveVisible(now: number): boolean {
    return this.waveEnabled && now >= this.releasedAt + KINETIC_CHARGE.hitDelay
      && now < this.releasedAt + KINETIC_CHARGE.hitDelay + KINETIC_CHARGE.waveDuration;
  }

  get wavePending(): boolean { return this.waveEnabled; }

  takeHits<T extends ChargeTarget>(now: number, targets: ReadonlyArray<T>): T[] {
    if (!this.waveEnabled || now - this.releasedAt < KINETIC_CHARGE.hitDelay) return [];
    const to = KINETIC_CHARGE.waveTravel * this.waveProgress(now);
    const hits: T[] = [];
    for (const target of targets) {
      if (target.isDead || this.hitTargets.has(target)) continue;
      if (inShockwaveSweep(this.origin, this.angle, target.position,
        KINETIC_CHARGE.waveStart + this.lastWaveDistance, KINETIC_CHARGE.waveStart + to,
        KINETIC_CHARGE.waveHalfWidth, KINETIC_CHARGE.waveThickness, target.radius)) {
        this.hitTargets.add(target);
        hits.push(target);
      }
    }
    this.lastWaveDistance = to;
    if (to >= KINETIC_CHARGE.waveTravel) this.waveEnabled = false;
    return hits;
  }
}
