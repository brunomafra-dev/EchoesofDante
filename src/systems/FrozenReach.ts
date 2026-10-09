import Phaser from 'phaser';
import { FROST, FROST_ROCKS } from '../config/frost';
import { ChapterPortal } from './ChapterPortal';
import { EnvironmentPainter, trackEnvironmentOcclusion } from '../visual/EnvironmentArt';
import { distance, type Vec2 } from '../utils/math';

export class FrozenReach {
  readonly bounds = { ...FROST.bounds };
  readonly obstacles = FROST_ROCKS.map(rock => ({ ...rock }));
  readonly returnPortal: ChapterPortal;
  readonly onward: ChapterPortal;
  private readonly response: Phaser.GameObjects.Ellipse;
  constructor(private scene: Phaser.Scene, recorded: boolean) {
    scene.add.image(0, 0, 'frost-ground').setOrigin(0).setDisplaySize(FROST.width, FROST.height).setDepth(-10002);
    for (let top = 0; top < FROST.height; top += 550) {
      const layer = scene.add.renderTexture(0, Math.max(0, top - 130), FROST.width,
        Math.min(810, FROST.height - top + 130)).setOrigin(0).setDepth(top + 220);
      const painter = new EnvironmentPainter(scene, layer);
      for (const rock of FROST_ROCKS.filter(r => Math.floor(r.y / 550) === top / 550 && r.x !== FROST.relay.x))
        painter.rock(rock.x, rock.y, rock.radius, 0xb4c0b9, true);
      if (top === 0) {
        painter.stamp({ key: 'deep-mineral', x: 970, y: 470, width: 135, height: 96, tint: 0xe4d4b7 });
      }
      if (top === 1100) painter.stamp({ key: 'root-growth', x: 2100, y: 1300, width: 185, height: 55, tint: 0xbbc6b3 });
      if (top === 550) {
        painter.sediment(FROST.relay.x, FROST.relay.y, 280, 75, 0x93a6a1, .22);
        painter.contact(FROST.relay.x, FROST.relay.y - 5, 170, 35, .4);
      }
      painter.destroy();
    }
    this.onward = new ChapterPortal(scene, FROST.frontier, recorded);
    this.returnPortal = new ChapterPortal(scene, FROST.returnPortal, true);
    const relay = scene.add.image(FROST.relay.x, FROST.relay.y - 20, 'deep-relay')
      .setOrigin(.5, .94).setDisplaySize(230, 210).setTint(0xc0ced0).setDepth(FROST.relay.y - 45);
    trackEnvironmentOcclusion(scene, relay);
    this.response = scene.add.ellipse(FROST.relay.x, FROST.relay.y - 34, 75, 17, 0xa98cff, recorded ? .5 : .12)
      .setDepth(FROST.relay.y - 43);
    scene.add.image(FROST.frontier.x + 100, FROST.frontier.y - 15, 'ancient-remnant')
      .setDisplaySize(190, 120).setTint(0xb1c4c6).setDepth(FROST.frontier.y - 50);
  }
  canInvestigate(position: Vec2, dead: boolean, recorded: boolean): boolean {
    return !dead && !recorded && distance(position, FROST.relay) < FROST.relay.radius;
  }
  respond(): void {
    this.onward.activate();
    this.scene.tweens.killTweensOf(this.response);
    this.response.setAlpha(.9).setScale(1.8);
    this.scene.tweens.add({ targets: this.response, alpha: .5, scale: 1, duration: 1100 });
  }
}
