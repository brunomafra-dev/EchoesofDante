import Phaser from 'phaser';
import { environmentImage } from '../visual/EnvironmentArt';
import { FOREST_ECHOES } from '../config/discovery';
import type { Vec2 } from '../utils/math';

export interface EchoSite {
  readonly id: string;
  readonly message: string;
  readonly position: Vec2;
  canInvestigate(position: Vec2, dead: boolean): boolean;
  activate(): void;
  respond(): void;
}

type ForestSite = typeof FOREST_ECHOES[keyof typeof FOREST_ECHOES];

// Two small authored sites share the existing E interaction, without changing the forest.
export class ForestEcho implements EchoSite {
  readonly id: string;
  readonly message: string;
  readonly position: Vec2;
  private activated: boolean;
  private mark: Phaser.GameObjects.Graphics;
  private pulse: Phaser.GameObjects.Ellipse;

  constructor(private scene: Phaser.Scene, private site: ForestSite, discovered: boolean) {
    this.id = site.id;
    this.message = site.message;
    this.position = { x: site.x, y: site.y };
    this.activated = discovered;
    const mineral = site.id === FOREST_ECHOES.mineral.id;
    this.mark = scene.add.graphics().setPosition(site.x, site.y).setDepth(site.y - 5);
    if (mineral) {
      // A narrow seam in the existing formation. MineralPulse remains independent.
      this.mark.fillStyle(0x302d36, 0.82).fillEllipse(0, 5, 42, 18);
      this.mark.lineStyle(3, 0xffbd54, discovered ? 0.88 : 0.5)
        .lineBetween(-15, 3, -3, -6).lineBetween(-3, -6, 12, 1);
      this.mark.fillStyle(0xffbd54, discovered ? 0.85 : 0.52).fillCircle(12, 1, 3);
    } else {
      // Uneven old fragment partly swallowed by soil; Arena registers its physical base.
      environmentImage(scene, 'ancient-remnant', site.x, site.y - 8, 95, 70, site.y - 6);
      this.mark.lineStyle(3, 0xa98cff, discovered ? 0.95 : 0.78)
        .lineBetween(-11, -10, 3, 1).lineBetween(3, 1, 24, -8);
      this.mark.fillStyle(0xffbd54, 0.85).fillCircle(3, 1, 4);
      this.mark.fillStyle(0x426c55).fillEllipse(-41, 15, 30, 12).fillEllipse(40, 14, 28, 11);
    }
    this.pulse = scene.add.ellipse(site.x, site.y + 2, 45, 18)
      .setStrokeStyle(2, mineral ? 0xffbd54 : 0xa98cff, 0.8).setDepth(site.y + 2).setAlpha(0);
  }

  canInvestigate(position: Vec2, dead: boolean): boolean {
    return !dead && !this.activated && Math.hypot(position.x - this.site.x, position.y - this.site.y) <= this.site.radius;
  }

  activate(): void {
    if (this.activated) return;
    this.activated = true;
    this.pulseWithColor(this.id === FOREST_ECHOES.mineral.id ? 0xffbd54 : 0xa98cff);
  }

  respond(): void {
    this.pulseWithColor(0xa98cff);
  }

  private pulseWithColor(color: number): void {
    this.pulse.setStrokeStyle(2, color, 0.8);
    this.pulse.setScale(1).setAlpha(0.8);
    this.scene.tweens.add({ targets: this.pulse, scaleX: 3, scaleY: 3, alpha: 0, duration: 850, ease: 'Cubic.easeOut' });
  }
}
