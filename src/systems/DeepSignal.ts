import Phaser from 'phaser';
import { DEEP_AREA, DEEP_OBSTACLES } from '../config/cavern';
import { groundContour, EnvironmentPainter, environmentImage } from '../visual/EnvironmentArt';

// The first deeper pocket shares the Cavern scene. Its rock, growth and buried
// structure are captured once; only the signal and the two collapse pieces move.
export class DeepSignal {
  private upperRock: Phaser.GameObjects.Image;
  private lowerRock: Phaser.GameObjects.Image;
  private inscriptions: Phaser.GameObjects.Graphics;
  private carrier: Phaser.GameObjects.Ellipse;
  private opening = false;
  private opened: boolean;

  constructor(private scene: Phaser.Scene, opened: boolean) {
    this.opened = opened;
    const art = scene.add.graphics().setVisible(false);

    // The narrow throat grows into a pocket with a different material language:
    // old fractured plates are being swallowed by stone, roots and mineral.
    art.fillStyle(0x091820).fillPoints(groundContour([
      { x: 1664, y: 436 }, { x: 1790, y: 389 }, { x: 1906, y: 420 },
      { x: 1982, y: 509 }, { x: 1900, y: 650 }, { x: 1780, y: 621 },
      { x: 1670, y: 558 },
    ]), true);
    art.fillStyle(0x263b3d).fillPoints(groundContour([
      { x: 1700, y: 447 }, { x: 1797, y: 417 }, { x: 1875, y: 451 },
      { x: 1948, y: 536 }, { x: 1883, y: 620 }, { x: 1788, y: 584 },
      { x: 1700, y: 536 },
    ]), true);
    art.fillStyle(0x142932).fillPoints(groundContour([
      { x: 1838, y: 536 }, { x: 1931, y: 407 }, { x: 2084, y: 346 },
      { x: 2306, y: 379 }, { x: 2464, y: 493 }, { x: 2500, y: 727 },
      { x: 2425, y: 936 }, { x: 2212, y: 1005 }, { x: 2023, y: 940 },
      { x: 1863, y: 829 }, { x: 1796, y: 667 },
    ]), true);
    art.fillStyle(0x354449, 0.9).fillPoints(groundContour([
      { x: 1892, y: 545 }, { x: 1989, y: 446 }, { x: 2128, y: 406 },
      { x: 2306, y: 444 }, { x: 2412, y: 537 }, { x: 2450, y: 723 },
      { x: 2360, y: 875 }, { x: 2181, y: 936 }, { x: 2029, y: 868 },
      { x: 1897, y: 749 },
    ]), true);
    art.fillStyle(0x435153, 0.78).fillPoints(groundContour([
      { x: 1938, y: 575 }, { x: 2035, y: 485 }, { x: 2155, y: 475 },
      { x: 2250, y: 558 }, { x: 2365, y: 543 }, { x: 2418, y: 690 },
      { x: 2305, y: 804 }, { x: 2122, y: 833 }, { x: 1987, y: 756 },
    ]), true);
    // Unequal manufactured seams disappear under mineral deposits.
    art.lineStyle(20, 0x111e29, 0.52)
      .lineBetween(1893, 610, 2032, 548).lineBetween(2032, 548, 2131, 601)
      .lineBetween(2120, 812, 2270, 789).lineBetween(2270, 789, 2392, 727);
    art.lineStyle(4, 0x806e9d, 0.52)
      .lineBetween(1901, 615, 2033, 552).lineBetween(2033, 552, 2110, 592)
      .lineBetween(2130, 808, 2270, 785).lineBetween(2270, 785, 2384, 727);
    art.fillStyle(0x556065).fillPoints(groundContour([
      { x: 1884, y: 474 }, { x: 1985, y: 394 }, { x: 2084, y: 377 },
      { x: 2050, y: 485 }, { x: 1947, y: 548 },
    ]), true);
    art.fillStyle(0x53625e).fillPoints(groundContour([
      { x: 2321, y: 823 }, { x: 2420, y: 761 }, { x: 2468, y: 843 },
      { x: 2396, y: 950 }, { x: 2265, y: 960 },
    ]), true);
    art.fillStyle(0x1e3934, 0.7).fillPoints(groundContour([
      { x: 1845, y: 651 }, { x: 1970, y: 784 }, { x: 2135, y: 899 },
      { x: 2080, y: 956 }, { x: 1904, y: 861 }, { x: 1817, y: 738 },
    ]), true);
    // Far edge implies continuation below without presenting another playable room.
    art.fillStyle(0x0a1922).fillPoints(groundContour([
      { x: 2398, y: 522 }, { x: 2488, y: 490 }, { x: 2512, y: 726 },
      { x: 2457, y: 799 }, { x: 2418, y: 707 },
    ]), true);
    art.lineStyle(3, 0x9a85d0, 0.4).lineBetween(2411, 624, 2448, 596).lineBetween(2448, 596, 2478, 618);

    const layer = scene.add.renderTexture(1650, 290, 1000, 850).setOrigin(0).setDepth(-9999).draw(art, -1650, -290);
    const painter = new EnvironmentPainter(scene, layer);
    // Clip the material to the authored ground, preserving transparency where
    // the two cached sections overlap. The mask exists only during this bake.
    painter.ground('cavern-ground', 0.25, art);
    for (const rock of DEEP_OBSTACLES) {
      if (rock.x === 2220) continue;
      painter.rock(rock.x, rock.y, rock.radius, 0xc6d4cf);
    }
    painter.stamp({ key: 'root-growth', x: 2112, y: 505, width: 225, height: 83, angle: 65, tint: 0xacc3a9 });
    painter.stamp({ key: 'root-growth', x: 2310, y: 509, width: 230, height: 74, angle: -68, tint: 0x95af9b });
    painter.stamp({ key: 'ancient-remnant', x: 2210, y: 625, width: 265, height: 320, tint: 0xc5ced0 });
    for (const [x,y,h] of [[1978,685,34],[2020,865,47],[2343,778,38],[2378,617,29]] as const) {
      painter.stamp({ key: 'mineral-growth', x, y: y-h*0.25, width: h*1.5, height: h*1.8 });
    }
    const glyph = scene.make.graphics({ x: 0, y: 0 }, false);
    glyph.lineStyle(3, 0xa98cff, 0.43).lineBetween(2134,548,2167,554).lineBetween(2254,522,2285,546);
    glyph.fillStyle(0xffbd54, 0.85).fillEllipse(2201,647,10,7);
    layer.draw(glyph, -1650, -290);
    glyph.destroy();
    painter.destroy();
    art.destroy();

    const { collapseX: x, collapseY: y } = DEEP_AREA;
    this.upperRock = environmentImage(scene, 'rock-shelf', x, y - (opened ? 78 : 0), 150, 185, 660)
      .setOrigin(0.5, 0.68).setTint(0xcdd6d2);
    this.lowerRock = environmentImage(scene, 'rock-shelf', x, y + (opened ? 78 : 0), 150, 175, 660)
      .setOrigin(0.5, 0.29).setTint(0xa8beb8);
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
