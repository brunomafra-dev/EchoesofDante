import Phaser from 'phaser';
import { distance, type Vec2 } from '../utils/math';

// A visible biome transition using the same INTERACT action as other world gates.
export class ChapterPortal {
  active = false;
  private readonly arch: Phaser.GameObjects.Image;
  private readonly aperture: Phaser.GameObjects.Ellipse;
  private readonly glow: Phaser.GameObjects.Ellipse;

  constructor(private readonly scene: Phaser.Scene, readonly position: Vec2, active: boolean) {
    const { x, y } = position;
    this.arch = scene.add.image(x, y + 9, 'guardian-lintel-open').setOrigin(0.5, 0.96)
      .setDisplaySize(210, 142).setTint(0xd8b689).setAlpha(active ? 1 : 0.32).setDepth(y - 24);
    this.aperture = scene.add.ellipse(x, y - 62, 56, 94, 0x101019, 0.92).setDepth(y - 22).setVisible(active);
    this.glow = scene.add.ellipse(x, y - 62, 72, 110, 0xa98cff, 0.14).setStrokeStyle(4, 0xa98cff, 0.83)
      .setDepth(y - 20).setVisible(active);
    if (active) this.activate();
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.arch.setAlpha(1);
    this.aperture.setVisible(true);
    this.glow.setVisible(true);
    this.scene.tweens.add({ targets: this.glow, alpha: { from: 0.52, to: 0.92 }, scaleY: { from: 0.96, to: 1.04 },
      duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  canEnter(position: Vec2, dead: boolean): boolean {
    return this.active && !dead && distance(position, this.position) < 116;
  }
}
