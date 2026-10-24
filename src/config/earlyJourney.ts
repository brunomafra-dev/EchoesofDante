import type { MovementBounds } from '../systems/Movement';
import type { Vec2 } from '../utils/math';

// Optional geography. The original Echoes, seal, mechanism and First Echo keep
// their coordinates and prerequisites. No branch crosses a campaign gate.
export const FOREST_SIZE = { width: 3100, height: 1950 };
export const FOREST_CONTOUR: readonly Vec2[] = [
  [56,56],[2144,56],[2144,800],[2350,800],[2550,650],[2920,720],
  [3044,920],[3020,1420],[2830,1480],[2730,1780],[2440,1844],
  [2110,1810],[2020,1600],[1450,1650],[1240,1810],[890,1844],
  [720,1700],[740,1500],[56,1444],
].map(([x,y])=>({x,y}));
export const FOREST_BOUNDS: MovementBounds = { left:56, top:56, right:3044, bottom:1844, walkable:FOREST_CONTOUR };
export const FOREST_BRANCH_PATHS = [
  {width:180,points:[[1770,1010],[2100,1050],[2300,1120],[2510,1260],[2630,1300]].map(([x,y])=>({x,y}))},
  {width:165,points:[[2630,1300],[2590,1580],[2350,1650],[1960,1450],[1520,1460],[1140,1640],[1120,1250]].map(([x,y])=>({x,y}))},
];
// Contact geometry for the authored paintings. Obstacle centers are in actor
// coordinates (39 px above ground); pool banks and solid roots cannot be crossed.
export const EARLY_LANDMARKS = {
  forest:[{x:2770,y:1090,radius:140},{x:2870,y:1080,radius:98},{x:2310,y:1570-39,radius:48}],
  cavern:[{x:990,y:1305-39,radius:95},{x:2275,y:1440-39,radius:58},{x:3895,y:1360-39,radius:62}],
} as const;
export const EARLY_PREVIEW_ENTRY = {forest:{x:2240,y:1230},cavern:{x:1140,y:1240}} as const;
export const FOREST_BRANCH_CLEARINGS = [
  {x:2430,y:1030,rx:210,ry:165},{x:2740,y:1240,rx:180,ry:170},
  {x:2500,y:1610,rx:200,ry:130},{x:1140,y:1640,rx:165,ry:125},
];
// Openings in the original southern rim. Independent pocket contours retain
// the main horizontal passage; the existing right clamp still seals Deep Cavern.
export const CAVERN_SIZE = { height:1900 };
export const CAVERN_POCKETS = [
  {name:'Câmara da condensação',left:780,right:1510,bottom:1480,entry:1140,x:1200,y:1350},
  {name:'Jardim mineral',left:1740,right:2450,bottom:1600,entry:2120,x:2090,y:1440},
  {name:'Conduto soterrado',left:3330,right:4170,bottom:1500,entry:3720,x:3750,y:1360},
] as const;
export function cavernContour(): readonly Vec2[] {
  const points:Vec2[]=[{x:480,y:380},{x:6480,y:380},{x:6480,y:1120}];
  for(const p of [...CAVERN_POCKETS].reverse())points.push(
    {x:p.right,y:1120},{x:p.right-70,y:p.bottom-80},
    {x:p.right-190,y:p.bottom},{x:p.left+160,y:p.bottom},
    {x:p.left+40,y:p.bottom-100},{x:p.left,y:1120});
  points.push({x:480,y:1120});return points;
}
export function cavernPocketOpening(x:number):boolean {
  return CAVERN_POCKETS.some(p=>x>p.entry-155&&x<p.entry+155);
}
