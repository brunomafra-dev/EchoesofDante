import Phaser from 'phaser';
import { environmentImage } from '../visual/EnvironmentArt';
import { SIGNAL_THRESHOLD as SITE } from '../config/discovery';
import type { Vec2 } from '../utils/math';

// A sealed fissure at the end of the existing northern trail, not a new level.
export class SignalThreshold {
  activated: boolean;
  sourceLocated: boolean;
  opened: boolean;
  private glyphs: Phaser.GameObjects.Graphics;
  private ambient: Phaser.GameObjects.Ellipse;
  private flash: Phaser.GameObjects.Graphics;
  private leftSeal: Phaser.GameObjects.Image;
  private rightSeal: Phaser.GameObjects.Image;

  constructor(private scene: Phaser.Scene, synchronized: boolean, sourceLocated: boolean, opened = false) {
    this.activated = synchronized;
    this.sourceLocated = sourceLocated;
    this.opened = opened;
    const x = SITE.x;
    const y = SITE.y;
    environmentImage(scene, 'ancient-frame', x, y - 13, 200, 170, y - 8);
    // Painted seal pieces keep the existing pivots, destinations and opening timing.
    this.leftSeal = environmentImage(scene, 'rock-shelf', x, y, 58, 105, y - 5).setOrigin(1, 0.5);
    this.rightSeal = environmentImage(scene, 'rock-shelf', x, y, 58, 105, y - 5).setOrigin(0, 0.5).setTint(0xc8d3ce);
    if (opened) {
      this.leftSeal.x -= 40;
      this.rightSeal.x += 40;
    }

    this.ambient = scene.add.ellipse(x, y - 4, 119, 48, 0xa98cff, 0.2)
      .setDepth(y - 9).setAlpha(synchronized ? 0.45 : 0);
    this.glyphs = scene.add.graphics().setPosition(x, y).setDepth(y - 7).setAlpha(synchronized ? 0.85 : 0);
    this.glyphs.lineStyle(3, 0xa98cff, 0.85)
      .lineBetween(-43, -24, -29, -33).lineBetween(-29, -33, -20, -18)
      .lineBetween(27, -38, 40, -29).lineBetween(40, -29, 47, -13)
      .lineBetween(-12, 13, 0, 5).lineBetween(0, 5, 17, 13);
    this.glyphs.fillStyle(0xffbd54, 0.9).fillCircle(0, 5, 3.5);
    this.flash = scene.add.graphics().setPosition(x, y).setDepth(y + 1).setAlpha(0);
    this.flash.lineStyle(3, 0xb7a0ff, 0.7)
      .lineBetween(-86, -26, -107, -36).lineBetween(76, -35, 96, -48)
      .lineBetween(-52, 34, -67, 44).lineBetween(60, 29, 78, 39);
    if (synchronized) this.breathe();
  }

  canInvestigate(position: Vec2, dead: boolean): boolean {
    return this.activated && !this.sourceLocated && !dead &&
      Math.hypot(position.x - SITE.x, position.y - SITE.y) <= SITE.radius;
  }

  activate(): void {
    if (this.activated) return;
    this.activated = true;
    this.ambient.setAlpha(0.45);
    this.glyphs.setAlpha(0.85);
    this.breathe();
    this.pulse();
  }

  locateSource(): void {
    if (this.sourceLocated) return;
    this.sourceLocated = true;
    this.pulse();
  }

  open(onOpened: () => void): void {
    if (this.opened) return;
    this.opened = true;
    this.pulse();
    this.ambient.setAlpha(0.8);
    this.scene.tweens.add({ targets: this.leftSeal, x: SITE.x - 40, duration: 680, ease: 'Cubic.easeInOut' });
    this.scene.tweens.add({ targets: this.rightSeal, x: SITE.x + 40, duration: 680, ease: 'Cubic.easeInOut', onComplete: onOpened });
  }

  isInside(position: Vec2): boolean {
    return this.opened && Math.hypot(position.x - SITE.x, position.y - SITE.y) < 42;
  }

  private breathe(): void {
    this.scene.tweens.add({ targets: this.glyphs, alpha: { from: 0.52, to: 0.88 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private pulse(): void {
    this.flash.setAlpha(0.95);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 650, ease: 'Cubic.easeOut' });
  }
}
