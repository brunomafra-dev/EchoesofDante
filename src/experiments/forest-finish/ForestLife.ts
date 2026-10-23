import Phaser from 'phaser';
import type {Player} from '../../entities/Player';
import type {Vec2} from '../../utils/math';

export const FOREST_TOUCH={water:{x:885,y:475,radius:85},signal:{x:2050,y:320,radius:95}} as const;
type Resident={position:Vec2;isDead:boolean};
type Leaf={image:Phaser.GameObjects.Image;x:number;y:number;born:number;angle:number};

/** Fixed pools for local reactions, independent of combat and progression. */
export class ForestLife{
 private plants:{image:Phaser.GameObjects.Image;x:number;y:number;phase:number;bend:number}[]=[];
 private leaves:Leaf[]=[];
 private rings:Phaser.GameObjects.Ellipse[]=[];
 private water:Phaser.GameObjects.TileSprite;
 private signal:Phaser.GameObjects.Ellipse;
 private waterAt=-Infinity;
 private signalAt=-Infinity;
 private lastTouch=-Infinity;
 private lastStep:Vec2={x:1060,y:840};
 private leafIndex=0;
 private readonly still=matchMedia('(prefers-reduced-motion: reduce)').matches;
 constructor(scene:Phaser.Scene){
  const texture=scene.textures.get('finish-clearing');
  if(!texture.has('moving-water'))texture.add('moving-water',0,210,165,390,220);
  const sx=2200/1536,sy=1500/1024;
  // Stationary stencil on the water inset. Only UVs drift; stone banks stay put.
  const clip=scene.make.graphics({x:0,y:0});
  clip.fillStyle(0xffffff).fillPoints([[280,190],[347,180],[390,196],[422,224],[494,238],[543,267],[559,293],[527,322],[464,344],[400,354],[342,341],[290,335],[258,314],[254,271]].map(([x,y])=>new Phaser.Math.Vector2(x*sx,y*sy)),true);
  const mask=clip.createGeometryMask();
  this.water=scene.add.tileSprite(210*sx,165*sy,390*sx,220*sy,'finish-clearing','moving-water').setOrigin(0).setTileScale(sx,sy).setAlpha(.28).setDepth(-9998).setMask(mask).setName('finish-living-water');
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{mask.destroy();clip.destroy()});
  for(const [i,[px,py,w]]of [[398,472,82],[620,672,76],[747,771,76],[1028,651,78],[1100,492,85],[1070,246,74]].entries()){
   const x=px*sx,y=py*sy,image=scene.add.image(x,y,'finish-plants',i%3).setOrigin(.5,.83).setDisplaySize(w,w).setDepth(y-39).setName('finish-reactive-plant');
   this.plants.push({image,x,y,phase:i*1.71,bend:0});
  }
  for(let i=0;i<6;i++)this.leaves.push({image:scene.add.image(0,0,'finish-plants',3).setDisplaySize(18,18).setVisible(false).setName('finish-step-leaf'),x:0,y:0,born:-Infinity,angle:i});
  for(let i=0;i<5;i++)this.rings.push(scene.add.ellipse(785,490,1,1).setStrokeStyle(1,0xc5e5d5,.7).setDepth(-9997).setVisible(false));
  this.signal=scene.add.ellipse(2125,475,70,52).setStrokeStyle(2,0xc2a6ff,.8).setDepth(-9997).setVisible(false).setName('finish-signal-response');
 }
 near(p:Vec2,dead=false):'water'|'signal'|undefined{
  if(dead)return;
  for(const id of ['water','signal'] as const){const s=FOREST_TOUCH[id];if(Math.hypot(p.x-s.x,p.y-s.y)<s.radius)return id;}
 }
 touch(now:number,kind:'water'|'signal'):boolean{
  if(now-this.lastTouch<1000)return false;
  this.lastTouch=now;if(kind==='water')this.waterAt=now;else this.signalAt=now;return true;
 }
 update(now:number,player:Player,residents:readonly Resident[]):void{
  const t=this.still?0:now*.001;
  this.water.setTilePosition(Math.sin(t*.65)*1.7,Math.cos(t*.47)*1.2);
  const actors=[player,...residents];
  for(const plant of this.plants){
   let push=0;
   for(const actor of actors){if(actor.isDead)continue;const dx=plant.x-actor.position.x,dy=plant.y-actor.position.y-(actor===player?39:18),d=Math.hypot(dx,dy);if(d<72)push+=(dx>=0?1:-1)*(1-d/72)*11;}
   plant.bend+=(Phaser.Math.Clamp(push,-14,14)-plant.bend)*.13;
   plant.image.setAngle(this.still?0:Math.sin(t*.85+plant.phase)*1.8+plant.bend);
  }
  const travelled=Math.hypot(player.position.x-this.lastStep.x,player.position.y-this.lastStep.y);
  if(travelled>52){
   if(!this.still&&!player.isDead&&travelled<200){const leaf=this.leaves[this.leafIndex++%6];leaf.x=player.position.x-8;leaf.y=player.position.y+39;leaf.born=now;leaf.image.setVisible(true).setDepth(player.position.y-1);}
   this.lastStep={...player.position};
  }
  for(const leaf of this.leaves){const age=(now-leaf.born)/800;if(age>=1){leaf.image.setVisible(false);continue;}leaf.image.setPosition(leaf.x+Math.sin(age*3+leaf.angle)*12,leaf.y-age*12-Math.sin(age*Math.PI)*5).setRotation(leaf.angle+age*1.5).setAlpha((1-age)*.62);}
  for(let i=0;i<5;i++){const age=(now-this.waterAt-i*105)/1400,visible=age>=0&&age<1;this.rings[i].setVisible(visible);if(visible)this.rings[i].setDisplaySize(this.still?65:12+age*105,this.still?23:4+age*37).setAlpha(Math.sin(age*Math.PI)*.7);}
  const pulse=(now-this.signalAt)/2200;this.signal.setVisible(pulse>=0&&pulse<1);if(pulse>=0&&pulse<1)this.signal.setScale(this.still?1:1+pulse*.35).setAlpha(Math.sin(pulse*Math.PI)*.8);
 }
}
