import Phaser from 'phaser';
import type { SaberPose } from '../combat/Attack';
import type { KineticPose } from '../combat/KineticCharge';
import { Health } from '../combat/Health';
import { PLAYER } from '../config/game';
import { moveWithCollisions, type MovementBounds, type Obstacle } from '../systems/Movement';
import { clamp, normalized, type Vec2 } from '../utils/math';
import { EnergySaber } from './EnergySaber';

export type PlayerAnimationState = 'IDLE' | 'WALK' | 'ATTACK_WINDUP' | 'ATTACK_SWING' | 'ATTACK_RECOVERY' | 'DASH' | 'CHARGE' | 'CHARGE_RELEASE' | 'HURT' | 'DEAD';

export class Player {
  readonly position: Vec2;
  readonly velocity: Vec2 = { x: 0, y: 0 };
  readonly health: Health;
  readonly movementSpeed = PLAYER.speed;
  readonly attackDamage = PLAYER.attackDamage;
  readonly attackCooldown = PLAYER.attackCooldown;
  readonly dashCooldown = PLAYER.dashCooldown;
  readonly radius = PLAYER.radius;
  readonly view: Phaser.GameObjects.Container;
  readonly weapon: EnergySaber;
  private shadow: Phaser.GameObjects.Ellipse;
  private groundContact: Phaser.GameObjects.Ellipse;
  private leftLeg: Phaser.GameObjects.Image;
  private rightLeg: Phaser.GameObjects.Image;
  private legsRig: Phaser.GameObjects.Container;
  private bodyRig: Phaser.GameObjects.Container;
  private torso: Phaser.GameObjects.Image;
  private supportArm: Phaser.GameObjects.Image;
  private supportUpperArm: Phaser.GameObjects.Image;
  private saberArm: Phaser.GameObjects.Image;
  private supportGlove: Phaser.GameObjects.Arc;
  private handAnchor: Phaser.GameObjects.Container;
  private gripWorld: Vec2 = { x: 0, y: 0 };
  private bodyLean = 0;
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

  constructor(private scene: Phaser.Scene, x: number, y: number, maxHp: number = PLAYER.maxHp) {
    this.health = new Health(maxHp);
    this.position = { x, y };
    this.shadow = scene.add.ellipse(x, y + 39, 57, 16, 0x020e14, 0.39).setDepth(y - 3);
    this.groundContact = scene.add.ellipse(x, y + 39, 32, 9, 0x061a20, 0.32).setDepth(y - 2);
    this.leftLeg = this.makeLeg(-10);
    this.rightLeg = this.makeLeg(10);
    this.legsRig = scene.add.container(0, 0, [this.leftLeg, this.rightLeg]);

    this.torso = scene.add.image(0, 0, 'warrior-body').setDisplaySize(90, 100);
    this.supportUpperArm = scene.add.image(-18, -8, 'warrior-support-arm').setDisplaySize(18, 16).setOrigin(0, 0.5);
    this.supportArm = scene.add.image(-18, -8, 'warrior-support-arm').setDisplaySize(18, 16).setOrigin(0, 0.5);
    this.saberArm = scene.add.image(18, -8, 'warrior-saber-arm').setDisplaySize(30, 16).setOrigin(0, 0.5);

    this.hurtOverlay = scene.add.graphics();
    this.hurtOverlay.fillStyle(0xff9a7f, 0.8).fillEllipse(0, -8, 61, 80);
    this.hurtOverlay.setAlpha(0);
    this.weapon = new EnergySaber(scene);
    const glove = scene.add.circle(0, 0, 5, 0x203d47).setStrokeStyle(1.5, 0x9bb8b3);
    this.supportGlove = scene.add.circle(0, 0, 4.5, 0x203d47).setStrokeStyle(1.5, 0xd4dbce);
    this.handAnchor = scene.add.container(0, 0, [this.weapon.view, glove]);
    this.bodyRig = scene.add.container(0, 0, [this.torso, this.supportUpperArm, this.supportArm, this.saberArm, this.handAnchor, this.supportGlove, this.hurtOverlay]);
    this.view = scene.add.container(x, y, [this.legsRig, this.bodyRig]).setDepth(y);
    this.ring = scene.add.circle(x, y + 39, 33).setStrokeStyle(1, 0x89d9d2, 0.28).setFillStyle(0, 0).setDepth(y - 1);
    this.setAim(0);
  }

