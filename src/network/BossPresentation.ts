import Phaser from 'phaser';
import type { BossDisplay } from '../ui/WardenHud';

// Presentation only. Combat, collision and clocks remain authoritative on the host.
export type BossVisual = {
  kind: 'image' | 'ellipse' | 'graphics'; x:number;y:number;width:number;height:number;
  rotation:number;depth:number;alpha:number;visible:boolean;originX:number;originY:number;
  texture?:string;frame?:string;flip?:boolean;tint?:number;fill?:number;fillAlpha?:number;
  tintFill?:boolean;blend?:number;stroke?:number;strokeAlpha?:number;lineWidth?:number;
  crop?:{x:number;y:number;width:number;height:number};commands?:number[];
};
export type BossPose = BossDisplay & { visuals:BossVisual[]; active:boolean };
export type NetworkBoss = BossDisplay & { coopObjects:Phaser.GameObjects.GameObject[] };

export function captureBoss(boss?:NetworkBoss):BossPose|undefined {
  if(!boss)return undefined;
  const visuals:BossVisual[]=[];
  for(const object of boss.coopObjects.slice(0,40)) {
    if(!(object instanceof Phaser.GameObjects.Image || object instanceof Phaser.GameObjects.Ellipse || object instanceof Phaser.GameObjects.Graphics))continue;
    const matrix=object.getWorldTransformMatrix(), scale=matrix.decomposeMatrix();
    const parent=object.parentContainer;
    const common={x:matrix.tx,y:matrix.ty,width:object instanceof Phaser.GameObjects.Graphics?scale.scaleX:object.width*Math.abs(scale.scaleX),
      height:object instanceof Phaser.GameObjects.Graphics?scale.scaleY:object.height*Math.abs(scale.scaleY),rotation:scale.rotation,
      depth:parent?.depth??object.depth,alpha:object.alpha*(parent?.alpha??1),visible:object.visible&&(parent?.visible??true),
      originX:'originX' in object?object.originX:0,originY:'originY' in object?object.originY:0,blend:typeof object.blendMode==='number'?object.blendMode:0};
    if(object instanceof Phaser.GameObjects.Image) {
      const crop=object.isCropped?(object as unknown as {_crop:{x:number;y:number;width:number;height:number}})._crop:undefined;
      visuals.push({...common,kind:'image',texture:object.texture.key,frame:String(object.frame.name),flip:object.flipX,tint:object.tintTopLeft,tintFill:object.tintFill,
        crop:crop?{x:crop.x,y:crop.y,width:crop.width,height:crop.height}:undefined});
    } else if(object instanceof Phaser.GameObjects.Ellipse)visuals.push({...common,kind:'ellipse',fill:object.fillColor,fillAlpha:object.fillAlpha,stroke:object.strokeColor,strokeAlpha:object.strokeAlpha,lineWidth:object.isStroked?object.lineWidth:0});
    else visuals.push({...common,kind:'graphics',commands:object.commandBuffer.slice(0,2048)});
  }
  return {state:boss.state,isDead:boss.isDead,phase:boss.phase,attackName:boss.attackName,
    health:{current:boss.health.current,max:boss.health.max},active:!boss.isDead&&boss.state!=='DORMANT',visuals};
}

// At most forty reused objects; Graphics are copied at snapshot cadence, never
// re-generated from AI. Static scenery continues using its existing bake.
export class BossMirror {
  private objects:(Phaser.GameObjects.Image|Phaser.GameObjects.Ellipse|Phaser.GameObjects.Graphics)[]=[];
  private kinds:string[]=[];
  constructor(private scene:Phaser.Scene){}
  render(pose?:BossPose):void {
    const visuals=pose?.visuals??[];
    this.objects.forEach((object,i)=>object.setVisible(i<visuals.length));
    visuals.slice(0,40).forEach((v,i)=>{
      let object=this.objects[i];
      if(!object||this.kinds[i]!==v.kind){object?.destroy();object=v.kind==='image'?this.scene.add.image(0,0,'__WHITE'):v.kind==='ellipse'?this.scene.add.ellipse(0,0,1,1):this.scene.add.graphics();this.objects[i]=object;this.kinds[i]=v.kind;}
      object.setPosition(v.x,v.y).setRotation(v.rotation).setDepth(v.depth).setAlpha(v.alpha).setVisible(v.visible).setBlendMode(v.blend??0);
      if(object instanceof Phaser.GameObjects.Image) {
        if(!v.texture||!this.scene.textures.exists(v.texture)){object.setVisible(false);return;}
        object.setTexture(v.texture,v.frame).setOrigin(v.originX,v.originY).setDisplaySize(v.width,v.height).setFlipX(v.flip??false).setTint(v.tint??0xffffff);
        if(v.tintFill)object.setTintFill(v.tint??0xffffff);
        if(v.crop)object.setCrop(v.crop.x,v.crop.y,v.crop.width,v.crop.height);else object.setCrop();
      } else if(object instanceof Phaser.GameObjects.Ellipse)object.setSize(v.width,v.height).setOrigin(v.originX,v.originY).setFillStyle(v.fill??0,v.fillAlpha??1).setStrokeStyle(v.lineWidth??0,v.stroke??0,v.strokeAlpha??1);
      else { object.commandBuffer=(v.commands??[]).filter(Number.isFinite).slice(0,2048);object.setScale(v.width,v.height); }
    });
  }
  destroy():void{this.objects.forEach(o=>o.destroy());this.objects=[];}
}
