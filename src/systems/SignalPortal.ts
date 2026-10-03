import Phaser from 'phaser';
import { distance, type Vec2 } from '../utils/math';
import { trackEnvironmentOcclusion } from '../visual/EnvironmentArt';

// A local traversal affordance; reuses the scene's INTERACT action and transfer.
export class SignalPortal {
  active = false;
  private readonly stone: Phaser.GameObjects.Image;
  private readonly seam: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene, readonly position: Vec2, active = false) {
    const { x, y } = position;
    this.stone = scene.add.image(x, y + 8, 'guardian-lintel-open').setOrigin(0.5, 0.96)
      .setDisplaySize(205, 103).setDepth(y + 5).setTint(0xb7c3ad).setVisible(false);
    trackEnvironmentOcclusion(scene, this.stone);
    this.seam = scene.add.graphics().setPosition(x, y - 35).setDepth(y - 1).setVisible(false);
    this.seam.lineStyle(14, 0xa98cff, 0.14).lineBetween(-5, -32, 2, -15).lineBetween(2, -15, -2, 9).lineBetween(-2, 9, 8, 26);
    this.seam.lineStyle(3, 0xa98cff, 0.9).lineBetween(-5, -32, 2, -15).lineBetween(2, -15, -2, 9).lineBetween(-2, 9, 8, 26);
    this.seam.fillStyle(0xffbd54, 0.8).fillEllipse(8, 26, 8, 3);
    // ExplorationGuide owns the nearby label. A second label here would stack
    // two interaction messages on the Warrior's feet.
    if (active) this.activate();
  }
  activate(): void {
    if (this.active) return;
    this.active = true;
    this.stone.setVisible(true); this.seam.setVisible(true);
    this.scene.tweens.add({ targets: this.seam, alpha: { from: 0.55, to: 1 }, duration: 1400, yoyo: true, repeat: -1 });
  }
  canTraverse(position: Vec2, dead: boolean): boolean {
    return this.active && !dead && distance(position, this.position) < 105;
  }
}
