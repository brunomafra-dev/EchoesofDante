import Phaser from 'phaser';
import type { SaberPose } from '../combat/Attack';
import type { KineticPose } from '../combat/KineticCharge';
import { Health } from '../combat/Health';
import { PLAYER } from '../config/game';
import type { AbilityUpgradeId } from '../config/abilityUpgrades';
import { moveWithCollisions, type MovementBounds, type Obstacle } from '../systems/Movement';
import { clamp, normalized, type Vec2 } from '../utils/math';
import { EnergySaber } from './EnergySaber';
import { poseWarrior } from '../experiments/quality-reference/ActorPresentation';
import { WarriorArt } from '../visual/WarriorArt';
import { WarriorArms } from '../visual/WarriorArms';
import { HUNTER, type PlayableClass } from '../config/classes';

export type PlayerAnimationState = 'IDLE' | 'WALK' | 'ATTACK_WINDUP' | 'ATTACK_SWING' | 'ATTACK_RECOVERY' | 'DASH' | 'CHARGE' | 'CHARGE_RELEASE' | 'HURT' | 'DEAD';

export class Player {
  readonly position: Vec2;
  readonly velocity: Vec2 = { x: 0, y: 0 };
  readonly health: Health;
  get movementSpeed(): number { return this.classId === 'hunter' ? HUNTER.speed : PLAYER.speed; }
  readonly attackDamage = PLAYER.attackDamage;
  readonly attackCooldown = PLAYER.attackCooldown;
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
  private paintedArt?: WarriorArt;
  private paintedArms?: WarriorArms;
  private supportArm: Phaser.GameObjects.Image;
  private supportUpperArm: Phaser.GameObjects.Image;
  private saberArm: Phaser.GameObjects.Image;
  private supportGlove: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
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

  constructor(private scene: Phaser.Scene, x: number, y: number, maxHp: number = PLAYER.maxHp, private referencePresentation = false,
    paintedPresentation = false, private readonly upgradeRank: (id: AbilityUpgradeId) => number = () => 0,
    readonly classId: PlayableClass = 'warrior') {
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
    this.weapon = new EnergySaber(scene, paintedPresentation);
    const glove = scene.add.circle(0, 0, 5, 0x203d47).setStrokeStyle(1.5, 0x9bb8b3);
    this.supportGlove = paintedPresentation ? scene.add.image(0, 0, 'warrior-arm-kit', 2) :
      scene.add.circle(0, 0, 4.5, 0x203d47).setStrokeStyle(1.5, 0xd4dbce);
    this.handAnchor = scene.add.container(0, 0, [this.weapon.view, glove]);
    this.bodyRig = scene.add.container(0, 0, [this.torso, this.supportUpperArm, this.supportArm, this.saberArm, this.handAnchor, this.supportGlove, this.hurtOverlay]);
    this.view = scene.add.container(x, y, [this.legsRig, this.bodyRig]).setDepth(y);
    if (paintedPresentation) {
      this.paintedArt = new WarriorArt(this.torso);
      glove.setVisible(false);
      this.paintedArms = new WarriorArms(scene, this.bodyRig, this.torso, this.saberArm,
        this.supportUpperArm, this.supportArm, this.handAnchor, this.supportGlove as Phaser.GameObjects.Image, this.hurtOverlay);
      this.leftLeg.setVisible(false); this.rightLeg.setVisible(false);
    }
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
    if (!this.paintedArt) {
      if (this.torso.texture.key !== texture) this.torso.setTexture(texture);
      this.torso.setFlipX(!vertical && x < 0);
    }
    const shoulderX = 17;
    const shoulderY = this.paintedArt?.shoulderY ?? -8;
    const handX = 30 * x + 32 * (1 - Math.abs(x)) + x * handReach - y * sweep;
    const handY = -8 + y * (12 + handReach) + x * sweep;
    this.handAnchor.setPosition(handX, handY);
    this.paintedArms?.prepare(aim, shoulderY, handReach, sweep);
    const bodyX = this.position.x + this.bodyRig.x * x - this.bodyRig.y * y;
    const bodyY = this.position.y + this.bodyRig.x * y + this.bodyRig.y * x;
    this.gripWorld.x = bodyX + this.handAnchor.x * Math.cos(bodyLean) - this.handAnchor.y * Math.sin(bodyLean);
    this.gripWorld.y = bodyY + this.handAnchor.x * Math.sin(bodyLean) + this.handAnchor.y * Math.cos(bodyLean);
    if (!this.paintedArms) {
      const armX = handX - shoulderX;
      const armY = handY - shoulderY;
      this.saberArm.setPosition(shoulderX, shoulderY).setRotation(Math.atan2(armY, armX)).setDisplaySize(Math.max(16, Math.hypot(armX, armY)), this.paintedArt ? 12 : 16);
    }
  }

