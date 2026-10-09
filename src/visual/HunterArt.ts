import Phaser from 'phaser';
import type { KineticPose } from '../combat/KineticCharge';
import { hunterBody, weaponStyle, type WeaponStyle, type EquipmentLook, type CharacterSex } from '../config/appearance';
import { ModularTorso } from './ModularTorso';
import type { EquipmentSnapshot } from '../config/equipment';
import { HunterWeapon } from './HunterWeapon';

export function preloadHunterArt(scene: Phaser.Scene): void {
  for (const key of ['star-hunter-body-v2', 'star-hunter-male-body', hunterBody('male'),hunterBody('female'), 'star-hunter-weapon-v2']) {
    if (!scene.textures.exists(key)) scene.load.spritesheet(key,
      `${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`, { frameWidth: 256, frameHeight: 256 });
  }
  if (!scene.cache.json.exists('star-hunter-weapon-v2-parts')) scene.load.json('star-hunter-weapon-v2-parts',
    `${import.meta.env.BASE_URL}assets/visual/characters/star-hunter-weapon-v2.json`);
}

// Whole painted legs without synthetic knee cuts. Real displacement drives gait;
// the independently articulated rifle remains free to aim while walking.
export class HunterArt {
  private readonly body: Phaser.GameObjects.Image;
  private readonly weapon: HunterWeapon;
  private readonly torso: ModularTorso;
  private travel = 0;
  private previous: { x: number; y: number };
  constructor(scene: Phaser.Scene, private view: Phaser.GameObjects.Container, x: number, y: number, sex: CharacterSex = 'female') {
    view.list.forEach(part => (part as unknown as Phaser.GameObjects.Components.Visible).setVisible(false));
    this.body = scene.add.image(0, -19, hunterBody(sex), 0).setDisplaySize(128, 128);
    view.add(this.body);
    this.torso = new ModularTorso(scene,view,'hunter',sex,this.body);
    this.weapon = new HunterWeapon(scene, view, this.body,this.torso.image);
    this.previous = { x, y };
    this.update(x, y, 0, false);
  }
  setEquipment(slots:EquipmentSnapshot['slots']):void { this.torso.setEquipped(!!slots.armor,!!slots.armor&&!slots.armor.startsWith('forest'));this.weapon.setProtection(this.torso.look);this.weapon.setStyle(weaponStyle(slots.weapon)); }
  setWeaponLook(style:WeaponStyle):void {this.weapon.setStyle(style);}
  setEquipmentLook(look:EquipmentLook):void {this.torso.setLook(look);this.weapon.setProtection(look);}
  update(x: number, y: number, aim: number, firing: boolean, dashing = false,
    heavy: Pick<KineticPose, 'phase' | 'level'> = { phase: 'READY', level: 0 }): void {
    const dx = x - this.previous.x, dy = y - this.previous.y, moved = Math.hypot(dx, dy);
    this.previous.x = x; this.previous.y = y;
    const walking = moved > .05 && moved < 30 && !dashing;
    if (walking) this.travel += moved;
    const vx = Math.cos(aim), vy = Math.sin(aim), vertical = Math.abs(vy) > Math.abs(vx);
    const row = vertical ? vy > 0 ? 0 : 1 : 2, flip = !vertical && vx < 0;
    const backwards = dx * vx + dy * vy < -.05;
    const phase = ((this.travel / 104 * (backwards ? -1 : 1)) % 1 + 1) % 1;
    const frame = walking ? [1, 0, 2, 0][Math.floor(phase * 4)] : 0;
    this.view.setRotation(0);
    this.body.setFrame(row * 4 + frame).setFlipX(flip);
    this.torso.update(row===0?'front':row===1?'back':'side',flip,-37);
    this.weapon.update(aim, row, firing, heavy);
  }
}
