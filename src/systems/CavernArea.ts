import Phaser from 'phaser';
import { CAVERN_BOUNDS } from '../config/cavern';
import type { Obstacle } from './Movement';

// One authored chamber; static art is captured once so it does not replay every frame.
export class CavernArea {
  readonly bounds = CAVERN_BOUNDS;
  readonly obstacles: Obstacle[] = [
    { x: 885, y: 540, radius: 34 },
    { x: 1210, y: 1000, radius: 38 },
    { x: 1490, y: 850, radius: 43 },
  ];

  constructor(scene: Phaser.Scene) {
    const art = scene.add.graphics().setVisible(false);
    art.fillStyle(0x07151c).fillRect(350, 250, 1500, 1000);
    art.fillStyle(0x1d3035).fillPoints([
      { x: 416, y: 497 }, { x: 484, y: 361 }, { x: 620, y: 316 }, { x: 770, y: 340 },
      { x: 951, y: 303 }, { x: 1126, y: 326 }, { x: 1348, y: 312 }, { x: 1541, y: 359 },
      { x: 1703, y: 441 }, { x: 1759, y: 605 }, { x: 1730, y: 894 }, { x: 1661, y: 1123 },
      { x: 1470, y: 1184 }, { x: 1261, y: 1163 }, { x: 1019, y: 1200 }, { x: 775, y: 1162 },
      { x: 535, y: 1163 }, { x: 426, y: 1050 }, { x: 391, y: 812 },
    ], true);
    art.fillStyle(0x314345, 0.82).fillPoints([
      { x: 467, y: 484 }, { x: 541, y: 398 }, { x: 670, y: 375 }, { x: 810, y: 401 },
      { x: 978, y: 362 }, { x: 1150, y: 390 }, { x: 1350, y: 370 }, { x: 1538, y: 411 },
      { x: 1656, y: 474 }, { x: 1689, y: 624 }, { x: 1653, y: 892 }, { x: 1600, y: 1072 },
      { x: 1445, y: 1122 }, { x: 1260, y: 1099 }, { x: 1000, y: 1136 }, { x: 778, y: 1099 },
      { x: 568, y: 1100 }, { x: 484, y: 1018 }, { x: 452, y: 805 },
    ], true);
    art.fillStyle(0x263a3e, 0.95).fillEllipse(1040, 755, 1120, 640);
    art.fillStyle(0x41504b, 0.21).fillEllipse(1020, 770, 950, 550);
    art.lineStyle(22, 0x5c5546, 0.22).lineBetween(610, 937, 914, 780).lineBetween(914, 780, 1308, 717);
    art.lineStyle(7, 0x786f56, 0.18).lineBetween(610, 937, 914, 780).lineBetween(914, 780, 1308, 717);

    // The forest fissure opens into a rough descent, framed by old stone rather than a clean door.
    art.fillStyle(0x111f27, 0.8).fillPoints([
      { x: 466, y: 864 }, { x: 544, y: 802 }, { x: 659, y: 807 },
      { x: 754, y: 880 }, { x: 729, y: 1008 }, { x: 569, y: 1033 }, { x: 464, y: 980 },
    ], true);
    art.fillStyle(0x34454a).fillPoints([
      { x: 466, y: 864 }, { x: 544, y: 802 }, { x: 573, y: 825 }, { x: 533, y: 892 }, { x: 469, y: 934 },
    ], true);
    art.fillStyle(0x485755).fillPoints([
      { x: 659, y: 807 }, { x: 754, y: 880 }, { x: 729, y: 1008 }, { x: 703, y: 933 }, { x: 681, y: 855 },
    ], true);
    art.lineStyle(5, 0xa98cff, 0.52).lineBetween(512, 856, 537, 841).lineBetween(537, 841, 552, 860);
    art.lineStyle(4, 0xffbd54, 0.36).lineBetween(707, 859, 722, 891).lineBetween(722, 891, 711, 923);
    art.fillStyle(0x59665c, 0.65).fillEllipse(612, 995, 125, 29);

    // Broken stone shelves and roots frame the walkable center.
    for (let i = 0; i < 12; i++) {
      const x = 508 + i * 96;
      const top = 387 + Math.sin(i * 2.7) * 22;
      const bottom = 1103 + Math.cos(i * 1.9) * 16;
      art.fillStyle(i % 3 ? 0x39484a : 0x4e5852, 0.9);
      art.fillTriangle(x - 43, top - 39, x + 26, top - 47, x + 49, top + 30);
      art.fillTriangle(x - 34, bottom + 34, x + 48, bottom + 42, x + 19, bottom - 23);
      art.lineStyle(5, 0x376b56, 0.6).lineBetween(x - 22, top - 28, x - 2, top + 36);
      art.lineBetween(x + 9, bottom + 29, x - 2, bottom - 24);
    }
    for (let i = 0; i < 70; i++) {
      const x = 515 + (i * 173) % 1110;
      const y = 455 + (i * 131) % 585;
      const radius = 3 + (i * 7) % 12;
      art.fillStyle(i % 9 === 0 ? 0x796d55 : i % 3 ? 0x50605a : 0x42665a, i % 9 === 0 ? 0.5 : 0.29)
        .fillEllipse(x, y, radius * 2, radius);
    }
    // Mineral seams and roots break up the broad rock floor without creating new actors.
    for (const [x, y, size] of [[760, 1024, 23], [865, 626, 17], [1140, 449, 20], [1370, 1042, 26], [1600, 752, 18]] as const) {
      art.fillStyle(0x222b33, 0.8).fillEllipse(x, y + size, size * 4, size);
      art.fillStyle(0x6e6965).fillTriangle(x - size, y + size, x - size * 0.2, y - size, x + size * 0.4, y + size);
      art.fillStyle(0x856f65).fillTriangle(x + size * 0.1, y + size, x + size * 0.9, y - size * 0.6, x + size * 1.5, y + size);
      art.lineStyle(3, 0xffbd54, 0.65).lineBetween(x - size * 0.2, y + 3, x + size * 0.1, y - size * 0.55);
      art.lineStyle(2, 0xa98cff, 0.5).lineBetween(x + size * 0.7, y + 5, x + size * 0.92, y - size * 0.42);
    }
    for (let i = 0; i < 8; i++) {
      const x = 552 + i * 139;
      const y = i % 2 ? 1037 : 460;
      art.lineStyle(5, 0x365c50, 0.7).lineBetween(x, y, x + 18, y + (i % 2 ? -48 : 46));
      art.lineStyle(3, 0x668968, 0.6).lineBetween(x + 18, y + (i % 2 ? -48 : 46), x + 42, y + (i % 2 ? -69 : 68));
    }
    for (const rock of this.obstacles) {
      art.fillStyle(0x0a1c23, 0.5).fillEllipse(rock.x + 8, rock.y + 22, rock.radius * 2.7, rock.radius);
      art.fillStyle(0x50605b).fillPoints([
        { x: rock.x - rock.radius, y: rock.y + 12 }, { x: rock.x - rock.radius * 0.62, y: rock.y - rock.radius * 0.7 },
        { x: rock.x + rock.radius * 0.26, y: rock.y - rock.radius }, { x: rock.x + rock.radius, y: rock.y - 5 },
        { x: rock.x + rock.radius * 0.7, y: rock.y + rock.radius * 0.6 },
      ], true);
      art.lineStyle(3, 0x849087, 0.37).lineBetween(rock.x - rock.radius * 0.6, rock.y - 10, rock.x + 2, rock.y - rock.radius * 0.6);
    }

    // A buried, non-interactive signal face marks the next direction without granting another Echo.
    art.fillStyle(0x0b1a22, 0.7).fillEllipse(1490, 595, 166, 48);
    art.fillStyle(0x55565a).fillPoints([
      { x: 1395, y: 631 }, { x: 1415, y: 547 }, { x: 1460, y: 503 },
      { x: 1500, y: 520 }, { x: 1536, y: 487 }, { x: 1585, y: 565 }, { x: 1580, y: 637 },
    ], true);
    art.fillStyle(0x17222b).fillPoints([
      { x: 1432, y: 613 }, { x: 1450, y: 550 }, { x: 1484, y: 532 },
      { x: 1525, y: 548 }, { x: 1554, y: 610 },
    ], true);
    art.lineStyle(4, 0xa98cff, 0.75).lineBetween(1453, 570, 1480, 553).lineBetween(1480, 553, 1500, 578)
      .lineBetween(1500, 578, 1523, 559).lineBetween(1523, 559, 1543, 588);
    art.fillStyle(0xffbd54, 0.82).fillCircle(1500, 578, 5);
    art.lineStyle(5, 0x416e57, 0.7).lineBetween(1423, 541, 1452, 602).lineBetween(1578, 537, 1559, 608);
    art.fillStyle(0x839a65, 0.55).fillEllipse(1410, 630, 57, 13).fillEllipse(1585, 626, 52, 14);

    const layer = scene.add.renderTexture(350, 250, 1500, 1000).setOrigin(0).setDepth(-10000);
    layer.draw(art, -350, -250);
    art.destroy();
    // One reused light source makes the old inscriptions readable; no per-frame redraw.
    const glow = scene.add.ellipse(1492, 581, 86, 44, 0xa98cff, 0.17).setDepth(580);
    scene.tweens.add({ targets: glow, alpha: { from: 0.13, to: 0.35 }, scale: { from: 0.9, to: 1.1 }, duration: 2000, yoyo: true, repeat: -1 });
  }
}
