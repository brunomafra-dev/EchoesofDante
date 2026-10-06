import Phaser from 'phaser';
import { SIROCCO, SIROCCO_BORDERS, SIROCCO_ROCKS } from '../config/sirocco';
import { ChapterPortal } from './ChapterPortal';
import { EnvironmentPainter, trackEnvironmentOcclusion } from '../visual/EnvironmentArt';
import type { MovementBounds, Obstacle } from './Movement';
import { distance, type Vec2 } from '../utils/math';

type Stamp = { key: 'deep-stratum' | 'deep-mineral' | 'root-growth' | 'ancient-remnant' | 'resonance-growth';
  x: number; y: number; width: number; height: number; tint?: number; angle?: number; alpha?: number; flipX?: boolean };
type BakeZone = { x: number; width: number; walls: Stamp[]; formations: Stamp[]; roots: Stamp[]; rocks: readonly Obstacle[] };

// The Sirocco is authored in two connected stretches. Static art is baked once
// in matching depth bands; only the relays and two small portals stay live.
export class SiroccoBasin {
  readonly bounds: MovementBounds = { ...SIROCCO.bounds };
  readonly obstacles: Obstacle[] = [...SIROCCO_ROCKS, ...SIROCCO_BORDERS].map(obstacle => ({ ...obstacle }));
  readonly exitPortal: ChapterPortal;
  private readonly signal: Phaser.GameObjects.Ellipse;
  private readonly relay: Phaser.GameObjects.Image;
  private readonly routePulse: Phaser.GameObjects.Ellipse;

