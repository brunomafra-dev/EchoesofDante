import Phaser from 'phaser';
import { SOTERRADO } from '../config/soterrado';
import { clamp, type Vec2 } from '../utils/math';

type Hole = {
  base: Phaser.GameObjects.Image; lip: Phaser.GameObjects.Image;
  dust: Phaser.GameObjects.Image[]; x: number; y: number;
  starts: number; opensIn: number; bursts: number; settles: number; ends: number;
};

// Visuals only: two reusable holes, twelve dust quads, and no combat timers,
// obstacles, emitters, Graphics redraw or tween creation per dig.
export class SoterradoBurrow {
  private readonly holes: Hole[];
  constructor(scene: Phaser.Scene) {
    this.holes=Array.from({length:2},()=>({
      base:scene.add.image(0,0,'soterrado-burrow').setDisplaySize(244,136).setVisible(false),
      lip:scene.add.image(0,0,'soterrado-burrow-lip').setDisplaySize(244,136).setVisible(false),
      dust:Array.from({length:6},()=>scene.add.image(0,0,'soterrado-dust').setVisible(false)),
      x:0,y:0,starts:Infinity,opensIn:1,bursts:Infinity,settles:Infinity,ends:0,
    }));
  }

  intro(now:number,position:Vec2):void {
    this.clear();
    this.open(0,position,now,750,now+SOTERRADO.introMs*.42,now+SOTERRADO.introMs+600);
  }

  dig(now:number,source:Vec2,destination:Vec2):void {
    this.open(0,source,now,240,now+60,now+750);
    this.open(1,destination,now+SOTERRADO.burrow.tell*.46,600,now+SOTERRADO.burrow.tell,
      now+SOTERRADO.burrow.tell+SOTERRADO.burrow.execute+SOTERRADO.burrow.recover*.6);
  }

  private open(index:number,position:Vec2,starts:number,opensIn:number,bursts:number,settles:number):void {
    Object.assign(this.holes[index],{x:position.x,y:position.y,starts,opensIn,bursts,settles,ends:settles+700});
  }

  update(now:number):void {
    for(const hole of this.holes) {
      const visible=now>=hole.starts&&now<hole.ends;
      hole.base.setVisible(visible);hole.lip.setVisible(visible);
      if(!visible){hole.dust.forEach(p=>p.setVisible(false));continue;}
      const opening=clamp((now-hole.starts)/hole.opensIn,0,1);
      const smooth=opening*opening*(3-2*opening);
      const fade=1-clamp((now-hole.settles)/700,0,1);
      const shake=Math.sin((now-hole.starts)*.044)*(1-opening)*1.3;
      const width=244*(.55+.45*smooth),height=136*(.12+.88*smooth);
      hole.base.setPosition(hole.x+shake,hole.y-10).setDisplaySize(width,height).setAlpha(fade).setDepth(hole.y-2);
      hole.lip.setPosition(hole.x+shake,hole.y-10).setDisplaySize(width,height).setAlpha(fade).setDepth(hole.y+.1);
      for(let i=0;i<hole.dust.length;i++) {
        const t=(now-hole.bursts-i*24)/650,active=t>=0&&t<1;
        const puff=hole.dust[i];puff.setVisible(active);
        if(!active)continue;
        const angle=(i/hole.dust.length)*Math.PI*2;
        puff.setPosition(hole.x+Math.cos(angle)*(18+62*t),hole.y+Math.sin(angle)*15-36*Math.sin(t*Math.PI))
          .setDisplaySize(35+40*t,24+22*t).setAlpha(Math.sin(t*Math.PI)*.48*fade).setDepth(hole.y+1);
      }
    }
  }

  clear():void {
    for(const hole of this.holes){hole.ends=0;hole.base.setVisible(false);hole.lip.setVisible(false);hole.dust.forEach(p=>p.setVisible(false));}
  }
}
