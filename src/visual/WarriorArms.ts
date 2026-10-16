import Phaser from 'phaser';
import { registerPaintedArmFrames } from './PaintedArmFrames';
import { equipmentLook,type EquipmentLook } from '../config/appearance';
import {clothShoulder} from './ClothShoulders';
import { heldArm, newArm, paintedSegment, paintedHand, warriorHand } from './HumanPose';
import type { PaintedArmPart } from './PaintedArmFrames';

type Image = Phaser.GameObjects.Image;
type Layer = 'front' | 'back' | 'side';

// Visual articulation only. Both wrists follow the existing weapon grips;
// shoulder projection and paint/layer selection account for the body view.
export class WarriorArms {
  private readonly mainUpper: Image;
  private readonly mainGlove: Image;
  private layer?: Layer;
  private readonly orders: Record<Layer, Phaser.GameObjects.GameObject[]>;
  private shoulderY = -30;
  private mainX = -15;
  private supportX = 15;
  private supportY = -30;
  private facing = 0;
  private readonly pose=newArm();
  private readonly handPoint={x:0,y:0};
  private readonly armParts:Record<string,PaintedArmPart[]>;
  private cloth=true;
  private readonly mainShoulder={x:0,y:0};
  private readonly otherShoulder={x:0,y:0};
  private readonly clothOrders:Record<Layer,Phaser.GameObjects.GameObject[]>;

  constructor(scene: Phaser.Scene, private readonly rig: Phaser.GameObjects.Container,
    private readonly body: Image, private readonly mainFore: Image, private readonly supportUpper: Image,
    private readonly supportFore: Image, private readonly hand: Phaser.GameObjects.Container,
    private readonly supportGlove: Image, hurt: Phaser.GameObjects.Graphics, torso: Phaser.GameObjects.Container) {
    registerPaintedArmFrames(scene);
    this.armParts=scene.cache.json.get('character-arm-registration');
    this.mainUpper = scene.add.image(0, 0, 'warrior-arm-kit', 0).setOrigin(0, 0.5);
    for (const image of [mainFore, supportUpper, supportFore]) image.setTexture('warrior-arm-kit');
    this.mainGlove = scene.add.image(0, 0, 'warrior-arm-kit', 2).setOrigin(0.65, 0.5).setDisplaySize(8, 10);
    supportGlove.setOrigin(0.65, 0.5).setDisplaySize(7.5, 9);
    hand.add(this.mainGlove); rig.add(this.mainUpper);
    this.setProtection(equipmentLook());
    this.orders = {
      front: [body, torso, supportUpper, this.mainUpper, supportFore, mainFore, hand, supportGlove, hurt],
      back: [supportUpper, supportFore, this.mainUpper, mainFore, hand, supportGlove, body, torso, hurt],
      side: [supportUpper, supportFore, body, torso, this.mainUpper, mainFore, hand, supportGlove, hurt],
    };
    this.clothOrders={
      front:this.orders.front,
      back:this.orders.back,
      side:this.orders.side,
    };
  }

