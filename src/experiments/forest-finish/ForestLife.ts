import Phaser from 'phaser';
import type {Player} from '../../entities/Player';
import type {Vec2} from '../../utils/math';

type Resident={position:Vec2;isDead:boolean};
type Leaf={image:Phaser.GameObjects.Image;x:number;y:number;born:number;angle:number};

/** Fixed pools for local reactions, independent of combat and progression. */
export class ForestLife{
 private plants:{image:Phaser.GameObjects.Image;x:number;y:number;phase:number;bend:number;velocity:number;touching:boolean}[]=[];
 private leaves:Leaf[]=[];
 private water:Phaser.GameObjects.TileSprite;
 private previous=new Map<Resident,Vec2>();
 private lastUpdate?:number;
 private lastStep?:Vec2;
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
   this.plants.push({image,x,y,phase:i*1.71,bend:0,velocity:0,touching:false});
  }
  for(let i=0;i<6;i++)this.leaves.push({image:scene.add.image(0,0,'finish-plants',3).setDisplaySize(18,18).setVisible(false).setName('finish-step-leaf'),x:0,y:0,born:-Infinity,angle:i});
 }
 update(now:number,player:Player,residents:readonly Resident[]):void{
  const t=this.still?0:now*.001;
  const dt=Phaser.Math.Clamp((now-(this.lastUpdate??now-16.67))/1000,0,1/30);this.lastUpdate=now;
  this.water.setTilePosition(Math.sin(t*.65)*1.7,Math.cos(t*.47)*1.2);
  const actors=[player,...residents];
  let brushing=false;
  for(const plant of this.plants){
   let push=0,touching=false,impulse=0;
   for(const actor of actors){
    if(actor.isDead)continue;
    const dx=plant.x-actor.position.x,dy=plant.y-actor.position.y-(actor===player?39:18),d=Math.hypot(dx,dy);
    if(d>=64)continue;
    const sign=dx>=0?1:-1,weight=1-d/64,previous=this.previous.get(actor);
    const moved=previous?Math.hypot(actor.position.x-previous.x,actor.position.y-previous.y):0;
    const speed=moved<100&&dt>0?Math.min(1,moved/dt/200):0;
    push+=sign*weight*(3+speed*7);
    if(d<45){touching=true;impulse+=sign*speed*20;if(actor===player)brushing=true;}
   }
   if(touching&&!plant.touching)plant.velocity+=Phaser.Math.Clamp(impulse,-25,25);
   plant.touching=touching;
   // Damped return around the planted root, rather than a looping shake.
   plant.velocity+=((Phaser.Math.Clamp(push,-11,11)-plant.bend)*70-plant.velocity*10)*dt;
   plant.bend+=plant.velocity*dt;
   const wind=Math.sin(t*.8+plant.x*.002)*.9+Math.sin(t*1.35+plant.phase)*.35;
   plant.image.setAngle(this.still?0:wind+plant.bend);
  }
  const travelled=this.lastStep?Math.hypot(player.position.x-this.lastStep.x,player.position.y-this.lastStep.y):0;
  if(!this.lastStep||travelled>32){
   if(brushing&&!this.still&&!player.isDead&&travelled>0&&travelled<100){const leaf=this.leaves[this.leafIndex++%6];leaf.x=player.position.x-8;leaf.y=player.position.y+39;leaf.born=now;leaf.image.setVisible(true).setDepth(player.position.y-1);}
   this.lastStep={...player.position};
  }
  this.previous.clear();for(const actor of actors)if(!actor.isDead)this.previous.set(actor,{...actor.position});
  for(const leaf of this.leaves){const age=(now-leaf.born)/800;if(age>=1){leaf.image.setVisible(false);continue;}leaf.image.setPosition(leaf.x+Math.sin(age*3+leaf.angle)*12,leaf.y-age*12-Math.sin(age*Math.PI)*5).setRotation(leaf.angle+age*1.5).setAlpha((1-age)*.62);}
 }
}
