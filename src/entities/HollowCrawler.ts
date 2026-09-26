import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { CRAWLER } from '../config/game';
import { moveWithCollisions, type Obstacle } from '../systems/Movement';
import { distance, normalized, type Vec2 } from '../utils/math';

export type CrawlerState = 'IDLE' | 'DETECT' | 'CHASE' | 'ATTACK' | 'HURT' | 'DEAD';

export class HollowCrawler {
  readonly position: Vec2;
  readonly velocity: Vec2 = { x: 0, y: 0 };
  readonly health = new Health(CRAWLER.maxHp);
  readonly radius = CRAWLER.radius;
  readonly view: Phaser.GameObjects.Container;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly telegraph: Phaser.GameObjects.Arc;
  readonly healthBack: Phaser.GameObjects.Rectangle;
  readonly healthFill: Phaser.GameObjects.Rectangle;
  private forelimbs: Phaser.GameObjects.Graphics;
  private rearLimbs: Phaser.GameObjects.Graphics;
  private core: Phaser.GameObjects.Arc;
  private hitFlash: Phaser.GameObjects.Arc;
  state: CrawlerState = 'IDLE';
  isDead = false;
  private lastAttackAt = -Infinity;
  private windupUntil = 0;
  private hurtUntil = 0;
  private knockback: Vec2 = { x: 0, y: 0 };
  private attackCommitted = false;
  private spawn: Vec2;
  private travelPhase = 0;
  private hurtTilt = 0;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.position = { x, y };
    this.spawn = { x, y };
    this.shadow = scene.add.ellipse(x, y + 15, 51, 19, 0x030f17, 0.55).setDepth(y - 2);
    this.telegraph = scene.add.circle(x, y, CRAWLER.attackRange + 8).setStrokeStyle(2, 0xffa784, 0.8).setFillStyle(0xa54d4e, 0.08).setDepth(y - 1).setVisible(false);
    this.rearLimbs = scene.add.graphics();
    this.rearLimbs.lineStyle(7, 0x142932).lineBetween(-10, -13, -27, -24);
    this.rearLimbs.lineBetween(-10, 13, -27, 24);
    this.rearLimbs.lineStyle(3, 0x688b80).lineBetween(-22, -22, -30, -28);
    this.rearLimbs.lineBetween(-22, 22, -30, 28);
    const art = scene.add.graphics();
    art.fillStyle(0x091c26).fillEllipse(-4, 0, 48, 35);
    art.lineStyle(2, 0x608d85).strokeEllipse(-4, 0, 48, 35);
    art.fillStyle(0x25454b).fillEllipse(-11, 0, 28, 29);
    art.fillStyle(0x142d38).fillTriangle(-20, -14, -32, -7, -22, -2);
    art.fillTriangle(-20, 14, -32, 7, -22, 2);
    art.fillStyle(0x46726e).fillEllipse(-9, -9, 18, 9);
    art.fillEllipse(-9, 9, 18, 9);
    art.lineStyle(2, 0x7ba69a, 0.75).lineBetween(-15, -11, 0, -12);
    art.lineBetween(-15, 11, 0, 12);
    art.fillStyle(0x081823).fillTriangle(6, -14, 27, 0, 6, 14);
    art.fillStyle(0x31525a).fillTriangle(8, -11, 22, 0, 8, 11);
    art.fillStyle(0xb4e0d0).fillCircle(15, -5, 2);
    art.fillCircle(15, 5, 2);
    this.core = scene.add.circle(-7, 0, 6, 0x80d5c0);
    this.core.setStrokeStyle(2, 0xd0f1d8, 0.65);
    this.forelimbs = scene.add.graphics();
    this.forelimbs.lineStyle(7, 0x102631).lineBetween(8, -12, 24, -23);
    this.forelimbs.lineBetween(8, 12, 24, 23);
    this.forelimbs.lineStyle(3, 0x638f86).lineBetween(21, -21, 29, -28);
    this.forelimbs.lineBetween(21, 21, 29, 28);
    this.forelimbs.fillStyle(0xc4ded0).fillTriangle(27, -29, 33, -31, 31, -22);
    this.forelimbs.fillTriangle(27, 29, 33, 31, 31, 22);
    this.hitFlash = scene.add.circle(-2, 0, 21, 0xeafeee, 0).setScale(1.2, 0.9);
    this.view = scene.add.container(x, y, [this.rearLimbs, art, this.core, this.forelimbs, this.hitFlash]).setDepth(y);
    this.healthBack = scene.add.rectangle(x, y - 34, 42, 6, 0x0c252d).setDepth(10000).setVisible(false);
    this.healthFill = scene.add.rectangle(x - 19, y - 34, 38, 4, 0x9bd6b4).setOrigin(0, 0.5).setDepth(10001).setVisible(false);
  }

  update(now: number, dt: number, player: Vec2, playerDead: boolean, obstacles: ReadonlyArray<Obstacle>, onAttack: () => void): void {
    if (this.isDead) return;
    const gap = distance(this.position, player);
    const direction = normalized(player.x - this.position.x, player.y - this.position.y);
    this.velocity.x = this.velocity.y = 0;

    if (now < this.hurtUntil) {
      this.state = 'HURT';
      this.velocity.x = this.knockback.x;
      this.velocity.y = this.knockback.y;
      this.knockback.x *= Math.max(0, 1 - dt * 10);
      this.knockback.y *= Math.max(0, 1 - dt * 10);
    } else if (playerDead || gap > CRAWLER.detectionRange) {
      this.state = 'IDLE';
      const home = normalized(this.spawn.x - this.position.x, this.spawn.y - this.position.y);
      if (distance(this.position, this.spawn) > 22) {
        this.velocity.x = home.x * 45;
        this.velocity.y = home.y * 45;
      }
    } else if (this.state === 'ATTACK' && now < this.windupUntil) {
      // Telegraph remains stationary and can be escaped with a dash.
    } else if (this.state === 'ATTACK' && !this.attackCommitted) {
      this.attackCommitted = true;
      if (gap <= CRAWLER.attackRange + 18) onAttack();
      this.state = 'CHASE';
    } else if (gap <= CRAWLER.attackRange && now - this.lastAttackAt >= CRAWLER.attackCooldown) {
      this.state = 'ATTACK';
      this.lastAttackAt = now;
      this.windupUntil = now + CRAWLER.windup;
      this.attackCommitted = false;
    } else {
      this.state = gap > 260 ? 'DETECT' : 'CHASE';
      if (gap > CRAWLER.attackRange - 2) {
        this.velocity.x = direction.x * CRAWLER.speed;
        this.velocity.y = direction.y * CRAWLER.speed;
      }
    }

    const beforeX = this.position.x;
    const beforeY = this.position.y;
    moveWithCollisions(this.position, this.velocity, Math.min(dt, 0.04), this.radius, obstacles);
    const travelled = Math.hypot(this.position.x - beforeX, this.position.y - beforeY);
    const moving = travelled > 0.1 && this.state !== 'HURT';
    if (moving) this.travelPhase += travelled / 46 * Math.PI * 2;
    const gait = moving ? Math.sin(this.travelPhase) : 0;
    this.forelimbs.setPosition(gait * 2, gait * 1.4).setRotation(gait * 0.16);
    this.rearLimbs.setPosition(-gait * 2, -gait * 1.4).setRotation(-gait * 0.16);
    this.hurtTilt *= Math.max(0, 1 - dt * 12);
    const lift = moving ? -1.4 - Math.abs(gait) * 1.5 : this.state === 'HURT' ? 0.5 : 0;
    this.view.setPosition(this.position.x, this.position.y + lift).setRotation(Math.atan2(direction.y, direction.x) + this.hurtTilt).setDepth(this.position.y);
    this.view.setScale(this.state === 'ATTACK' ? 1.12 : 1 + Math.sin(now * 0.006) * 0.018);
    this.core.setFillStyle(this.state === 'ATTACK' ? 0xffad84 : 0x80d5c0);
    this.core.setScale(this.state === 'ATTACK' ? 1.3 : 0.9 + Math.sin(now * 0.008) * 0.12);
    this.shadow.setPosition(this.position.x, this.position.y + 15).setDepth(this.position.y - 2);
    this.telegraph.setPosition(this.position.x, this.position.y).setDepth(this.position.y - 1).setVisible(this.state === 'ATTACK');
    this.telegraph.setAlpha(0.65 + Math.sin(now * 0.035) * 0.25);
    this.healthBack.setPosition(this.position.x, this.position.y - 34);
    this.healthFill.setPosition(this.position.x - 19, this.position.y - 34);
  }

  hurt(now: number, from: Vec2): void {
    this.state = 'HURT';
    this.hurtUntil = now + 170;
    this.attackCommitted = true;
    const push = normalized(this.position.x - from.x, this.position.y - from.y);
    this.knockback = { x: push.x * 300, y: push.y * 300 };
    this.hurtTilt = push.y >= 0 ? 0.19 : -0.19;
    this.hitFlash.setAlpha(0.9);
    this.scene.tweens.add({ targets: this.hitFlash, alpha: 0, duration: 170 });
    this.healthBack.setVisible(true);
    this.healthFill.setVisible(true).setDisplaySize(38 * this.health.current / this.health.max, 4);
  }

  die(): void {
    this.isDead = true;
    this.state = 'DEAD';
    this.healthBack.destroy();
    this.healthFill.destroy();
    this.telegraph.destroy();
    this.scene.tweens.add({ targets: this.view, alpha: 0, scaleX: 0.55, scaleY: 0.2, angle: 32, duration: 300, onComplete: () => {
      this.view.destroy();
    } });
    this.scene.tweens.add({ targets: this.shadow, alpha: 0, scale: 0.45, duration: 300, onComplete: () => {
      this.shadow.destroy();
    } });
  }
}
