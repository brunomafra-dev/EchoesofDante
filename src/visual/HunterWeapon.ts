import Phaser from 'phaser';
import { equipmentLook,type WeaponStyle,type EquipmentLook } from '../config/appearance';
import { registerPaintedArmFrames } from './PaintedArmFrames';
import type { KineticPose } from '../combat/KineticCharge';
import { hunterRiflePose, HUNTER_MUZZLE_DISTANCE } from './HunterRiflePose';

type Image = Phaser.GameObjects.Image;
type Part = { frame: number; width: number; height: number; axisY?: number };

// Painted arms follow both rifle grips. Gameplay hold/release is unchanged.
export class HunterWeapon {
  private readonly rifle: Image;
  private readonly sleeves: Image[];
  private readonly gloves: Image[];
  private readonly charge: Phaser.GameObjects.Graphics;
  private readonly barrel: Phaser.GameObjects.Ellipse;
  private readonly orders: Phaser.GameObjects.GameObject[][];
  private layer = -1;
  private style:WeaponStyle='starter';
  private sleeveKey='expedition-arm-kit';
  private gloveKey='expedition-arm-kit';
  private readonly axisY: number[];
  constructor(scene: Phaser.Scene, private rig: Phaser.GameObjects.Container, body: Image, torso:Phaser.GameObjects.Container) {
    registerPaintedArmFrames(scene);
    const texture = scene.textures.get('star-hunter-weapon-v2');
    const parts = scene.cache.json.get('star-hunter-weapon-v2-parts') as Part[];
    for (const part of parts) if (!texture.has(`part-${part.frame}`)) texture.add(`part-${part.frame}`, 0,
      part.frame % 2 * 256 + Math.floor((256 - part.width) / 2), Math.floor(part.frame / 2) * 256 + 16, part.width, part.height);
    this.axisY = parts.slice(0, 2).map(p => p.axisY ?? .4);
    const create = (frame: number) => scene.add.image(0, 0, 'star-hunter-weapon-v2', `part-${frame}`);
    this.sleeves = [create(2), create(3), create(2), create(3)];
    this.sleeves.forEach(p => p.setOrigin(0, .5));
    this.gloves = [create(4), create(5)];
    this.gloves.forEach(p => p.setOrigin(.65, .5).setDisplaySize(10, 10));
    this.rifle = create(0);
    this.charge = scene.add.graphics();
    this.barrel = scene.add.ellipse(0, 0, 8, 8, 0x5fe6d8).setVisible(false);
    rig.add([...this.sleeves, this.rifle, ...this.gloves, this.barrel, this.charge]);
    const [upper, fore, otherUpper, otherFore] = this.sleeves;
    this.setProtection(equipmentLook());
    this.orders = [
      [body, torso, otherUpper, otherFore, upper, fore, this.rifle, ...this.gloves, this.barrel, this.charge],
      [otherUpper, otherFore, upper, fore, this.rifle, ...this.gloves, body, torso, this.barrel, this.charge],
      [otherUpper, otherFore, body, torso, upper, fore, this.rifle, ...this.gloves, this.barrel, this.charge],
    ];
  }
  setProtection(look:EquipmentLook):void {
    this.sleeveKey=look.torso==='none'?'expedition-arm-kit':look.torso==='reinforced'?'reinforced-arm-kit':'warrior-arm-kit';
    this.gloveKey=look.gloves==='none'?'expedition-arm-kit':look.gloves==='reinforced'?'reinforced-arm-kit':'warrior-arm-kit';
    this.sleeves.forEach((p,i)=>p.setTexture(this.sleeveKey,`anatomy-${i%2}`));
    this.gloves.forEach(p=>p.setTexture(this.gloveKey,'anatomy-2').setDisplaySize(7.5,9));
    this.layer=-1;
  }
  setEquipped(value:boolean):void {this.setStyle(value?'current':'starter');}
  setStyle(style:WeaponStyle):void {this.style=style;}
  update(aim: number, row: number, firing: boolean, heavy: Pick<KineticPose, 'phase' | 'level'>): void {
    const cos = Math.cos(aim), sin = Math.sin(aim), pose = hunterRiflePose(aim);
    if (row !== this.layer) {
      this.layer = row;
      const offset=row===1?3:0;
      this.sleeves.forEach((p,i)=>p.setFrame(`anatomy-${offset+i%2}`));
      this.gloves.forEach(p=>p.setFrame(`anatomy-${offset+2}`).setDisplaySize(7.5,9));
      for (const object of this.orders[row]) this.rig.bringToTop(object);
    }
    const back = row === 1, left = cos < 0;
    const axisY = this.axisY[back ? 1 : 0];
    const key=this.style==='starter'?'hunter-starter-weapon':this.style==='advanced'?'hunter-pilot-weapon':'star-hunter-weapon-v2';
    const current=this.style==='current';
    const axis=current?axisY:this.style==='starter'?34/128:.38;
    this.rifle.setTexture(key,current?`part-${back?1:0}`:undefined).setOrigin(.3, left ? 1-axis : axis)
      .setDisplaySize(60, 60 * this.rifle.frame.realHeight / this.rifle.frame.realWidth)
      .setPosition(pose.x, pose.y).setRotation(aim).setFlipX(current&&back).setFlipY(left);
    const grip = (along: number, across: number) => ({ x: pose.x + along * cos - across * sin, y: pose.y + along * sin + across * cos });
    const main = grip(-4, left ? -9 : 9), support = grip(16, left ? -7 : 7);
    const sx = row === 2 ? (left ? 10 : -10) : back ? 13 : -13;
    this.arm(this.sleeves[0], this.sleeves[1], sx, -37, main.x, main.y, back ? 1 : -1);
    this.arm(this.sleeves[2], this.sleeves[3], -sx, -36, support.x, support.y, back ? -1 : 1);
    this.gloves[0].setPosition(main.x, main.y).setRotation(aim).setFlipY(left);
    this.gloves[1].setPosition(support.x, support.y).setRotation(aim).setFlipY(left);
    const charging = heavy.phase === 'CHARGING', level = Phaser.Math.Clamp(heavy.level, 0, 1);
    this.barrel.setPosition(pose.muzzleX, pose.muzzleY).setVisible(charging || firing)
      .setDisplaySize(charging ? 5 + 9 * level : 10, charging ? 5 + 9 * level : 10)
      .setFillStyle(level >= .99 ? 0xeefff5 : 0x5fe6d8, charging ? .4 + .6 * level : .8);
    if (charging) {
      this.charge.clear().setVisible(true);
      // Same ring/progress language as Warrior; one reused dynamic effect.
      this.charge.lineStyle(1, 0x5fe6d8, .24).strokeCircle(0, 0, 48);
      this.charge.lineStyle(4, level >= .99 ? 0xeefff5 : 0x5fe6d8, .8)
        .beginPath().arc(0, 0, 48, -Math.PI / 2, -Math.PI / 2 + level * Math.PI * 2, false).strokePath();
      this.charge.lineStyle(2, 0x5fe6d8, .6).lineBetween(pose.muzzleX, pose.muzzleY,
        pose.x + (HUNTER_MUZZLE_DISTANCE + 10 + 16 * level) * cos, pose.y + (HUNTER_MUZZLE_DISTANCE + 10 + 16 * level) * sin);
    } else if (this.charge.visible) this.charge.clear().setVisible(false);
  }
  private arm(upper: Image, fore: Image, sx: number, sy: number, wx: number, wy: number, side: number): void {
    const dx = wx - sx, dy = wy - sy, distance = Math.max(.001, Math.hypot(dx, dy));
    const length = Math.max(17, distance / 2 + .5), bend = Math.min(10, Math.sqrt(Math.max(0, length * length - distance * distance / 4)));
    const ex = sx + dx * .5 - dy / distance * bend * side, ey = sy + dy * .5 + dx / distance * bend * side;
    this.segment(upper, sx, sy, ex, ey, 11.5);
    this.segment(fore, ex, ey, wx, wy, 10);
  }
  private segment(image: Image, x: number, y: number, ex: number, ey: number, thickness: number): void {
    image.setPosition(x, y).setRotation(Math.atan2(ey - y, ex - x)).setDisplaySize(Math.hypot(ex - x, ey - y) + 2, thickness);
  }
}
