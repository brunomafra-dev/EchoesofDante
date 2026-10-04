import Phaser from 'phaser';

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

  constructor(scene: Phaser.Scene, private readonly rig: Phaser.GameObjects.Container,
    body: Image, private readonly mainFore: Image, private readonly supportUpper: Image,
    private readonly supportFore: Image, private readonly hand: Phaser.GameObjects.Container,
    private readonly supportGlove: Image, hurt: Phaser.GameObjects.Graphics) {
    this.mainUpper = scene.add.image(0, 0, 'warrior-arm-kit', 0).setOrigin(0, 0.5);
    for (const image of [mainFore, supportUpper, supportFore]) image.setTexture('warrior-arm-kit');
    this.mainGlove = scene.add.image(0, 0, 'warrior-arm-kit', 2).setOrigin(0.65, 0.5).setDisplaySize(12, 14);
    supportGlove.setOrigin(0.65, 0.5).setDisplaySize(11, 13);
    hand.add(this.mainGlove); rig.add(this.mainUpper);
    this.orders = {
      front: [body, supportUpper, supportFore, this.mainUpper, mainFore, hand, supportGlove, hurt],
      back: [supportUpper, supportFore, this.mainUpper, mainFore, hand, supportGlove, body, hurt],
      side: [supportUpper, supportFore, body, this.mainUpper, mainFore, hand, supportGlove, hurt],
    };
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
    if (this.layer !== layer) {
      this.layer = layer;
      const outer = layer === 'back';
      this.mainUpper.setFrame(outer ? 3 : 0); this.supportUpper.setFrame(outer ? 3 : 0);
      this.mainFore.setFrame(outer ? 4 : 1); this.supportFore.setFrame(outer ? 4 : 1);
      this.mainGlove.setFrame(outer ? 5 : 2); this.supportGlove.setFrame(outer ? 5 : 2);
      // Change draw order only on a view change, never allocate per-frame lists.
      for (const item of this.orders[layer]) this.rig.bringToTop(item);
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
    this.segment(upper, sx, sy, ex, ey, 19);
    this.segment(fore, ex, ey, wx, wy, 17);
  }

  private segment(image: Image, x: number, y: number, endX: number, endY: number, thickness: number): void {
    const dx = endX - x, dy = endY - y;
    // The sheet has 60px of sleeve height inside a 128px transparent cell.
    image.setPosition(x, y).setRotation(Math.atan2(dy, dx))
      .setDisplaySize(Math.max(1, Math.hypot(dx, dy)) + 1, thickness);
  }
}
