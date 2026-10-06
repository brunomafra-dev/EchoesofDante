import Phaser from 'phaser';
import { VALLEY, VALLEY_BORDERS, VALLEY_ROCKS } from '../config/valley';
import { EnvironmentPainter, createEnvironmentGround } from '../visual/EnvironmentArt';
import type { MovementBounds, Obstacle } from './Movement';
import { distance, type Vec2 } from '../utils/math';

// A continuous authored exterior with a new escarpment beyond the old valley.
export class ResonanceValley {
  readonly bounds: MovementBounds = { ...VALLEY.bounds };
  readonly obstacles: Obstacle[] = [...VALLEY_ROCKS, ...VALLEY_BORDERS].map(o => ({ ...o }));
  private readonly pulse: Phaser.GameObjects.Ellipse;
  private readonly frontierPulse: Phaser.GameObjects.Ellipse;
  constructor(private readonly scene: Phaser.Scene, recorded: boolean) {
    createEnvironmentGround(scene, VALLEY.cameraWidth, 'forest-ground', 0xb7c2a7);
    for (const tileX of [0, 1500, 3000, 4500]) {
      const layer = scene.add.renderTexture(tileX, 200, 1500, 1200).setOrigin(0).setDepth(-10000);
      const painter = new EnvironmentPainter(scene, layer);
      const visible = (x: number, width: number) => x + width / 2 > tileX && x - width / 2 < tileX + 1500;
      for (const [x, y, w, h] of [[570,850,540,220],[1080,780,620,260],[1290,590,360,170],
        [1700,850,520,250],[2040,735,560,230],[2440,865,380,170]]) {
        if (visible(x,w)) painter.sediment(x,y,w,h,0x8a8f64,0.23);
      }
      for (const rock of VALLEY_BORDERS) if (visible(rock.x, 310)) {
        painter.apron(rock.x, rock.y + 30, 235, 0xb2b592);
        painter.stamp({ key: 'deep-stratum', x: rock.x, y: rock.y - 8, width: 285, height: 148,
          angle: Math.sin(rock.x) * 6, flipX: rock.y > 1000, tint: 0xbec7ad });
      }
      for (const rock of VALLEY_ROCKS) if (visible(rock.x, rock.radius * 5)) {
        if ([2190, 2590, 4230].includes(rock.x)) continue;
        if (rock.x >= tileX && rock.x < tileX + 1500) painter.rock(rock.x, rock.y, rock.radius, 0xc9cbb1, true);
      }
      // The divided ridge makes a northern mineral detour and a broad southern route.
      for (const [x,y,w,h] of [[930,515,150,112],[1140,585,130,100],[1690,495,190,130],
        [1850,1080,165,117],[2310,525,130,96]]) if (visible(x,w)) {
        painter.apron(x,y+h*0.34,w*0.85,0xbbbc97);
        painter.stamp({key:'deep-mineral',x,y,width:w,height:h,tint:0xe0d9b6});
      }
      for (const [x,y,w,a] of [[570,625,220,-18],[810,1020,210,21],[1190,1080,230,-7],
        [1340,545,190,30],[1550,685,165,52],[1910,550,245,14],[2070,905,160,-21],[2350,1110,190,-25]]) {
        if (visible(x,w)) painter.stamp({key:'root-growth',x,y,width:w,height:w*0.28,angle:a,tint:0xbacfa1});
      }
      for (const [x,y,w] of [[620,560,88],[830,1005,110],[1230,1070,94],[1570,555,102],[1970,1080,98],[2440,585,105]]) {
        if(visible(x,w)) painter.stamp({key:'dante-canopy-green',x,y,width:w,height:w*0.52,alpha:0.75,tint:0xa8bd91});
      }
      // Past the old valley, the route narrows through mineral ridges before
      // opening into an exposed escarpment. The same painterly stamp families
      // keep the new ground and its landmarks in the existing world language.
      const frontierRidges = [
        { x: 3020, y: 500, w: 500, h: 210, tint: 0xb4c0a8 },
        { x: 3370, y: 1090, w: 410, h: 190, tint: 0xaab69f },
        { x: 3490, y: 790, w: 485, h: 245, tint: 0xc1c5ad },
        { x: 3830, y: 570, w: 340, h: 175, tint: 0xbac2ae },
        { x: 3840, y: 1050, w: 390, h: 185, tint: 0xabb79f },
        { x: 4650, y: 1050, w: 430, h: 195, tint: 0xb0b99f },
      ];
      for (const ridge of frontierRidges) if (visible(ridge.x, ridge.w)) {
        painter.apron(ridge.x, ridge.y + ridge.h * 0.34, ridge.w, ridge.tint);
        painter.stamp({ key: 'deep-stratum', x: ridge.x, y: ridge.y, width: ridge.w, height: ridge.h,
          tint: ridge.tint, flipX: Math.sin(ridge.x) < 0 });
      }
      const frontierMinerals = [
        { x: 3220, y: 545, w: 185, h: 145 },
        { x: 3570, y: 1035, w: 145, h: 115 },
        { x: 4490, y: 565, w: 205, h: 155 },
      ];
      for (const mineral of frontierMinerals) if (visible(mineral.x, mineral.w)) {
        painter.apron(mineral.x, mineral.y + 34, mineral.w * 0.9, 0xc2bd9f);
        painter.stamp({ key: 'deep-mineral', x: mineral.x, y: mineral.y, width: mineral.w, height: mineral.h,
          tint: 0xe1d4a8, flipX: mineral.x % 2 === 0 });
      }
      for (const [x,y,w,angle] of [[3100,990,300,-15],[3580,550,260,12],[3940,1100,320,-9],[4430,970,280,17]]) {
        if (visible(x,w)) painter.stamp({ key: 'root-growth', x, y, width: w, height: w * 0.24,
          angle, tint: 0xb1c39a, alpha: 0.76 });
      }
      if (visible(4230, 390)) {
        painter.apron(4230, 790, 285, 0xc0b89c);
        painter.stamp({ key: 'ancient-remnant', x: 4230, y: 738, width: 310, height: 215,
          tint: 0xbcbfa9, flipX: true });
        painter.stamp({ key: 'resonance-growth', x: 4230, y: 695, width: 205, height: 155,
          tint: 0xd0cdb2 });
        painter.stamp({ key: 'root-growth', x: 4110, y: 806, width: 270, height: 70,
          angle: -12, tint: 0xb4c49a, alpha: 0.8 });
      }
      if (visible(5100, 430)) {
        painter.apron(5100, 800, 390, 0xa9b29f);
        painter.stamp({ key: 'deep-stratum', x: 5100, y: 748, width: 520, height: 340, tint: 0x9faa9b });
        painter.stamp({ key: 'ancient-remnant', x: 5060, y: 780, width: 230, height: 195,
          tint: 0x9da995, alpha: 0.9 });
      }
      for (const [x,y,w,h] of [[2940,810,520,330],[3540,700,540,390],[4110,855,580,330],[4650,760,560,390]]) {
        if (visible(x,w)) painter.sediment(x,y,w,h,0x7b806c,0.22);
      }
      if (visible(2190,260)) {
        painter.apron(2190,706,228,0xbcb89a);
        painter.stamp({key:'resonance-growth',x:2190,y:640,width:255,height:191,tint:0xd7d6bc});
      }
      if (visible(2590,350)) {
        painter.apron(2590,886,310,0xaeb497);
        painter.stamp({key:'ancient-remnant',x:2590,y:785,width:330,height:210,tint:0xa9b49f});
      }
      // Shallow buried fragments describe paths, not a clean symmetric floor.
      for (const [x,y] of [[690,820],[1050,790],[1630,755],[1970,755],[2350,850]]) {
        if(visible(x,90)) painter.stamp({key:'ancient-remnant',x,y,width:85,height:30,tint:0x9ba88e,alpha:0.48});
      }
      painter.destroy();
    }
    this.pulse = scene.add.ellipse(2190,654,52,15,0xa98cff,recorded?0.35:0.12).setDepth(660);
    scene.tweens.add({targets:this.pulse,alpha:{from:0.5,to:1},duration:1900,yoyo:true,repeat:-1});
    this.frontierPulse = scene.add.ellipse(4230,686,66,20,0xa98cff,0.12).setDepth(687);
    scene.tweens.add({targets:this.frontierPulse,alpha:{from:0.35,to:0.9},scale:{from:0.9,to:1.08},duration:2300,yoyo:true,repeat:-1});
  }
  canInvestigate(position: Vec2, dead: boolean, recorded: boolean): boolean {
    return !dead && !recorded && distance(position, VALLEY.landmark) < VALLEY.landmark.radius;
  }
  respond(): void { this.pulse.setFillStyle(0xa98cff,0.42); }
  canInvestigateFrontier(position: Vec2, dead: boolean, recorded: boolean): boolean {
    return !dead && !recorded && distance(position, VALLEY.frontier.signal) < VALLEY.frontier.signal.radius;
  }
  respondFrontier(): void {
    this.frontierPulse.setFillStyle(0xa98cff,0.5).setScale(1.18);
    this.scene.tweens.add({ targets: this.frontierPulse, scale: 1, alpha: 0.55, duration: 850 });
  }
}
