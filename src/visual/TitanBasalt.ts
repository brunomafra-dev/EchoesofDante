import Phaser from 'phaser';
import { TITAN as B } from '../config/caldera';
import { distance,type Vec2 } from '../utils/math';
import type { Obstacle } from '../systems/Movement';

type Cover={x:number;y:number;active:boolean;shielded:boolean;brokenAt:number;view:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Graphics};
// Three physical shelters and four impact quads. Wave arcs change only when a
// shelter intercepts the front; expanding the cached geometry uses transforms.
export class TitanBasalt {
 readonly covers:Cover[];
 readonly wave:Phaser.GameObjects.Graphics;
 private impacts:{at:number;size:number;view:Phaser.GameObjects.Image}[];
 constructor(private scene:Phaser.Scene){
  this.bake();
  this.covers=Array.from({length:3},()=>({x:0,y:0,active:false,shielded:false,brokenAt:-Infinity,view:scene.add.image(0,0,'titan-basalt-cover').setOrigin(.5,.55).setVisible(false),shadow:scene.add.graphics().setVisible(false)}));
  this.impacts=Array.from({length:4},()=>({at:-Infinity,size:1,view:scene.add.image(0,0,'titan-ground-impact').setVisible(false)}));
  this.wave=scene.add.graphics().setDepth(-30).setVisible(false);
 }
 get objects():Phaser.GameObjects.GameObject[]{return[this.wave,...this.covers.flatMap(c=>[c.shadow,c.view]),...this.impacts.map(i=>i.view)];}
 get solids():Obstacle[]{return this.covers.filter(c=>c.active).map(c=>({x:c.x,y:c.y,radius:B.cover.radius}));}
 land(index:number,point:Vec2,now:number):void{Object.assign(this.covers[index],{x:point.x,y:point.y,active:true,shielded:false,brokenAt:-Infinity});this.impact(index+1,point,now,190);}
 impact(index:number,point:Vec2,now:number,size=250):void{const i=this.impacts[index];i.at=now;i.size=size;i.view.setPosition(point.x,point.y).setDepth(point.y+1);}
 beginWave(origin:Vec2):void{
  this.wave.setPosition(origin.x,origin.y);this.covers.forEach(c=>{c.shielded=false;c.shadow.clear().setVisible(false);});this.drawWave(origin);
 }
 advanceWave(origin:Vec2,radius:number,now:number):boolean{
  let intercepted=false;
  for(const c of this.covers)if(c.active&&distance(origin,c)-B.cover.radius<=radius){
   c.active=false;c.shielded=true;c.brokenAt=now;intercepted=true;this.impact(this.covers.indexOf(c)+1,c,now,170);
   const a=Math.atan2(c.y-origin.y,c.x-origin.x),half=Math.asin(Math.min(1,B.cover.radius/distance(origin,c)));
   const g=c.shadow.clear().setPosition(origin.x,origin.y).setDepth(-40).setVisible(true).fillStyle(0x15212b,.18);
   g.beginPath().moveTo(c.x-origin.x,c.y-origin.y).lineTo(Math.cos(a-half)*B.slam.waveEnd,Math.sin(a-half)*B.slam.waveEnd).arc(0,0,B.slam.waveEnd,a-half,a+half,false).closePath().fillPath();
  }
  if(intercepted)this.drawWave(origin);
  this.wave.setVisible(true).setScale(radius/256);return intercepted;
 }
 shelters(origin:Vec2,point:Vec2):boolean{
  const dx=point.x-origin.x,dy=point.y-origin.y,len2=dx*dx+dy*dy;
  return len2>0&&this.covers.some(c=>{if(!c.shielded)return false;const t=((c.x-origin.x)*dx+(c.y-origin.y)*dy)/len2;return t>0&&t<1&&distance(c,{x:origin.x+dx*t,y:origin.y+dy*t})<=B.cover.radius;});
 }
 endWave():void{this.wave.setVisible(false);this.covers.forEach(c=>c.shadow.setVisible(false));}
 update(now:number):void{
  for(const c of this.covers){const age=now-c.brokenAt,shards=!c.active&&age>=0&&age<850;c.view.setVisible(c.active||shards).setTexture(shards?'titan-basalt-shards':'titan-basalt-cover').setPosition(c.x,c.y).setDepth(c.y-1).setDisplaySize(110,140).setAlpha(shards?1-age/850:1);}
  for(const i of this.impacts){const t=(now-i.at)/520;i.view.setVisible(t>=0&&t<1).setDisplaySize(i.size*(1+Math.max(0,t)*.15),i.size*(1+Math.max(0,t)*.15)).setAlpha(Math.max(0,1-t));}
 }
 clear():void{this.endWave();this.covers.forEach(c=>{c.active=false;c.shielded=false;c.brokenAt=-Infinity;c.view.setVisible(false);});this.impacts.forEach(i=>{i.at=-Infinity;i.view.setVisible(false);});}
 private drawWave(origin:Vec2):void{
  const tau=Math.PI*2,blocked:{lo:number;hi:number}[]=[];
  for(const c of this.covers.filter(c=>c.shielded)){const a=(Math.atan2(c.y-origin.y,c.x-origin.x)+tau)%tau,h=Math.asin(Math.min(1,B.cover.radius/distance(origin,c)));for(const shift of [-tau,0,tau]){const lo=Math.max(0,a-h+shift),hi=Math.min(tau,a+h+shift);if(hi>lo)blocked.push({lo,hi});}}
  blocked.sort((a,b)=>a.lo-b.lo);const g=this.wave.clear();let cursor=0;
  const arc=(lo:number,hi:number)=>{for(const [width,color,alpha]of [[18,0xf46e35,.12],[8,0xff9b4f,.6],[2,0xffe2a3,.95]])g.lineStyle(width,color,alpha).beginPath().arc(0,0,256,lo,hi,false).strokePath();};
  for(const b of blocked){if(b.lo>cursor)arc(cursor,b.lo);cursor=Math.max(cursor,b.hi);}
  if(cursor<tau)arc(cursor,tau);
 }
 private bake():void{
  for(const key of ['titan-basalt-cover','titan-basalt-shards','titan-ground-impact']){
   if(this.scene.textures.exists(key))continue;const t=this.scene.textures.createCanvas(key,256,256)!,c=t.context;
   if(key==='titan-ground-impact'){const g=c.createRadialGradient(128,128,12,128,128,124);g.addColorStop(0,'rgba(255,237,162,.65)');g.addColorStop(.5,'rgba(250,111,44,.3)');g.addColorStop(1,'rgba(230,68,30,0)');c.fillStyle=g;c.fillRect(0,0,256,256);c.strokeStyle='rgba(255,199,103,.7)';c.lineWidth=4;c.beginPath();c.arc(128,128,104,0,Math.PI*2);c.stroke();}
   else {const source=this.scene.textures.get('world-rock').getSourceImage() as HTMLImageElement;c.drawImage(source,144,157,224,186,12,key.endsWith('shards')?110:20,232,key.endsWith('shards')?100:185);c.globalCompositeOperation='source-atop';c.fillStyle='rgba(23,34,42,.4)';c.fillRect(0,0,256,256);c.strokeStyle='rgba(255,170,78,.75)';c.lineWidth=3;for(let i=0;i<5;i++){c.beginPath();c.moveTo(40+i*37,180);c.lineTo(64+i*33,143-i*6);c.lineTo(54+i*36,126-i*9);c.stroke();}c.globalCompositeOperation='source-over';}
   t.refresh();
  }
 }
}