  private makeLeg(x: number): Phaser.GameObjects.Image {
    return this.scene.add.image(x, 0, 'warrior-boot').setDisplaySize(40, 100);
  }

  // The body remains upright; the saber rotates around the glove inside bodyRig.
  setAim(aim: number, bodyLean = 0, handReach = 0, sweep = 0): void {
    this.rotation = aim;
    this.bodyLean = bodyLean;
    this.view.setRotation(aim);
    this.legsRig.setRotation(-aim);
    this.bodyRig.setRotation(-aim + bodyLean);
    const x = Math.cos(aim);
    const y = Math.sin(aim);
    const vertical = Math.abs(y) > Math.abs(x);
    const texture = vertical ? (y > 0 ? 'warrior-body' : 'warrior-body-back') : 'warrior-body-side';
    if (this.torso.texture.key !== texture) this.torso.setTexture(texture);
    this.torso.setFlipX(!vertical && x < 0);
    const shoulderX = 17;
    const handX = 30 * x + 32 * (1 - Math.abs(x)) + x * handReach - y * sweep;
    const handY = -8 + y * (12 + handReach) + x * sweep;
    this.handAnchor.setPosition(handX, handY);
    const bodyX = this.position.x + this.bodyRig.x * x - this.bodyRig.y * y;
    const bodyY = this.position.y + this.bodyRig.x * y + this.bodyRig.y * x;
    this.gripWorld.x = bodyX + handX * Math.cos(bodyLean) - handY * Math.sin(bodyLean);
    this.gripWorld.y = bodyY + handX * Math.sin(bodyLean) + handY * Math.cos(bodyLean);
    const armX = handX - shoulderX;
    const armY = handY + 8;
    this.saberArm.setPosition(shoulderX, -8).setRotation(Math.atan2(armY, armX)).setDisplaySize(Math.max(16, Math.hypot(armX, armY)), 16);
  }

  get hp(): number { return this.health.current; }
  get maxHp(): number { return this.health.max; }
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

