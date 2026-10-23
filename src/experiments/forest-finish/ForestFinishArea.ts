import Phaser from 'phaser';
import {Arena} from '../../systems/Arena';
import type {MovementBounds,Obstacle} from '../../systems/Movement';
import type {Vec2} from '../../utils/math';
import type {Player} from '../../entities/Player';

export const FINISH_ENTRY={x:1060,y:840};
export const FINISH_SPAWNS=[{x:1090,y:470},{x:1510,y:760},{x:1380,y:440}];
// Same bounds and residents in both versions. These circles follow
// the pond, raised root banks and shelves in the new painting, not extra props.
export const FINISH_BOUNDS:MovementBounds={left:340,right:1870,top:370,bottom:1300};
export const FINISH_SOLIDS:readonly Obstacle[]=[
 {x:505,y:403,radius:185},{x:580,y:480,radius:122},
 {x:410,y:1070,radius:160},{x:620,y:1180,radius:115},
 {x:1730,y:530,radius:150},{x:1840,y:720,radius:132},
 {x:1480,y:1200,radius:142},{x:1660,y:1290,radius:145},
 {x:420,y:705,radius:90},{x:790,y:390,radius:90},
];

export class ForestFinishArea{
 readonly bounds={...FINISH_BOUNDS};
 readonly obstacles:Obstacle[];
 private boughs:{image:Phaser.GameObjects.Image;x:number;y:number;angle:number;phase:number}[]=[];
 private motes:{image:Phaser.GameObjects.Arc;x:number;y:number;phase:number}[]=[];
 private contact?:Phaser.GameObjects.Image;
 private ripples:Phaser.GameObjects.Ellipse[]=[];
 private readonly still=matchMedia('(prefers-reduced-motion: reduce)').matches;
 constructor(scene:Phaser.Scene,readonly enhanced:boolean){
  if(!enhanced){this.obstacles=new Arena(scene).obstacles;return;}
  this.obstacles=FINISH_SOLIDS.map(o=>({...o}));
  scene.add.image(1100,750,'finish-clearing').setDisplaySize(2200,1500).setDepth(-10001).setName('finish-continuous-ground');
  // True-alpha overhead foliage is separate from the ground so it can sway and
  // partially overlap actors. Only three bounded sprites; no static redraw.
  for(const[x,y,w,angle,phase]of [[405,1190,780,8,0],[1870,330,650,-18,1.9],[310,180,610,22,4.1]]){
   const image=scene.add.image(x,y,'finish-canopy').setDisplaySize(w,w*2/3).setAngle(angle).setDepth(14000).setName('finish-foreground');
   if(x>1500)image.setFlipX(true);this.boughs.push({image,x,y,angle,phase});
  }
  for(let i=0;i<16;i++){const x=690+(i*137)%850,y=410+(i*173)%610;const image=scene.add.circle(x,y,i%3===0?1.8:1,0xf2dfaa,.25).setBlendMode(Phaser.BlendModes.ADD).setDepth(13900);this.motes.push({image,x,y,phase:i*1.73});}
  // Light reflection only inside the painted spring; no blue AO rings on land.
  for(let i=0;i<3;i++)this.ripples.push(scene.add.ellipse(468+i*43,367+i*28,54,12).setStrokeStyle(1,0xd5e6c3,.14).setDepth(-9999));
  if(!scene.textures.exists('finish-contact')){const canvas=scene.textures.createCanvas('finish-contact',96,96)!;const c=canvas.context,g=c.createRadialGradient(48,48,0,48,48,46);g.addColorStop(0,'rgba(8,20,16,.7)');g.addColorStop(.45,'rgba(8,20,16,.3)');g.addColorStop(1,'rgba(8,20,16,0)');c.fillStyle=g;c.fillRect(0,0,96,96);canvas.refresh();}
  this.contact=scene.add.image(0,0,'finish-contact').setDisplaySize(88,31).setAlpha(.75);
 }
 update(now:number,player:Player):void{
  if(!this.enhanced)return;
  const t=this.still?0:now*.001;
  for(const b of this.boughs){b.image.setAngle(b.angle+Math.sin(t*.52+b.phase)*.65).setY(b.y+Math.sin(t*.65+b.phase)*2);const d=Math.hypot((player.position.x-b.x)/(b.image.displayWidth*.45),(player.position.y-b.y)/(b.image.displayHeight*.4));b.image.setAlpha(.48+.52*Phaser.Math.Clamp((d-.65)/.5,0,1));}
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