  get hp(): number { return this.health.current; }
  get maxHp(): number { return this.health.max; }
  get dashCooldown(): number { return (this.classId === 'hunter' ? HUNTER.dashCooldown : PLAYER.dashCooldown) - this.upgradeRank('dashCooldown') * 120; }
  get dashDuration(): number { return PLAYER.dashDuration + this.upgradeRank('dashDuration') * 20; }
  get dashReady(): boolean { return !this.isDead && this.scene.time.now - this.lastDashAt >= this.dashCooldown; }
  get dashProgress(): number { return clamp((this.scene.time.now - this.lastDashAt) / this.dashCooldown, 0, 1); }
  get invulnerable(): boolean { return this.isDashing || this.scene.time.now < this.invulnerableUntil; }

  startDash(now: number, input: Vec2): boolean {
    if (this.isDead || now - this.lastDashAt < this.dashCooldown) return false;
    this.lastDashAt = now;
    this.dashUntil = now + this.dashDuration;
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
    const speed = this.isDashing ? PLAYER.dashSpeed : this.movementSpeed;
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
    const presentationLean = this.referencePresentation && !this.paintedArt ? poseWarrior(this.leftLeg, this.rightLeg, this.bodyRig,
      stride, this.stepPhase, walking, this.travelDirection, aim, pose, heavy, this.isDashing, now < this.hitFlashUntil) : 0;
    if (this.paintedArt) {
      // Whole painted feet already carry weight transfer. Anchor to the same
      // ground plane; the old boot bob would otherwise make the new feet float.
      this.bodyRig.setPosition(0, 0);
      this.paintedArt.update(aim, this.stepPhase, walking, this.travelDirection, pose, heavy, this.isDashing);
    }
    this.setAim(aim, (this.paintedArt ? 0 : (walking ? stride * 0.015 : 0) + attackTwist + heavyLean + presentationLean), handReach, pose.phase === 'READY' ? 0 : pose.relativeAngle * 3);
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
    if (this.classId === 'hunter') { this.weapon.clearEffects(); return; }
    this.weapon.render(this.position, this.gripWorld, aim, this.bodyLean, pose, heavy, this.isDashing);
    const offset = this.weapon.supportGripX * this.weapon.view.scaleX;
    const gripX = this.handAnchor.x + Math.cos(this.weapon.view.rotation) * offset;
    const gripY = this.handAnchor.y + Math.sin(this.weapon.view.rotation) * offset;
    if (this.paintedArms) {
      this.paintedArms.update(gripX, gripY, this.weapon.view.rotation);
      return;
    }
    const shoulderY = this.paintedArt?.shoulderY ?? -8;
    const sleeveWidth = this.paintedArt ? 12 : 16;
    const armX = gripX + 18;
    const armY = gripY - shoulderY;
    const armLength = Math.max(1, Math.hypot(armX, armY));
    const bend = 12 * clamp(gripX / 18, -1, 1);
    const elbowX = -18 + armX * 0.5 - armY / armLength * bend;
    const elbowY = shoulderY + armY * 0.5 + armX / armLength * bend;
    const upperX = elbowX + 18;
    const upperY = elbowY - shoulderY;
    const lowerX = gripX - elbowX;
    const lowerY = gripY - elbowY;
    this.supportUpperArm.setPosition(-18, shoulderY).setRotation(Math.atan2(upperY, upperX)).setDisplaySize(Math.max(7, Math.hypot(upperX, upperY)), sleeveWidth);
    this.supportArm.setPosition(elbowX, elbowY).setRotation(Math.atan2(lowerY, lowerX)).setDisplaySize(Math.max(7, Math.hypot(lowerX, lowerY)), sleeveWidth);
    this.supportGlove.setPosition(gripX, gripY);
  }

  flashHurt(): void {
    this.hitFlashUntil = this.scene.time.now + 140;
    this.hurtOverlay.setAlpha(0.8);
  }

  renderRemote(position: Vec2, aim: number, pose: SaberPose, heavy: KineticPose, dashing: boolean, dead: boolean): void {
    const moved = Math.hypot(position.x - this.position.x, position.y - this.position.y);
    const travel = normalized(position.x - this.position.x, position.y - this.position.y);
    this.stepPhase += moved / 108 * Math.PI * 2;
    Object.assign(this.position, { x: position.x, y: position.y });
    this.isDead = dead; this.isDashing = dashing;
    this.paintedArt?.update(aim, this.stepPhase, moved > .1, travel, pose, heavy, dashing);
    this.setAim(aim); this.renderWeapon(aim, pose, heavy);
    this.view.setPosition(position.x, position.y).setDepth(position.y).setAlpha(dead ? .25 : dashing ? .74 : 1);
    this.shadow.setPosition(position.x, position.y + 39).setDepth(position.y - 3);
    this.groundContact.setPosition(position.x, position.y + 39).setDepth(position.y - 2);
    this.ring.setPosition(position.x, position.y + 39).setDepth(position.y - 1);
  }

  destroy(): void {
    this.weapon.destroy(); this.view.destroy(true);
    this.shadow.destroy(); this.groundContact.destroy(); this.ring.destroy();
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
