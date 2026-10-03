import Phaser from 'phaser';
import { WARDEN_ARENA, WARDEN_ARENA_FOOTPRINTS, WARDEN_ARENA_MINERAL_BASES } from '../config/wardenArena';
import { EnvironmentPainter, groundContour } from '../visual/EnvironmentArt';
import type { MovementBounds, Obstacle } from './Movement';

// Painted custodial basin behind the guardian threshold. Static material is
// captured once; the encounter only changes a few already drawn inscriptions.
export class WardenArena {
  readonly bounds: MovementBounds = { ...WARDEN_ARENA.bounds };
  readonly obstacles: Obstacle[] = [...WARDEN_ARENA_FOOTPRINTS, ...WARDEN_ARENA_MINERAL_BASES].map(rock => ({ ...rock }));
  private readonly entranceObstacle: Obstacle = { x: 530, y: 760, radius: 80 };
  private readonly seal: Phaser.GameObjects.Image;
  private readonly inscription: Phaser.GameObjects.Graphics;
  private readonly lights: Phaser.GameObjects.Ellipse[] = [];
  private active = false;
  private resolved = false;
  private phase = 0;

  constructor(private readonly scene: Phaser.Scene, resolved = false) {
    scene.add.rectangle(1100, 750, 2200, 1500, 0x102329).setDepth(-10002);
    this.bake();
    scene.add.image(520, 739, 'ancient-approach').setDisplaySize(260, 325).setDepth(890).setTint(0xabb9a8);
    this.seal = scene.add.image(530, 760, 'sealed-threshold').setDisplaySize(225, 250)
      .setDepth(895).setTint(0x9da9a1).setAlpha(0);

    // These are broken seams embedded around the perimeter, never a magic circle.
    this.inscription = scene.add.graphics().setDepth(-9900).setAlpha(0.16);
    for (const path of [
      [[682,514],[738,490],[847,497],[876,484]],
      [[1010,480],[1101,464],[1191,485],[1242,476]],
      [[1440,504],[1530,549],[1560,625]],
      [[1540,885],[1518,972],[1407,1016]],
      [[1218,1038],[1120,1015],[1076,1030],[1027,1021]],
      [[866,1010],[764,986],[713,937]],
    ]) {
      this.inscription.lineStyle(7, 0xa98cff, 0.12).beginPath().moveTo(path[0][0], path[0][1]);
      for (const [x, y] of path.slice(1)) this.inscription.lineTo(x, y);
      this.inscription.strokePath();
      this.inscription.lineStyle(2, 0xa98cff, 0.58).beginPath().moveTo(path[0][0], path[0][1]);
      for (const [x, y] of path.slice(1)) this.inscription.lineTo(x, y);
      this.inscription.strokePath();
    }
    for (const [x, y, width] of [[820,473,70],[1212,462,72],[1555,605,50],[1544,958,56],[1280,1035,65],[738,1015,58]]) {
      this.lights.push(scene.add.ellipse(x, y, width, width * 0.28, 0xa98cff, 0.12).setDepth(-9899));
    }
    if (resolved) this.resolve();
  }

  setEncounterActive(active: boolean): void {
    if ((this.resolved && active) || this.active === active) return;
    this.active = active;
    if (active) {
      this.obstacles.push(this.entranceObstacle);
      this.scene.tweens.killTweensOf(this.seal);
      this.seal.setAlpha(0).setScale(225 / this.seal.width, 250 / this.seal.height);
      this.scene.tweens.add({ targets: this.seal, alpha: 1, duration: 650 });
      this.inscription.setAlpha(0.5);
    } else {
      const index = this.obstacles.indexOf(this.entranceObstacle);
      if (index >= 0) this.obstacles.splice(index, 1);
      this.scene.tweens.killTweensOf(this.seal);
      this.seal.setAlpha(0);
    }
  }

  setPhase(phase: number): void {
    if (this.resolved || this.phase === phase) return;
    this.phase = phase;
    this.inscription.setAlpha(phase >= 3 ? 0.84 : phase === 2 ? 0.68 : 0.5);
    const color = phase >= 3 ? 0xffbd54 : 0xa98cff;
    for (const light of this.lights) {
      this.scene.tweens.killTweensOf(light);
      light.setFillStyle(color, phase >= 3 ? 0.27 : phase === 2 ? 0.22 : 0.17).setScale(1);
      this.scene.tweens.add({ targets: light, scaleX: 1.22, scaleY: 1.3, duration: 550, yoyo: true });
    }
  }

  resolve(): void {
    if (this.resolved) return;
    this.setEncounterActive(false);
    this.resolved = true;
    this.inscription.setAlpha(0.24);
    for (const light of this.lights) {
      this.scene.tweens.killTweensOf(light);
      light.setScale(1).setFillStyle(0xffbd54, 0.12);
    }
  }

