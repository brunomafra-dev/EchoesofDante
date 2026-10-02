import Phaser from 'phaser';
import { EXPANSION, EXPANSION_ROCKS, EXPANSION_WALLS } from '../config/expansion';
import type { Obstacle } from './Movement';
import type { Vec2 } from '../utils/math';
import { distance } from '../utils/math';
import { EnvironmentPainter, groundContour } from '../visual/EnvironmentArt';

// Small authored continuation, captured once in three bounded cache tiles.
export class CavernContinuation {
  readonly obstacles: readonly Obstacle[] = [...EXPANSION_WALLS.flatMap(wall => wall.bases), ...EXPANSION_ROCKS];
  private readonly fragmentLight: Phaser.GameObjects.Ellipse;
  private readonly approachLight: Phaser.GameObjects.Ellipse;

  constructor(private scene: Phaser.Scene, fragmentSeen: boolean) {
    // Distant open-air matte, behind physical ground. No lighting/camera rewrite.
    scene.add.image(5000,700,'exterior-atmosphere').setDisplaySize(1400,1400).setDepth(-10001).setTint(0xc7d5ce);
    for (const x of [2450, 3450, 4450]) this.bake(x);
    // A tall monument needs foreground occlusion at its feet, like existing roots/trees.
    scene.add.image(5310,680,'ancient-approach').setDisplaySize(450,550).setDepth(925);
    const glows = [[2875, 510, 0xffbd54], [3455, 992, 0xffbd54], [3780, 535, 0xa98cff], [4160, 530, 0xa98cff]];
    const lights = glows.map(([x,y,color]) => scene.add.ellipse(x,y,65,20,color,0.13).setDepth(y));
    this.fragmentLight = scene.add.ellipse(EXPANSION.fragment.x, 580, 62, 30, 0xa98cff, fragmentSeen ? 0.3 : 0.1).setDepth(600);
    this.approachLight = scene.add.ellipse(5350, 730, 34, 9, 0xa98cff, fragmentSeen ? 0.4 : 0.14).setDepth(740);
    scene.tweens.add({ targets: [...lights,this.approachLight], alpha: { from: 0.6, to: 1 }, scale: { from: 0.94, to: 1.06 }, duration: 2500, yoyo: true, repeat: -1 });
  }

  canInvestigate(position: Vec2, dead: boolean, seen: boolean): boolean {
    return !dead && !seen && distance(position, EXPANSION.fragment) <= EXPANSION.fragment.radius;
  }

  respond(): void {
    this.fragmentLight.setFillStyle(0xa98cff, 0.35).setScale(1.5);
    this.approachLight.setFillStyle(0xa98cff, 0.4);
    this.scene.tweens.add({ targets: this.fragmentLight, scale: 1, duration: 800 });
  }

