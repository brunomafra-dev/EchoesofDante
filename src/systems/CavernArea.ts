import Phaser from 'phaser';
import { CAVERN_BOUNDS, DEEP_AREA, DEEP_OBSTACLES } from '../config/cavern';
import { CAVERN_STRUCTURE_FOOTPRINTS, cavernShelfFootprints } from '../config/environmentCollision';
import { DeepSignal } from './DeepSignal';
import type { MovementBounds, Obstacle } from './Movement';
import { drawOrganicCavernForm } from '../visual/OrganicCavernForm';

// One continuous authored Cavern; static art is captured once per section.
export class CavernArea {
  readonly bounds: MovementBounds;
  readonly obstacles: Obstacle[] = [
    { x: 885, y: 595, radius: 56 },
    { x: 1190, y: 1000, radius: 63 },
    { x: 1490, y: 850, radius: 67 },
    ...DEEP_OBSTACLES,
  ];
  private readonly collapseObstacle: Obstacle = { x: DEEP_AREA.collapseX, y: DEEP_AREA.collapseY, radius: 64 };
  private readonly deepSignal: DeepSignal;

  constructor(scene: Phaser.Scene, deepPassageOpen = false) {
    this.bounds = { ...CAVERN_BOUNDS, right: deepPassageOpen ? DEEP_AREA.right : CAVERN_BOUNDS.right };
    if (!deepPassageOpen) this.obstacles.push(this.collapseObstacle);
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
    // Three irregular pockets replace the former oval arena: descent, mineral basin, old stone throat.
    art.fillStyle(0x293c3d, 0.94).fillPoints([
      { x: 514, y: 888 }, { x: 638, y: 748 }, { x: 776, y: 772 }, { x: 890, y: 717 },
      { x: 1047, y: 747 }, { x: 1114, y: 930 }, { x: 977, y: 1086 }, { x: 787, y: 1073 },
      { x: 602, y: 1051 },
    ], true);
    art.fillStyle(0x304445, 0.9).fillPoints([
      { x: 880, y: 718 }, { x: 982, y: 529 }, { x: 1137, y: 498 }, { x: 1281, y: 558 },
      { x: 1405, y: 676 }, { x: 1336, y: 879 }, { x: 1177, y: 955 }, { x: 1002, y: 909 },
    ], true);
    art.fillStyle(0x394847, 0.73).fillPoints([
      { x: 1260, y: 714 }, { x: 1367, y: 615 }, { x: 1481, y: 561 }, { x: 1617, y: 469 },
      { x: 1711, y: 486 }, { x: 1674, y: 594 }, { x: 1517, y: 714 }, { x: 1372, y: 804 },
    ], true);
    art.lineStyle(19, 0x9b865e, 0.14).lineBetween(623, 920, 894, 815).lineBetween(894, 815, 1212, 742).lineBetween(1212, 742, 1505, 604);
    art.lineStyle(7, 0xdaa76a, 0.13).lineBetween(623, 920, 894, 815).lineBetween(894, 815, 1212, 742).lineBetween(1212, 742, 1505, 604);
    // A quiet side pocket: mineral growth and roots make exploration worthwhile off the direct line.
    art.fillStyle(0x182b31, 0.55).fillPoints([
      { x: 852, y: 926 }, { x: 976, y: 907 }, { x: 1117, y: 937 }, { x: 1088, y: 1053 },
      { x: 938, y: 1072 }, { x: 853, y: 1028 },
    ], true);
    art.fillStyle(0x735b43, 0.36).fillEllipse(997, 1005, 190, 58);
    for (const [x, y, h] of [[946, 1008, 46], [1002, 1030, 66], [1055, 988, 39]] as const) {
      art.fillStyle(0x7b6d61).fillTriangle(x - 18, y + 12, x, y - h, x + 17, y + 10);
      art.fillStyle(0xb49064, 0.82).fillTriangle(x - 7, y + 6, x, y - h, x + 4, y + 2);
      art.lineStyle(3, 0xffbd54, 0.64).lineBetween(x, y - h + 11, x + 2, y - 8);
    }
    art.lineStyle(7, 0x416e57, 0.69).lineBetween(866, 943, 941, 995).lineBetween(1091, 947, 1037, 1002);

    // A short natural corridor continues behind the old face to the buried passage.
    art.fillStyle(0x0d1b23).fillPoints([
      { x: 1460, y: 604 }, { x: 1539, y: 528 }, { x: 1636, y: 438 },
      { x: 1772, y: 385 }, { x: 1790, y: 536 }, { x: 1696, y: 577 }, { x: 1578, y: 676 },
    ], true);
    art.fillStyle(0x344349, 0.73).fillPoints([
      { x: 1543, y: 535 }, { x: 1641, y: 443 }, { x: 1756, y: 404 }, { x: 1696, y: 482 }, { x: 1589, y: 596 },
    ], true);
    art.fillStyle(0x32474a, 0.88).fillPoints([
      { x: 1498, y: 607 }, { x: 1576, y: 555 }, { x: 1662, y: 477 },
      { x: 1729, y: 457 }, { x: 1700, y: 505 }, { x: 1615, y: 576 }, { x: 1552, y: 645 },
    ], true);
    art.lineStyle(5, 0xa98cff, 0.29).lineBetween(1542, 637, 1620, 551).lineBetween(1620, 551, 1700, 508);

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

    // Broken, uneven shelves frame the route without repeating identical stone teeth.
    for (let i = 0; i < 12; i++) {
      const x = 508 + i * 96;
      const top = 387 + Math.sin(i * 2.7) * 22;
      const bottom = 1103 + Math.cos(i * 1.9) * 16;
      art.fillStyle(i % 3 ? 0x39484a : 0x4e5852, 0.9);
      art.fillPoints([
        { x: x - 49, y: top - 14 }, { x: x - 26, y: top - 46 - i % 3 * 8 },
        { x: x + 11, y: top - 38 }, { x: x + 48, y: top - 4 }, { x: x + 33, y: top + 23 },
      ], true);
      art.fillPoints([
        { x: x - 49, y: bottom + 21 }, { x: x - 30, y: bottom - 18 - i % 4 * 8 },
        { x: x + 3, y: bottom - 34 }, { x: x + 34, y: bottom - 7 },
        { x: x + 47, y: bottom + 26 }, { x: x - 4, y: bottom + 43 },
      ], true);
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
      if (x === 865) continue; // This one seam is composed with the prototype rock below.
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
      if (rock === this.collapseObstacle || rock.x > CAVERN_BOUNDS.right) continue; // Deep art owns those rocks.
      if (rock.x === 885 && rock.y === 595) {
        drawOrganicCavernForm(art);
        continue;
      }
      art.fillStyle(0x0a1c23, 0.5).fillEllipse(rock.x + 8, rock.y + 22, rock.radius * 2.7, rock.radius);
      art.fillStyle(0x50605b).fillPoints([
        { x: rock.x - rock.radius, y: rock.y + 12 }, { x: rock.x - rock.radius * 0.62, y: rock.y - rock.radius * 0.7 },
        { x: rock.x + rock.radius * 0.26, y: rock.y - rock.radius }, { x: rock.x + rock.radius, y: rock.y - 5 },
        { x: rock.x + rock.radius * 0.7, y: rock.y + rock.radius * 0.6 },
      ], true);
      art.lineStyle(3, 0x849087, 0.37).lineBetween(rock.x - rock.radius * 0.6, rock.y - 10, rock.x + 2, rock.y - rock.radius * 0.6);
    }

    // The face is a weathered frame at the throat, with a dark opening behind it.
    art.fillStyle(0x0b1a22, 0.7).fillEllipse(1490, 595, 166, 48);
    art.fillStyle(0x465354).fillPoints([
      { x: 1368, y: 642 }, { x: 1382, y: 530 }, { x: 1426, y: 484 },
      { x: 1455, y: 513 }, { x: 1421, y: 584 }, { x: 1436, y: 656 },
    ], true);
    art.fillStyle(0x53605b).fillPoints([
      { x: 1554, y: 507 }, { x: 1607, y: 490 }, { x: 1633, y: 585 },
      { x: 1592, y: 656 }, { x: 1557, y: 628 },
    ], true);
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
    art.fillStyle(0x8c735c, 0.9).fillTriangle(1401, 643, 1417, 616, 1430, 647);
    art.fillStyle(0xb99562, 0.8).fillTriangle(1570, 639, 1581, 608, 1598, 644);
    art.lineStyle(3, 0xffbd54, 0.53).lineBetween(1417, 620, 1418, 640).lineBetween(1581, 613, 1585, 637);

    const layer = scene.add.renderTexture(350, 250, 1500, 1000).setOrigin(0).setDepth(-10000);
    layer.draw(art, -350, -250);
    art.destroy();
    const roots = scene.add.graphics().setVisible(false);
    roots.lineStyle(13, 0x18362f, 0.86).lineBetween(1110, 357, 1121, 518).lineBetween(1121, 518, 1091, 616);
    roots.lineStyle(8, 0x38664c, 0.84).lineBetween(1194, 355, 1167, 472).lineBetween(1167, 472, 1190, 577);
    roots.lineStyle(4, 0x82a26d, 0.55).lineBetween(1110, 368, 1117, 494).lineBetween(1192, 368, 1167, 472);
    roots.lineStyle(5, 0x2d5942, 0.7).lineBetween(1121, 518, 1167, 472).lineBetween(1167, 472, 1213, 504);
    scene.add.renderTexture(1040, 340, 230, 295).setOrigin(0).setDepth(625).draw(roots, -1040, -340);
    roots.destroy();
    // One reused light source makes the old inscriptions readable; no per-frame redraw.
    const glow = scene.add.ellipse(1492, 581, 86, 44, 0xa98cff, 0.17).setDepth(580);
    scene.tweens.add({ targets: glow, alpha: { from: 0.13, to: 0.35 }, scale: { from: 0.9, to: 1.1 }, duration: 2000, yoyo: true, repeat: -1 });
    const seam = scene.add.ellipse(1703, 486, 48, 14, 0xffbd54, 0.12).setDepth(480);
    scene.tweens.add({ targets: seam, alpha: { from: 0.1, to: 0.27 }, duration: 2300, yoyo: true, repeat: -1 });
    this.deepSignal = new DeepSignal(scene, deepPassageOpen);
    // Physics-only additions must not enter the rock artwork loop above.
    this.obstacles.push(...CAVERN_STRUCTURE_FOOTPRINTS, ...cavernShelfFootprints());
  }

  revealDeep(onOpened: () => void): void {
    this.deepSignal.reveal(() => {
      const index = this.obstacles.indexOf(this.collapseObstacle);
      if (index >= 0) this.obstacles.splice(index, 1);
      this.bounds.right = DEEP_AREA.right;
      onOpened();
    });
  }
}
