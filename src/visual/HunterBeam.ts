import Phaser from 'phaser';

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
    const cos = Math.cos(pose.angle), sin = Math.sin(pose.angle);
    const vertical = Math.abs(sin) > Math.abs(cos);
    // Match the painted rifle barrel, rather than emitting light from the waist.
    // The trace endpoint stays at the actual solid surface/range limit.
    const x = pose.x + (vertical ? sin > 0 ? 28 : -30 : cos > 0 ? 52 : -52);
    const y = pose.y + (vertical ? sin > 0 ? -19 : -30 : -27);
    if (pose.length <= Math.max(0, (x - pose.x) * cos + (y - pose.y) * sin)) {
      this.view.setVisible(false); return;
    }
    const dx = pose.x + cos * pose.length - x, dy = pose.y + sin * pose.length - y;
    const length = Math.hypot(dx, dy);
    this.view.setPosition(x, y).setRotation(Math.atan2(dy, dx)).setDepth(pose.y + 6).setAlpha(pose.alpha);
    this.halo.setDisplaySize(length, width * 1.6);
    this.light.setDisplaySize(length, width);
    this.core.setDisplaySize(length, Math.max(3, width * .24));
    this.muzzle.setDisplaySize(Math.min(26, length), width * 1.2);
  }
  destroy(): void { this.view.destroy(true); }
}
