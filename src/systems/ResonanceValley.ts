import Phaser from 'phaser';
import { VALLEY, VALLEY_BORDERS, VALLEY_ROCKS } from '../config/valley';
import { EnvironmentPainter, createCavernGround } from '../visual/EnvironmentArt';
import type { MovementBounds, Obstacle } from './Movement';
import { distance, type Vec2 } from '../utils/math';

// A separate authored exterior, not a recolor or extension of the old plateau.
export class ResonanceValley {
  readonly bounds: MovementBounds = { ...VALLEY.bounds };
  readonly obstacles: Obstacle[] = [...VALLEY_ROCKS, ...VALLEY_BORDERS].map(o => ({ ...o }));
  private readonly pulse: Phaser.GameObjects.Ellipse;
  constructor(scene: Phaser.Scene, recorded: boolean) {
    createCavernGround(scene, VALLEY.cameraWidth);
    (scene.children.getByName('continuous-cavern-ground') as Phaser.GameObjects.TileSprite).setTint(0xd4d7b9);
    for (const tileX of [0, 1500]) {
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
        if ([2190, 2590].includes(rock.x)) continue;
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
  }
  canInvestigate(position: Vec2, dead: boolean, recorded: boolean): boolean {
    return !dead && !recorded && distance(position, VALLEY.landmark) < VALLEY.landmark.radius;
  }
  respond(): void { this.pulse.setFillStyle(0xa98cff,0.42); }
}
