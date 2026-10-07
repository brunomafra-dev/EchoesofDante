import Phaser from 'phaser';
import { HUNTER } from '../config/classes';
import { inShockwaveSweep } from './HitDetection';
import type { Enemy } from '../entities/Enemy';
import type { Obstacle, MovementBounds } from '../systems/Movement';
import type { Vec2 } from '../utils/math';
type Shot = { view: Phaser.GameObjects.Rectangle; active: boolean; x: number; y: number; angle: number; travelled: number; range: number; speed: number; damage: number; precision: boolean; radius: number };
// A small fixed pool. Movement and damage still use the common gameplay contracts.
export class HunterCombat {
  momentum = 0;
  firedUntil = 0;
  private lastAt = -Infinity;
  private previous?: Vec2;
  private readonly shots: Shot[];
  constructor(scene: Phaser.Scene, private rank: (id: 'saberArc' | 'saberReach' | 'chargeWidth') => number) {
    this.shots = Array.from({ length: 8 }, () => ({ view: scene.add.rectangle(0, 0, 24, 4, 0x5fe6d8, .9).setVisible(false),
      active: false, x: 0, y: 0, angle: 0, travelled: 0, range: 0, speed: 0, damage: 0, precision: false, radius: 4 }));
  }
  fire(now: number, position: Vec2, angle: number, precisionDamage?: number): boolean {
    if (precisionDamage === undefined && now - this.lastAt < HUNTER.shotCooldown) return false;
    const shot = this.shots.find(s => !s.active); if (!shot) return false;
    const precision = precisionDamage !== undefined;
    const boost = this.momentum / 100;
    Object.assign(shot, position, { active: true, angle, travelled: 0,
      range: precision ? HUNTER.precisionRange : HUNTER.shotRange + this.rank('saberReach') * 60,
      speed: precision ? HUNTER.precisionSpeed : HUNTER.shotSpeed,
      damage: Math.round((precisionDamage ?? HUNTER.shotDamage + this.rank('saberArc') * 3) * (1 + boost * .35)), precision,
      radius: precision ? 4 + this.rank('chargeWidth') * 2 : 4 });
    this.momentum = Math.max(0, this.momentum - (precision ? 35 : 9));
    shot.view.setDisplaySize(precision ? 45 : 24, precision ? 7 : 4).setVisible(true);
    this.lastAt = now; this.firedUntil = now + 150; return true;
  }
  update(dt: number, position: Vec2, moving: boolean, targets: readonly Enemy[], obstacles: readonly Obstacle[], bounds: MovementBounds | undefined,
    onHit: (enemy: Enemy, damage: number, angle: number, precision: boolean) => void): void {
    const engaged = targets.some(e => !e.isDead && Math.hypot(e.position.x-position.x,e.position.y-position.y) < 620);
    const travelled = this.previous ? Math.hypot(position.x-this.previous.x,position.y-this.previous.y) : 0;
    this.previous = { ...position };
    this.momentum = Phaser.Math.Clamp(this.momentum + dt * (moving && travelled > .1 && engaged ? HUNTER.momentumPerSecond : -HUNTER.momentumDecay), 0, HUNTER.momentumMax);
    for (const s of this.shots) if (s.active) {
      const travel = Math.min(s.speed * dt, s.range - s.travelled), previous = { x: s.x, y: s.y };
      // Pick the first obstruction/target along the swept segment; cover cannot be bypassed.
      let first = travel + 1, target: Enemy | undefined;
      const entry = (p: Vec2, radius: number): number => {
        const dx=p.x-previous.x,dy=p.y-previous.y, along=dx*Math.cos(s.angle)+dy*Math.sin(s.angle);
        const across=dx*-Math.sin(s.angle)+dy*Math.cos(s.angle), expanded=radius+s.radius;
        return Math.max(0, along-Math.sqrt(Math.max(0,expanded*expanded-across*across)));
      };
      for (const o of obstacles) if (inShockwaveSweep(previous,s.angle,o,0,travel,s.radius,0,o.radius)) first=Math.min(first,entry(o,o.radius));
      for (const e of targets) if (!e.isDead && inShockwaveSweep(previous,s.angle,e.position,0,travel,s.radius,0,e.radius)) {
        const at=entry(e.position,e.radius); if (at < first) { first=at;target=e; }
      }
      s.x += Math.cos(s.angle)*travel; s.y += Math.sin(s.angle)*travel;s.travelled+=travel;
      if (target) onHit(target,s.damage,s.angle,s.precision);
      if (first<=travel || s.travelled>=s.range || bounds && (s.x<bounds.left||s.x>bounds.right||s.y<bounds.top||s.y>bounds.bottom)) {
        s.active=false;s.view.setVisible(false);
      } else s.view.setPosition(s.x,s.y).setRotation(s.angle).setDepth(s.y+5);
    }
  }
  clear(): void { this.momentum=0; for(const shot of this.shots){shot.active=false;shot.view.setVisible(false);} }
  destroy(): void { for (const shot of this.shots) shot.view.destroy(); }
  projectilePoses(): {x:number;y:number;rotation:number}[] { return this.shots.filter(s=>s.active).map(s=>({x:s.x,y:s.y,rotation:s.angle})); }
}