  setProtection(look:EquipmentLook):void {
    this.cloth=look.torso==='none';
    const sleeve=look.torso==='none'?'expedition-arm-kit':look.torso==='reinforced'?'reinforced-arm-kit':'warrior-arm-kit';
    const glove=look.gloves==='none'?'expedition-arm-kit':look.gloves==='reinforced'?'reinforced-arm-kit':'warrior-arm-kit';
    const outer=this.layer==='back'?3:0;
    this.mainUpper.setTexture(sleeve,`anatomy-${outer}`);this.supportUpper.setTexture(sleeve,`anatomy-${outer}`);
    this.mainFore.setTexture(sleeve,`anatomy-${outer+1}`);this.supportFore.setTexture(sleeve,`anatomy-${outer+1}`);
    this.mainGlove.setTexture(glove,`anatomy-${outer+2}`).setDisplaySize(8,10);this.supportGlove.setTexture(glove,`anatomy-${outer+2}`).setDisplaySize(7.5,9);
    this.layer=undefined;
  }
  prepare(aim: number, shoulderY: number, reach: number, sweep: number): void {
    const x = Math.cos(aim), y = Math.sin(aim);
    const vertical = Math.abs(y) > Math.abs(x);
    const layer: Layer = vertical ? (y < 0 ? 'back' : 'front') : 'side';
    this.facing = aim;
    this.shoulderY = shoulderY;
    if (layer === 'front') { this.mainX = -15; this.supportX = 15; this.supportY = shoulderY; }
    else if (layer === 'back') { this.mainX = 15; this.supportX = -15; this.supportY = shoulderY; }
    else { this.mainX = x > 0 ? -13 : 13; this.supportX = x > 0 ? 10 : -10; this.supportY = shoulderY - 2; }
    // Foreshortened forward reach and a right-handed offset replace the old
    // fixed +32px sideways hold used even when looking away from the camera.
    warriorHand(aim,shoulderY,reach,sweep,this.handPoint);
    this.hand.setPosition(this.handPoint.x,this.handPoint.y);
    {
      clothShoulder(this.body,layer==='back'?'right':'left',this.mainShoulder);
      clothShoulder(this.body,layer==='back'?'left':'right',this.otherShoulder);
      this.mainX=this.mainShoulder.x;this.shoulderY=this.mainShoulder.y;
      this.supportX=this.otherShoulder.x;this.supportY=this.otherShoulder.y;
    }
    if (this.layer !== layer) {
      this.layer = layer;
      const outer = layer === 'back';
      this.mainUpper.setFrame(outer ? 'anatomy-3' : 'anatomy-0'); this.supportUpper.setFrame(outer ? 'anatomy-3' : 'anatomy-0');
      this.mainFore.setFrame(outer ? 'anatomy-4' : 'anatomy-1'); this.supportFore.setFrame(outer ? 'anatomy-4' : 'anatomy-1');
      this.mainGlove.setFrame(outer ? 'anatomy-5' : 'anatomy-2'); this.supportGlove.setFrame(outer ? 'anatomy-5' : 'anatomy-2');
      // Change draw order only on a view change, never allocate per-frame lists.
      for (const item of (this.cloth?this.clothOrders:this.orders)[layer]) this.rig.bringToTop(item);
    }
  }

  update(supportGripX: number, supportGripY: number, weaponRotation: number): void {
    const wristX = Math.cos(weaponRotation) * 5.5;
    const wristY = Math.sin(weaponRotation) * 5.5;
    this.glove(this.mainGlove,-wristX,-wristY,weaponRotation);
    this.glove(this.supportGlove,supportGripX-wristX,supportGripY-wristY,weaponRotation);
    this.arm(this.mainUpper, this.mainFore, this.mainX, this.shoulderY,
      this.hand.x - wristX, this.hand.y - wristY, -1);
    this.arm(this.supportUpper, this.supportFore, this.supportX, this.supportY,
      supportGripX - wristX, supportGripY - wristY, 1);
  }

  private arm(upper: Image, fore: Image, sx: number, sy: number, wx: number, wy: number, side: number): void {
    // Two joints with a stable anatomical bend, not one sleeve stretched from
    // shoulder to hand. Long reach stretches conservatively during a strike.
    const elbowSide = -side * (Math.sin(this.facing) < -0.2 ? -1 : 1);
    heldArm(sx,sy,wx,wy,elbowSide,18,12,this.pose);
    this.segment(upper,this.pose.shoulder,this.pose.elbow);
    this.segment(fore,this.pose.elbow,this.pose.wrist);
  }

  private segment(image:Image,a:{x:number;y:number},b:{x:number;y:number}):void {
    const p=this.armParts[image.texture.key][Number(String(image.frame.name).slice(-1))],t=paintedSegment(p,a,b);
    image.setOrigin(p.root.x/p.width,p.root.y/p.height).setPosition(a.x,a.y).setRotation(t.angle).setScale(t.scale);
  }
  private glove(image:Image,x:number,y:number,angle:number):void{
    const p=this.armParts[image.texture.key][Number(String(image.frame.name).slice(-1))],t=paintedHand(p,angle);
    image.setOrigin(p.root.x/p.width,p.root.y/p.height).setPosition(x,y).setRotation(t.angle).setScale(t.scale);
  }
}
