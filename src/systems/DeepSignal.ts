import Phaser from 'phaser';
import { DEEP_AREA } from '../config/cavern';
import { environmentImage } from '../visual/EnvironmentArt';
import { bakeDeepCavern } from '../visual/DeepCavernArt';

// The first deeper pocket shares the Cavern scene. Its rock, growth and buried
// structure are captured once; only the signal and the two collapse pieces move.
export class DeepSignal {
  private upperRock: Phaser.GameObjects.Image;
  private lowerRock: Phaser.GameObjects.Image;
  private inscriptions: Phaser.GameObjects.Graphics;
  private carrier: Phaser.GameObjects.Ellipse;
  private opening = false;
  private opened: boolean;

  constructor(private scene: Phaser.Scene, opened: boolean) {
    this.opened = opened;
    bakeDeepCavern(scene);

    const { collapseX: x, collapseY: y } = DEEP_AREA;
    this.upperRock = environmentImage(scene, 'rock-shelf', x, y - (opened ? 78 : 0), 150, 185, 660)
      .setOrigin(0.5, 0.68).setTint(0xcdd6d2);
    this.lowerRock = environmentImage(scene, 'rock-shelf', x, y + (opened ? 78 : 0), 150, 175, 660)
      .setOrigin(0.5, 0.29).setTint(0xa8beb8);
    this.inscriptions = scene.add.graphics().setDepth(665).setAlpha(opened ? 0.82 : 0.18);
    this.inscriptions.lineStyle(4, 0xa98cff, 0.82)
      .lineBetween(1548, 609, 1617, 551).lineBetween(1617, 551, 1676, 505)
      .lineBetween(1719, 484, 1774, 495).lineBetween(1774, 495, 1842, 526);
    this.carrier = scene.add.ellipse(1560, 601, 16, 7, 0xffbd54, 0.8).setDepth(666).setAlpha(0);
    const presence = scene.add.ellipse(2200, 650, 113, 52, 0xa98cff, 0.18).setDepth(590);
    const mineral = scene.add.ellipse(1990, 977, 82, 28, 0xffbd54, 0.11).setDepth(970);
    const beyond = scene.add.ellipse(2570, 715, 60, 12, 0xa98cff, 0.12).setDepth(720);
    scene.tweens.add({ targets: [presence, mineral, beyond], alpha: { from: 0.6, to: 1 }, scale: { from: 0.92, to: 1.05 }, duration: 2400, yoyo: true, repeat: -1 });
  }

  respond(): void {
    this.carrier.setPosition(DEEP_AREA.signalX, DEEP_AREA.signalY).setScale(2).setAlpha(0.65);
    this.scene.tweens.add({ targets: this.carrier, scale: 5, alpha: 0, duration: 720,
      onComplete: () => this.carrier.setScale(1) });
  }

  reveal(onOpened: () => void): void {
    if (this.opened || this.opening) return;
    this.opening = true;
    this.scene.tweens.add({ targets: this.inscriptions, alpha: 0.82, duration: 300 });
    this.carrier.setAlpha(0.9);
    this.scene.tweens.add({
      targets: this.carrier, x: DEEP_AREA.collapseX, y: DEEP_AREA.collapseY,
      duration: 390, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.carrier.setAlpha(0);
        this.scene.tweens.add({ targets: this.upperRock, y: DEEP_AREA.collapseY - 78, duration: 620, ease: 'Cubic.easeInOut' });
        this.scene.tweens.add({
          targets: this.lowerRock, y: DEEP_AREA.collapseY + 78, duration: 620, ease: 'Cubic.easeInOut',
          onComplete: () => {
            this.opening = false;
            this.opened = true;
            onOpened();
          },
        });
      },
    });
  }
}
