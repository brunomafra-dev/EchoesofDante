import Phaser from 'phaser';
import { hunterRiflePose, HUNTER_MUZZLE_DISTANCE } from './HunterRiflePose';

export type HunterBeamPose = { x: number; y: number; angle: number; length: number; halfWidth: number; alpha: number };

// Four reused elements; no particles, per-frame drawing or accumulating tweens.
export class HunterBeamView {
  private readonly view: Phaser.GameObjects.Container;
  private readonly halo: Phaser.GameObjects.Rectangle;
  private readonly light: Phaser.GameObjects.Rectangle;
  private readonly core: Phaser.GameObjects.Rectangle;
  private readonly muzzle: Phaser.GameObjects.Ellipse;
  constructor(scene: Phaser.Scene) {
    this.halo = scene.add.rectangle(0, 0, 1, 1, 0x5fe6d8, .16).setOrigin(0, .5);
    this.light = scene.add.rectangle(0, 0, 1, 1, 0x5fe6d8, .65).setOrigin(0, .5);
    this.core = scene.add.rectangle(0, 0, 1, 1, 0xeefff5, .95).setOrigin(0, .5);
    this.muzzle = scene.add.ellipse(0, 0, 1, 1, 0xd9fff5, .9);
    this.view = scene.add.container(0, 0, [this.halo, this.light, this.core, this.muzzle]).setVisible(false);
  }
  render(pose?: HunterBeamPose): void {
    this.view.setVisible(!!pose && pose.length > 0 && pose.alpha > 0);
    if (!pose) return;
    const width = pose.halfWidth * 2;
    const rifle = hunterRiflePose(pose.angle);
    const x = pose.x + rifle.muzzleX, y = pose.y + rifle.muzzleY;
    if (pose.length <= HUNTER_MUZZLE_DISTANCE) {
      this.view.setVisible(false); return;
    }
    // Project the ground-plane ray to the gun's height without bending it.
    const length = pose.length - HUNTER_MUZZLE_DISTANCE;
    this.view.setPosition(x, y).setRotation(pose.angle).setDepth(pose.y + 6).setAlpha(pose.alpha);
    this.halo.setDisplaySize(length, width * 1.6);
    this.light.setDisplaySize(length, width);
    this.core.setDisplaySize(length, Math.max(3, width * .24));
    this.muzzle.setDisplaySize(Math.min(26, length), width * 1.2);
  }
  destroy(): void { this.view.destroy(true); }
}
