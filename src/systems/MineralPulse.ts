import Phaser from 'phaser';

// A quiet, repeating glimmer on the existing eastern mineral formation.
// Both shapes and their tween are created once with the scene.
export class MineralPulse {
  readonly ring: Phaser.GameObjects.Ellipse;
  readonly glint: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene) {
    this.ring = scene.add.ellipse(1930, 997, 58, 24)
      .setStrokeStyle(2, 0x9fd9cb, 0.7).setAlpha(0).setDepth(1060).setName('east-mineral-pulse');
    this.glint = scene.add.circle(1930, 997, 7, 0xc3e9d7)
      .setAlpha(0).setDepth(1061);
    scene.tweens.add({
      targets: [this.ring, this.glint],
      alpha: 0.52,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 650,
      yoyo: true,
      repeat: -1,
      repeatDelay: 6500,
      ease: 'Sine.easeInOut',
    });
  }
}
