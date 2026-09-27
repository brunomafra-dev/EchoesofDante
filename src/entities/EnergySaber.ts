import Phaser from 'phaser';
import { PLAYER } from '../config/game';
import type { SaberPose } from '../combat/Attack';
import type { Vec2 } from '../utils/math';

export class EnergySaber {
  readonly view: Phaser.GameObjects.Container;
  private indicator: Phaser.GameObjects.Graphics;
  private trail: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
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
    this.view = scene.add.container(20, -19, [art]);
    this.indicator = scene.add.graphics();
    this.trail = scene.add.graphics();
  }

  render(position: Vec2, facing: number, pose: SaberPose, bob: number, dashing: boolean): void {
    this.view.setPosition(20 + (dashing ? 3 : 0) + bob * Math.sin(facing), -19 + bob * Math.cos(facing));
    this.view.setRotation(pose.phase === 'READY' && dashing ? -0.68 : pose.relativeAngle);
    this.view.setScale(pose.phase === 'SWING' ? 1.06 : 1);
    this.indicator.clear().setDepth(position.y - 1);
    this.trail.clear().setDepth(position.y + 2);

    if (pose.phase === 'WINDUP') {
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
