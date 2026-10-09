import Phaser from 'phaser';
import { GLACIER, type GlacierAreaId } from '../config/glacier';
import { ChapterPortal } from './ChapterPortal';
import type { Obstacle } from './Movement';
import { EnvironmentPainter, trackEnvironmentOcclusion } from '../visual/EnvironmentArt';

// Painted terrain + existing raster masses, baked once. Raised bases retain foot sorting.
export class GlacierRegion {
  readonly bounds;
  readonly obstacles;
  readonly back: ChapterPortal;
  readonly onward?: ChapterPortal;
  private readonly signal: Phaser.GameObjects.Ellipse;
  private readonly gate?: Phaser.GameObjects.Image;
  private readonly gateObstacle: Obstacle = { x: 805, y: 990, radius: 90 };
  constructor(private readonly scene: Phaser.Scene, readonly id: GlacierAreaId, recorded: boolean, defeated: boolean) {
    const c = GLACIER[id];
    this.bounds = { ...c.bounds };
    this.obstacles = c.rocks.map(r => ({ ...r }));
    scene.add.image(0, 0, 'glacier-ground').setOrigin(0).setDisplaySize(c.width, c.height)
      .setTint(id === 'icecave' ? 0x829dab : 0xc4d6df).setDepth(-10002);
    for (let top = 0; top < c.height; top += 550) {
      const cache = scene.add.renderTexture(0, Math.max(0, top - 140), c.width,
        Math.min(830, c.height - top + 140)).setOrigin(0).setDepth(-9900 + top / 550);
      const p = new EnvironmentPainter(scene, cache);
      if (top === 0 || top === 1100) {
        for (let x = 430; x < c.width; x += 610) p.sediment(x, top === 0 ? 395 : 1510, 850, 360, 0x1d3347, .48);
      }
      for (const r of c.rocks.filter(r => Math.floor(r.y / 550) === top / 550)) p.rock(r.x, r.y, r.radius, 0xb0c5d2, true);
      // Perimeter strata sit beyond the playable floor, never cover the route.
      for (let x = 380; x < c.width - 200; x += 420) {
        const y = top === 0 ? 360 + Math.sin(x) * 20 : top === 1100 ? 1530 : undefined;
        if (y !== undefined) {
          p.contact(x, y + 40, 280, 65, .5);
          p.stamp({ key: 'deep-stratum', x, y, width: 340, height: 165, tint: 0xadc0cf, flipX: Math.sin(x) < 0 });
        }
      }
      if (top === 550) {
        p.apron(c.relay.x, c.relay.y, 160, 0xbac9d0);
        p.stamp({ key: 'deep-mineral', x: id === 'icecave' ? 1090 : 1210, y: 540, width: 155, height: 95, tint: 0xb9c8e3 });
        p.stamp({ key: 'ancient-remnant', x: id === 'icecave' ? 2030 : 1730, y: 1330, width: 185, height: 100, tint: 0x9dabbc, angle: -12 });
        p.stamp({ key: 'root-growth', x: 1050, y: 1260, width: 180, height: 50, tint: 0x94a5a3 });
      }
      p.destroy();
    }
    const relay = scene.add.image(c.relay.x, c.relay.y - 18, 'deep-relay').setOrigin(.5, .94)
      .setDisplaySize(175, 160).setTint(0xb9cbd9).setDepth(c.relay.y - 35);
    trackEnvironmentOcclusion(scene, relay);
    this.signal = scene.add.ellipse(c.relay.x, c.relay.y - 35, 62, 13, 0xa98cff, recorded ? .6 : .15).setDepth(c.relay.y - 33);
    this.back = new ChapterPortal(scene, c.back, true);
    if (id === 'icecave') this.onward = new ChapterPortal(scene, c.exit, recorded);
    else {
      this.gate = scene.add.image(805, 990, 'open-threshold').setOrigin(.5, .94).setDisplaySize(190, 170).setTint(0xa8bfcb).setDepth(955);
      trackEnvironmentOcclusion(scene, this.gate);
      if (defeated) this.resolve();
    }
  }
  respond(): void {
    this.onward?.activate();
    this.scene.tweens.killTweensOf(this.signal);
    this.signal.setAlpha(1).setScale(1.6);
    this.scene.tweens.add({ targets: this.signal, alpha: .6, scale: 1, duration: 900 });
  }
  resolve(): void { this.signal.setFillStyle(0xffbd54, .65); }
  setEncounterActive(active: boolean): void {
    this.gate?.setTexture(active ? 'sealed-threshold' : 'open-threshold');
    const index = this.obstacles.indexOf(this.gateObstacle);
    if (active && index === -1) this.obstacles.push(this.gateObstacle);
    else if (!active && index !== -1) this.obstacles.splice(index, 1);
  }
}
