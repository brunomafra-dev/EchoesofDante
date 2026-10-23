import Phaser from 'phaser';
import {Arena} from '../../systems/Arena';
import type {MovementBounds,Obstacle} from '../../systems/Movement';
import type {Vec2} from '../../utils/math';
import type {Player} from '../../entities/Player';
import {ForestLife} from './ForestLife';

export const FINISH_ENTRY={x:1060,y:840};
export const FINISH_SPAWNS=[{x:1090,y:470},{x:1510,y:760},{x:1380,y:440}];
// Authored in source-image pixels, clockwise along the actual shore/root/rock
// bases. Grass and flat trail margins remain walkable; trunks and raised banks
// do not. This is one connected clearing, with a southern trail and two forks.
export const FINISH_GROUND:readonly Vec2[]=[
 [507,1024],[604,901],[671,838],[720,770],[729,723],[701,688],
 [635,682],[566,650],[495,608],[421,564],[359,552],[312,518],
 [300,486],[327,454],[380,427],[445,403],[506,403],[552,378],
 [577,340],[597,316],[636,309],[671,283],[698,234],[733,185],
 [758,141],[775,88],[770,20],[898,20],[923,78],[913,126],
 [935,160],[982,178],[1051,178],[1100,158],[1190,155],[1243,162],
 [1284,187],[1375,204],[1430,211],[1517,180],[1517,245],
 [1424,273],[1352,267],[1289,249],[1246,228],[1200,215],
 [1132,229],[1085,249],[1072,294],[1060,353],[1092,405],
 [1080,459],[1110,507],[1185,534],[1233,562],[1225,605],
 [1190,625],[1128,621],[1076,623],[1008,654],[966,698],
 [937,736],[910,774],[912,810],[886,857],[866,908],
 [836,945],[784,1010],[776,1024],
].map(([x,y])=>({x:x*2200/1536,y:y*1500/1024}));
export const FINISH_BOUNDS:MovementBounds={left:0,right:2200,top:0,bottom:1500,walkable:FINISH_GROUND};

