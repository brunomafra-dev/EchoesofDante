import Phaser from 'phaser';
import catalog from './pixelfx198.json';
export type PixelEffect=keyof typeof catalog;
export function preloadPixelFX(scene:Phaser.Scene):void{
 for(const[name,m]of Object.entries(catalog))if(!scene.textures.exists('pixelfx-'+name))scene.load.spritesheet('pixelfx-'+name,`${import.meta.env.BASE_URL}assets/visual/pixelfx/${name}.png`,{frameWidth:m.width,frameHeight:m.height});
}
/** Shared raster frames, sampled from the existing authoritative event age. */
export function pixelEffect(image:Phaser.GameObjects.Image,key:PixelEffect,age:number,width:number,duration=catalog[key].duration):void{
 const m=catalog[key],frame=Math.min(m.frames-1,Math.max(0,Math.floor(age/Math.max(.001,duration)*m.frames)));
 image.setTexture('pixelfx-'+key,frame).setOrigin(m.origin[0],m.origin[1]).setDisplaySize(width,width*m.height/m.width);
}
/** Fixed presentation pool. Receives confirmed impacts; never calls damage. */
export class PixelImpacts{
 private pool:{image:Phaser.GameObjects.Image;at:number}[];
 private next=0;
 constructor(private scene:Phaser.Scene){
  this.pool=Array.from({length:12},()=>({at:-Infinity,image:scene.add.image(0,0,'pixelfx-hit-spark').setVisible(false).setDepth(15001)}));
  scene.events.on(Phaser.Scenes.Events.UPDATE,this.update,this);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,this.update,this));
 }
 hit(position:{x:number;y:number},color:number):void{const p=this.pool[this.next++%this.pool.length];p.at=this.scene.time.now;p.image.setPosition(position.x,position.y-10).setTint(color).setVisible(true);}
 private update(now:number):void{for(const p of this.pool){const age=(now-p.at)/1000;p.image.setVisible(age>=0&&age<.18);if(age>=0&&age<.18)pixelEffect(p.image,'hit-spark',age,58);}}
}
