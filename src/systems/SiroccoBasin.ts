import Phaser from 'phaser';
import { SIROCCO, SIROCCO_BORDERS, SIROCCO_ROCKS } from '../config/sirocco';
import { EnvironmentPainter, trackEnvironmentOcclusion } from '../visual/EnvironmentArt';
import type { MovementBounds, Obstacle } from './Movement';
import { distance, type Vec2 } from '../utils/math';

type Stamp = { key: 'deep-stratum' | 'deep-mineral' | 'root-growth' | 'ancient-remnant' | 'resonance-growth';
  x: number; y: number; width: number; height: number; tint?: number; angle?: number; alpha?: number; flipX?: boolean };

// A separate authored region; scenery is captured once in three depth bands.
export class SiroccoBasin {
  readonly bounds: MovementBounds = { ...SIROCCO.bounds };
  readonly obstacles: Obstacle[] = [...SIROCCO_ROCKS, ...SIROCCO_BORDERS].map(obstacle => ({ ...obstacle }));
  private readonly signal: Phaser.GameObjects.Ellipse;
  private readonly relay: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene, recorded: boolean) {
    scene.add.image(0, 0, 'sirocco-ground').setOrigin(0).setDisplaySize(SIROCCO.cameraWidth, SIROCCO.worldHeight).setDepth(-10002);
    this.bake();
    const { x, y } = SIROCCO.signal;
    const contact = scene.add.ellipse(x, y + 44, 215, 53, 0x291c15, 0.42).setDepth(y - 3);
    this.relay = scene.add.image(x, y + 30, 'deep-relay').setOrigin(0.5, 0.91).setDisplaySize(268, 242)
      .setTint(0xcbb08c).setDepth(y + 30);
    trackEnvironmentOcclusion(scene, this.relay);
    this.obstacles.push({ x, y: y + 36, radius: 32 });
    this.signal = scene.add.ellipse(x, y + 42, 76, 18, 0xa98cff, recorded ? 0.52 : 0.13)
      .setDepth(y + 38);
    if (!recorded) scene.tweens.add({ targets: this.signal, alpha: { from: 0.28, to: 0.8 }, scaleX: { from: 0.85, to: 1.16 },
      duration: 1750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    contact.setAlpha(0.42);
  }

  canInvestigate(position: Vec2, dead: boolean, recorded: boolean): boolean {
    return !dead && !recorded && distance(position, SIROCCO.signal) < SIROCCO.signal.radius;
  }

  respond(): void {
    this.signal.setFillStyle(0xa98cff, 0.72).setScale(1.28, 1.28);
    this.scene.tweens.add({ targets: this.signal, scaleX: 1, scaleY: 1, alpha: 0.42, duration: 650, ease: 'Cubic.easeOut' });
    this.scene.tweens.add({ targets: this.relay, tint: 0xffddb1, duration: 160, yoyo: true, repeat: 2 });
  }

  private bake(): void {
    const wallMasses: Stamp[] = [
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
    const formations: Stamp[] = [
      { key: 'deep-mineral', x: 970, y: 515, width: 180, height: 145, tint: 0xe6ba79 },
      { key: 'deep-mineral', x: 1040, y: 535, width: 107, height: 98, tint: 0xb8a295, flipX: true },
      { key: 'deep-mineral', x: 2620, y: 930, width: 188, height: 144, tint: 0xddad70 },
      { key: 'ancient-remnant', x: 2030, y: 760, width: 385, height: 250, tint: 0xb89c84, flipX: true },
      { key: 'resonance-growth', x: 2035, y: 713, width: 232, height: 186, tint: 0xc3aa91 },
    ];
    const roots: Stamp[] = [
      { key: 'root-growth', x: 675, y: 585, width: 265, height: 82, angle: -15, tint: 0x9c8b67 },
      { key: 'root-growth', x: 1210, y: 1012, width: 300, height: 84, angle: 9, tint: 0xa98f69 },
      { key: 'root-growth', x: 1665, y: 585, width: 268, height: 78, angle: 17, tint: 0x9a896b },
      { key: 'root-growth', x: 2380, y: 985, width: 305, height: 86, angle: -12, tint: 0xa68f6b },
      { key: 'root-growth', x: 2180, y: 904, width: 195, height: 66, angle: 7, tint: 0xa18a6c },
    ];
    const all = [...wallMasses, ...formations, ...roots];
    const bandHeight = 500;
    for (let top = 0; top < SIROCCO.worldHeight; top += bandHeight) {
      const height = Math.min(bandHeight + 220, SIROCCO.worldHeight - top + 110);
      const layer = this.scene.add.renderTexture(0, Math.max(0, top - 110), SIROCCO.cameraWidth, height)
        .setOrigin(0).setDepth(top + bandHeight / 2 - 5);
      const painter = new EnvironmentPainter(this.scene, layer);
      for (const stamp of all.filter(item => Math.floor(item.y / bandHeight) === top / bandHeight)) {
        painter.stamp(stamp);
      }
      // Broad, low contact layers make formations sit into the dusty basin.
      for (const item of wallMasses.filter(stamp => Math.floor(stamp.y / bandHeight) === top / bandHeight)) {
        painter.sediment(item.x, item.y + item.height * 0.24, item.width * 1.22, item.height * 0.38, 0x614b3b, 0.3);
        painter.contact(item.x, item.y + item.height * 0.32, item.width * 0.84, item.height * 0.2, 0.5);
      }
      for (const rock of SIROCCO_ROCKS.filter(item => Math.floor(item.y / bandHeight) === top / bandHeight)) {
        painter.apron(rock.x, rock.y + 10, rock.radius * 3.1, 0xb89472);
        painter.stamp({ key: 'world-rock', x: rock.x, y: rock.y, width: rock.radius * 2.8,
          height: rock.radius * 2.25, tint: 0xc7a27c, flipX: Math.sin(rock.x) < 0 });
      }
      painter.destroy();
    }
  }
}
