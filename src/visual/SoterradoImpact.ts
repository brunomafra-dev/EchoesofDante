import Phaser from 'phaser';
import { clamp, type Vec2 } from '../utils/math';

type Burst = { image: Phaser.GameObjects.Image; at: number; scale: number };

// Four fixed quads; two deterministic textures baked once per TextureManager.
// Their existing BossVisual transforms carry both impact and timing to visitors.
export class SoterradoImpact {
  private readonly bursts: Burst[];
  constructor(scene: Phaser.Scene) {
    for (const [key, color] of [['soterrado-crash-impact','#e6be7d'],['soterrado-ground-impact','#e99e61']] as const) {
      if (scene.textures.exists(key)) continue;
      const texture=scene.textures.createCanvas(key,256,256)!,ctx=texture.context;
      const haze=ctx.createRadialGradient(128,128,12,128,128,118);
      haze.addColorStop(0,'rgba(245,204,143,.8)');haze.addColorStop(.35,'rgba(186,130,76,.4)');haze.addColorStop(1,'rgba(186,130,76,0)');
      ctx.fillStyle=haze;ctx.fillRect(0,0,256,256);
      ctx.strokeStyle=color;ctx.lineWidth=4;
      for(let i=0;i<10;i++) {
        const a=i*Math.PI/5,r=75+(i%3)*12;
        ctx.beginPath();ctx.moveTo(128+Math.cos(a)*15,128+Math.sin(a)*15);
        ctx.lineTo(128+Math.cos(a+.13)*r*.55,128+Math.sin(a+.13)*r*.55);
        ctx.lineTo(128+Math.cos(a)*r,128+Math.sin(a)*r);ctx.stroke();
        ctx.fillStyle=color;ctx.fillRect(128+Math.cos(a)*102,128+Math.sin(a)*102,7+i%3,5);
      }
      texture.refresh();
    }
    this.bursts=Array.from({length:4},(_,i)=>({at:-Infinity,scale:1,image:scene.add.image(0,0,i===0?'soterrado-crash-impact':'soterrado-ground-impact').setVisible(false)}));
  }
  get coopObjects(): Phaser.GameObjects.Image[] { return this.bursts.map(b=>b.image); }
  show(now:number,point:Vec2,index=0,scale=1):void {
    const burst=this.bursts[index];burst.at=now;burst.scale=scale;
    burst.image.setPosition(point.x,point.y).setDepth(point.y+1).setVisible(true).setAlpha(1);
  }
  update(now:number):void {
    for(const burst of this.bursts) {
      const t=clamp((now-burst.at)/650,0,1);
      burst.image.setVisible(t<1).setDisplaySize((100+125*t)*burst.scale,(80+100*t)*burst.scale).setAlpha((1-t)*.9);
    }
  }
  clear():void { for(const burst of this.bursts){burst.at=-Infinity;burst.image.setVisible(false);} }
}