export class ForestFinishArea{
 readonly bounds:MovementBounds;
 readonly obstacles:Obstacle[];
 private boughs:{image:Phaser.GameObjects.Image;x:number;y:number;angle:number;phase:number}[]=[];
 private motes:{image:Phaser.GameObjects.Arc;x:number;y:number;phase:number}[]=[];
 private contact?:Phaser.GameObjects.Image;
 private ripples:Phaser.GameObjects.Ellipse[]=[];
 private readonly life?:ForestLife;
 private shadows:{image:Phaser.GameObjects.Image;x:number;y:number;angle:number;phase:number}[]=[];
 private readonly still=matchMedia('(prefers-reduced-motion: reduce)').matches;
 constructor(scene:Phaser.Scene,readonly enhanced:boolean){
  this.bounds=enhanced?{...FINISH_BOUNDS}:{left:340,right:1870,top:370,bottom:1300};
  if(!enhanced){this.obstacles=new Arena(scene).obstacles;return;}
  this.obstacles=[];
  // Water adds a subframe to this shared texture. Always request the full image
  // explicitly so a scene restart cannot use that subframe as the default.
  scene.add.image(1100,750,'finish-clearing','__BASE').setDisplaySize(2200,1500).setDepth(-10001).setName('finish-continuous-ground');
  // True-alpha overhead foliage is separate from the ground so it can sway and
  // partially overlap actors. Only three bounded sprites; no static redraw.
  for(const[x,y,w,angle,phase]of [[405,1190,780,8,0],[1870,330,650,-18,1.9],[310,180,610,22,4.1]]){
   const image=scene.add.image(x,y,'finish-canopy').setDisplaySize(w,w*2/3).setAngle(angle).setDepth(14000).setName('finish-foreground');
   if(x>1500)image.setFlipX(true);this.boughs.push({image,x,y,angle,phase});
   const shadow=scene.add.image(x+45,y+30,'finish-canopy').setDisplaySize(w,w*.45).setTintFill(0x12241a).setAlpha(.13).setAngle(angle).setDepth(-9996);if(x>1500)shadow.setFlipX(true);this.shadows.push({image:shadow,x:x+45,y:y+30,angle,phase});
  }
  for(let i=0;i<8;i++){const x=690+(i*137)%850,y=410+(i*173)%610;const image=scene.add.circle(x,y,i%3===0?1.8:1,0xf2dfaa,.25).setBlendMode(Phaser.BlendModes.ADD).setDepth(13900);this.motes.push({image,x,y,phase:i*1.73});}
  // Light reflection only inside the painted spring; no blue AO rings on land.
  for(let i=0;i<3;i++)this.ripples.push(scene.add.ellipse(468+i*43,367+i*28,54,12).setStrokeStyle(1,0xd5e6c3,.14).setDepth(-9999));
  if(!scene.textures.exists('finish-contact')){const canvas=scene.textures.createCanvas('finish-contact',96,96)!;const c=canvas.context,g=c.createRadialGradient(48,48,0,48,48,46);g.addColorStop(0,'rgba(8,20,16,.7)');g.addColorStop(.45,'rgba(8,20,16,.3)');g.addColorStop(1,'rgba(8,20,16,0)');c.fillStyle=g;c.fillRect(0,0,96,96);canvas.refresh();}
  this.contact=scene.add.image(0,0,'finish-contact').setDisplaySize(88,31).setAlpha(.75);
  this.life=new ForestLife(scene);
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('terrain')){
   const outline=scene.add.graphics().setDepth(15000).setName('finish-ground-diagnostic');
   outline.lineStyle(2,0x5fe6d8,.8).beginPath().moveTo(FINISH_GROUND[0].x,FINISH_GROUND[0].y);
   for(const p of FINISH_GROUND.slice(1))outline.lineTo(p.x,p.y);outline.closePath().strokePath();
  }
 }
 update(now:number,player:Player,residents:readonly {position:Vec2;isDead:boolean}[]=[]):void{
  if(!this.enhanced)return;
  const t=this.still?0:now*.001;
  for(const b of this.boughs){b.image.setAngle(b.angle+Math.sin(t*.52+b.phase)*.8).setY(b.y+Math.sin(t*.65+b.phase)*1.5);const d=Math.hypot((player.position.x-b.x)/(b.image.displayWidth*.45),(player.position.y-b.y)/(b.image.displayHeight*.4));b.image.setAlpha(.48+.52*Phaser.Math.Clamp((d-.65)/.5,0,1));}
  for(const s of this.shadows)s.image.setPosition(s.x+Math.sin(t*.52+s.phase)*3,s.y+Math.sin(t*.65+s.phase)).setAngle(s.angle+Math.sin(t*.52+s.phase)*.8);
  this.life?.update(now,player,residents);
  for(const m of this.motes)m.image.setPosition(m.x+Math.sin(t*.24+m.phase)*28,m.y+Math.cos(t*.3+m.phase)*14).setAlpha(.08+(.5+.5*Math.sin(t*.6+m.phase))*.2);
  for(let i=0;i<this.ripples.length;i++){const phase=(t*.15+i/3)%1;this.ripples[i].setScale(.6+phase*.8).setAlpha(Math.sin(phase*Math.PI)*.45);}
  this.contact?.setPosition(player.position.x+9,player.position.y+43).setDepth(player.position.y-4).setVisible(!player.isDead);
  // Apply only after the existing presentation; preserve its damage tint.
  this.lightActor(player.view,player.position);
 }
 private lightActor(view:Phaser.GameObjects.Container,p:Vec2):void{
  const body=view.getData('completeActor')?.body as Phaser.GameObjects.Image|undefined;
  if(body&&!body.isTinted){const sun=Phaser.Math.SmoothStep(p.x,690,850)*(1-Phaser.Math.SmoothStep(p.x,1510,1700))*Phaser.Math.SmoothStep(p.y,380,510);body.setTint((Math.round(205+50*sun)<<16)|(Math.round(222+18*sun)<<8)|Math.round(215+sun));}
 }
}
