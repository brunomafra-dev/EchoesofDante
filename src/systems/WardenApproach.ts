import Phaser from 'phaser';
import { WARDEN_PREPARATION as W, WARDEN_FOOTPRINTS } from '../config/wardenPreparation';
import { EnvironmentPainter, groundContour } from '../visual/EnvironmentArt';
import { distance, type Vec2 } from '../utils/math';

// Local scenery/response only: no quest framework, reward, boss or gameplay lock.
export class WardenApproach {
  readonly obstacles = WARDEN_FOOTPRINTS;
  responding = false;
  private recorded: boolean;
  private approached = false;
  private readonly archive: Phaser.GameObjects.Image;
  private readonly archiveLight: Phaser.GameObjects.Ellipse;
  private readonly seams: Phaser.GameObjects.Graphics[] = [];
  private readonly gate: Phaser.GameObjects.Image;
  private readonly record: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, recorded: boolean) {
    this.recorded = recorded;
    scene.add.image(5890, 700, 'exterior-atmosphere').setDisplaySize(1800, 1400).setDepth(-10001).setTint(0x91a99b);
    this.bake();
    this.archive = scene.add.image(5530, 705, 'first-echo-archive').setOrigin(0.5, 0.94)
      .setDisplaySize(250, 245).setDepth(720).setTint(recorded ? 0xffffff : 0xb9c2b0);
    this.archiveLight = scene.add.ellipse(5530, 681, 38, 13, 0xa98cff, recorded ? 0.4 : 0.08).setDepth(725);
    this.gate = scene.add.image(6340, 1050, 'sealed-threshold').setOrigin(0.5, 1)
      .setDisplaySize(640, 700).setDepth(1050).setTint(recorded ? 0xe1dece : 0xb8c1b1);
    this.record = scene.add.text(5530, 790, 'PRIMEIRO ECO\nASSINATURA HUMANA REGISTRADA\nDATA: ILEGÍVEL', {
      fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', color: '#e4dcff',
      stroke: '#071b24', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5, 0).setDepth(11000).setVisible(false);
    // Draw each inscription once. Only alpha changes during the finite response.
    for (const [x, y] of [[5645, 805], [5820, 790], [6000, 748]]) {
      const seam = scene.add.graphics().setPosition(x, y).setDepth(y - 2).setAlpha(recorded ? 0.75 : 0.06);
      seam.lineStyle(8, 0xa98cff, 0.12).lineBetween(-28, 4, -8, 7).lineBetween(-8, 7, 3, -4).lineBetween(3, -4, 26, -1);
      seam.lineStyle(2, 0xa98cff, 0.85).lineBetween(-28, 4, -8, 7).lineBetween(-8, 7, 3, -4).lineBetween(3, -4, 26, -1);
      seam.fillStyle(0xffbd54, 0.65).fillEllipse(26, -1, 6, 3);
      this.seams.push(seam);
    }
  }

  canInvestigate(position: Vec2, dead: boolean): boolean {
    return !dead && !this.recorded && distance(position, W.echo) <= W.echo.radius;
  }

  showRecord(position: Vec2): void {
    const visible = this.recorded && !this.responding && distance(position, W.echo) <= 210;
    if (this.record.visible !== visible) this.record.setVisible(visible);
  }

  approach(position: Vec2): boolean {
    if (this.recorded || this.approached || distance(position, W.echo) > W.echo.approachRadius) return false;
    this.approached = true;
    this.scene.tweens.add({ targets: this.archiveLight, fillAlpha: 0.25, duration: 650 });
    return true;
  }

  activate(onStage: (stage: 'revelation' | 'confirmation' | 'complete') => void): void {
    if (this.recorded) return;
    this.recorded = true;
    this.responding = true;
    this.archive.setTint(0xffffff);
    this.archiveLight.setFillStyle(0xa98cff, 0.45);
    this.scene.tweens.add({ targets: this.archiveLight, scale: 1.45, duration: 650, yoyo: true });
    onStage('revelation');
    this.seams.forEach((seam, i) => this.scene.tweens.add({ targets: seam, alpha: 0.75, duration: 550, delay: 650 + i * 750 }));
    this.scene.time.delayedCall(3000, () => onStage('confirmation'));
    this.scene.time.delayedCall(W.responseMs, () => {
      this.responding = false;
      this.gate.setTint(0xe1dece);
      onStage('complete');
    });
  }

  presence(): void {
    // A single brief stone movement suggests pressure beyond, without a boss model.
    this.scene.tweens.add({ targets: this.gate, x: 6341.5, duration: 140, yoyo: true, repeat: 2 });
  }

  private bake(): void {
    const floor = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const mass = (color: number, alpha: number, points: number[][]) => floor.fillStyle(color, alpha)
      .fillPoints(groundContour(points.map(([x, y]) => ({ x, y }))), true);
    mass(0x526e65, 1, [[5320,570],[5520,440],[5760,450],[5930,460],[6240,590],[6530,720],[6390,1100],[6090,1160],[5810,1120],[5500,1080],[5380,1010]]);
    mass(0x748575, 0.9, [[5340,655],[5490,550],[5610,570],[5750,630],[5950,595],[6140,630],[6290,780],[6170,1000],[5960,980],[5740,1000],[5530,930],[5410,820]]);
    mass(0xa1aa91, 0.28, [[5400,710],[5500,715],[5580,770],[5710,810],[5860,780],[6060,720],[6130,815],[5890,875],[5680,910],[5490,855]]);
    mass(0x182d34, 0.3, [[6050,530],[6320,470],[6620,510],[6670,1020],[6400,1150],[6130,1040]]);
    const layer = this.scene.add.renderTexture(5350, 200, 1400, 1000).setOrigin(0).setDepth(-9998).draw(floor, -5350, -200);
    const painter = new EnvironmentPainter(this.scene, layer);
    painter.ground('cavern-ground', 0.3, floor);
    // Retain the visible footprint where the new cache overlaps the old edge.
    painter.rock(5360, 740, 42, 0x91a69c);
    for (const rock of WARDEN_FOOTPRINTS) {
      if (rock.x === 5530 || rock.x === 6400) continue;
      painter.stamp({ key: 'world-shadow', x: rock.x, y: rock.y + 15, width: rock.radius * 5, height: rock.radius * 3, alpha: 0.65 });
      painter.stamp({ key: 'exterior-outcrop', x: rock.x, y: rock.y - rock.radius * 0.6, width: rock.radius * 4.4, height: rock.radius * 3.2,
        tint: rock.x < 5700 ? 0xcbd4b9 : 0xa7bbad, flipX: rock.y > 800 });
    }
    painter.stamp({ key: 'world-shadow', x: 5530, y: 697, width: 180, height: 60, alpha: 0.6 });
    for (const [x, y, width, angle] of [[5530,709,135,8],[5650,968,180,-17],[5810,560,130,32],[5890,955,190,-10]] as const) {
      painter.stamp({ key: 'root-growth', x, y, width, height: width * 0.3, angle, tint: 0xa6bd95 });
    }
    for (const [x, y] of [[5670,995],[5820,525],[5980,980]]) {
      painter.stamp({ key: 'mineral-growth', x, y, width: 75, height: 90, tint: 0xd9d2b6 });
    }
    for (const [x, y] of [[5650,805],[5820,790],[6000,750]]) {
      painter.stamp({ key: 'ancient-remnant', x, y: y - 15, width: 66, height: 52, tint: 0x8b9b91 });
    }
    painter.destroy();
    floor.destroy();
  }
}
