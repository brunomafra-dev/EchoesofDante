import Phaser from 'phaser';
import { CAVERN_BOUNDS, DEEP_AREA, DEEP_OBSTACLES, DEEP_RIDGES } from '../config/cavern';
import { CAVERN_STRUCTURE_FOOTPRINTS, cavernShelfFootprints } from '../config/environmentCollision';
import { DeepSignal } from './DeepSignal';
import type { MovementBounds, Obstacle } from './Movement';
import { groundContour, EnvironmentPainter } from '../visual/EnvironmentArt';

// One continuous authored Cavern; static art is captured once per section.
export class CavernArea {
  readonly bounds: MovementBounds;
  readonly obstacles: Obstacle[] = [
    { x: 885, y: 595, radius: 56 },
    { x: 1190, y: 1000, radius: 63 },
    { x: 1490, y: 850, radius: 67 },
    ...DEEP_OBSTACLES,
    ...DEEP_RIDGES.flatMap(ridge => ridge.bases),
  ];
  private readonly collapseObstacle: Obstacle = { x: DEEP_AREA.collapseX, y: DEEP_AREA.collapseY, radius: 64 };
  private readonly deepSignal: DeepSignal;

  constructor(scene: Phaser.Scene, deepPassageOpen = false) {
    this.bounds = { ...CAVERN_BOUNDS, right: deepPassageOpen ? DEEP_AREA.right : CAVERN_BOUNDS.right };
    if (!deepPassageOpen) this.obstacles.push(this.collapseObstacle);
    const art = scene.add.graphics().setVisible(false);
    art.fillStyle(0x07151c).fillRect(350, 250, 1500, 1000);
    art.fillStyle(0x1d3035).fillPoints(groundContour([
      { x: 416, y: 497 }, { x: 484, y: 361 }, { x: 620, y: 316 }, { x: 770, y: 340 },
      { x: 951, y: 303 }, { x: 1126, y: 326 }, { x: 1348, y: 312 }, { x: 1541, y: 359 },
      { x: 1703, y: 441 }, { x: 1759, y: 605 }, { x: 1730, y: 894 }, { x: 1661, y: 1123 },
      { x: 1470, y: 1184 }, { x: 1261, y: 1163 }, { x: 1019, y: 1200 }, { x: 775, y: 1162 },
      { x: 535, y: 1163 }, { x: 426, y: 1050 }, { x: 391, y: 812 },
    ]), true);
    art.fillStyle(0x314345, 0.82).fillPoints(groundContour([
      { x: 467, y: 484 }, { x: 541, y: 398 }, { x: 670, y: 375 }, { x: 810, y: 401 },
      { x: 978, y: 362 }, { x: 1150, y: 390 }, { x: 1350, y: 370 }, { x: 1538, y: 411 },
      { x: 1656, y: 474 }, { x: 1689, y: 624 }, { x: 1653, y: 892 }, { x: 1600, y: 1072 },
      { x: 1445, y: 1122 }, { x: 1260, y: 1099 }, { x: 1000, y: 1136 }, { x: 778, y: 1099 },
      { x: 568, y: 1100 }, { x: 484, y: 1018 }, { x: 452, y: 805 },
    ]), true);
    // Three irregular pockets replace the former oval arena: descent, mineral basin, old stone throat.
    art.fillStyle(0x293c3d, 0.94).fillPoints(groundContour([
      { x: 514, y: 888 }, { x: 638, y: 748 }, { x: 776, y: 772 }, { x: 890, y: 717 },
      { x: 1047, y: 747 }, { x: 1114, y: 930 }, { x: 977, y: 1086 }, { x: 787, y: 1073 },
      { x: 602, y: 1051 },
    ]), true);
    art.fillStyle(0x304445, 0.9).fillPoints(groundContour([
      { x: 880, y: 718 }, { x: 982, y: 529 }, { x: 1137, y: 498 }, { x: 1281, y: 558 },
      { x: 1405, y: 676 }, { x: 1336, y: 879 }, { x: 1177, y: 955 }, { x: 1002, y: 909 },
    ]), true);
    art.fillStyle(0x394847, 0.73).fillPoints(groundContour([
      { x: 1260, y: 714 }, { x: 1367, y: 615 }, { x: 1481, y: 561 }, { x: 1617, y: 469 },
      { x: 1711, y: 486 }, { x: 1674, y: 594 }, { x: 1517, y: 714 }, { x: 1372, y: 804 },
    ]), true);
    art.lineStyle(19, 0x9b865e, 0.14).lineBetween(623, 920, 894, 815).lineBetween(894, 815, 1212, 742).lineBetween(1212, 742, 1505, 604);
    art.lineStyle(7, 0xdaa76a, 0.13).lineBetween(623, 920, 894, 815).lineBetween(894, 815, 1212, 742).lineBetween(1212, 742, 1505, 604);
    // A quiet side pocket: mineral growth and roots make exploration worthwhile off the direct line.
    art.fillStyle(0x182b31, 0.55).fillPoints(groundContour([
      { x: 852, y: 926 }, { x: 976, y: 907 }, { x: 1117, y: 937 }, { x: 1088, y: 1053 },
      { x: 938, y: 1072 }, { x: 853, y: 1028 },
    ]), true);
    art.fillStyle(0x735b43, 0.36).fillEllipse(997, 1005, 190, 58);
    art.lineStyle(7, 0x416e57, 0.69).lineBetween(866, 943, 941, 995).lineBetween(1091, 947, 1037, 1002);

    // A short natural corridor continues behind the old face to the buried passage.
    art.fillStyle(0x0d1b23).fillPoints(groundContour([
      { x: 1460, y: 604 }, { x: 1539, y: 528 }, { x: 1636, y: 438 },
      { x: 1772, y: 385 }, { x: 1790, y: 536 }, { x: 1696, y: 577 }, { x: 1578, y: 676 },
    ]), true);
    art.fillStyle(0x344349, 0.73).fillPoints(groundContour([
      { x: 1543, y: 535 }, { x: 1641, y: 443 }, { x: 1756, y: 404 }, { x: 1696, y: 482 }, { x: 1589, y: 596 },
    ]), true);
    art.fillStyle(0x32474a, 0.88).fillPoints(groundContour([
      { x: 1498, y: 607 }, { x: 1576, y: 555 }, { x: 1662, y: 477 },
      { x: 1729, y: 457 }, { x: 1700, y: 505 }, { x: 1615, y: 576 }, { x: 1552, y: 645 },
    ]), true);
    art.lineStyle(5, 0xa98cff, 0.29).lineBetween(1542, 637, 1620, 551).lineBetween(1620, 551, 1700, 508);

    // The forest fissure opens into a rough descent, framed by old stone rather than a clean door.
    art.fillStyle(0x111f27, 0.8).fillPoints(groundContour([
      { x: 466, y: 864 }, { x: 544, y: 802 }, { x: 659, y: 807 },
      { x: 754, y: 880 }, { x: 729, y: 1008 }, { x: 569, y: 1033 }, { x: 464, y: 980 },
    ]), true);
    art.fillStyle(0x34454a).fillPoints(groundContour([
      { x: 466, y: 864 }, { x: 544, y: 802 }, { x: 573, y: 825 }, { x: 533, y: 892 }, { x: 469, y: 934 },
    ]), true);
    art.fillStyle(0x485755).fillPoints(groundContour([
      { x: 659, y: 807 }, { x: 754, y: 880 }, { x: 729, y: 1008 }, { x: 703, y: 933 }, { x: 681, y: 855 },
    ]), true);
    art.lineStyle(5, 0xa98cff, 0.52).lineBetween(512, 856, 537, 841).lineBetween(537, 841, 552, 860);
    art.lineStyle(4, 0xffbd54, 0.36).lineBetween(707, 859, 722, 891).lineBetween(722, 891, 711, 923);
    art.fillStyle(0x59665c, 0.65).fillEllipse(612, 995, 125, 29);

    for (let i = 0; i < 70; i++) {
      const x = 515 + (i * 173) % 1110;
      const y = 455 + (i * 131) % 585;
      const radius = 3 + (i * 7) % 12;
      art.fillStyle(i % 9 === 0 ? 0x796d55 : i % 3 ? 0x50605a : 0x42665a, i % 9 === 0 ? 0.5 : 0.29)
        .fillEllipse(x, y, radius * 2, radius);
    }
    const layer = scene.add.renderTexture(350, 250, 1500, 1000).setOrigin(0).setDepth(-10000);
    layer.draw(art, -350, -250);
    const painter = new EnvironmentPainter(scene, layer);
    painter.ground('cavern-ground', 0.25);
    for (let i = 0; i < 12; i++) {
      const x = 508 + i * 96;
      const top = 387 + Math.sin(i * 2.7) * 22;
      const bottom = 1103 + Math.cos(i * 1.9) * 16;
      painter.stamp({ key: 'rock-shelf', x, y: top - 5, width: 143, height: 128,
        angle: i % 3 * 3 - 3, flipX: i % 3 === 0, tint: i % 3 ? 0xc4d5cf : 0xe1dec9 });
      painter.stamp({ key: 'rock-shelf', x, y: bottom + 1, width: 145, height: 132,
        angle: i % 3 * -3, flipX: i % 3 !== 0, tint: 0xbdcfc6 });
    }
    for (let i = 0; i < 8; i++) {
      const x = 552 + i * 139;
      const y = i % 2 ? 1037 : 460;
      painter.stamp({ key: 'root-growth', x: x+17, y: y+(i%2 ? -32 : 32),
        width: 92, height: 43, angle: i%2 ? -55 : 55, tint: 0x9eb49a });
    }
    for (const [x,y,radius] of [[507,891,24],[706,882,19],[727,970,20]] as const) {
      painter.rock(x,y,radius,0xcbd8d0);
    }
    for (const rock of this.obstacles) {
      if (rock === this.collapseObstacle || rock.x > CAVERN_BOUNDS.right) continue;
      painter.rock(rock.x, rock.y, rock.radius, 0xd9e0d4);
    }
    for (const [x, y, h] of [[946,1008,46],[1002,1030,66],[1055,988,39]] as const) {
      painter.stamp({ key: 'mineral-growth', x, y: y - h * 0.3,
        width: h * 1.3, height: h * 1.45, tint: 0xddd6ba });
    }
    for (const [x, y, size] of [[760,1024,23],[1140,449,20],[1370,1042,26],[1600,752,18]] as const) {
      painter.stamp({ key: 'mineral-growth', x, y, width: size * 3, height: size * 3.2 });
    }
    painter.stamp({ key: 'ancient-frame', x: 1494, y: 570, width: 300, height: 310, tint: 0xd4d9d1 });
    // Keep the existing inscriptions above the painting, captured in the same bake.
    const glyph = scene.make.graphics({ x: 0, y: 0 }, false);
    glyph.lineStyle(4, 0xa98cff, 0.75).lineBetween(1453,570,1480,553)
      .lineBetween(1480,553,1500,578).lineBetween(1500,578,1523,559).lineBetween(1523,559,1543,588);
    glyph.fillStyle(0xffbd54, 0.82).fillCircle(1500,578,5);
    layer.draw(glyph, -350, -250);
    glyph.destroy();
    painter.destroy();
    art.destroy();
    const foreground = scene.add.renderTexture(1040,340,230,295).setOrigin(0).setDepth(625);
    const rootPainter = new EnvironmentPainter(scene, foreground);
    rootPainter.stamp({ key: 'root-growth', x: 1113, y: 478, width: 278, height: 79, angle: 83, tint: 0x95b49d });
    rootPainter.stamp({ key: 'root-growth', x: 1183, y: 466, width: 240, height: 64, angle: 97, tint: 0xafbe9b });
    rootPainter.destroy();
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

  respondToDeepSignal(): void { this.deepSignal.respond(); }
}
