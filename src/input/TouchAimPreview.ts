import Phaser from 'phaser';
import { KINETIC_CHARGE, PLAYER } from '../config/game';
import type { Vec2 } from '../utils/math';

// Draw once. Gestures only move/rotate these two reusable visual guides.
export class TouchAimPreview {
  setCombatPresentation(hunter: boolean): void {
    if (!hunter) return;
    this.strike.clear(); this.charge.clear();
    this.arrow(this.strike, 24, 700);
    this.arrow(this.charge, 24, 980);
    this.charge.lineStyle(1, 0x5fe6d8, .3).lineBetween(24, -7, 980, -7).lineBetween(24, 7, 980, 7);
  }
  private strike: Phaser.GameObjects.Graphics;
  private charge: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.strike = scene.add.graphics().setDepth(14998).setVisible(false);
    const points = [{ x: 0, y: 0 }];
    for (let i = 0; i <= 24; i++) {
      const angle = -PLAYER.attackHalfAngle + PLAYER.attackHalfAngle * 2 * i / 24;
      points.push({ x: Math.cos(angle) * PLAYER.attackRange, y: Math.sin(angle) * PLAYER.attackRange });
    }
    this.strike.fillStyle(0x5fe6d8, 0.06).fillPoints(points, true);
    this.strike.lineStyle(1.5, 0x5fe6d8, 0.55).strokePoints(points, true);
    this.arrow(this.strike, 24, PLAYER.attackRange);

    this.charge = scene.add.graphics().setDepth(14998).setVisible(false);
    const start = KINETIC_CHARGE.waveStart;
    const end = start + KINETIC_CHARGE.waveTravel;
    const width = KINETIC_CHARGE.waveHalfWidth;
    this.charge.lineStyle(1.5, 0x5fe6d8, 0.5);
    this.charge.strokePoints([{ x: start, y: -width }, { x: end, y: -width }, { x: end, y: width }, { x: start, y: width }], false);
    this.arrow(this.charge, 28, end);
  }

  private arrow(graphics: Phaser.GameObjects.Graphics, start: number, end: number): void {
    graphics.lineStyle(2, 0x5fe6d8, 0.8);
    graphics.lineBetween(start, 0, end, 0);
    graphics.strokePoints([{ x: end - 12, y: -8 }, { x: end, y: 0 }, { x: end - 12, y: 8 }], false);
  }

  update(mode: 'attack' | 'charge' | undefined, position: Vec2, angle: number): void {
    this.strike.setVisible(mode === 'attack');
    this.charge.setVisible(mode === 'charge');
    const active = mode === 'attack' ? this.strike : mode === 'charge' ? this.charge : undefined;
    active?.setPosition(position.x, position.y).setRotation(angle);
  }

  destroy(): void { this.strike.destroy(); this.charge.destroy(); }
}
