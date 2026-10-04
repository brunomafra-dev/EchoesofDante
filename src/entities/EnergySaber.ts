import Phaser from 'phaser';
import { PLAYER } from '../config/game';
import type { SaberPose } from '../combat/Attack';
import type { KineticPose } from '../combat/KineticCharge';
import type { Vec2 } from '../utils/math';

export class EnergySaber {
  readonly view: Phaser.GameObjects.Container;
  // Local handle point behind the dominant hand; both grips rotate with this view.
  readonly supportGripX = -10;
  private indicator: Phaser.GameObjects.Graphics;
  private trail: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, paintedPresentation = false) {
    if (paintedPresentation) {
      // Pixel-registered grip: the two glove pivots remain (0,0) and (-10,0).
      const art = scene.add.image(0, 0, 'warrior-saber-painted').setOrigin(78 / 256, 34 / 64).setDisplaySize(128, 32);
      this.view = scene.add.container(0, 0, [art]);
    } else {
      const art = scene.add.graphics();
      // The grip, crossguard, emitter and broad tapered blade are distinct at game scale.
      art.fillStyle(0x0b2533).fillRoundedRect(-18, -5, 28, 10, 3);
      art.fillStyle(0x517a87).fillRoundedRect(-14, -3, 20, 6, 2);
      art.lineStyle(2, 0x9bbac1).lineBetween(-8, -5, -8, 5);
      art.lineBetween(-1, -5, -1, 5);
      art.fillStyle(0x173c4d).fillRoundedRect(7, -12, 8, 24, 2);
      art.fillStyle(0xdbece9).fillRoundedRect(10, -10, 4, 20, 1);
      art.fillStyle(0x3c91a7, 0.5).fillTriangle(15, -10, 68, -6, 78, 0);
      art.fillTriangle(15, 10, 68, 6, 78, 0);
      art.fillStyle(0x72e0ef, 0.88).fillTriangle(17, -7, 69, -3, 76, 0);
      art.fillTriangle(17, 7, 69, 3, 76, 0);
      art.fillStyle(0xe8fffb, 0.95).fillTriangle(20, -2, 70, -1, 76, 0);
      art.fillTriangle(20, 2, 70, 1, 76, 0);
      art.fillStyle(0xffffff).fillCircle(17, 0, 2.4);
      // Shift the art, not the pivot: local (0, 0) stays exactly at the glove as the blade rotates.
      art.setPosition(6, 0);
      this.view = scene.add.container(0, 0, [art]);
    }
    this.indicator = scene.add.graphics();
    this.trail = scene.add.graphics();
  }

  render(position: Vec2, grip: Vec2, facing: number, bodyLean: number, pose: SaberPose, heavy: KineticPose, dashing: boolean): void {
    const heavyAngle = heavy.phase === 'CHARGING' ? -0.9 : -0.9 + 1.8 * heavy.swingProgress;
    const localAngle = heavy.phase !== 'READY' ? heavyAngle : pose.phase === 'READY' && dashing ? -0.68 : pose.relativeAngle;
    this.view.setPosition(0, 0).setRotation(facing - bodyLean + localAngle);
    this.view.setScale(heavy.phase === 'CHARGING' ? 1 + heavy.level * 0.08 : heavy.phase === 'RELEASE' ? 1.12 : pose.phase === 'SWING' ? 1.06 : 1);
    this.indicator.clear().setDepth(position.y - 1);
    this.trail.clear().setDepth(position.y + 2);

    if (heavy.phase === 'CHARGING') {
      this.indicator.lineStyle(2, 0x5fe6d8, 0.16).strokeCircle(position.x, position.y, 48);
      this.indicator.lineStyle(4, 0x5fe6d8, 0.68);
      this.indicator.beginPath().arc(position.x, position.y, 48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * heavy.level).strokePath();
      const angle = facing + localAngle;
      this.trail.lineStyle(8, 0x5fe6d8, 0.12 + heavy.level * 0.24);
      this.trail.lineBetween(grip.x + Math.cos(angle) * 18, grip.y + Math.sin(angle) * 18, grip.x + Math.cos(angle) * 82, grip.y + Math.sin(angle) * 82);
    } else if (heavy.phase === 'RELEASE') {
      const angle = facing + localAngle;
      this.trail.lineStyle(17, 0x5fe6d8, 0.23);
      this.trail.beginPath().arc(grip.x, grip.y, 83, angle - 0.42, angle).strokePath();
      this.trail.lineStyle(6, 0xd7fff7, 0.68);
      this.trail.beginPath().arc(grip.x, grip.y, 83, angle - 0.42, angle).strokePath();
    } else if (pose.phase === 'WINDUP') {
      this.indicator.lineStyle(2, 0x82dce3, 0.28);
      this.indicator.beginPath().arc(position.x, position.y, PLAYER.attackRange, facing - PLAYER.attackHalfAngle, facing + PLAYER.attackHalfAngle).strokePath();
    } else if (pose.phase === 'SWING') {
      const start = facing - PLAYER.attackHalfAngle;
      this.indicator.lineStyle(2, 0x78c8d2, 0.33);
      this.indicator.beginPath().arc(position.x, position.y, PLAYER.attackRange, start, facing + PLAYER.attackHalfAngle).strokePath();
      this.indicator.lineStyle(5, 0xc3fff4, 0.55);
      this.indicator.beginPath().arc(position.x, position.y, PLAYER.attackRange, start, pose.worldAngle).strokePath();
      const trailStart = Math.max(start, pose.worldAngle - 0.38);
      this.trail.lineStyle(15, 0x68cada, 0.25);
      this.trail.beginPath().arc(position.x, position.y, 83, trailStart, pose.worldAngle).strokePath();
      this.trail.lineStyle(5, 0xb5fff3, 0.72);
      this.trail.beginPath().arc(position.x, position.y, 83, trailStart, pose.worldAngle).strokePath();
    } else if (pose.phase === 'RECOVERY') {
      this.indicator.lineStyle(2, 0x81dce1, 0.12);
      this.indicator.beginPath().arc(position.x, position.y, PLAYER.attackRange, facing - PLAYER.attackHalfAngle, facing + PLAYER.attackHalfAngle).strokePath();
    }
  }

  clearEffects(): void {
    this.indicator.clear();
    this.trail.clear();
  }
}