  private bake(tileX: number): void {
    const floor = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const mass = (color: number, alpha: number, points: number[][]) => floor.fillStyle(color,alpha).fillPoints(groundContour(points.map(([x,y])=>({x,y}))),true);
    // A throat, unequal basins and a lower loop. Space alternates with pressure.
    mass(0x182c35,1,[[2440,690],[2650,590],[2780,495],[3050,475],[3190,625],[3350,530],[3560,570],[3640,620],[3860,510],[4130,550],[4380,650],[4530,760],[4380,985],[4110,1025],[3900,1035],[3660,1020],[3500,1085],[3260,1010],[3040,1020],[2810,1060],[2560,1050],[2500,850]]);
    mass(0x3b5053,0.9,[[2470,735],[2680,660],[2840,580],[3000,570],[3160,720],[3310,650],[3500,695],[3650,740],[3850,620],[4060,650],[4320,710],[4380,850],[4120,930],[3910,940],[3670,935],[3500,1010],[3270,900],[3020,930],[2830,980],[2600,950],[2540,830]]);
    mass(0x233b40,0.86,[[2950,850],[3150,880],[3360,880],[3490,835],[3600,890],[3510,1070],[3320,1040],[3170,980],[3030,965]]);
    mass(0x59685d,0.35,[[3300,945],[3430,875],[3550,932],[3540,1030],[3440,1050],[3330,1030]]);
    // Daylight reaches the ascending throat before the view opens onto the plateau.
    mass(0x647a75,1,[[4160,670],[4380,575],[4600,600],[4700,735],[4570,925],[4390,990],[4230,940]]);
    mass(0x526e65,1,[[4380,595],[4560,400],[4830,365],[5100,405],[5330,530],[5500,765],[5410,1060],[5160,1140],[4840,1125],[4600,1030],[4400,925]]);
    mass(0x809487,0.83,[[4460,695],[4640,510],[4830,485],[5070,520],[5260,630],[5350,810],[5210,980],[4950,1035],[4750,980],[4520,880]]);
    mass(0x9ca994,0.3,[[4580,660],[4770,580],[4990,625],[5060,830],[4870,940],[4670,845]]);
    const layer = this.scene.add.renderTexture(tileX,200,1000,1000).setOrigin(0).setDepth(-9999).draw(floor,-tileX,-200);
    const painter = new EnvironmentPainter(this.scene,layer);
    // Continuous stone material across tile boundaries; daylight comes from the masses/matte.
    painter.ground('cavern-ground',0.3,floor);
    const visible = (x: number, width: number) => x+width/2 >= tileX && x-width/2 <= tileX+1000;
    for(const wall of EXPANSION_WALLS) if(visible(wall.x,wall.width)) {
      painter.stamp({key:'world-shadow',x:wall.x,y:wall.y+30,width:wall.width,height:wall.height*1.3,alpha:0.7});
      painter.stamp({key:'deep-stratum',...wall,tint:wall.x>4150?0xd1d9c0:0xa1b5bc,flipX:wall.x%3>1});
    }
    for(const rock of EXPANSION_ROCKS) {
      if(!visible(rock.x,rock.radius*5)||rock.x>=4500||[3450,3810].includes(rock.x))continue;
      painter.rock(rock.x,rock.y,rock.radius,rock.x>4200?0xd3dcca:0x9db3b8);
    }
    const paintings = [
      {key:'deep-mineral' as const,x:2875,y:495,width:155,height:125},
      {key:'deep-mineral' as const,x:3450,y:977,width:190,height:145},
      {key:'deep-relay' as const,x:3790,y:490,width:245,height:250},
      {key:'ancient-remnant' as const,x:3980,y:674,width:142,height:185},
      {key:'exterior-outcrop' as const,x:4620,y:470,width:280,height:200},
      {key:'exterior-outcrop' as const,x:4710,y:912,width:280,height:200,flipX:true},
      {key:'exterior-outcrop' as const,x:5020,y:405,width:355,height:250},
      {key:'exterior-outcrop' as const,x:5100,y:930,width:355,height:250,flipX:true},
      {key:'ancient-remnant' as const,x:4870,y:555,width:170,height:200},
      {key:'ancient-approach' as const,x:5310,y:680,width:450,height:550},
    ];
    for(const painting of paintings) if(visible(painting.x,painting.width)) {
      painter.stamp({key:'world-shadow',x:painting.x,y:painting.y+painting.height*0.3,width:painting.width,height:painting.height*0.45,alpha:0.55});
      if(painting.key !== 'ancient-approach') painter.stamp(painting);
    }
    if(visible(5360,200))painter.rock(5360,740,42,0x91a69c);
    for(const [x,y,w,angle] of [[2660,950,155,-10],[3040,940,170,20],[3470,530,210,65],[3770,968,185,-12],[4050,500,160,20],[4480,908,170,-20],[4860,632,140,35],[5180,975,240,-15]] as const) {
      if(visible(x,w))painter.stamp({key:'root-growth',x,y,width:w,height:w*0.3,angle,tint:x>4300?0xc5ddb7:0x829f96});
    }
    for(const [x,y,w,h] of [[2800,1010,68,75],[3170,520,70,80],[3580,520,48,65],[4080,955,55,75],[4600,920,65,80],[4980,820,70,95]] as const) {
      if(visible(x,w))painter.stamp({key:'mineral-growth',x,y,width:w,height:h,tint:x>4300?0xd9d9b9:0xadbec4});
    }
    painter.destroy(); floor.destroy();
  }
}
