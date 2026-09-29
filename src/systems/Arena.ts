import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/game';
import { FOREST_CLEARINGS, FOREST_PATHS, FOREST_ROCKS } from '../config/forest';
import type { Obstacle } from './Movement';

export class Arena {
  readonly obstacles: Obstacle[] = [];
  private seed = 92341;

  constructor(private scene: Phaser.Scene) {
    this.createTreeTextures();
    this.draw();
    this.bakeStaticScenery();
  }

  private createTreeTextures(): void {
    const size = 100;
    if (!this.scene.textures.exists('dante-tree-trunk')) {
      const g = this.scene.add.graphics().setVisible(false);
      g.fillStyle(0x041a20, 0.5).fillEllipse(118, 110, size * 1.9, size * 0.62);
      g.fillStyle(0x345a54).fillRoundedRect(98, 10, size * 0.25, size * 1.05, 5);
      g.lineStyle(3, 0x608677, 0.7).lineBetween(110, 28, 114, 100);
      g.generateTexture('dante-tree-trunk', 220, 155);
      g.destroy();
    }
    for (const blue of [true, false]) {
      const key = blue ? 'dante-canopy-blue' : 'dante-canopy-green';
      if (this.scene.textures.exists(key)) continue;
      const g = this.scene.add.graphics().setVisible(false);
      const ox = 100;
      const oy = 90;
      g.fillStyle(0x071e27, 0.45).fillEllipse(ox + 5, oy + 9, size * 1.55, size * 0.75);
      g.fillStyle(blue ? 0x244655 : 0x245348);
      g.fillEllipse(ox - size * 0.34, oy - size * 0.09, size * 0.98, size * 0.82);
      g.fillEllipse(ox + size * 0.36, oy - size * 0.18, size * 0.95, size * 0.87);
      g.fillStyle(blue ? 0x406a76 : 0x39765e).fillEllipse(ox, oy - size * 0.38, size * 1.08, size * 0.77);
      g.lineStyle(2, 0x8bbaa2, 0.5).strokeEllipse(ox, oy - size * 0.38, size * 1.08, size * 0.77);
      g.fillStyle(blue ? 0x9bb3c3 : 0xa9d4a8, 0.7).fillCircle(ox + size * 0.23, oy - size * 0.48, 2.6);
      g.fillCircle(ox - size * 0.38, oy - size * 0.06, 2);
      g.generateTexture(key, 200, 150);
      g.destroy();
    }
  }

