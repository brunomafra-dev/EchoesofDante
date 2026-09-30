import Phaser from 'phaser';
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
  private leftSeal: Phaser.GameObjects.Graphics;
  private rightSeal: Phaser.GameObjects.Graphics;

  constructor(private scene: Phaser.Scene, synchronized: boolean, sourceLocated: boolean, opened = false) {
    this.activated = synchronized;
    this.sourceLocated = sourceLocated;
    this.opened = opened;
    const x = SITE.x;
    const y = SITE.y;
    const stone = scene.add.graphics().setPosition(x, y).setDepth(y - 8);
    stone.fillStyle(0x06191d, 0.65).fillEllipse(5, 29, 178, 60);
    stone.fillStyle(0x344c4e).fillPoints([
      { x: -88, y: 19 }, { x: -70, y: -31 }, { x: -39, y: -51 }, { x: -10, y: -43 },
      { x: 23, y: -61 }, { x: 67, y: -37 }, { x: 91, y: 12 }, { x: 59, y: 32 }, { x: -57, y: 33 },
    ], true);
    stone.fillStyle(0x061419).fillPoints([
      { x: -55, y: 15 }, { x: -34, y: -22 }, { x: -7, y: -30 }, { x: 11, y: -20 },
      { x: 36, y: -30 }, { x: 62, y: 13 }, { x: 30, y: 24 }, { x: -34, y: 25 },
    ], true);
    stone.fillStyle(0x6a8178).fillPoints([{ x: -70, y: -31 }, { x: -39, y: -51 }, { x: -25, y: -31 }, { x: -53, y: -12 }], true);
    stone.fillStyle(0x536768).fillPoints([{ x: 23, y: -61 }, { x: 67, y: -37 }, { x: 78, y: -7 }, { x: 37, y: -27 }], true);
    stone.fillStyle(0x304d42).fillEllipse(-67, 29, 53, 17).fillEllipse(67, 27, 56, 18);
    stone.lineStyle(3, 0x52745c, 0.8).lineBetween(-75, 22, -64, -3).lineBetween(73, 21, 81, -5);

    // Two heavy plates visibly cover the fissure until the buried resonator answers.
    this.leftSeal = scene.add.graphics().setPosition(x, y).setDepth(y - 5);
    this.leftSeal.fillStyle(0x566365).fillPoints([
      { x: -42, y: -29 }, { x: -5, y: -23 }, { x: 0, y: 23 }, { x: -49, y: 23 },
    ], true);
    this.leftSeal.lineStyle(3, 0x7d8580, 0.65).lineBetween(-5, -21, 0, 21);
    this.rightSeal = scene.add.graphics().setPosition(x, y).setDepth(y - 5);
    this.rightSeal.fillStyle(0x46575a).fillPoints([
      { x: 5, y: -23 }, { x: 40, y: -31 }, { x: 49, y: 23 }, { x: 0, y: 23 },
    ], true);
    this.rightSeal.lineStyle(3, 0xffbd54, 0.38).lineBetween(5, -21, 0, 21);
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
