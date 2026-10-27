import Phaser from 'phaser';
import { VESPER as B } from '../config/glacier';
import { PLAYER } from '../config/game';
import { inMeleeArc } from '../combat/HitDetection';
import { distance, type Vec2 } from '../utils/math';
import type { Obstacle } from '../systems/Movement';

type Patch = { x:number; y:number; active:boolean; until:number; brokenAt:number; image:Phaser.GameObjects.Image };
type Impact = { at:number; size:number; image:Phaser.GameObjects.Image };

// Thin floor crust is a contact hazard, never a solid wall. Six floor quads and
// four impact quads are reused; their textures are baked only once per manager.
export class VesperFrost {
  readonly patches:Patch[];
  readonly impacts:Impact[];
  constructor(scene:Phaser.Scene) {
    this.bake(scene);
    this.patches=Array.from({length:B.frost.count},()=>({x:0,y:0,active:false,until:0,brokenAt:-Infinity,image:scene.add.image(0,0,'vesper-frost-crust').setVisible(false)}));
    this.impacts=Array.from({length:4},(_,i)=>({at:-Infinity,size:1,image:scene.add.image(0,0,i===0?'vesper-tail-impact':'vesper-ground-impact').setVisible(false)}));
  }
  get coopObjects():Phaser.GameObjects.Image[]{return [...this.patches.map(p=>p.image),...this.impacts.map(p=>p.image)];}
  deposit(now:number,origin:Vec2,angle:number,obstacles:readonly Obstacle[]):void {
    this.patches.forEach((patch,i)=>{
      const forward=160+Math.floor(i/2)*130,side=(i%2?1:-1)*forward*.18;
      const x=origin.x+Math.cos(angle)*forward-Math.sin(angle)*side,y=origin.y+Math.sin(angle)*forward+Math.cos(angle)*side,r=B.frost.radius;
      const safe=x-r>=B.bounds.left&&x+r<=B.bounds.right&&y-r>=B.bounds.top&&y+r<=B.bounds.bottom&&obstacles.every(o=>distance({x,y},o)>o.radius+r*.6);
      Object.assign(patch,{x,y,active:safe,until:now+B.frost.lifetime,brokenAt:-Infinity});
    });
  }
  covers(point:Vec2):boolean {return this.patches.some(p=>p.active&&distance(p,point)<B.frost.radius+PLAYER.radius);}
  shatter(now:number,origin:Vec2,angle:number):number {
    let count=0;
    for(const patch of this.patches)if(patch.active&&inMeleeArc(origin,angle,patch,B.tail.range,B.tail.halfAngle,B.frost.radius)){
      patch.active=false;patch.brokenAt=now;count++;
    }
    return count;
  }
  impact(now:number,point:Vec2,index:number,angle=0):void {
    const impact=this.impacts[index];impact.at=now;impact.size=index===0?B.tail.range*2:210;
    impact.image.setPosition(point.x,point.y).setDepth(point.y+1).setRotation(angle);
  }
  update(now:number):void {
    for(const patch of this.patches){
      if(now>=patch.until)patch.active=false;
      const age=now-patch.brokenAt,shards=!patch.active&&age>=0&&age<650;
      patch.image.setVisible(patch.active||shards).setTexture(shards?'vesper-frost-shatter':'vesper-frost-crust')
        .setPosition(patch.x,patch.y).setRotation((patch.x*.017+patch.y*.013)%6.28).setDepth(shards?patch.y+2:-8500)
        .setDisplaySize(B.frost.radius*2*(shards?1+age/900:1),B.frost.radius*2*(shards?1+age/900:1))
        .setAlpha(shards?1-age/650:Math.min(.84,Math.max(0,(patch.until-now)/600)));
    }
    for(const impact of this.impacts){const t=(now-impact.at)/480;impact.image.setVisible(t>=0&&t<1).setDisplaySize(impact.size,impact.size).setAlpha(Math.max(0,1-t));}
  }
  clear():void {for(const p of this.patches){p.active=false;p.until=0;p.brokenAt=-Infinity;p.image.setVisible(false);}for(const p of this.impacts){p.at=-Infinity;p.image.setVisible(false);}}
  private bake(scene:Phaser.Scene):void {
    for(const key of ['vesper-frost-crust','vesper-frost-shatter','vesper-tail-impact','vesper-ground-impact','vesper-breath-mist']){
      if(scene.textures.exists(key))continue;
      const texture=scene.textures.createCanvas(key,256,256)!,ctx=texture.context;
      if(key==='vesper-breath-mist'){
        const g=ctx.createRadialGradient(128,128,5,128,128,120);g.addColorStop(0,'rgba(220,246,255,.8)');g.addColorStop(.45,'rgba(117,200,231,.38)');g.addColorStop(1,'rgba(93,164,210,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
      }else if(key==='vesper-tail-impact'){
        ctx.strokeStyle='rgba(236,250,255,.55)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(128,128,116,-B.tail.halfAngle,B.tail.halfAngle);ctx.stroke();
        ctx.strokeStyle='rgba(112,198,225,.25)';ctx.lineWidth=17;ctx.beginPath();ctx.arc(128,128,107,-B.tail.halfAngle,B.tail.halfAngle);ctx.stroke();
      }else{
        const shards=key==='vesper-frost-shatter',ground=key==='vesper-ground-impact';
        // Irregular thin material, sampled from the existing painted floor.
        // Fractures start on different edges; no radial snowflake/grid motif.
        let seed=7319;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
        ctx.save();ctx.beginPath();for(let i=0;i<36;i++){const a=i*Math.PI/18,r=103+random()*20,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.clip();
        const source=scene.textures.get('glacier-ground').getSourceImage() as HTMLImageElement;
        ctx.globalAlpha=.85;ctx.drawImage(source,0,0,source.width,source.height,0,0,256,256);ctx.globalAlpha=1;
        const glow=ctx.createRadialGradient(119,133,12,128,128,126);glow.addColorStop(0,shards?'rgba(189,166,236,.48)':'rgba(28,80,111,.45)');glow.addColorStop(.7,shards?'rgba(205,223,255,.23)':'rgba(37,86,118,.4)');glow.addColorStop(1,'rgba(164,219,240,.1)');ctx.fillStyle=glow;ctx.fillRect(0,0,256,256);
        ctx.strokeStyle=shards?'rgba(244,239,255,.82)':'rgba(199,234,247,.68)';ctx.lineCap='round';
        for(let i=0;i<9;i++){
          const a=random()*Math.PI*2;let x=128+Math.cos(a)*120,y=128+Math.sin(a)*120;ctx.lineWidth=.8+random()*1.6;ctx.beginPath();ctx.moveTo(x,y);
          for(let j=0;j<4;j++){x+=(128-x)*.34+(random()-.5)*55;y+=(128-y)*.34+(random()-.5)*55;ctx.lineTo(x,y);}ctx.stroke();
          ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*70,y+(random()-.5)*70);ctx.stroke();
        }
        if(shards||ground)for(let i=0;i<26;i++){const a=random()*6.28,r=30+random()*100,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;ctx.fillStyle='rgba(228,244,255,.8)';ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x+3,y+4);ctx.lineTo(x-4,y+2);ctx.closePath();ctx.fill();}
        ctx.restore();
      }
      texture.refresh();
    }
  }
}
