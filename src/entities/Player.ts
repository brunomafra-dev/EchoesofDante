import Phaser from 'phaser';
import type { SaberPose } from '../combat/Attack';
import { Health } from '../combat/Health';
import { PLAYER } from '../config/game';
import { moveWithCollisions, type Obstacle } from '../systems/Movement';
import { clamp, normalized, type Vec2 } from '../utils/math';
import { EnergySaber } from './EnergySaber';

export type PlayerAnimationState = 'IDLE' | 'WALK' | 'ATTACK_WINDUP' | 'ATTACK_SWING' | 'ATTACK_RECOVERY' | 'DASH' | 'HURT' | 'DEAD';

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
  readonly weapon: EnergySaber;
  private shadow: Phaser.GameObjects.Ellipse;
  private groundContact: Phaser.GameObjects.Ellipse;
  private leftLeg: Phaser.GameObjects.Graphics;
  private rightLeg: Phaser.GameObjects.Graphics;
  private legsRig: Phaser.GameObjects.Container;
  private bodyRig: Phaser.GameObjects.Container;
  private supportArm: Phaser.GameObjects.Graphics;
  private saberArm: Phaser.GameObjects.Graphics;
  private ring: Phaser.GameObjects.Arc;
  private hurtOverlay: Phaser.GameObjects.Graphics;
  private hitFlashUntil = 0;
  private stepPhase = 0;
  private lastStepIndex = 0;
  private gaitStride = 0;
  private gaitLift = 0;
  private wasWalking = false;
  private travelDirection: Vec2 = { x: 0, y: -1 };
  animationState: PlayerAnimationState = 'IDLE';
  rotation = 0;
  isDashing = false;
  isDead = false;
  private dashUntil = 0;
  private lastDashAt = -Infinity;
  private dashVector: Vec2 = { x: 1, y: 0 };
  private invulnerableUntil = 0;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.position = { x, y };
    this.shadow = scene.add.ellipse(x, y + 17, 52, 20, 0x020e14, 0.39).setDepth(y - 3);
    this.groundContact = scene.add.ellipse(x, y + 12, 31, 11, 0x061a20, 0.32).setDepth(y - 2);
    this.leftLeg = this.makeLeg(-13);
    this.rightLeg = this.makeLeg(13);
    this.legsRig = scene.add.container(0, 0, [this.leftLeg, this.rightLeg]);

    const torso = scene.add.graphics();
    torso.fillStyle(0x102c3b).fillRoundedRect(-24, -23, 32, 46, 9);
    torso.fillStyle(0x477183).fillRoundedRect(-22, -20, 10, 40, 4);
    torso.lineStyle(2, 0x88c9cb, 0.75).strokeRoundedRect(-22, -20, 10, 40, 4);
    torso.fillStyle(0x243e50).fillRoundedRect(-13, -25, 33, 50, 12);
    torso.fillStyle(0xdce6de).fillRoundedRect(-10, -22, 29, 44, 10);
    torso.fillStyle(0x779a9c).fillRoundedRect(-4, -15, 18, 30, 5);
    torso.fillStyle(0x102e3c).fillRoundedRect(0, -12, 14, 24, 4);
    torso.fillStyle(0x61d5dc).fillRoundedRect(5, -8, 4, 16, 2);
    torso.fillStyle(0xeff1e7).fillEllipse(-3, -25, 28, 15);
    torso.fillEllipse(-3, 25, 28, 15);
    torso.fillStyle(0x325d6b).fillEllipse(1, -25, 17, 9);
    torso.fillEllipse(1, 25, 17, 9);
    torso.lineStyle(2, 0x91cdd0).lineBetween(-12, -27, 8, -27);
    torso.lineBetween(-12, 27, 8, 27);
    torso.fillStyle(0x0d2633).fillEllipse(17, 0, 31, 30);
    torso.fillStyle(0xe6eee6).fillEllipse(17, 0, 27, 26);
    torso.fillStyle(0x2e5665).fillEllipse(23, 0, 15, 22);
    torso.fillStyle(0x061b28).fillEllipse(29, 0, 11, 18);
    torso.fillStyle(0x70e2e4).fillRoundedRect(26, -7, 4, 14, 2);
    torso.fillStyle(0xb8ffff, 0.7).fillRoundedRect(29, -5, 2, 10, 1);

    this.supportArm = scene.add.graphics();
    this.supportArm.fillStyle(0x254859).fillRoundedRect(7, 22, 24, 10, 4);
    this.supportArm.fillStyle(0xd9e8df).fillRoundedRect(11, 24, 18, 7, 3);
    this.supportArm.fillStyle(0x102936).fillCircle(29, 27, 5);
    this.saberArm = scene.add.graphics();
    this.saberArm.fillStyle(0x254859).fillRoundedRect(7, -31, 25, 10, 4);
    this.saberArm.fillStyle(0xd9e8df).fillRoundedRect(12, -30, 18, 7, 3);
    this.saberArm.fillStyle(0x12323d).fillCircle(30, -25, 5);

    this.hurtOverlay = scene.add.graphics();
    this.hurtOverlay.fillStyle(0xff9a7f, 0.8).fillEllipse(7, 0, 51, 56);
    this.hurtOverlay.setAlpha(0);
    this.bodyRig = scene.add.container(0, 0, [torso, this.supportArm, this.saberArm, this.hurtOverlay]);
    this.weapon = new EnergySaber(scene);
    this.view = scene.add.container(x, y, [this.legsRig, this.bodyRig, this.weapon.view]).setDepth(y);
    this.ring = scene.add.circle(x, y, 33).setStrokeStyle(1, 0x89d9d2, 0.28).setFillStyle(0, 0).setDepth(y - 1);
  }

  private makeLeg(y: number): Phaser.GameObjects.Graphics {
    const leg = this.scene.add.graphics().setPosition(0, y);
    leg.fillStyle(0x081c28).fillRoundedRect(-40, -6, 32, 12, 4);
    leg.fillStyle(0x315365).fillRoundedRect(-39, -5, 24, 10, 3);
    leg.fillStyle(0x9ebfbc).fillRoundedRect(-39, -5, 7, 10, 2);
    leg.lineStyle(1, 0x80b0b4, 0.7).lineBetween(-17, -4, -11, -4);
    return leg;
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

  update(now: number, deltaSeconds: number, input: Vec2, aim: number, obstacles: ReadonlyArray<Obstacle>, pose: SaberPose): void {
    if (this.isDead) return;
    this.rotation = aim;
    if (this.isDashing && now >= this.dashUntil) this.isDashing = false;
    const direction = this.isDashing ? this.dashVector : input;
    const speed = this.isDashing ? PLAYER.dashSpeed : PLAYER.speed;
    this.velocity.x = direction.x * speed;
    this.velocity.y = direction.y * speed;
    const previousX = this.position.x;
    const previousY = this.position.y;
    moveWithCollisions(this.position, this.velocity, Math.min(deltaSeconds, 0.04), this.radius, obstacles);
    const movedX = this.position.x - previousX;
    const movedY = this.position.y - previousY;
    const travelled = Math.hypot(movedX, movedY);
    const walking = !this.isDashing && travelled > 0.1;
    if (walking) {
      if (!this.wasWalking) {
        this.stepPhase = 0;
        this.lastStepIndex = 0;
      }
      this.travelDirection = normalized(movedX, movedY);
      this.stepPhase += travelled / 108 * Math.PI * 2;
      const stepIndex = Math.floor(this.stepPhase / Math.PI);
      if (stepIndex !== this.lastStepIndex) this.footstep(stepIndex);
      this.lastStepIndex = stepIndex;
    }
    this.wasWalking = walking;
    const settle = walking ? 1 : Math.min(1, deltaSeconds * 20);
    this.gaitStride += ((walking ? Math.sin(this.stepPhase) : 0) - this.gaitStride) * settle;
    this.gaitLift += ((walking ? Math.abs(Math.sin(this.stepPhase)) : 0) - this.gaitLift) * settle;
    const stride = this.gaitStride;
    const lift = this.gaitLift;
    const cosAim = Math.cos(aim);
    const sinAim = Math.sin(aim);
    // The lower body stays grounded; rotate travel into its upright local axes.
    const footX = -this.travelDirection.y * stride * 8;
    const footY = this.travelDirection.x * stride * 8;
    this.leftLeg.setPosition(footX, -14 + footY);
    this.rightLeg.setPosition(-footX, 14 - footY);
    if (this.isDashing) {
      this.leftLeg.setPosition(-5, -13);
      this.rightLeg.setPosition(-7, 13);
    }

    if (this.isDashing) this.animationState = 'DASH';
    else if (now < this.hitFlashUntil) this.animationState = 'HURT';
    else if (pose.phase !== 'READY') this.animationState = `ATTACK_${pose.phase}` as PlayerAnimationState;
    else this.animationState = walking ? 'WALK' : 'IDLE';

    const bob = -lift * 1.9;
    const attackTwist = pose.phase === 'READY' ? 0 : clamp(pose.relativeAngle * 0.075, -0.1, 0.1);
    this.bodyRig.setPosition((this.isDashing ? 5 : 0) + bob * sinAim, bob * cosAim + (this.isDashing ? -1 : 0));
    this.bodyRig.setRotation((walking ? stride * 0.015 : 0) + attackTwist);
    this.legsRig.setRotation(-aim - Math.PI / 2);
    this.supportArm.setRotation(walking ? -stride * 0.075 : 0);
    this.saberArm.setRotation(pose.phase === 'READY' ? (walking ? stride * 0.05 : 0) : pose.relativeAngle * 0.18);
    this.hurtOverlay.setAlpha(now < this.hitFlashUntil ? 0.72 : 0);

    this.view.setPosition(this.position.x, this.position.y).setRotation(this.rotation).setDepth(this.position.y);
    this.shadow.setPosition(this.position.x, this.position.y + 17).setDepth(this.position.y - 3);
    this.groundContact.setPosition(this.position.x, this.position.y + 12).setDepth(this.position.y - 2);
    this.ring.setPosition(this.position.x, this.position.y).setDepth(this.position.y - 1);
    this.ring.setStrokeStyle(1.5, this.isDashing ? 0xd7fff7 : 0x89d9d2, this.isDashing ? 0.78 : 0.28);
    this.view.setAlpha(this.isDashing ? 0.74 : now < this.invulnerableUntil ? 0.7 + Math.sin(now * 0.045) * 0.25 : 1);
    this.weapon.render(this.position, aim, pose, bob, this.isDashing);
  }

  flashHurt(): void {
    this.hitFlashUntil = this.scene.time.now + 140;
    this.hurtOverlay.setAlpha(0.8);
  }

  private footstep(stepIndex: number): void {
    const direction = this.travelDirection;
    const side = stepIndex % 2 ? 1 : -1;
    const x = this.position.x - direction.x * 17 - direction.y * side * 10;
    const y = this.position.y - direction.y * 17 + direction.x * side * 10;
    const mark = this.scene.add.ellipse(x, y, 14, 6, 0x9bb6aa, 0.2).setDepth(y - 2);
    this.scene.tweens.add({ targets: mark, alpha: 0, scale: 0.65, duration: 290, onComplete: () => mark.destroy() });
  }

  setHurtGrace(until: number): void { this.invulnerableUntil = Math.max(this.invulnerableUntil, until); }

  die(): void {
    this.isDead = true;
    this.animationState = 'DEAD';
    this.isDashing = false;
    this.velocity.x = this.velocity.y = 0;
    this.weapon.clearEffects();
    this.scene.tweens.add({ targets: [this.view, this.shadow, this.groundContact, this.ring], alpha: 0, duration: 560 });
  }
}
