import Phaser from 'phaser';
type Point={x:number;y:number};
/** Low physical pipework, with contact, rounded elbows and short metal collars.
 * One baked canvas per authored route; updates only change image visibility. */
export function pipeTexture(scene:Phaser.Scene,key:string,width:number,height:number,routes:readonly Point[][]):string{
 if(scene.textures.exists(key))return key;
 const t=scene.textures.createCanvas(key,width,height)!,g=t.context;
 g.lineCap='round';g.lineJoin='round';
 const stroke=(route:Point[],color:string,line:number,dx=0,dy=0)=>{g.strokeStyle=color;g.lineWidth=line;g.beginPath();route.forEach((p,i)=>i?g.lineTo(p.x+dx,p.y+dy):g.moveTo(p.x+dx,p.y+dy));g.stroke();};
 for(const route of routes){
  stroke(route,'#23302955',11,2,3);stroke(route,'#363e36',8);stroke(route,'#827b64',5);stroke(route,'#b4ad925c',1,-1,-1);
  let distance=0,next=20;
  for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i],length=Math.hypot(b.x-a.x,b.y-a.y);
   while(next<=distance+length){const f=(next-distance)/length,x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;g.save();g.translate(x,y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x));g.fillStyle='#414a43';g.fillRect(-3,-5,6,10);g.fillStyle='#a5a18b';g.fillRect(-2,-4,2,8);g.fillStyle='#242f29';g.fillRect(1,-4,1,8);g.restore();next+=44;}
   distance+=length;
  }
 }
 t.refresh();return key;
}
export function pressureTexture(scene:Phaser.Scene):string{
 const key='water-pressure-r1';if(scene.textures.exists(key))return key;
 const t=scene.textures.createCanvas(key,280,64)!,g=t.context;
 // Same telegraph/damage footprint as the original pressure stripe, with a
 // feathered wet surface and irregular spray instead of an opaque rectangle.
 g.save();g.translate(140,32);g.scale(1,.22);const fade=g.createRadialGradient(0,0,15,0,0,130);fade.addColorStop(0,'#b4e8dfb8');fade.addColorStop(.65,'#80b4b25a');fade.addColorStop(1,'#80b4b200');g.fillStyle=fade;g.fillRect(-140,-140,280,280);g.restore();
 for(let i=0;i<16;i++){g.strokeStyle=i%2?'#d6eee187':'#629b9d70';g.lineWidth=i%3?1:2;g.beginPath();g.ellipse(20+i*16,29+(i%3-1)*5,9+i%5,2,0,.1,2.7);g.stroke();}
 t.refresh();return key;
}
