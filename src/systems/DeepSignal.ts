import Phaser from 'phaser';
import { DEEP_AREA, DEEP_OBSTACLES } from '../config/cavern';

// The first deeper pocket shares the Cavern scene. Its rock, growth and buried
// structure are captured once; only the signal and the two collapse pieces move.
export class DeepSignal {
  private upperRock: Phaser.GameObjects.Graphics;
  private lowerRock: Phaser.GameObjects.Graphics;
  private inscriptions: Phaser.GameObjects.Graphics;
  private carrier: Phaser.GameObjects.Ellipse;
  private opening = false;
  private opened: boolean;

  constructor(private scene: Phaser.Scene, opened: boolean) {
    this.opened = opened;
    const art = scene.add.graphics().setVisible(false);

    // The narrow throat grows into a pocket with a different material language:
    // old fractured plates are being swallowed by stone, roots and mineral.
    art.fillStyle(0x091820).fillPoints([
      { x: 1664, y: 436 }, { x: 1790, y: 389 }, { x: 1906, y: 420 },
      { x: 1982, y: 509 }, { x: 1900, y: 650 }, { x: 1780, y: 621 },
      { x: 1670, y: 558 },
    ], true);
    art.fillStyle(0x263b3d).fillPoints([
      { x: 1700, y: 447 }, { x: 1797, y: 417 }, { x: 1875, y: 451 },
      { x: 1948, y: 536 }, { x: 1883, y: 620 }, { x: 1788, y: 584 },
      { x: 1700, y: 536 },
    ], true);
    art.fillStyle(0x142932).fillPoints([
      { x: 1838, y: 536 }, { x: 1931, y: 407 }, { x: 2084, y: 346 },
      { x: 2306, y: 379 }, { x: 2464, y: 493 }, { x: 2500, y: 727 },
      { x: 2425, y: 936 }, { x: 2212, y: 1005 }, { x: 2023, y: 940 },
      { x: 1863, y: 829 }, { x: 1796, y: 667 },
    ], true);
    art.fillStyle(0x354449, 0.9).fillPoints([
      { x: 1892, y: 545 }, { x: 1989, y: 446 }, { x: 2128, y: 406 },
      { x: 2306, y: 444 }, { x: 2412, y: 537 }, { x: 2450, y: 723 },
      { x: 2360, y: 875 }, { x: 2181, y: 936 }, { x: 2029, y: 868 },
      { x: 1897, y: 749 },
    ], true);
    art.fillStyle(0x435153, 0.78).fillPoints([
      { x: 1938, y: 575 }, { x: 2035, y: 485 }, { x: 2155, y: 475 },
      { x: 2250, y: 558 }, { x: 2365, y: 543 }, { x: 2418, y: 690 },
      { x: 2305, y: 804 }, { x: 2122, y: 833 }, { x: 1987, y: 756 },
    ], true);
    // Unequal manufactured seams disappear under mineral deposits.
    art.lineStyle(20, 0x111e29, 0.52)
      .lineBetween(1893, 610, 2032, 548).lineBetween(2032, 548, 2131, 601)
      .lineBetween(2120, 812, 2270, 789).lineBetween(2270, 789, 2392, 727);
    art.lineStyle(4, 0x806e9d, 0.52)
      .lineBetween(1901, 615, 2033, 552).lineBetween(2033, 552, 2110, 592)
      .lineBetween(2130, 808, 2270, 785).lineBetween(2270, 785, 2384, 727);
    art.fillStyle(0x556065).fillPoints([
      { x: 1884, y: 474 }, { x: 1985, y: 394 }, { x: 2084, y: 377 },
      { x: 2050, y: 485 }, { x: 1947, y: 548 },
    ], true);
    art.fillStyle(0x53625e).fillPoints([
      { x: 2321, y: 823 }, { x: 2420, y: 761 }, { x: 2468, y: 843 },
      { x: 2396, y: 950 }, { x: 2265, y: 960 },
    ], true);
    art.fillStyle(0x1e3934, 0.7).fillPoints([
      { x: 1845, y: 651 }, { x: 1970, y: 784 }, { x: 2135, y: 899 },
      { x: 2080, y: 956 }, { x: 1904, y: 861 }, { x: 1817, y: 738 },
    ], true);
    // Large shelf stones keep the playable route inside the lit rock floor.
    for (const rock of DEEP_OBSTACLES) {
      if (rock.x === 2220) continue; // The ancient structure below supplies this footprint.
      const r = rock.radius;
      art.fillStyle(0x081921, 0.55).fillEllipse(rock.x + 11, rock.y + r * 0.35, r * 2.4, r * 0.8);
      art.fillStyle(0x354a49).fillPoints([
        { x: rock.x - r, y: rock.y + r * 0.31 },
        { x: rock.x - r * 0.8, y: rock.y - r * 0.38 },
        { x: rock.x - r * 0.48, y: rock.y - r * 0.83 },
        { x: rock.x + r * 0.02, y: rock.y - r },
        { x: rock.x + r * 0.5, y: rock.y - r * 0.64 },
        { x: rock.x + r * 0.94, y: rock.y - r * 0.11 },
        { x: rock.x + r * 0.7, y: rock.y + r * 0.56 },
        { x: rock.x - r * 0.21, y: rock.y + r * 0.73 },
      ], true);
      art.fillStyle(0x52615b, 0.65).fillPoints([
        { x: rock.x - r * 0.78, y: rock.y - r * 0.35 },
        { x: rock.x - r * 0.48, y: rock.y - r * 0.83 },
        { x: rock.x + r * 0.02, y: rock.y - r },
        { x: rock.x + r * 0.19, y: rock.y - r * 0.5 },
        { x: rock.x - r * 0.38, y: rock.y - r * 0.12 },
      ], true);
      art.lineStyle(3, 0x688071, 0.42)
        .lineBetween(rock.x - r * 0.45, rock.y - r * 0.76, rock.x + r * 0.07, rock.y - r * 0.86)
        .lineBetween(rock.x + r * 0.07, rock.y - r * 0.86, rock.x + r * 0.25, rock.y - r * 0.45);
    }
    // Partly buried, asymmetric structure: a physical object, not a portal.
    art.fillStyle(0x081820, 0.65).fillEllipse(2209, 734, 310, 88);
    art.fillStyle(0x495b62).fillPoints([
      { x: 2093, y: 724 }, { x: 2107, y: 567 }, { x: 2138, y: 507 },
      { x: 2201, y: 531 }, { x: 2233, y: 465 }, { x: 2297, y: 521 },
      { x: 2327, y: 681 }, { x: 2295, y: 748 }, { x: 2165, y: 762 },
    ], true);
    art.fillStyle(0x35464e).fillPoints([
      { x: 2154, y: 713 }, { x: 2173, y: 566 }, { x: 2205, y: 548 },
      { x: 2242, y: 594 }, { x: 2228, y: 681 }, { x: 2201, y: 738 },
    ], true);
    art.fillStyle(0x64706d, 0.58).fillPoints([
      { x: 2173, y: 566 }, { x: 2205, y: 548 }, { x: 2222, y: 578 },
      { x: 2190, y: 605 }, { x: 2166, y: 640 },
    ], true);
    art.lineStyle(3, 0x182c34, 0.8)
      .lineBetween(2169, 675, 2200, 636).lineBetween(2200, 636, 2222, 652);
    art.fillStyle(0x677477, 0.75).fillPoints([
      { x: 2107, y: 568 }, { x: 2138, y: 507 }, { x: 2201, y: 531 },
      { x: 2173, y: 566 }, { x: 2154, y: 713 }, { x: 2110, y: 716 },
    ], true);
    art.fillStyle(0x354b4b).fillPoints([
      { x: 2233, y: 465 }, { x: 2297, y: 521 }, { x: 2327, y: 681 },
      { x: 2286, y: 711 }, { x: 2257, y: 540 },
    ], true);
    art.lineStyle(4, 0xa98cff, 0.6)
      .lineBetween(2140, 650, 2173, 629).lineBetween(2173, 629, 2195, 648)
      .lineBetween(2195, 648, 2226, 615).lineBetween(2226, 615, 2262, 649)
      .lineBetween(2262, 649, 2290, 617);
    art.lineStyle(3, 0xa98cff, 0.43)
      .lineBetween(2134, 548, 2167, 554).lineBetween(2254, 522, 2285, 546);
    art.fillStyle(0xffbd54, 0.85).fillEllipse(2201, 647, 10, 7);
    // Roots break the geometry and link the object to the surrounding stone.
    art.lineStyle(11, 0x244338, 0.9)
      .lineBetween(2050, 410, 2114, 510).lineBetween(2114, 510, 2144, 606)
      .lineBetween(2354, 389, 2314, 530).lineBetween(2314, 530, 2273, 586);
    art.lineStyle(5, 0x547a55, 0.8)
      .lineBetween(2064, 427, 2114, 510).lineBetween(2314, 530, 2288, 578);
    for (const [x, y, h] of [[1978, 685, 34], [2020, 865, 47], [2343, 778, 38], [2378, 617, 29]] as const) {
      art.fillStyle(0x776c63).fillTriangle(x - 18, y + 10, x, y - h, x + 16, y + 13);
      art.fillStyle(0xad906b, 0.8).fillTriangle(x - 5, y + 5, x, y - h, x + 3, y + 6);
      art.lineStyle(2, 0xffbd54, 0.7).lineBetween(x, y - h + 8, x + 1, y - 4);
    }
    // Far edge implies continuation below without presenting another playable room.
    art.fillStyle(0x0a1922).fillPoints([
      { x: 2398, y: 522 }, { x: 2488, y: 490 }, { x: 2512, y: 726 },
      { x: 2457, y: 799 }, { x: 2418, y: 707 },
    ], true);
    art.lineStyle(3, 0x9a85d0, 0.4).lineBetween(2411, 624, 2448, 596).lineBetween(2448, 596, 2478, 618);

    scene.add.renderTexture(1650, 290, 1000, 850).setOrigin(0).setDepth(-9999).draw(art, -1650, -290);
    art.destroy();

    const { collapseX: x, collapseY: y } = DEEP_AREA;
    this.upperRock = scene.add.graphics().setPosition(x, y - (opened ? 78 : 0)).setDepth(660);
    this.upperRock.fillStyle(0x63706c).fillPoints([
      { x: -59, y: -62 }, { x: -24, y: -82 }, { x: 28, y: -65 },
      { x: 57, y: -20 }, { x: 24, y: 21 }, { x: -31, y: 14 },
    ], true);
    this.upperRock.lineStyle(3, 0x9d8fae, 0.65).lineBetween(-28, -30, 8, -14).lineBetween(8, -14, 31, 2);
    this.lowerRock = scene.add.graphics().setPosition(x, y + (opened ? 78 : 0)).setDepth(660);
    this.lowerRock.fillStyle(0x485b5b).fillPoints([
      { x: -58, y: 7 }, { x: 5, y: -8 }, { x: 61, y: 17 },
      { x: 52, y: 74 }, { x: -15, y: 85 }, { x: -66, y: 49 },
    ], true);
    this.lowerRock.lineStyle(4, 0x3a594a, 0.9).lineBetween(-40, 30, -8, 10).lineBetween(-8, 10, 22, 25);
    this.inscriptions = scene.add.graphics().setDepth(665).setAlpha(opened ? 0.82 : 0.18);
    this.inscriptions.lineStyle(4, 0xa98cff, 0.82)
      .lineBetween(1548, 609, 1617, 551).lineBetween(1617, 551, 1676, 505)
      .lineBetween(1719, 484, 1774, 495).lineBetween(1774, 495, 1842, 526);
    this.carrier = scene.add.ellipse(1560, 601, 16, 7, 0xffbd54, 0.8).setDepth(666).setAlpha(0);
    const presence = scene.add.ellipse(2200, 650, 113, 52, 0xa98cff, 0.12).setDepth(590);
    scene.tweens.add({ targets: presence, alpha: { from: 0.08, to: 0.24 }, scale: { from: 0.88, to: 1.15 }, duration: 2400, yoyo: true, repeat: -1 });
  }

  reveal(onOpened: () => void): void {
    if (this.opened || this.opening) return;
    this.opening = true;
    this.scene.tweens.add({ targets: this.inscriptions, alpha: 0.82, duration: 300 });
    this.carrier.setAlpha(0.9);
    this.scene.tweens.add({
      targets: this.carrier, x: DEEP_AREA.collapseX, y: DEEP_AREA.collapseY,
      duration: 390, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.carrier.setAlpha(0);
        this.scene.tweens.add({ targets: this.upperRock, y: DEEP_AREA.collapseY - 78, duration: 620, ease: 'Cubic.easeInOut' });
        this.scene.tweens.add({
          targets: this.lowerRock, y: DEEP_AREA.collapseY + 78, duration: 620, ease: 'Cubic.easeInOut',
          onComplete: () => {
            this.opening = false;
            this.opened = true;
            onOpened();
          },
        });
      },
    });
  }
}
