import Phaser from 'phaser';
import { CAVERN_BOUNDS } from '../../config/cavern';
import { CAVERN_STRUCTURE_FOOTPRINTS, cavernShelfFootprints } from '../../config/environmentCollision';
import type { Obstacle } from '../../systems/Movement';
import { EnvironmentPainter } from '../../visual/EnvironmentArt';

// One existing room, same world scale and physical footprints. Nothing in the
// normal Cavern is replaced. The unique floor and composition are baked once.
export class ReferenceArea {
  readonly bounds = { ...CAVERN_BOUNDS };
  readonly obstacles: Obstacle[] = [
    { x: 885, y: 595, radius: 56 },
    { x: 1190, y: 1000, radius: 63 },
    { x: 1490, y: 850, radius: 67 },
    ...CAVERN_STRUCTURE_FOOTPRINTS.filter(p => p.x <= CAVERN_BOUNDS.right),
    ...cavernShelfFootprints(),
  ];

  constructor(scene: Phaser.Scene) {
    // Cover the entire possible camera footprint around this room. A floor
    // rectangle the size of the props cache exposes a straight seam when the
    // player walks along the rim; the backing image must extend beyond it.
    scene.add.image(1200, 800, 'reference-basin-floor').setDisplaySize(2400, 1600)
      .setTint(0xb9c5b8).setDepth(-10001.5).setName('reference-continuous-ground');
    const layer = scene.add.renderTexture(350, 250, 1500, 1000).setOrigin(0).setDepth(-10000).setName('reference-room-cache');
    const painter = new EnvironmentPainter(scene, layer);
    // Keep the same perimeter bases; lower contrast and joined sediment make
    // the rim subordinate to actors. The path has uninterrupted negative space.
    for (let i = 0; i < 12; i++) {
      const x = 508 + i * 96;
      for (const [y, angle] of [[387 + Math.sin(i * 2.7) * 22, -12], [1103 + Math.cos(i * 1.9) * 16, 169]]) {
        painter.sediment(x, y, 210, 90, 0x29332e, 0.45);
        painter.stamp({ key: 'rock-shelf', x, y, width: 143, height: 128, tint: 0xb9c3b0,
          angle: angle + Math.sin(i * 2.1) * 6, flipX: i % 3 === 0 });
      }
    }
    for (const rock of this.obstacles.slice(0, 3)) painter.rock(rock.x, rock.y, rock.radius, 0xd1d4bd, true);
    for (const rock of CAVERN_STRUCTURE_FOOTPRINTS.slice(0, 3)) painter.rock(rock.x, rock.y, rock.radius, 0xc6ceb7);
    // Roots and low rubble tie the lower rim into the same material, without
    // adding visual barriers or changing any optional/decorative footprints.
    for (const [x, y, w, angle] of [[610, 1046, 260, 8], [829, 1064, 245, -9], [1220, 1092, 220, 5]]) {
      painter.stamp({ key: 'root-growth', x, y, width: w, height: w * 0.26, tint: 0xa2ac8b, alpha: 0.55, angle });
    }
    for (const [x, y, h] of [[946, 1008, 46], [1002, 1030, 66], [1055, 988, 39], [760, 1024, 48], [1370, 1042, 60]]) {
      painter.apron(x, y + h * 0.22, h * 0.9, 0xb9b699);
      painter.stamp({ key: 'mineral-growth', x, y, width: h * 1.1, height: h, tint: 0xffe3b8 });
    }
    painter.apron(1494, 635, 238, 0xa9b59c);
    painter.raised({ key: 'ancient-frame', x: 1494, y: 589, width: 300, height: 220,
      depth: 632, tint: 0xd1d4bd });
    painter.stamp({ key: 'root-growth', x: 1515, y: 635, width: 190, height: 49, alpha: 0.65, tint: 0xb3b596 });
    painter.destroy();
    // One reused soft texture. No light engine, particles or extra update.
    scene.add.image(1492, 594, 'terrain-blend').setDisplaySize(250, 145)
      .setTint(0xa98cff).setAlpha(0.065).setBlendMode(Phaser.BlendModes.ADD).setDepth(631);
  }
}