  private bakeStaticScenery(): void {
    // Graphics are costly to replay every frame. Capture the static art once,
    // keeping narrow depth bands so the player can still pass among the trees.
    const graphics = this.scene.children.list.filter((object): object is Phaser.GameObjects.Graphics =>
      object instanceof Phaser.GameObjects.Graphics);
    const floor = graphics.find(object => object.depth === -10000);
    if (floor) {
      this.scene.add.renderTexture(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
        .setOrigin(0).setDepth(floor.depth).draw(floor);
    }
    const bandHeight = 100;
    const bands = new Map<number, Phaser.GameObjects.Graphics[]>();
    for (const object of graphics) {
      if (object === floor) continue;
      const band = Math.floor(Phaser.Math.Clamp(object.depth, 0, WORLD_HEIGHT - 1) / bandHeight);
      const group = bands.get(band) ?? [];
      group.push(object);
      bands.set(band, group);
    }
    for (const [band, group] of bands) {
      const top = Math.max(0, band * bandHeight - 170);
      const bottom = Math.min(WORLD_HEIGHT, (band + 1) * bandHeight + 150);
      const layer = this.scene.add.renderTexture(0, top, WORLD_WIDTH, bottom - top)
        .setOrigin(0).setDepth(band * bandHeight + bandHeight / 2);
      layer.beginDraw();
      for (const object of group.sort((a, b) => a.depth - b.depth)) {
        layer.batchDraw(object, object.x, object.y - top);
      }
      layer.endDraw();
    }
    graphics.forEach(object => object.destroy());
  }

  private random(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  private draw(): void {
    const scene = this.scene;
    const floor = scene.add.graphics().setDepth(-10000);
    floor.fillStyle(0x0b252a).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    for (let i = 0; i < 25; i++) {
      this.patch(floor, 80 + this.random() * 2040, 80 + this.random() * 1340, 95 + this.random() * 220, 60 + this.random() * 135, i % 3 === 0 ? 0x173d3d : 0x123239, 0.75);
    }
    // Broad, connected soil trails leave room to dodge and read nearby enemies.
    for (const path of FOREST_PATHS) {
      for (let i = 1; i < path.points.length; i++) {
        const a = path.points[i - 1];
        const b = path.points[i];
        floor.lineStyle(path.width, 0x284a40).lineBetween(a.x, a.y, b.x, b.y);
        floor.fillStyle(0x284a40).fillCircle(a.x, a.y, path.width / 2).fillCircle(b.x, b.y, path.width / 2);
        floor.lineStyle(path.width * 0.38, 0x496353, 0.24).lineBetween(a.x, a.y, b.x, b.y);
      }
    }
    for (const clearing of FOREST_CLEARINGS) {
      this.patch(floor, clearing.x, clearing.y, clearing.rx, clearing.ry, 0x2d5144, 0.85);
      this.patch(floor, clearing.x, clearing.y, clearing.rx * 0.7, clearing.ry * 0.65, 0x3c5c49, 0.3);
    }
    for (let i = 0; i < 18; i++) {
      const x = 130 + this.random() * 1940;
      const y = 120 + this.random() * 1250;
      this.patch(floor, x, y, 26 + this.random() * 65, 12 + this.random() * 32, i % 2 ? 0x53766b : 0x294e52, 0.2);
    }
    // A modest survey pad establishes the origin; worn paving suggests a route north.
    floor.fillStyle(0x40595a).fillRoundedRect(310, 1180, 180, 130, 14);
    floor.lineStyle(3, 0xa0bdb1, 0.55).strokeRoundedRect(320, 1190, 160, 110, 10);
    for (let y = 1195; y < 1270; y += 25) {
      floor.lineStyle(4, 0xa5c5bd, 0.55).lineBetween(380, y + 12, 400, y);
      floor.lineBetween(400, y, 420, y + 12);
    }
    for (let i = 0; i < 5; i++) {
      floor.fillStyle(0x6b8378, 0.45).fillRoundedRect(1440 + i * 28, 375 - i * 18, 20, 35, 3);
    }
    for (let i = 0; i < 290; i++) {
      const x = 72 + this.random() * (WORLD_WIDTH - 144);
      const y = 72 + this.random() * (WORLD_HEIGHT - 144);
      const r = 1 + this.random() * 2.8;
      floor.fillStyle(this.random() > 0.84 ? 0x8fb69b : 0x648d78, 0.17 + this.random() * 0.28).fillCircle(x, y, r);
    }
    FOREST_ROCKS.forEach(([x, y, radius]) => this.rock(x, y, radius));
    // Visible rock banks cover the existing world clamp. No extra collision system.
    for (let x = 100; x <= WORLD_WIDTH - 100; x += 125) {
      const north = 100 + Math.sin(x * 0.009) * 24;
      const south = WORLD_HEIGHT - 100 + Math.sin(x * 0.007) * 20;
      this.rock(x, north, 90 + this.random() * 22);
      this.rock(x, south, 90 + this.random() * 22);
      this.plant(x + this.random() * 24, north - 35, 45 + this.random() * 35);
      this.plant(x - this.random() * 24, south + 35, 45 + this.random() * 35);
    }
    for (let y = 225; y < WORLD_HEIGHT - 100; y += 125) {
      const west = 100 + Math.sin(y * 0.009) * 25;
      const east = WORLD_WIDTH - 100 + Math.sin(y * 0.008) * 25;
      this.rock(west, y, 90 + this.random() * 22);
      this.rock(east, y, 90 + this.random() * 22);
      this.plant(west - 40, y, 45 + this.random() * 35);
      this.plant(east + 40, y, 45 + this.random() * 35);
    }
    let trees = 0;
    for (let i = 0; i < 240 && trees < 80; i++) {
      const x = 210 + this.random() * (WORLD_WIDTH - 420);
      const y = 210 + this.random() * (WORLD_HEIGHT - 420);
      if (this.nearRoute(x, y, 65)) continue;
      if (this.obstacles.some(rock => Math.hypot(x - rock.x, y - rock.y) < rock.radius + 55)) continue;
      this.plant(x, y, 32 + this.random() * 34, trees % 16 === 0);
      trees++;
    }
    for (let i = 0; i < 35; i++) {
      const x = 100 + this.random() * 2000;
      const y = 110 + this.random() * 1280;
      if (this.nearRoute(x, y, 0)) continue;
      this.fern(x, y, 8 + this.random() * 12);
    }
    this.plant(420, 390, 110, true);
    this.obstacles.push({ x: 420, y: 390, radius: 25 });
    [-70, 0, 70].forEach(offset => this.obstacles.push({ x: 1500 + offset, y: 285, radius: 35 }));
    this.rock(1930, 1020, 67);
    this.rock(1900, 1110, 45);
    this.beacon(1860, 1120);
    this.beacon(290, 1220);
    this.beacon(510, 1220);
    this.beacon(1740, 220);
    this.motes();
  }

  private nearRoute(x: number, y: number, margin: number): boolean {
    if (FOREST_CLEARINGS.some(c => ((x - c.x) / (c.rx + margin)) ** 2 + ((y - c.y) / (c.ry + margin)) ** 2 < 1)) return true;
    return FOREST_PATHS.some(path => path.points.slice(1).some((b, i) => {
      const a = path.points[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const t = Phaser.Math.Clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
      return Math.hypot(x - a.x - t * dx, y - a.y - t * dy) < path.width / 2 + margin;
    }));
  }

  private patch(g: Phaser.GameObjects.Graphics, x: number, y: number, rx: number, ry: number, color: number, alpha: number): void {
    g.fillStyle(color, alpha).beginPath();
    for (let i = 0; i <= 15; i++) {
      const angle = i / 15 * Math.PI * 2;
      const wobble = i === 15 ? 1 : 0.84 + this.random() * 0.31;
      const px = x + Math.cos(angle) * rx * wobble;
      const py = y + Math.sin(angle) * ry * wobble;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath().fillPath();
  }

  private plant(x: number, y: number, size: number, sway = false): void {
    const shade = this.random();
    this.scene.add.image(x, y, 'dante-tree-trunk').setOrigin(0.5, 100 / 155).setScale(size / 100).setDepth(y + 2);
    const canopy = this.scene.add.image(x, y - size * 0.9, shade < 0.3 ? 'dante-canopy-blue' : 'dante-canopy-green')
      .setOrigin(0.5, 0.6).setScale(size / 100).setDepth(y + 12);
    if (sway) {
      this.scene.tweens.add({ targets: canopy, angle: 2.5, duration: 2200 + this.random() * 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private fern(x: number, y: number, size: number): void {
    const g = this.scene.add.graphics().setDepth(y + 1).setPosition(x, y);
    g.lineStyle(2, 0x709a7e, 0.6).lineBetween(0, 0, 0, -size);
    for (let i = 0; i < 3; i++) {
      const h = size * (0.2 + i * 0.23);
      g.fillStyle(i === 1 ? 0x57887c : 0x3d7669, 0.9).fillEllipse(-size * 0.32, -h, size * 0.55, size * 0.32);
      g.fillEllipse(size * 0.32, -h - 2, size * 0.55, size * 0.32);
    }
    g.fillStyle(0xa4cdaa, 0.65).fillCircle(0, -size, 2);
  }

  private rock(x: number, y: number, radius: number): void {
    this.obstacles.push({ x, y, radius: radius * 0.72 });
    const g = this.scene.add.graphics().setDepth(y - 6).setPosition(x, y);
    const r = radius;
    const skew = Math.sin(x * 0.019 + y * 0.023) * r * 0.11;
    g.fillStyle(0x061b23, 0.56).fillEllipse(8, r * 0.55, r * 2.25, r * 0.69);
    g.fillStyle(0x223c43).beginPath()
      .moveTo(-r * 0.98, -r * 0.12).lineTo(-r * 0.76, -r * 0.62)
      .lineTo(-r * 0.3 + skew, -r * 0.77).lineTo(r * 0.34, -r * 0.67)
      .lineTo(r * 0.88, -r * 0.26).lineTo(r * 0.94, r * 0.25)
      .lineTo(r * 0.53, r * 0.67).lineTo(-r * 0.18, r * 0.73)
      .lineTo(-r * 0.78, r * 0.47).closePath().fillPath();
    g.fillStyle(0x607d7c).beginPath()
      .moveTo(-r * 0.76, -r * 0.62).lineTo(-r * 0.3 + skew, -r * 0.77)
      .lineTo(r * 0.34, -r * 0.67).lineTo(r * 0.88, -r * 0.26)
      .lineTo(r * 0.21, r * 0.04).lineTo(-r * 0.52, r * 0.1)
      .lineTo(-r * 0.98, -r * 0.12).closePath().fillPath();
    g.fillStyle(0x36575b).beginPath()
      .moveTo(r * 0.21, r * 0.04).lineTo(r * 0.88, -r * 0.26)
      .lineTo(r * 0.94, r * 0.25).lineTo(r * 0.53, r * 0.67)
      .lineTo(-r * 0.18, r * 0.73).lineTo(-r * 0.52, r * 0.1)
      .closePath().fillPath();
    g.lineStyle(2, 0xa6b6a2, 0.58).lineBetween(-r * 0.65, -r * 0.41, -r * 0.17, -r * 0.52);
    g.lineStyle(2, 0x8fa698, 0.46).lineBetween(r * 0.21, r * 0.04, r * 0.47, r * 0.38);
  }

  private beacon(x: number, y: number): void {
    const g = this.scene.add.graphics().setDepth(y - 5).setPosition(x, y);
    g.fillStyle(0x081d25, 0.62).fillEllipse(0, 16, 88, 29);
    g.fillStyle(0x526e70).fillEllipse(0, 8, 48, 25);
    g.fillStyle(0x16343e).fillRoundedRect(-11, -63, 22, 70, 4);
    g.fillStyle(0x617e82).fillRoundedRect(-11, -63, 22, 11, 2);
    g.lineStyle(2, 0x80c4c0, 0.7).lineBetween(-5, -48, -5, -16);
    g.lineBetween(5, -48, 5, -16);
    g.fillStyle(0xa3ded0).fillCircle(0, -42, 4);
    g.fillStyle(0x8c81ae).fillCircle(0, -12, 3);
  }

  private motes(): void {
    for (let i = 0; i < 18; i++) {
      const x = 120 + this.random() * (WORLD_WIDTH - 240);
      const y = 120 + this.random() * (WORLD_HEIGHT - 240);
      const mote = this.scene.add.circle(x, y, 1.5 + this.random() * 1.4, i % 5 === 0 ? 0xa9a2ca : 0xb4dfc5, 0.24).setDepth(y + 20);
      this.scene.tweens.add({ targets: mote, y: y - 13, alpha: 0.07, duration: 1900 + this.random() * 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}
