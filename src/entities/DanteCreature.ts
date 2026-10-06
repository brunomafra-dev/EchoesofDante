import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inShockwaveSweep } from '../combat/HitDetection';
import { CREATURES, type CreatureKind } from '../config/expansion';
import { PLAYER } from '../config/game';
import { moveWithCollisions, type MovementBounds, type Obstacle } from '../systems/Movement';
import { distance, normalized, type Vec2 } from '../utils/math';
import type { Enemy, EnemyImpact } from './Enemy';
import { createEnemyName } from '../ui/EnemyName';

// Two explicit creature behaviors, using the same movement, health and hit contracts.
export class DanteCreature implements Enemy {
  readonly position: Vec2;
  readonly health: Health;
  readonly radius: number;
  readonly attackRange: number;
  readonly attackDamage: number;
  readonly view: Phaser.GameObjects.Container;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly telegraph: Phaser.GameObjects.Ellipse;
  readonly healthBack: Phaser.GameObjects.Rectangle;
  readonly healthFill: Phaser.GameObjects.Rectangle;
  readonly projectile: Phaser.GameObjects.Ellipse;
  private readonly aimGuide?: Phaser.GameObjects.Line;
  isDead = false;
  state: 'IDLE' | 'CHASE' | 'WINDUP' | 'LUNGE' | 'HURT' | 'DEAD' = 'IDLE';
  private readonly home: Vec2;
  private readonly body: Phaser.GameObjects.Image;
  private readonly name: Phaser.GameObjects.Text;
  private readonly flash: Phaser.GameObjects.Ellipse;
  private velocity: Vec2 = { x: 0, y: 0 };
  private push: Vec2 = { x: 0, y: 0 };
  private hurtUntil = 0;
  private attackAt = -Infinity;
  private windupUntil = 0;
  private lungeUntil = 0;
  private committed = false;
  private attackAngle = 0;
  private travelPhase = 0;
  private facingLeft = false;
  private attackPoseUntil = 0;
  private shot?: { x: number; y: number; angle: number; travelled: number };

  constructor(private scene: Phaser.Scene, readonly kind: CreatureKind, x: number, y: number) {
    const stats = CREATURES[kind];
    this.position = { x, y }; this.home = { x, y };
    this.health = new Health(stats.hp); this.radius = stats.radius;
    this.attackRange = stats.range; this.attackDamage = stats.damage;
    const pouncer = kind === 'skitter' || kind === 'dunePouncer';
    const size = kind === 'skitter' ? 78 : kind === 'dunePouncer' ? 96 : kind === 'glassSpitter' ? 106 : 94;
    this.shadow = scene.add.ellipse(x, y + 12, size * 0.65, 22, 0x07191b, 0.55);
    this.telegraph = scene.add.ellipse(x, y, pouncer ? 75 : 48, 28, 0xffbd54, 0.1)
      .setStrokeStyle(2, 0xffbd54, 0.9).setVisible(false);
    const texture = kind === 'dunePouncer' ? 'dante-dune-pouncer-motion' : kind === 'glassSpitter' ? 'dante-glass-spitter-motion' : `dante-${kind}-motion`;
    this.body = scene.add.image(0, 15, texture, 0).setOrigin(0.5, 244 / 256).setDisplaySize(size, size);
    this.flash = scene.add.ellipse(0, 0, size * 0.65, size * 0.5, 0xf4ffdc, 0);
    this.view = scene.add.container(x, y, [this.body, this.flash]);
    this.healthBack = scene.add.rectangle(x, y - 44, 44, 6, 0x10252b).setDepth(10000).setVisible(false);
    this.healthFill = scene.add.rectangle(x - 20, y - 44, 40, 4, pouncer ? 0x9bd6b4 : 0xffbd54).setOrigin(0, 0.5).setDepth(10001).setVisible(false);
    this.name = createEnemyName(scene, x, y - 65, kind === 'skitter' ? 'SALTADOR' : kind === 'dunePouncer' ? 'RASGA-AREIA' : kind === 'glassSpitter' ? 'CUSPIDOR VÍTREO' : 'CUSPIDOR');
    // One reusable projectile per creature. No projectile/listener/timer allocation loop.
    this.projectile = scene.add.ellipse(x, y, 21, 13, 0xffbd54, 0.94).setStrokeStyle(2, 0xc85639, 0.8).setVisible(false);
    if (kind === 'spitter' || kind === 'glassSpitter') this.aimGuide = scene.add.line(0,0,0,0,240,0,0xffbd54,0.42).setOrigin(0,0).setLineWidth(2).setVisible(false);
  }

