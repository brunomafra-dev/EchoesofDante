import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { PLAYER } from '../config/game';
import { moveWithCollisions, type Obstacle } from '../systems/Movement';
import { clamp, type Vec2 } from '../utils/math';

export class Player {
  readonly position: Vec2;
  readonly velocity: Vec2 = { x: 0, y: 0 };
  readonly health = new Health(PLAYER.maxHp);
  readonly maxHp = PLAYER.maxHp;
  readonly movementSpeed = PLAYER.speed;
  readonly attackDamage = PLAYER.attackDamage;
  readonly attackCooldown = PLAYER.attackCooldown;
  readonly dashCooldown = PLAYER.dashCooldown;
  readonly radius = PLAYER.radius;
  readonly view: Phaser.GameObjects.Container;
  private shadow: Phaser.GameObjects.Ellipse;
  private body: Phaser.GameObjects.Graphics;
  private ring: Phaser.GameObjects.Arc;
  private hurtOverlay: Phaser.GameObjects.Graphics;
  private hitFlashUntil = 0;
  rotation = 0;
  isDashing = false;
  isDead = false;
  private dashUntil = 0;
  private lastDashAt = -Infinity;
  private dashVector: Vec2 = { x: 1, y: 0 };
  private invulnerableUntil = 0;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.position = { x, y };
    this.shadow = scene.add.ellipse(x, y + 19, 53, 22, 0x020e14, 0.48).setDepth(y - 2);
    this.body = scene.add.graphics();
    // Viewed from above: split boots, field pack, broad shoulder plates, helmet and saber arm.
    this.body.fillStyle(0x081c28).fillRoundedRect(-27, -16, 20, 13, 4);
    this.body.fillRoundedRect(-27, 3, 20, 13, 4);
    this.body.fillStyle(0x315365).fillRoundedRect(-27, -16, 15, 11, 3);
    this.body.fillRoundedRect(-27, 5, 15, 11, 3);
    this.body.fillStyle(0x102c3b).fillRoundedRect(-24, -23, 32, 46, 9);
    this.body.fillStyle(0x477183).fillRoundedRect(-22, -20, 10, 40, 4);
    this.body.lineStyle(2, 0x88c9cb, 0.75).strokeRoundedRect(-22, -20, 10, 40, 4);
    this.body.fillStyle(0x243e50).fillRoundedRect(-13, -25, 33, 50, 12);
    this.body.fillStyle(0xdce6de).fillRoundedRect(-10, -22, 29, 44, 10);
    this.body.fillStyle(0x779a9c).fillRoundedRect(-4, -15, 18, 30, 5);
    this.body.fillStyle(0x102e3c).fillRoundedRect(0, -12, 14, 24, 4);
    this.body.fillStyle(0x61d5dc).fillRoundedRect(5, -8, 4, 16, 2);
    this.body.fillStyle(0xeff1e7).fillEllipse(-3, -25, 28, 15);
    this.body.fillEllipse(-3, 25, 28, 15);
    this.body.fillStyle(0x325d6b).fillEllipse(1, -25, 17, 9);
    this.body.fillEllipse(1, 25, 17, 9);
    this.body.lineStyle(2, 0x91cdd0).lineBetween(-12, -27, 8, -27);
    this.body.lineBetween(-12, 27, 8, 27);
    this.body.fillStyle(0x0d2633).fillEllipse(17, 0, 31, 30);
    this.body.fillStyle(0xe6eee6).fillEllipse(17, 0, 27, 26);
    this.body.fillStyle(0x2e5665).fillEllipse(23, 0, 15, 22);
    this.body.fillStyle(0x061b28).fillEllipse(29, 0, 11, 18);
    this.body.fillStyle(0x70e2e4).fillRoundedRect(26, -7, 4, 14, 2);
    this.body.fillStyle(0xb8ffff, 0.7).fillRoundedRect(29, -5, 2, 10, 1);
    this.body.fillStyle(0x264858).fillRoundedRect(8, -30, 23, 10, 4);
    this.body.fillStyle(0xe8efea).fillRoundedRect(12, -30, 18, 8, 3);
    this.body.fillStyle(0x1d4c59).fillRoundedRect(26, -29, 17, 6, 2);
    this.body.fillStyle(0x0d2835).fillRoundedRect(35, -32, 18, 12, 3);
    this.body.fillStyle(0x65d7e7).fillRoundedRect(40, -29, 20, 6, 2);
    this.body.fillStyle(0xc9ffff).fillRoundedRect(46, -28, 18, 3, 1);
    this.body.fillStyle(0xffffff, 0.65).fillCircle(62, -26, 3);
    this.hurtOverlay = scene.add.graphics();
    this.hurtOverlay.fillStyle(0xff9a7f, 0.8).fillEllipse(7, 0, 51, 56);
    this.hurtOverlay.setAlpha(0);
    this.view = scene.add.container(x, y, [this.body, this.hurtOverlay]).setDepth(y);
    this.ring = scene.add.circle(x, y, 33).setStrokeStyle(1, 0x89d9d2, 0.28).setFillStyle(0, 0).setDepth(y - 1);
  }

  get hp(): number { return this.health.current; }
  get dashReady(): boolean { return !this.isDead && this.scene.time.now - this.lastDashAt >= PLAYER.dashCooldown; }
  get dashProgress(): number { return clamp((this.scene.time.now - this.lastDashAt) / PLAYER.dashCooldown, 0, 1); }
  get invulnerable(): boolean { return this.isDashing || this.scene.time.now < this.invulnerableUntil; }

  startDash(now: number, input: Vec2): boolean {
    if (this.isDead || now - this.lastDashAt < PLAYER.dashCooldown) return false;
    this.lastDashAt = now;
    this.dashUntil = now + PLAYER.dashDuration;
    this.isDashing = true;
    this.dashVector = input.x || input.y ? { ...input } : { x: Math.cos(this.rotation), y: Math.sin(this.rotation) };
    this.invulnerableUntil = this.dashUntil + 80;
    return true;
  }

  update(now: number, deltaSeconds: number, input: Vec2, aim: number, obstacles: ReadonlyArray<Obstacle>): void {
    if (this.isDead) return;
    this.rotation = aim;
    if (this.isDashing && now >= this.dashUntil) this.isDashing = false;
    const direction = this.isDashing ? this.dashVector : input;
    const speed = this.isDashing ? PLAYER.dashSpeed : PLAYER.speed;
    this.velocity.x = direction.x * speed;
    this.velocity.y = direction.y * speed;
    moveWithCollisions(this.position, this.velocity, Math.min(deltaSeconds, 0.04), this.radius, obstacles);
    this.view.setPosition(this.position.x, this.position.y).setRotation(this.rotation).setDepth(this.position.y);
    this.shadow.setPosition(this.position.x, this.position.y + 17).setDepth(this.position.y - 2);
    this.ring.setPosition(this.position.x, this.position.y).setDepth(this.position.y - 1);
    this.ring.setStrokeStyle(1.5, this.isDashing ? 0xd7fff7 : 0x89d9d2, this.isDashing ? 0.78 : 0.28);
    this.view.setAlpha(this.isDashing ? 0.74 : now < this.invulnerableUntil ? 0.7 + Math.sin(now * 0.045) * 0.25 : 1);
    this.body.setPosition(0, input.x || input.y ? Math.sin(now * 0.025) * 1.6 : 0);
    this.hurtOverlay.setAlpha(now < this.hitFlashUntil ? 0.72 : 0);
  }

  flashHurt(): void {
    this.hitFlashUntil = this.scene.time.now + 140;
    this.hurtOverlay.setAlpha(0.8);
  }

  setHurtGrace(until: number): void { this.invulnerableUntil = Math.max(this.invulnerableUntil, until); }

  die(): void {
    this.isDead = true;
    this.isDashing = false;
    this.velocity.x = this.velocity.y = 0;
    this.scene.tweens.add({ targets: [this.view, this.shadow, this.ring], alpha: 0, duration: 560 });
  }
}
