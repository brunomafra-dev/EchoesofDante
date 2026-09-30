import Phaser from 'phaser';
import { SIGNAL_THRESHOLD as SITE } from '../config/discovery';
import type { Vec2 } from '../utils/math';

// A small buried resonator. The three Echoes make it responsive; it is not a key or reward.
export class PassageMechanism {
  private inscriptions: Phaser.GameObjects.Graphics;
  private pulse: Phaser.GameObjects.Ellipse;
  private conduit: Phaser.GameObjects.Graphics;
  private signal: Phaser.GameObjects.Ellipse;
  private armed: boolean;
  private opened: boolean;

  constructor(private scene: Phaser.Scene, sourceLocated: boolean, passageOpen: boolean) {
    this.armed = sourceLocated;
    this.opened = passageOpen;
    const { mechanismX: x, mechanismY: y } = SITE;
    const stone = scene.add.graphics().setPosition(x, y).setDepth(y - 5);
    stone.fillStyle(0x07151b, 0.65).fillEllipse(0, 21, 100, 30);
    stone.fillStyle(0x38474b).fillPoints([
      { x: -42, y: 17 }, { x: -33, y: -22 }, { x: -18, y: -34 }, { x: 10, y: -30 },
      { x: 31, y: -43 }, { x: 45, y: -13 }, { x: 35, y: 19 }, { x: 2, y: 24 },
    ], true);
    stone.fillStyle(0x61716b, 0.75).fillPoints([
      { x: -33, y: -22 }, { x: -18, y: -34 }, { x: -7, y: -21 }, { x: -24, y: -11 },
    ], true);
    stone.fillStyle(0x315044).fillEllipse(-35, 19, 26, 9).fillEllipse(39, 16, 29, 10);
    this.inscriptions = scene.add.graphics().setPosition(x, y).setDepth(y - 4).setAlpha(sourceLocated ? 0.85 : 0.22);
    this.inscriptions.lineStyle(3, 0xa98cff, 0.9)
      .lineBetween(-18, -23, -4, -14).lineBetween(-4, -14, 8, -23)
      .lineBetween(8, -23, 22, -9).lineBetween(22, -9, 14, 5);
    this.inscriptions.fillStyle(0xffbd54).fillCircle(14, 5, 3);
    this.pulse = scene.add.ellipse(x, y, 82, 38, 0xa98cff, 0.3).setDepth(y - 6).setAlpha(0);
    this.conduit = scene.add.graphics().setDepth(y + 1).setAlpha(passageOpen ? 0.36 : 0);
    this.conduit.lineStyle(12, 0xa98cff, 0.2)
      .lineBetween(x, y, 1778, 285).lineBetween(1778, 285, SITE.x, SITE.y);
    this.conduit.lineStyle(4, 0xb9a6ff, 0.95)
      .lineBetween(x, y, 1778, 285).lineBetween(1778, 285, SITE.x, SITE.y);
    this.signal = scene.add.ellipse(x, y, 13, 8, 0xffbd54, 0.85).setDepth(y + 2).setAlpha(0);
    if (passageOpen) this.inscriptions.setAlpha(1);
  }

  canInvestigate(position: Vec2, dead: boolean): boolean {
    return this.armed && !this.opened && !dead &&
      Math.hypot(position.x - SITE.mechanismX, position.y - SITE.mechanismY) <= SITE.mechanismRadius;
  }

  arm(): void {
    if (this.armed) return;
    this.armed = true;
    this.scene.tweens.add({ targets: this.inscriptions, alpha: 0.85, duration: 380 });
  }

  activate(onSignalReached: () => void): void {
    if (this.opened) return;
    this.opened = true;
    this.inscriptions.setAlpha(1);
    this.pulse.setAlpha(0.6).setScale(0.5);
    this.scene.tweens.add({ targets: this.pulse, scale: 2.1, alpha: 0, duration: 900, ease: 'Cubic.easeOut' });
    this.conduit.setAlpha(0.95);
    this.signal.setPosition(SITE.mechanismX, SITE.mechanismY).setAlpha(1);
    this.scene.tweens.add({
      targets: this.signal, x: 1778, y: 285, duration: 280, ease: 'Sine.easeInOut',
      onComplete: () => this.scene.tweens.add({
        targets: this.signal, x: SITE.x, y: SITE.y, duration: 300, ease: 'Sine.easeInOut',
        onComplete: () => {
          this.signal.setAlpha(0);
          this.conduit.setAlpha(0.36);
          onSignalReached();
        },
      }),
    });
  }
}