  update(now: number, dt: number, player: Vec2, playerDead: boolean, obstacles: readonly Obstacle[], onAttack: (impact?: EnemyImpact) => void, bounds?: MovementBounds): void {
    if (this.isDead) return;
    const stats = CREATURES[this.kind], gap = distance(this.position, player);
    const direction = normalized(player.x - this.position.x, player.y - this.position.y);
    const angle = Math.atan2(direction.y, direction.x);
    this.velocity.x = this.velocity.y = 0;
    this.updateShot(dt, player, playerDead, obstacles, bounds, onAttack);
    if (playerDead) { this.shot = undefined; this.projectile.setVisible(false); }
    if (now < this.hurtUntil) {
      this.state = 'HURT';
      this.velocity = { ...this.push };
      this.push.x *= Math.max(0, 1 - dt * 10); this.push.y *= Math.max(0, 1 - dt * 10);
    } else if (playerDead || gap > stats.detection) {
      this.state = 'IDLE'; this.committed = true;
      if (distance(this.position, this.home) > 18) {
        const home = normalized(this.home.x - this.position.x, this.home.y - this.position.y);
        this.velocity = { x: home.x * 45, y: home.y * 45 };
      }
    } else if (this.state === 'WINDUP') {
      if (now >= this.windupUntil) {
        this.committed = false;
        if (this.kind === 'skitter' || this.kind === 'dunePouncer') {
          this.state = 'LUNGE'; this.lungeUntil = now + (this.kind === 'dunePouncer' ? CREATURES.dunePouncer.lungeMs : CREATURES.skitter.lungeMs);
        } else {
          if (!this.shot) this.shot = { ...this.position, angle: this.attackAngle, travelled: 0 };
          this.attackPoseUntil = now + 180;
          this.state = 'CHASE';
        }
      }
    } else if (this.state === 'LUNGE' && (this.kind === 'skitter' || this.kind === 'dunePouncer')) {
      const lungeSpeed = this.kind === 'dunePouncer' ? CREATURES.dunePouncer.lungeSpeed : CREATURES.skitter.lungeSpeed;
      this.velocity = { x: Math.cos(this.attackAngle) * lungeSpeed, y: Math.sin(this.attackAngle) * lungeSpeed };
      if (!this.committed && gap <= this.radius + PLAYER.radius + 8) {
        this.committed = true; onAttack({ damage: stats.damage });
      }
      if (now >= this.lungeUntil) this.state = 'CHASE';
    } else if (gap <= stats.range && now - this.attackAt >= stats.cooldown && !this.shot) {
      this.state = 'WINDUP'; this.attackAt = now; this.windupUntil = now + stats.windup;
      this.attackAngle = angle; this.committed = false;
    } else {
      this.state = 'CHASE';
      const ranged = this.kind === 'spitter' || this.kind === 'glassSpitter';
      const retreatRange = this.kind === 'glassSpitter' ? CREATURES.glassSpitter.retreatRange : CREATURES.spitter.retreatRange;
      const forward = ranged && gap < retreatRange ? -1 : gap > (ranged ? 230 : 32) ? 1 : 0;
      this.velocity = { x: direction.x * stats.speed * forward, y: direction.y * stats.speed * forward };
    }
    const beforeX = this.position.x, beforeY = this.position.y;
    moveWithCollisions(this.position, this.velocity, dt, this.radius, obstacles, bounds);
    const travelled = Math.hypot(this.position.x - beforeX, this.position.y - beforeY);
    const winding = this.state === 'WINDUP', attacking = winding || this.state === 'LUNGE';
    this.aimGuide?.setPosition(this.position.x,this.position.y).setRotation(this.attackAngle).setScale(Math.min(stats.range,gap)/240,1).setDepth(this.position.y-1).setVisible(winding);
    const moving = travelled > 0.1 && this.state !== 'HURT' && this.state !== 'LUNGE';
    if (moving) this.travelPhase += travelled / (this.kind === 'skitter' || this.kind === 'dunePouncer' ? 48 : 64) * 4;
    const facingX = attacking || now < this.attackPoseUntil ? Math.cos(this.attackAngle)
      : !playerDead && gap <= stats.detection ? direction.x : this.position.x - beforeX;
    if (Math.abs(facingX) > 0.08) this.facingLeft = facingX < 0;
    const frame = this.state === 'HURT' ? (this.kind === 'dunePouncer' ? 3 : 7)
      : winding ? this.kind === 'glassSpitter' ? 3 : this.kind === 'dunePouncer' ? 6 : 5
      : this.state === 'LUNGE' ? this.kind === 'dunePouncer' ? 7 : 6
      : now < this.attackPoseUntil ? this.kind === 'glassSpitter' ? 5 : 6
      : moving ? 1 + Math.floor(this.travelPhase) % 4 : 0;
    // Painted profile art stays upright. Only feet/poses animate; aiming never rolls anatomy.
    this.body.setFrame(frame).setFlipX(this.facingLeft);
    this.view.setPosition(this.position.x, this.position.y).setDepth(this.position.y).setRotation(0);
    this.shadow.setScale(winding ? 1.08 : 1, winding ? 0.92 : 1);
    this.shadow.setPosition(this.position.x, this.position.y + 12).setDepth(this.position.y - 2);
    const offset = this.kind === 'skitter' || this.kind === 'dunePouncer' ? 35 : 0;
    this.telegraph.setPosition(this.position.x + Math.cos(this.attackAngle) * offset, this.position.y + Math.sin(this.attackAngle) * offset)
      .setRotation(this.attackAngle).setDepth(this.position.y - 1).setVisible(winding)
      .setAlpha(winding ? 0.5 + 0.5 * Math.min(1, (now - this.attackAt) / stats.windup) : 0);
    this.healthBack.setPosition(this.position.x, this.position.y - 44);
    this.healthFill.setPosition(this.position.x - 20, this.position.y - 44);
    this.name.setPosition(this.position.x, this.position.y - 65).setVisible(winding || this.health.current < this.health.max);
  }

