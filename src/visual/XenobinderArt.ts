import Phaser from 'phaser';
import { AstralArt } from './AstralArt';
import type { CharacterSex } from '../config/appearance';
import { preloadCasterArms } from './PaintedArmFrames';

export function preloadXenobinderArt(scene:Phaser.Scene):void{
 preloadCasterArms(scene,'xenobinder');
 for(const sex of ['male','female'])for(const style of ['none','basic','reinforced']){const key=`wardrobe-xenobinder-${sex}-${style}`;if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);}
 for(const tier of ['starter','current','advanced']){const key=`xenobinder-${tier}-weapon`;if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);}
 for(const key of ['xeno-bolt','xeno-link','xeno-pulse'])if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/xenobinder/${key}.png`);
 if(!scene.textures.exists('dante-symbiont-motion'))scene.load.spritesheet('dante-symbiont-motion',`${import.meta.env.BASE_URL}assets/visual/characters/dante-symbiont-motion.png`,{frameWidth:256,frameHeight:256});
 if(!scene.cache.json.exists('xenobinder-shoulders'))scene.load.json('xenobinder-shoulders',`${import.meta.env.BASE_URL}assets/visual/characters/xenobinder-shoulders.json`);
}
// Own painted wardrobe/instrument, sharing the proven humanoid shoulder/arm rig.
export class XenobinderArt extends AstralArt {
 constructor(scene:Phaser.Scene,view:Phaser.GameObjects.Container,x:number,y:number,sex:CharacterSex){super(scene,view,x,y,sex,'xenobinder');}
}
