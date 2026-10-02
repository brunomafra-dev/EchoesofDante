import Phaser from 'phaser';
import { DEEP_OBSTACLES, DEEP_RIDGES } from '../config/cavern';
import { EnvironmentPainter, groundContour } from './EnvironmentArt';

// Authored scenery only. Graphics define low ground masses/masks; all physical
// formations use offline paintings. Images are pooled and disposed after bake.
export function bakeDeepCavern(scene: Phaser.Scene): void {
  const ground = scene.make.graphics({ x: 0, y: 0 }, false);
  function mass(color: number, alpha: number, points: number[][]): void {
    ground.fillStyle(color, alpha).fillPoints(groundContour(points.map(([x,y]) => ({x,y}))),true);
  }
  // Throat -> arrival shelf -> old basin. The world remains physically continuous.
  mass(0x0e2029,1,[[1664,436],[1800,395],[1910,420],[1990,530],[1950,700],[1800,680],[1670,558]]);
  mass(0x2b3b40,1,[[1700,447],[1800,430],[1860,475],[1950,580],[1890,655],[1780,588],[1700,536]]);
  mass(0x172b35,1,[[1825,550],[1950,405],[2130,355],[2350,400],[2490,485],[2580,670],[2540,890],[2420,1045],[2200,1110],[1970,1050],[1820,890],[1780,710]]);
  mass(0x304147,0.9,[[1860,590],[1980,475],[2150,465],[2340,520],[2470,610],[2490,790],[2340,945],[2130,1000],[1940,943],[1860,810]]);
  // Open arrival, quiet mineral side route, main route around the buried ribs.
  mass(0x3e4e50,0.58,[[1810,530],[1890,525],[1990,565],[2040,665],[1990,740],[1880,743],[1830,650]]);
  mass(0x22363b,0.92,[[1890,775],[1970,748],[2050,820],[2140,900],[2070,990],[1950,978],[1870,900]]);
  mass(0x46534f,0.36,[[1880,827],[1960,793],[2030,854],[2050,923],[1945,951],[1885,910]]);
  mass(0x394850,0.9,[[2000,535],[2120,505],[2250,534],[2330,641],[2370,778],[2280,860],[2150,848],[2080,764],[2050,650]]);
  // A recess is visible past the playable lip; no new room or lore is revealed.
  mass(0x10212c,1,[[2370,658],[2490,570],[2630,612],[2640,814],[2490,863],[2390,816]]);
  mass(0x2c3b45,0.85,[[2360,746],[2460,674],[2550,680],[2520,780],[2430,838],[2340,822]]);
  const layer=scene.add.renderTexture(1650,290,1000,850).setOrigin(0).setDepth(-9999).draw(ground,-1650,-290);
  const painter=new EnvironmentPainter(scene,layer);
  painter.ground('cavern-ground',0.3,ground);
  // Unequal strata connect boundaries to existing large formations.
  for(const ridge of DEEP_RIDGES){
    painter.stamp({key:'world-shadow',x:ridge.x,y:ridge.y+30,width:ridge.width,height:ridge.height*1.4,alpha:0.7});
    painter.stamp({key:'deep-stratum',...ridge,tint:0xb2c5c5,flipX:ridge.x>2200});
  }
  for(const rock of DEEP_OBSTACLES){
    if([2220,2010,2500,2420].includes(rock.x))continue;
    painter.rock(rock.x,rock.y,rock.radius,rock.x===1995?0xa4b9b9:0xb4c8c7);
  }
  // Selective mineral and root growth bind masses; low growth stays traversable.
  painter.stamp({key:'deep-mineral',x:2010,y:966,width:225,height:172,tint:0xd8cfbb});
  painter.stamp({key:'world-shadow',x:2210,y:715,width:330,height:140,alpha:0.8});
  painter.stamp({key:'deep-relay',x:2210,y:592,width:300,height:345,tint:0xd0d6d3});
  for(const [x,y,w,h,angle] of [[1810,605,150,50,65],[1910,886,170,54,-25],[2080,965,185,57,5],[2110,735,125,40,50],[2280,757,180,46,-20],[2360,510,180,45,30]] as const){
    painter.stamp({key:'root-growth',x,y,width:w,height:h,angle,tint:0x889f91});
  }
  for(const [x,y,w,h] of [[1865,565,52,65],[2080,510,68,80],[2355,843,62,74]] as const){
    painter.stamp({key:'mineral-growth',x,y,width:w,height:h,tint:0xaec6c9});
  }
  // These standing growths retain the prior collision audit's four small bases.
  for(const [x,y,h] of [[1978,685,34],[2020,865,47],[2343,778,38],[2378,617,29]] as const){
    painter.stamp({key:'mineral-growth',x,y:y-h*0.25,width:h*1.5,height:h*1.8,tint:0xaec6c9});
  }
  // The final formation frames darkness, with a visible buried stone lip.
  painter.stamp({key:'deep-stratum',x:2525,y:569,width:300,height:170,angle:-12,tint:0x8298a2});
  painter.stamp({key:'deep-stratum',x:2525,y:887,width:280,height:140,angle:8,tint:0x98adb0,flipX:true});
  painter.stamp({key:'ancient-remnant',x:2510,y:680,width:165,height:210,tint:0x8fa3ad});
  painter.stamp({key:'deep-mineral',x:2590,y:724,width:96,height:77,tint:0xa999d6,alpha:0.68});
  painter.destroy();ground.destroy();
  // One small foreground bake supplies occlusion at the lower rim only.
  const front=scene.add.renderTexture(2080,973,430,155).setOrigin(0).setDepth(1080);
  const foreground=new EnvironmentPainter(scene,front);
  foreground.stamp({key:'root-growth',x:2270,y:1052,width:370,height:90,angle:-4,tint:0x729080});
  foreground.stamp({key:'deep-stratum',x:2420,y:1084,width:205,height:140,tint:0x819ba0});
  foreground.destroy();
}
