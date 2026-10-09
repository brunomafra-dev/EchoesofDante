import Phaser from 'phaser';
import type { PlayableClass } from '../config/classes';
import { equipmentLook, type EquipmentLook, type CharacterSex } from '../config/appearance';

type Direction='front'|'back'|'side';
export function preloadModularArt(scene:Phaser.Scene):void {
  for(const c of ['warrior','hunter']) {
    for(const d of ['front','back','side']) {
      const key=`${c}-pilot-torso-${d}`;
      if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);
    }
    const key=`${c}-pilot-weapon`;
    if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);
    for(const sex of ['male','female'])for(const d of c==='warrior'?['front','back','side']:['all'])
      for(const style of ['basic','reinforced'])for(const part of ['helmet','torso','legs','boots']) {
        const key=`${c}-${sex}-${style}-${part}-${d}`;
        if(!scene.textures.exists(key))scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`,{frameWidth:128,frameHeight:128});
      }
  }
  for(const key of ['expedition-arm-kit','reinforced-arm-kit'])if(!scene.textures.exists(key))scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`,{frameWidth:128,frameHeight:128});
}
// Registered full-frame pieces follow the actual body pose. Presentation only.
export class ModularTorso {
  readonly image:Phaser.GameObjects.Container;
  readonly layers:Record<string,Phaser.GameObjects.Image>={};
  look:EquipmentLook=equipmentLook();
  constructor(scene:Phaser.Scene,rig:Phaser.GameObjects.Container,private classId:PlayableClass,private sex:CharacterSex,private body:Phaser.GameObjects.Image){
    this.image=scene.add.container(0,0).setVisible(false);rig.add(this.image);
    for(const part of ['boots','legs','torso','helmet']){
      const layer=scene.add.image(0,0,`${classId}-${sex}-basic-${part}-${classId==='warrior'?'front':'all'}`).setVisible(false);
      this.layers[part]=layer;this.image.add(layer);
    }
  }
  setEquipped(value:boolean, reinforced=false):void {
    this.setLook({...equipmentLook(),torso:value?(reinforced?'reinforced':'basic'):'none'});
  }
  setLook(look:EquipmentLook):void {this.look={...look};for(const [part,layer]of Object.entries(this.layers))layer.setVisible(look[part as keyof EquipmentLook]!=='none');this.image.setVisible(Object.values(look).some(v=>v!=='none'));}
  update(direction:Direction,_flip:boolean,_shoulderY:number):void {
    if(!this.image.visible)return;
    for(const [part,layer] of Object.entries(this.layers)){
      const style=this.look[part as keyof EquipmentLook];layer.setVisible(style!=='none');if(style==='none')continue;
      const key=`${this.classId}-${this.sex}-${style}-${part}-${this.classId==='warrior'?direction:'all'}`;
      layer.setTexture(key,this.body.frame.name).setDisplaySize(this.body.displayWidth,this.body.displayHeight)
        .setPosition(this.body.x,this.body.y).setFlipX(this.body.flipX);
    }
  }
}
