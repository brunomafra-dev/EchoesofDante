import Phaser from 'phaser';
type Bounds={x:number;y:number;width:number;height:number};
export function registerPaintedArmFrames(scene:Phaser.Scene):void {
  const data=scene.cache.json.get('character-arm-registration') as Record<string,Bounds[]>;
  for(const [key,parts]of Object.entries(data)){
    const texture=scene.textures.get(key);
    for(let i=0;i<parts.length;i++)if(!texture.has(`anatomy-${i}`)){
      const b=parts[i];texture.add(`anatomy-${i}`,0,b.x,b.y,b.width,b.height);
    }
  }
}