  private bake(): void {
    const floor = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const mass = (color: number, alpha: number, points: number[][]) => floor.fillStyle(color, alpha)
      .fillPoints(groundContour(points.map(([x, y]) => ({ x, y }))), true);
    // Unequal shelves create a long approach and a broad mineral basin; a quiet
    // center leaves room for feet, strike arcs and dangerous ground markings.
    mass(0x1e3237, 1, [[390,410],[575,290],[861,345],[1110,302],[1480,318],[1740,385],
      [1840,692],[1770,1010],[1690,1210],[1340,1218],[1120,1172],[857,1230],[543,1190],[378,991],[416,784]]);
    mass(0x35484a, 1, [[468,730],[551,570],[681,478],[921,447],[1168,480],[1332,461],[1600,529],
      [1672,749],[1582,1040],[1320,1113],[1090,1090],[835,1110],[625,1007],[555,867]]);
    mass(0x42524f, 0.86, [[592,692],[758,593],[932,564],[1125,601],[1314,553],[1490,633],[1518,815],
      [1454,966],[1248,1014],[1060,970],[876,1004],[730,933],[674,816],[566,822]]);
    mass(0x667264, 0.18, [[558,746],[768,658],[947,694],[1122,645],[1369,690],[1450,791],
      [1318,922],[1138,898],[936,958],[761,862],[620,810]]);
    mass(0x172b32, 0.5, [[910,392],[1193,371],[1445,387],[1605,480],[1524,552],[1371,530],[1160,514],[945,480]]);
    mass(0x1a3034, 0.42, [[680,1003],[883,1039],[1130,1004],[1374,1047],[1580,1004],[1635,1175],
      [1260,1200],[925,1180],[623,1158]]);

    const layer = this.scene.add.renderTexture(350, 240, 1500, 1060).setOrigin(0).setDepth(-10000)
      .draw(floor, -350, -240);
    const painter = new EnvironmentPainter(this.scene, layer);
    painter.ground('cavern-ground', 0.17, floor);
    // Quiet central footing keeps warnings legible; soft edge shade adds volume.
    for (const [x,y,w,h] of [[745,518,330,110],[1450,543,320,125],[1480,980,290,100],[895,1050,370,115]]) painter.contact(x,y,w,h,0.24);
    painter.apron(520, 886, 170, 0x92a78d);

    // The ancient construction is exposed only along the geological margins.
    // Painted plates, mineral strata and roots share contact shadows and material.
    for (const [x, y, width, height, angle] of [
      [1160,431,470,205,-3], [1470,465,350,205,12],
      [1020,1115,425,170,-8], [1510,1100,290,170,5],
    ]) {
      painter.stamp({ key: 'ancient-remnant', x, y, width, height, angle, tint: 0x9dab9d, alpha: 0.88 });
    }
    painter.stamp({ key: 'ancient-frame', x: 1460, y: 336, width: 390, height: 345, tint: 0x869a96 });
    painter.stamp({ key: 'deep-relay', x: 940, y: 374, width: 145, height: 215, angle: -7, tint: 0xa5b0a5 });

    for (const rock of WARDEN_ARENA_FOOTPRINTS) {
      const lower = rock.y > 900;
      const stratum = rock.x % 3 !== 0;
      painter.apron(rock.x, rock.y + rock.radius * 0.6, rock.radius * 3.8, 0x91a28a);
      // The shelf's painted ground contact remains close to its simple footprint.
      painter.stamp({ key: stratum ? 'deep-stratum' : 'rock-shelf', x: rock.x, y: rock.y - (stratum ? rock.radius * 0.27 : 0),
        width: rock.radius * 4.25, height: rock.radius * (stratum ? 2.2 : 3.1),
        angle: lower ? -5 : 5, flipX: lower, tint: lower ? 0x94a78c : 0xa0b2a0 });
    }
    // Back wall mass connects the large formations without another solid prop
    // in the playable center. These shared silhouettes are baked raster assets.
    for (const [x, y, width, angle] of [[676,373,255,-7],[967,347,270,4],[1270,363,286,-4],[1510,360,310,6],
      [771,1163,300,3],[1130,1180,330,-4],[1463,1167,290,6]]) {
      painter.stamp({ key: 'deep-stratum', x, y, width, height: width * 0.5, angle,
        flipX: y > 1000, tint: 0x80968e });
    }
    for (const [x, y, width, angle] of [[700,500,165,21],[1001,454,185,-8],[1450,491,205,19],
      [1590,961,175,-40],[1220,1078,208,-11],[742,1040,200,14]]) {
      painter.stamp({ key: 'root-growth', x, y, width, height: width * 0.29, angle, tint: 0x8f9e7d });
    }
    for (const [x, y, width, height, angle] of [[821,462,105,122,-14],[1218,442,100,115,11],
      [1602,617,102,120,23],[1572,998,90,98,-16],[1301,1072,135,113,7],[702,1084,100,113,-7]]) {
      painter.stamp({ key: 'deep-mineral', x, y, width, height, angle, tint: 0xd1c8a9 });
    }
    // Shallow fragments communicate the buried structure under the floor. They
    // stay flat and traversable; solid bases are exclusively the perimeter list.
    for (const [x, y, width, angle] of [[806,549,95,7],[1375,577,112,-10],[1450,929,112,12],[870,980,98,-4]]) {
      painter.stamp({ key: 'ancient-remnant', x, y, width, height: width * 0.34, angle, tint: 0x7e9289, alpha: 0.4 });
    }
    painter.destroy();
    floor.destroy();
  }
}
