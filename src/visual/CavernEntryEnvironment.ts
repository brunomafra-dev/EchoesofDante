import Phaser from 'phaser';
import { CAVERN_BOUNDS } from '../config/cavern';
import type { Obstacle } from '../systems/Movement';
import { EnvironmentPainter, groundContour } from './EnvironmentArt';

/** The quality-reference basin, carried into the actual first Cavern room. */
export class CavernEntryEnvironment {
  constructor(scene: Phaser.Scene, obstacles: readonly Obstacle[], collapse: Obstacle) {
    // The approved illustration is the ground plane. Its feathered perimeter
    // lets the existing continuous cavern-soil resume without a rectangular seam.
    scene.add.image(1200, 800, 'cavern-entry-floor').setDisplaySize(2400, 1600)
      .setTint(0xb9c5b8).setDepth(-10000.5).setName('cavern-entry-illustrated-ground');

    const layer = scene.add.renderTexture(350, 250, 1500, 1000).setOrigin(0)
      .setDepth(-10000).setName('cavern-entry-composition');
    const painter = new EnvironmentPainter(scene, layer);

    // The same compact perimeter, footings and contact treatment as the
    // approved reference keep the playable centre quiet and easy to read.
    for (let i = 0; i < 12; i++) {
      const x = 508 + i * 96;
      const top = 387 + Math.sin(i * 2.7) * 22;
      const bottom = 1103 + Math.cos(i * 1.9) * 16;
      painter.sediment(x, top, 210, 90, 0x29332e, 0.32);
      painter.sediment(x, bottom, 210, 90, 0x29332e, 0.36);
      painter.stamp({ key: 'rock-shelf', x, y: top - 5, width: 143, height: 128,
        angle: i % 3 * 3 - 3, flipX: i % 3 === 0, tint: i % 3 ? 0x98aba4 : 0xb3b8a2 });
      painter.stamp({ key: 'rock-shelf', x, y: bottom + 1, width: 145, height: 132,
        angle: i % 3 * -3, flipX: i % 3 !== 0, tint: 0x8caaa0 });
      painter.contact(x, top + 20, 136, 37, 0.55);
      painter.contact(x, bottom + 21, 138, 38, 0.5);
    }

    // Low entry stones keep the descent legible; three solid gameplay rocks
    // remain foot-sorted Images with their original physical footprints.
    for (const [x, y, radius] of [[507, 891, 24], [706, 882, 19], [727, 970, 20]] as const) {
      painter.rock(x, y, radius, 0xcbd8d0);
    }
    for (const rock of obstacles) {
      if (rock === collapse || rock.x > CAVERN_BOUNDS.right) continue;
      painter.rock(rock.x, rock.y, rock.radius, 0xbacbb9, true);
    }

    // Roots and small rubble transition into the mineral seam without
    // creating new obstacles or crowding the route between the Echo and exit.
    for (const [x, y, width, angle] of [
      [610, 1046, 260, 8], [829, 1064, 245, -9], [1220, 1092, 220, 5],
      [620, 470, 125, 54], [1080, 445, 115, -48], [1345, 1032, 150, -12],
    ] as const) {
      painter.stamp({ key: 'root-growth', x, y, width, height: width * 0.27, angle,
        tint: 0xa2ac8b, alpha: 0.56 });
    }
    for (const [x, y, size] of [
      [946, 1008, 46], [1002, 1030, 66], [1055, 988, 39], [760, 1024, 48],
      [1370, 1042, 60], [1140, 449, 20], [1600, 752, 18],
    ] as const) {
      painter.apron(x, y + size * 0.22, size * 1.5, 0xb9b699);
      painter.stamp({ key: 'mineral-growth', x, y, width: size * 1.1, height: size * 1.35,
        tint: size > 30 ? 0xddd6ba : 0xd6d0b4 });
    }

    painter.apron(1494, 635, 238, 0xa9b59c);
    painter.stamp({ key: 'ancient-frame', x: 1494, y: 589, width: 300, height: 220,
      tint: 0xd1d4bd });
    painter.stamp({ key: 'root-growth', x: 1515, y: 635, width: 190, height: 49,
      alpha: 0.65, tint: 0xb3b596 });

    // Keep the passage connected to the room, but confine hard visual strokes
    // to the throat; the basin floor itself is a single painted raster mass.
    const throat = scene.add.graphics();
    throat.fillStyle(0x14252a, 0.55).fillPoints(groundContour([
      { x: 1450, y: 610 }, { x: 1530, y: 540 }, { x: 1630, y: 452 },
      { x: 1780, y: 402 }, { x: 1800, y: 535 }, { x: 1696, y: 585 }, { x: 1578, y: 680 },
    ]), true);
    throat.lineStyle(19, 0x9b865e, 0.14).lineBetween(623, 920, 894, 815)
      .lineBetween(894, 815, 1212, 742).lineBetween(1212, 742, 1505, 604);
    throat.lineStyle(7, 0xdaa76a, 0.13).lineBetween(623, 920, 894, 815)
      .lineBetween(894, 815, 1212, 742).lineBetween(1212, 742, 1505, 604);
    throat.lineStyle(5, 0xa98cff, 0.29).lineBetween(1542, 637, 1620, 551)
      .lineBetween(1620, 551, 1700, 508);
    layer.draw(throat, -350, -250);
    throat.destroy();

    const glyph = scene.add.graphics();
    glyph.lineStyle(4, 0xa98cff, 0.75).lineBetween(1453, 570, 1480, 553)
      .lineBetween(1480, 553, 1500, 578).lineBetween(1500, 578, 1523, 559)
      .lineBetween(1523, 559, 1543, 588);
    glyph.fillStyle(0xffbd54, 0.82).fillCircle(1500, 578, 5);
    layer.draw(glyph, -350, -250);
    glyph.destroy();

    painter.destroy();
  }
}
