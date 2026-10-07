import Phaser from 'phaser';
import { DUNES, DUNES_ROCKS } from '../config/dunes';
import { ChapterPortal } from './ChapterPortal';
import { EnvironmentPainter, trackEnvironmentOcclusion, type EnvironmentStamp } from '../visual/EnvironmentArt';
import { distance, type Vec2 } from '../utils/math';

// One authored backplate and four static depth bands. No terrain update loop.
export class DunesInterior {
  readonly bounds = { ...DUNES.bounds };
  readonly obstacles = DUNES_ROCKS.map(rock => ({ ...rock }));
  readonly returnPortal: ChapterPortal;
  private readonly ruin: Phaser.GameObjects.Image;
  private readonly response: Phaser.GameObjects.Ellipse;

  constructor(private readonly scene: Phaser.Scene, recorded: boolean) {
    scene.add.image(0, 0, 'dunes-ground').setOrigin(0).setDisplaySize(DUNES.width, DUNES.height).setDepth(-10002);
    this.bake();
    this.returnPortal = new ChapterPortal(scene, DUNES.returnPortal, true);
    this.ruin = scene.add.image(DUNES.ruin.x, DUNES.ruin.y - 20, 'deep-relay')
      .setOrigin(.5, .94).setDisplaySize(230, 210).setTint(0xc8af88).setDepth(DUNES.ruin.y - 45);
    trackEnvironmentOcclusion(scene, this.ruin);
    this.response = scene.add.ellipse(DUNES.ruin.x, DUNES.ruin.y - 34, 75, 17, 0xa98cff, recorded ? .5 : .14)
      .setDepth(DUNES.ruin.y - 43);
  }

  canInvestigate(position: Vec2, dead: boolean, recorded: boolean): boolean {
    return !dead && !recorded && distance(position, DUNES.ruin) < DUNES.ruin.radius;
  }

  respond(): void {
    this.scene.tweens.killTweensOf(this.response);
    this.response.setAlpha(.8).setScale(1.4);
    this.scene.tweens.add({ targets: this.response, alpha: .42, scale: 1, duration: 1000 });
    this.scene.tweens.add({ targets: this.ruin, alpha: .7, duration: 170, yoyo: true, repeat: 2 });
  }

  private bake(): void {
    const stamps: EnvironmentStamp[] = [
      { key: 'deep-stratum', x: 510, y: 320, width: 355, height: 172, tint: 0xc0a584 },
      { key: 'deep-stratum', x: 1090, y: 305, width: 395, height: 185, tint: 0xb2977a, flipX: true },
      { key: 'deep-stratum', x: 1740, y: 310, width: 340, height: 170, tint: 0xa78971 },
      { key: 'deep-stratum', x: 2500, y: 300, width: 420, height: 192, tint: 0xb39171, flipX: true },
      { key: 'deep-stratum', x: 470, y: 1840, width: 320, height: 162, tint: 0xb8987a },
      { key: 'deep-stratum', x: 1090, y: 1870, width: 360, height: 175, tint: 0xb39a7c, flipX: true },
      { key: 'deep-stratum', x: 1860, y: 1865, width: 425, height: 180, tint: 0xb39176 },
      { key: 'deep-stratum', x: 2610, y: 1890, width: 370, height: 172, tint: 0xb19070 },
      { key: 'deep-stratum', x: 1490, y: 1160, width: 370, height: 160, tint: 0xb3977b },
      { key: 'ancient-remnant', x: 1760, y: 1110, width: 285, height: 174, tint: 0xb6a180 },
      { key: 'ancient-remnant', x: 1360, y: 430, width: 210, height: 135, tint: 0xc4ad88 },
      { key: 'deep-mineral', x: 1580, y: 1560, width: 220, height: 164, tint: 0xe0bd86 },
      { key: 'deep-mineral', x: 2170, y: 670, width: 152, height: 118, tint: 0xd0ad80 },
      { key: 'resonance-growth', x: 2930, y: 1360, width: 230, height: 165, tint: 0xc0a58b },
      { key: 'ancient-remnant', x: 2850, y: 1650, width: 250, height: 174, tint: 0xb59e82 },
      { key: 'root-growth', x: 750, y: 750, width: 190, height: 65, tint: 0xa99672, angle: -12 },
      { key: 'root-growth', x: 1680, y: 1550, width: 220, height: 68, tint: 0xb0956f, angle: 16 },
      { key: 'root-growth', x: 2020, y: 1680, width: 190, height: 59, tint: 0xa98e6f },
    ];
    for (let top = 0; top < DUNES.height; top += 550) {
      const layer = this.scene.add.renderTexture(0, Math.max(0, top - 130), DUNES.width,
        Math.min(810, DUNES.height - top + 130)).setOrigin(0).setDepth(top + 220);
      const painter = new EnvironmentPainter(this.scene, layer);
      const inBand = (item: Vec2) => Math.floor(item.y / 550) === top / 550;
      for (const stamp of stamps.filter(inBand)) {
        painter.sediment(stamp.x, stamp.y + stamp.height * .24, stamp.width * 1.25, stamp.height * .42, 0xab8a66, .2);
        painter.contact(stamp.x, stamp.y + stamp.height * .26, stamp.width * .78, stamp.height * .16, .4);
        painter.stamp(stamp);
      }
      for (const rock of DUNES_ROCKS.filter(inBand)) painter.rock(rock.x, rock.y, rock.radius, 0xc2a78a, true);
      painter.destroy();
    }
  }
}
