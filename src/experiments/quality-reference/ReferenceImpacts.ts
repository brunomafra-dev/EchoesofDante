import Phaser from 'phaser';
import type { Vec2 } from '../../utils/math';

type Burst = { sprites: Phaser.GameObjects.Image[]; label: Phaser.GameObjects.Text;
  at: number; x: number; y: number; angle: number };

// Fixed four-slot feedback pool. Reuses the existing soft raster mask. No new
// Graphics, tweens, timers, particles or allocations per rendered frame.
export class ReferenceImpacts {
  private cursor = 0;
  private readonly bursts: Burst[] = [];
  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < 4; i++) {
      const sprites = Array.from({ length: 5 }, () => scene.add.image(0, 0, 'terrain-blend')
        .setDepth(15001).setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
      const label = scene.add.text(0, 0, '', { fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '18px', color: '#e8efce', stroke: '#192c27', strokeThickness: 2 })
        .setOrigin(0.5).setDepth(15002).setVisible(false);
      this.bursts.push({ sprites, label, at: -Infinity, x: 0, y: 0, angle: 0 });
    }
  }
  hit(now: number, p: Vec2, color: number, damage: number, angle = 0): void {
    const burst = this.bursts[this.cursor++ % this.bursts.length];
    Object.assign(burst, { at: now, x: p.x, y: p.y, angle });
    burst.sprites.forEach(sprite => sprite.setTint(color).setPosition(p.x, p.y).setVisible(true));
    burst.label.setText(String(damage)).setColor(color === 0xff8f82 ? '#ff968a' : '#e8efce').setVisible(true);
  }
  update(now: number): void {
    for (const burst of this.bursts) {
      const age = now - burst.at;
      if (age > 420) {
        if (burst.label.visible) { burst.label.setVisible(false); burst.sprites.forEach(s => s.setVisible(false)); }
        continue;
      }
      const fade = Math.max(0, 1 - age / 190);
      burst.sprites[0].setPosition(burst.x, burst.y).setDisplaySize(42 + age * 0.09, 18)
        .setRotation(burst.angle + Math.PI / 2).setAlpha(fade * 0.9);
      for (let i = 1; i < 5; i++) {
        const angle = burst.angle + i * Math.PI * 0.5 + 0.35;
        const travel = 28 * Math.min(1, age / 160);
        burst.sprites[i].setPosition(burst.x + Math.cos(angle) * travel, burst.y + Math.sin(angle) * travel)
          .setDisplaySize(13 * fade, 3).setRotation(angle).setAlpha(fade);
      }
      burst.label.setPosition(burst.x, burst.y - 31 - Math.min(age, 420) * 0.045).setAlpha(1 - age / 420);
    }
  }
}
