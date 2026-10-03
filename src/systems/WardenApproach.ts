import Phaser from 'phaser';
import { WARDEN_PREPARATION as W, WARDEN_FOOTPRINTS } from '../config/wardenPreparation';
import { EnvironmentPainter, trackEnvironmentOcclusion } from '../visual/EnvironmentArt';
import { distance, type Vec2 } from '../utils/math';

// Local scenery/response only: no quest framework, reward, boss or gameplay lock.
export class WardenApproach {
  readonly obstacles: typeof WARDEN_FOOTPRINTS;
  gateOpen: boolean;
  opening = false;
  responding = false;
  private recorded: boolean;
  private approached = false;
  private readonly archive: Phaser.GameObjects.Image;
  private readonly archiveLight: Phaser.GameObjects.Ellipse;
  private readonly seams: Phaser.GameObjects.Graphics[] = [];
  private readonly gate: Phaser.GameObjects.Image;
  private readonly record: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, recorded: boolean, gateOpen = false) {
    this.recorded = recorded;
    this.gateOpen = gateOpen;
    this.obstacles = gateOpen ? WARDEN_FOOTPRINTS.filter(o => o.x !== 6400) : WARDEN_FOOTPRINTS;
    this.bake();
    this.archive = scene.add.image(5530, 705, 'first-echo-archive').setOrigin(0.5, 0.94)
      .setDisplaySize(250, 190).setDepth(720).setTint(recorded ? 0xffffff : 0xb9c2b0);
    trackEnvironmentOcclusion(scene, this.archive);
    this.archiveLight = scene.add.ellipse(5530, 681, 38, 13, 0xa98cff, recorded ? 0.4 : 0.08).setDepth(725);
    this.gate = scene.add.image(6340, 815, gateOpen ? 'guardian-lintel-open' : 'guardian-lintel-closed').setOrigin(0.5, 0.5)
      .setDisplaySize(600, 190).setDepth(910).setTint(recorded ? 0xcbd1bf : 0xa9b6a4);
    trackEnvironmentOcclusion(scene, this.gate);
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

  canOpen(position: Vec2, dead: boolean): boolean {
    return !dead && this.recorded && !this.responding && !this.gateOpen && !this.opening && distance(position, W.threshold) <= W.threshold.radius;
  }

  open(onOpen: () => void): void {
    if (this.gateOpen || this.opening) return;
    this.opening = true;
    this.gate.setData('environmentFadeDisabled', true).setAlpha(1);
    this.seams.forEach((seam, i) => this.scene.tweens.add({ targets: seam, alpha: 1, duration: 300, delay: i * 160, yoyo: true }));
    this.scene.tweens.add({ targets: this.gate, x: 6342, duration: 110, yoyo: true, repeat: 3 });
    this.scene.time.delayedCall(900, () => {
      const opening = this.scene.add.image(6340, 815, 'guardian-lintel-open').setOrigin(0.5, 0.5).setDisplaySize(600, 190).setDepth(910).setAlpha(0);
      this.scene.tweens.add({ targets: opening, alpha: 1, duration: 550 });
      this.scene.tweens.add({ targets: this.gate, alpha: 0, duration: 550, onComplete: () => {
        this.opening = false;
        this.gateOpen = true;
        trackEnvironmentOcclusion(this.scene, opening);
        onOpen();
      } });
    });
  }

  private bake(): void {
    // The underlying soil is continuous. This overlapping cache contains props
    // and soft contact only, avoiding another rectangular patch of ground.
    const layer = this.scene.add.renderTexture(5350, 200, 1400, 1000).setOrigin(0).setDepth(-9998);
    const painter = new EnvironmentPainter(this.scene, layer);
    for (const [x,y,w,h] of [[5540,775,475,315],[5810,780,485,320],[6140,782,535,345]]) {
      painter.sediment(x,y,w,h,0x969175,0.32);
    }
    painter.sediment(5830,465,1100,250,0x2c4437,0.5);
    painter.sediment(5790,1070,1060,220,0x203b31,0.55);
    for (const [x,y,w,h] of [[5560,542,300,105],[5750,946,320,120],[6020,553,380,135]]) painter.contact(x,y,w,h,0.22);
    // Retain the visible footprint where the new cache overlaps the old edge.
    painter.rock(5360, 740, 42, 0x91a69c);
    for (const rock of WARDEN_FOOTPRINTS) {
      if (rock.x === 5530 || rock.x === 6400) continue;
      const foot = rock.y + rock.radius * 0.65;
      painter.apron(rock.x, foot, rock.radius * 3.1, 0x95aa8d);
      painter.raised({ key: 'exterior-outcrop', x: rock.x, y: rock.y - rock.radius * 0.3,
        width: rock.radius * 3.5, height: rock.radius * 2.25, depth: foot,
        tint: rock.x < 5700 ? 0xb8c4a9 : 0x9baf9e, flipX: rock.y > 800 });
    }
    painter.apron(5530, 704, 180, 0x9dad94);
    // Keep the monumental threshold and passage geometry; bind only its feet.
    painter.apron(6135, 885, 170, 0x92a68e);
    painter.apron(6545, 885, 170, 0x92a68e);
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
  }
}
