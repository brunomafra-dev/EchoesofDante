import Phaser from 'phaser';
type Bounds={x:number;y:number;width:number;height:number};
export type PaintedArmPart=Bounds&{root:{x:number;y:number};tip:{x:number;y:number}};
export function preloadCasterArms(scene:Phaser.Scene,identity:'astral'|'xenobinder'):void {
  for(const style of ['none','basic','reinforced']){
    const key=`${identity}-arm-${style}`;
    if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`);
  }
  if(!scene.cache.json.exists('caster-arm-registration'))scene.load.json('caster-arm-registration',`${import.meta.env.BASE_URL}assets/visual/characters/caster-arm-registration.json`);
}
export function registerPaintedArmFrames(scene:Phaser.Scene):void {
  const data={...scene.cache.json.get('character-arm-registration'),...scene.cache.json.get('caster-arm-registration')} as Record<string,Bounds[]>;
  for(const [key,parts]of Object.entries(data)){
    if(!scene.textures.exists(key))continue;
    const texture=scene.textures.get(key);
    for(let i=0;i<parts.length;i++)if(!texture.has(`anatomy-${i}`)){
      const b=parts[i];texture.add(`anatomy-${i}`,0,b.x,b.y,b.width,b.height);
    }
  }
}
