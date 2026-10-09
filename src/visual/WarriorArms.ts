import Phaser from 'phaser';
import { registerPaintedArmFrames } from './PaintedArmFrames';
import { equipmentLook,type EquipmentLook } from '../config/appearance';
import {clothShoulder} from './ClothShoulders';

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
  private cloth=true;
  private readonly mainShoulder={x:0,y:0};
  private readonly otherShoulder={x:0,y:0};
  private readonly clothOrders:Record<Layer,Phaser.GameObjects.GameObject[]>;

  constructor(scene: Phaser.Scene, private readonly rig: Phaser.GameObjects.Container,
    private readonly body: Image, private readonly mainFore: Image, private readonly supportUpper: Image,
    private readonly supportFore: Image, private readonly hand: Phaser.GameObjects.Container,
    private readonly supportGlove: Image, hurt: Phaser.GameObjects.Graphics, torso: Phaser.GameObjects.Container) {
    registerPaintedArmFrames(scene);
    this.mainUpper = scene.add.image(0, 0, 'warrior-arm-kit', 0).setOrigin(0, 0.5);
    for (const image of [mainFore, supportUpper, supportFore]) image.setTexture('warrior-arm-kit');
    this.mainGlove = scene.add.image(0, 0, 'warrior-arm-kit', 2).setOrigin(0.65, 0.5).setDisplaySize(8, 10);
    supportGlove.setOrigin(0.65, 0.5).setDisplaySize(7.5, 9);
    hand.add(this.mainGlove); rig.add(this.mainUpper);
    this.setProtection(equipmentLook());
    this.orders = {
      front: [body, torso, supportUpper, supportFore, this.mainUpper, mainFore, hand, supportGlove, hurt],
      back: [supportUpper, supportFore, this.mainUpper, mainFore, hand, supportGlove, body, torso, hurt],
      side: [supportUpper, supportFore, body, torso, this.mainUpper, mainFore, hand, supportGlove, hurt],
    };
    this.clothOrders={
      front:[body,torso,supportUpper,this.mainUpper,supportFore,mainFore,hand,supportGlove,hurt],
      back:this.orders.back,
      side:[supportUpper,supportFore,body,torso,this.mainUpper,mainFore,hand,supportGlove,hurt],
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
    this.hand.setPosition(22 * x - 9 * y + x * reach - y * sweep,
      shoulderY + 13 + 12 * y + y * reach + x * sweep);
    if(this.cloth){
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
    this.mainGlove.setRotation(weaponRotation);
    this.supportGlove.setPosition(supportGripX, supportGripY).setRotation(weaponRotation);
    const wristX = Math.cos(weaponRotation) * 5.5;
    const wristY = Math.sin(weaponRotation) * 5.5;
    this.arm(this.mainUpper, this.mainFore, this.mainX, this.shoulderY,
      this.hand.x - wristX, this.hand.y - wristY, -1);
    this.arm(this.supportUpper, this.supportFore, this.supportX, this.supportY,
      supportGripX - wristX, supportGripY - wristY, 1);
  }

  private arm(upper: Image, fore: Image, sx: number, sy: number, wx: number, wy: number, side: number): void {
    const dx = wx - sx, dy = wy - sy;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    // Two joints with a stable anatomical bend, not one sleeve stretched from
    // shoulder to hand. Long reach stretches conservatively during a strike.
    const length = Math.max(18, distance / 2 + 0.5);
    const bend = Math.min(12, Math.sqrt(Math.max(0, length * length - distance * distance / 4)));
    const elbowSide = side * (Math.sin(this.facing) < -0.2 ? -1 : 1);
    const ex = sx + dx * 0.5 - dy / distance * bend * elbowSide;
    const ey = sy + dy * 0.5 + dx / distance * bend * elbowSide;
    this.segment(upper, sx, sy, ex, ey, 12.5,this.cloth?5:0);
    this.segment(fore, ex, ey, wx, wy, 10.5,this.cloth?2:0);
  }

  private segment(image: Image, x: number, y: number, endX: number, endY: number, thickness: number,overlap:number): void {
    const dx = endX - x, dy = endY - y;
    // Cropped anatomical frames make thickness refer to painted pixels.
    const width=Math.max(1,Math.hypot(dx,dy))+1+overlap;
    image.setOrigin(overlap/width,.5).setPosition(x, y).setRotation(Math.atan2(dy, dx))
      .setDisplaySize(width, thickness);
  }
}
