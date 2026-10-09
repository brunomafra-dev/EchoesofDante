import Phaser from 'phaser';
import type { PlayableClass } from '../config/classes';
import type { CharacterSex } from '../config/appearance';

type Direction='front'|'back'|'side';
export function preloadModularArt(scene:Phaser.Scene):void {
  for(const c of ['warrior','hunter']) {
    for(const d of ['front','back','side']) {
      const key=`${c}-pilot-torso-${d}`;
      if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);
    }
    const key=`${c}-pilot-weapon`;
    if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);
  }
}
// A single reusable painted layer, sorted with the body and its articulated arms.
// Equipment stats remain in Equipment; this class only selects presentation.
export class ModularTorso {
  readonly image:Phaser.GameObjects.Image;
  private equipped=false;
  constructor(scene:Phaser.Scene,rig:Phaser.GameObjects.Container,private classId:PlayableClass,private sex:CharacterSex){
    this.image=scene.add.image(0,0,`${classId}-pilot-torso-front`).setVisible(false);rig.add(this.image);
  }
  setEquipped(value:boolean):void{this.equipped=value;this.image.setVisible(value);}
  update(direction:Direction,flip:boolean,shoulderY:number):void{
    if(!this.equipped)return;
    const key=`${this.classId}-pilot-torso-${direction}`;
    if(this.image.texture.key!==key)this.image.setTexture(key);
    const width=direction==='side'?22:this.classId==='hunter'?30:36;
    const height=this.classId==='hunter'?32:34;
    const fit=this.sex==='female'?.94:1;
    this.image.setDisplaySize(width*fit,height).setPosition(0,shoulderY+height*.5-2).setFlipX(flip);
  }
}
