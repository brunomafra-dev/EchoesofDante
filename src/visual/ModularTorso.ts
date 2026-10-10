import Phaser from 'phaser';
import type { PlayableClass } from '../config/classes';
import { equipmentLook, type EquipmentLook, type CharacterSex } from '../config/appearance';

type Direction='front'|'back'|'side';
const DIRECTIONS:Direction[]=['front','back','side'];
const PARTS=['helmet','torso','legs','boots'] as const;
let serial=0;
export function preloadModularArt(scene:Phaser.Scene):void {
  for(const c of ['warrior','hunter']) {
    for(const sex of ['male','female'])for(const style of ['none','basic','reinforced']){
      const key=`wardrobe-${c}-${sex}-${style}`;
      if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);
    }
    for(const tier of ['starter','pilot']){
      const key=`${c}-${tier}-weapon`;
      if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);
    }
  }
  for(const key of ['expedition-arm-kit','reinforced-arm-kit'])if(!scene.textures.exists(key))scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`,{frameWidth:128,frameHeight:128});
  if(!scene.cache.json.exists('character-arm-registration'))scene.load.json('character-arm-registration',`${import.meta.env.BASE_URL}assets/visual/characters/character-arm-registration.json`);
  if(!scene.cache.json.exists('character-shoulder-registration'))scene.load.json('character-shoulder-registration',`${import.meta.env.BASE_URL}assets/visual/characters/character-shoulder-registration.json`);
}
// Bake selected painted clothing into one complete body atlas per actor.
// No transparent armor overlays, no per-frame painting, no cache growth on swaps.
export class ModularTorso {
  readonly image:Phaser.GameObjects.Container;
  look:EquipmentLook=equipmentLook();
  readonly keys:Record<Direction,string>;
  private readonly canvases:Phaser.Textures.CanvasTexture[]=[];
  private signature='';
  bakeCount=0;
  private readonly accessory:Phaser.GameObjects.Image;
  constructor(private scene:Phaser.Scene,rig:Phaser.GameObjects.Container,private classId:PlayableClass,private sex:CharacterSex,body:Phaser.GameObjects.Image){
    this.image=scene.add.container(0,0);rig.add(this.image);
    this.accessory=scene.add.image(-12,6,'item-accessory-1').setDisplaySize(10,10).setVisible(false);this.image.add(this.accessory);
    const id=++serial,prefix=`dressed-${classId}-${sex}-${id}`;
    this.keys={front:prefix+'-front',back:prefix+'-back',side:prefix+'-side'};
    for(let i=0;i<(classId==='warrior'?3:1);i++){
      const key=classId==='warrior'?this.keys[DIRECTIONS[i]]:prefix+'-all';
      const height=classId==='warrior'?256:768;
      const texture=scene.textures.createCanvas(key,1024,height)!;
      for(let f=0;f<height/256*4;f++)texture.add(f,0,f%4*256,Math.floor(f/4)*256,256,256);
      this.canvases.push(texture);
    }
    if(classId==='hunter')this.keys.front=this.keys.back=this.keys.side=this.canvases[0].key;
    body.setData('wardrobeKeys',this.keys);
    body.setData('clothShoulders',scene.cache.json.get('character-shoulder-registration')[`${classId}-${sex}`]);
    this.setLook(equipmentLook());
    body.setTexture(this.keys.front,0).setDisplaySize(128,128);
    // Remove only this actor's reusable atlases when its rig is destroyed.
    this.image.once(Phaser.GameObjects.Events.DESTROY,()=>{
      for(const texture of this.canvases)if(scene.textures.exists(texture.key))scene.textures.remove(texture.key);
    });
  }
  setAccessory(value:boolean):void {this.accessory.setVisible(value);this.image.setVisible(value||Object.values(this.look).some(v=>v!=='none'));}
  setEquipped(value:boolean, reinforced=false):void {
    this.setLook({...equipmentLook(),torso:value?(reinforced?'reinforced':'basic'):'none'});
  }
  setLook(look:EquipmentLook):void {
    this.look={...look};this.image.setVisible(Object.values(look).some(v=>v!=='none'));
    const signature=PARTS.map(p=>look[p]).join('/');if(signature===this.signature)return;
    this.signature=signature;
    const sources=Object.fromEntries(['none','basic','reinforced'].map(style=>[style,this.scene.textures.get(`wardrobe-${this.classId}-${this.sex}-${style}`).getSourceImage() as HTMLImageElement]));
    const splits=this.classId==='warrior'?[0,88,154,213,256]:[0,71,148,216,256];
    for(let i=0;i<this.canvases.length;i++){
      const texture=this.canvases[i],ctx=texture.context;ctx.clearRect(0,0,texture.width,texture.height);
      const firstRow=this.classId==='warrior'?i:0,rows=this.classId==='warrior'?1:3;
      for(let row=0;row<rows;row++)for(let p=0;p<PARTS.length;p++){
        const top=splits[p],height=splits[p+1]-top,source=sources[look[PARTS[p]]];
        // Replace the entire anatomical band. No unarmored body is drawn beneath it.
        ctx.drawImage(source,0,(firstRow+row)*256+top,1024,height,0,row*256+top,1024,height);
      }
      texture.refresh();
    }
    this.bakeCount++;
  }
  update(_direction:Direction,_flip:boolean,_shoulderY:number):void { /* body selects its own complete frames */ }
}