  constructor(private readonly scene: Phaser.Scene, recorded: boolean, frontierReached: boolean, routeSeen: boolean) {
    scene.add.image(0, 0, 'sirocco-ground').setOrigin(0).setDisplaySize(3000, SIROCCO.worldHeight).setDepth(-10002);
    scene.add.image(3000, 0, 'sirocco-east-ground').setOrigin(0)
      .setDisplaySize(SIROCCO.cameraWidth - 3000, SIROCCO.worldHeight).setDepth(-10002);
    this.bake();

    const { x, y } = SIROCCO.signal;
    scene.add.ellipse(x, y + 44, 215, 53, 0x291c15, 0.42).setDepth(y - 3);
    this.relay = scene.add.image(x, y + 30, 'deep-relay').setOrigin(0.5, 0.91).setDisplaySize(268, 242)
      .setTint(0xcbb08c).setDepth(y + 30);
    trackEnvironmentOcclusion(scene, this.relay);
    this.obstacles.push({ x, y: y + 36, radius: 32 });
    this.signal = scene.add.ellipse(x, y + 42, 76, 18, 0xa98cff, recorded ? 0.52 : 0.13).setDepth(y + 38);
    if (!recorded) scene.tweens.add({ targets: this.signal, alpha: { from: 0.28, to: 0.8 }, scaleX: { from: 0.85, to: 1.16 },
      duration: 1750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // This half-buried marker gives the optional northern loop a distinct focal point.
    const route = { x: 3750, y: 520 };
    this.routePulse = scene.add.ellipse(route.x, route.y + 28, 66, 18, 0xa98cff, routeSeen ? 0.28 : 0.1)
      .setDepth(route.y + 33);
    if (!routeSeen) scene.tweens.add({ targets: this.routePulse, alpha: { from: 0.12, to: 0.56 }, scale: { from: 0.9, to: 1.1 },
      duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.exitPortal = new ChapterPortal(scene, SIROCCO.exitPortal, frontierReached);
  }

  canInvestigate(position: Vec2, dead: boolean, recorded: boolean): boolean {
    return !dead && !recorded && distance(position, SIROCCO.signal) < SIROCCO.signal.radius;
  }

  respond(): void {
    this.signal.setFillStyle(0xa98cff, 0.72).setScale(1.28, 1.28);
    this.scene.tweens.add({ targets: this.signal, scaleX: 1, scaleY: 1, alpha: 0.42, duration: 650, ease: 'Cubic.easeOut' });
    this.scene.tweens.add({ targets: this.relay, tint: 0xffddb1, duration: 160, yoyo: true, repeat: 2 });
    this.routePulse.setAlpha(0.62).setScale(1.2);
    this.scene.tweens.add({ targets: this.routePulse, alpha: 0.3, scale: 1, duration: 900, ease: 'Cubic.easeOut' });
  }

  revealExit(): void { this.exitPortal.activate(); }

  private bake(): void {
    const baseWalls: Stamp[] = [
      { key: 'deep-stratum', x: 540, y: 438, width: 450, height: 225, tint: 0xb78568 },
      { key: 'deep-stratum', x: 1035, y: 460, width: 390, height: 190, tint: 0x987865, flipX: true },
      { key: 'deep-stratum', x: 1500, y: 435, width: 470, height: 220, tint: 0xb58667 },
      { key: 'deep-stratum', x: 2040, y: 448, width: 430, height: 215, tint: 0xa37c65, flipX: true },
      { key: 'deep-stratum', x: 2620, y: 452, width: 440, height: 220, tint: 0xb08b6d },
      { key: 'deep-stratum', x: 670, y: 1082, width: 455, height: 225, tint: 0xa47b63, flipX: true },
      { key: 'deep-stratum', x: 1220, y: 1090, width: 440, height: 210, tint: 0xb78969 },
      { key: 'deep-stratum', x: 1810, y: 1080, width: 420, height: 210, tint: 0x9d7968, flipX: true },
      { key: 'deep-stratum', x: 2440, y: 1085, width: 440, height: 225, tint: 0xb48766 },
    ];
    const baseFormations: Stamp[] = [
      { key: 'deep-mineral', x: 970, y: 515, width: 180, height: 145, tint: 0xe6ba79 },
      { key: 'deep-mineral', x: 1040, y: 535, width: 107, height: 98, tint: 0xb8a295, flipX: true },
      { key: 'deep-mineral', x: 2620, y: 930, width: 188, height: 144, tint: 0xddad70 },
      { key: 'ancient-remnant', x: 2030, y: 760, width: 385, height: 250, tint: 0xb89c84, flipX: true },
      { key: 'resonance-growth', x: 2035, y: 713, width: 232, height: 186, tint: 0xc3aa91 },
    ];
    const baseRoots: Stamp[] = [
      { key: 'root-growth', x: 675, y: 585, width: 265, height: 82, angle: -15, tint: 0x9c8b67 },
      { key: 'root-growth', x: 1210, y: 1012, width: 300, height: 84, angle: 9, tint: 0xa98f69 },
      { key: 'root-growth', x: 1665, y: 585, width: 268, height: 78, angle: 17, tint: 0x9a896b },
      { key: 'root-growth', x: 2380, y: 985, width: 305, height: 86, angle: -12, tint: 0xa68f6b },
      { key: 'root-growth', x: 2180, y: 904, width: 195, height: 66, angle: 7, tint: 0xa18a6c },
    ];

    const eastWalls: Stamp[] = [
      { key: 'deep-stratum', x: 3150, y: 445, width: 420, height: 205, tint: 0xb1876b },
      { key: 'deep-stratum', x: 3590, y: 438, width: 455, height: 225, tint: 0xa37a62, flipX: true },
      { key: 'deep-stratum', x: 4070, y: 465, width: 440, height: 220, tint: 0xb18566 },
      { key: 'deep-stratum', x: 4550, y: 435, width: 460, height: 215, tint: 0xa68067, flipX: true },
      { key: 'deep-stratum', x: 3240, y: 1085, width: 450, height: 220, tint: 0xa87f67 },
      { key: 'deep-stratum', x: 3700, y: 1095, width: 420, height: 210, tint: 0xb58a6b, flipX: true },
      { key: 'deep-stratum', x: 4140, y: 1080, width: 470, height: 225, tint: 0xa57b64 },
      { key: 'deep-stratum', x: 4630, y: 1090, width: 450, height: 220, tint: 0xb38768, flipX: true },
    ];
    const eastFormations: Stamp[] = [
      { key: 'deep-mineral', x: 3325, y: 570, width: 165, height: 135, tint: 0xd8b676 },
      { key: 'deep-mineral', x: 3480, y: 1005, width: 200, height: 150, tint: 0xd6ae72, flipX: true },
      { key: 'ancient-remnant', x: 3750, y: 505, width: 265, height: 195, tint: 0xb49a81, flipX: true },
      { key: 'resonance-growth', x: 3750, y: 475, width: 170, height: 145, tint: 0xc2a990 },
      { key: 'deep-mineral', x: 3890, y: 525, width: 118, height: 105, tint: 0xe2b66f },
      { key: 'deep-mineral', x: 4330, y: 900, width: 205, height: 158, tint: 0xd8b276 },
      { key: 'ancient-remnant', x: 4580, y: 795, width: 315, height: 245, tint: 0xb3987d },
      { key: 'resonance-growth', x: 4610, y: 750, width: 198, height: 178, tint: 0xc6aa8d },
    ];
    const eastRoots: Stamp[] = [
      { key: 'root-growth', x: 3280, y: 635, width: 280, height: 78, angle: -14, tint: 0xa68e6f },
      { key: 'root-growth', x: 3585, y: 620, width: 235, height: 70, angle: 14, tint: 0x9a846a },
      { key: 'root-growth', x: 3630, y: 980, width: 300, height: 82, angle: -8, tint: 0xa78c6d },
      { key: 'root-growth', x: 4050, y: 710, width: 260, height: 72, angle: 12, tint: 0xa1886a },
      { key: 'root-growth', x: 4470, y: 995, width: 290, height: 82, angle: -17, tint: 0xa58d69 },
      { key: 'root-growth', x: 4640, y: 950, width: 235, height: 72, angle: 11, tint: 0x9d8467 },
    ];

    const zones: BakeZone[] = [
      { x: 0, width: 3000, walls: baseWalls, formations: baseFormations, roots: baseRoots,
        rocks: SIROCCO_ROCKS.filter(item => item.x < 3000) },
      { x: 3000, width: SIROCCO.cameraWidth - 3000, walls: eastWalls, formations: eastFormations, roots: eastRoots,
        rocks: SIROCCO_ROCKS.filter(item => item.x >= 3000) },
    ];
    const bandHeight = 500;
    for (const zone of zones) for (let top = 0; top < SIROCCO.worldHeight; top += bandHeight) {
      const height = Math.min(bandHeight + 220, SIROCCO.worldHeight - top + 110);
      const layer = this.scene.add.renderTexture(zone.x, Math.max(0, top - 110), zone.width, height)
        .setOrigin(0).setDepth(top + bandHeight / 2 - 5);
      const painter = new EnvironmentPainter(this.scene, layer);
      const inBand = (item: Stamp | Obstacle) => Math.floor(item.y / bandHeight) === top / bandHeight;
      for (const stamp of [...zone.walls, ...zone.formations, ...zone.roots].filter(inBand)) painter.stamp(stamp as Stamp);
      for (const wall of zone.walls.filter(inBand)) {
        painter.sediment(wall.x, wall.y + wall.height * 0.24, wall.width * 1.22, wall.height * 0.38, 0x614b3b, 0.3);
        painter.contact(wall.x, wall.y + wall.height * 0.32, wall.width * 0.84, wall.height * 0.2, 0.5);
      }
      for (const rock of zone.rocks.filter(inBand)) {
        painter.apron(rock.x, rock.y + 10, rock.radius * 3.1, zone.x === 0 ? 0xb89472 : 0xae8b6d);
        painter.stamp({ key: 'world-rock', x: rock.x, y: rock.y, width: rock.radius * 2.8,
          height: rock.radius * 2.25, tint: zone.x === 0 ? 0xc7a27c : 0xc0a07a, flipX: Math.sin(rock.x) < 0 });
      }
      painter.destroy();
    }
  }
}