  private updateShot(dt: number, player: Vec2, playerDead: boolean, obstacles: readonly Obstacle[], bounds: MovementBounds | undefined, onAttack: (impact?: EnemyImpact) => void): void {
    if (!this.shot) { this.projectile.setVisible(false); return; }
    const shot = this.shot;
    const stats = this.kind === 'glassSpitter' ? CREATURES.glassSpitter : this.kind === 'spitter' ? CREATURES.spitter : undefined;
    if (!stats) return;
    const travel = stats.shotSpeed * dt;
    const previous = { x: shot.x, y: shot.y };
    shot.x += Math.cos(shot.angle) * travel; shot.y += Math.sin(shot.angle) * travel; shot.travelled += travel;
    const blocked = obstacles.some(obstacle => inShockwaveSweep(previous, shot.angle, obstacle, 0, travel, stats.shotRadius, 0, obstacle.radius));
    const hit = !blocked && !playerDead && inShockwaveSweep(previous, shot.angle, player, 0, travel, stats.shotRadius, 0, PLAYER.radius);
    if (hit) onAttack({ damage: stats.damage, ranged: true });
    if (blocked || hit || shot.travelled >= stats.shotRange || (bounds && (shot.x < bounds.left || shot.x > bounds.right || shot.y < bounds.top || shot.y > bounds.bottom))) {
      this.shot = undefined; this.projectile.setVisible(false);
    } else this.projectile.setPosition(shot.x, shot.y).setDepth(shot.y + 3).setRotation(shot.angle).setVisible(true);
  }

  hurt(now: number, from: Vec2, force = 300): void {
    this.state = 'HURT'; this.hurtUntil = now + 170; this.committed = true;
    const direction = normalized(this.position.x - from.x, this.position.y - from.y);
    this.push = { x: direction.x * force, y: direction.y * force };
    this.flash.setAlpha(0.62);
    this.scene.tweens.killTweensOf(this.flash);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 110 });
    this.healthBack.setVisible(true);
    this.healthFill.setVisible(true).setDisplaySize(40 * this.health.current / this.health.max, 4);
  }

  die(): void {
    this.isDead = true; this.state = 'DEAD'; this.shot = undefined;
    this.projectile.destroy(); this.aimGuide?.destroy(); this.telegraph.destroy(); this.healthBack.destroy(); this.healthFill.destroy();
    this.name.destroy();
    this.scene.tweens.add({ targets: [this.view, this.shadow], alpha: 0, scale: 0.4, duration: 300, onComplete: () => { this.view.destroy(); this.shadow.destroy(); } });
  }
}