  update(now: number, deltaSeconds: number, input: Vec2, aim: number, obstacles: ReadonlyArray<Obstacle>, pose: SaberPose, heavy: KineticPose, bounds?: MovementBounds): void {
    if (this.isDead) return;
    this.rotation = aim;
    if (this.isDashing && now >= this.dashUntil) this.isDashing = false;
    const heavyBusy = heavy.phase !== 'READY';
    const direction = this.isDashing ? this.dashVector : input;
    const speed = this.isDashing ? PLAYER.dashSpeed : PLAYER.speed;
    this.velocity.x = heavyBusy ? 0 : direction.x * speed;
    this.velocity.y = heavyBusy ? 0 : direction.y * speed;
    const previousX = this.position.x;
    const previousY = this.position.y;
    moveWithCollisions(this.position, this.velocity, Math.min(deltaSeconds, 0.04), this.radius, obstacles, bounds);
    const movedX = this.position.x - previousX;
    const movedY = this.position.y - previousY;
    const travelled = Math.hypot(movedX, movedY);
    const walking = !this.isDashing && !heavyBusy && travelled > 0.1;
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
    // Each boot stays below the upright torso and alternates with real travel.
    this.leftLeg.setPosition(-10 + stride * 2, -stride * 5);
    this.rightLeg.setPosition(10 - stride * 2, stride * 5);
    if (this.isDashing) {
      this.leftLeg.setPosition(-9, -2);
      this.rightLeg.setPosition(9, -2);
    }

    if (heavy.phase === 'CHARGING') this.animationState = 'CHARGE';
    else if (heavy.phase === 'RELEASE') this.animationState = 'CHARGE_RELEASE';
    else if (this.isDashing) this.animationState = 'DASH';
    else if (now < this.hitFlashUntil) this.animationState = 'HURT';
    else if (pose.phase !== 'READY') this.animationState = `ATTACK_${pose.phase}` as PlayerAnimationState;
    else this.animationState = walking ? 'WALK' : 'IDLE';

    const bob = -lift * 1.9;
    const attackTwist = pose.phase === 'READY' ? 0 : clamp(pose.relativeAngle * 0.075, -0.1, 0.1);
    this.bodyRig.setPosition((this.isDashing ? 5 : 0) + bob * sinAim, bob * cosAim + (this.isDashing ? -1 : 0));
    const heavyLean = heavy.phase === 'CHARGING' ? -0.03 - heavy.level * 0.04 : heavy.phase === 'RELEASE' ? (1 - heavy.swingProgress) * 0.08 : 0;
    const handReach = heavy.phase === 'CHARGING' ? -4 - heavy.level * 4 : heavy.phase === 'RELEASE' ? Math.sin(heavy.swingProgress * Math.PI) * 8 : 0;
    this.setAim(aim, (walking ? stride * 0.015 : 0) + attackTwist + heavyLean, handReach, pose.phase === 'READY' ? 0 : pose.relativeAngle * 3);
    this.hurtOverlay.setAlpha(now < this.hitFlashUntil ? 0.72 : 0);

    this.view.setPosition(this.position.x, this.position.y).setDepth(this.position.y);
    this.shadow.setPosition(this.position.x, this.position.y + 39).setDepth(this.position.y - 3);
    this.groundContact.setPosition(this.position.x, this.position.y + 39).setDepth(this.position.y - 2);
    this.ring.setPosition(this.position.x, this.position.y + 39).setDepth(this.position.y - 1);
    this.ring.setStrokeStyle(heavyBusy ? 2.5 : 1.5, heavyBusy ? 0x5fe6d8 : this.isDashing ? 0xd7fff7 : 0x89d9d2, heavyBusy ? 0.5 + heavy.level * 0.36 : this.isDashing ? 0.78 : 0.28);
    this.view.setAlpha(this.isDashing ? 0.74 : now < this.invulnerableUntil ? 0.7 + Math.sin(now * 0.045) * 0.25 : 1);
    this.renderWeapon(aim, pose, heavy);
  }

  renderWeapon(aim: number, pose: SaberPose, heavy: KineticPose): void {
    this.weapon.render(this.position, this.gripWorld, aim, this.bodyLean, pose, heavy, this.isDashing);
    const offset = this.weapon.supportGripX * this.weapon.view.scaleX;
    const gripX = this.handAnchor.x + Math.cos(this.weapon.view.rotation) * offset;
    const gripY = this.handAnchor.y + Math.sin(this.weapon.view.rotation) * offset;
    const armX = gripX + 18;
    const armY = gripY + 8;
    const armLength = Math.max(1, Math.hypot(armX, armY));
    const bend = 12 * clamp(gripX / 18, -1, 1);
    const elbowX = -18 + armX * 0.5 - armY / armLength * bend;
    const elbowY = -8 + armY * 0.5 + armX / armLength * bend;
    const upperX = elbowX + 18;
    const upperY = elbowY + 8;
    const lowerX = gripX - elbowX;
    const lowerY = gripY - elbowY;
    this.supportUpperArm.setPosition(-18, -8).setRotation(Math.atan2(upperY, upperX)).setDisplaySize(Math.max(7, Math.hypot(upperX, upperY)), 16);
    this.supportArm.setPosition(elbowX, elbowY).setRotation(Math.atan2(lowerY, lowerX)).setDisplaySize(Math.max(7, Math.hypot(lowerX, lowerY)), 16);
    this.supportGlove.setPosition(gripX, gripY);
  }

  flashHurt(): void {
    this.hitFlashUntil = this.scene.time.now + 140;
    this.hurtOverlay.setAlpha(0.8);
  }

  private footstep(stepIndex: number): void {
    const direction = this.travelDirection;
    const side = stepIndex % 2 ? 1 : -1;
    const x = this.position.x - direction.x * 17 - direction.y * side * 10;
    const y = this.position.y - direction.y * 17 + direction.x * side * 10 + 39;
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
