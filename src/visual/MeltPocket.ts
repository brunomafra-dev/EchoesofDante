import type Phaser from 'phaser';
/** Match the floor's texel density before GPU upload, rather than shrinking
 * a detailed 1254 px decal to 100–190 world units and aliasing its perimeter. */
export function meltPocketTexture(scene:Phaser.Scene):string|undefined{
 const key='boreal-melt-pocket';if(scene.textures.exists(key))return key;
 if(!scene.textures.exists(key+'-source'))return;
 const t=scene.textures.createCanvas(key,128,128)!,g=t.context;
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(scene.textures.get(key+'-source').getSourceImage() as HTMLImageElement,0,0,128,128);t.refresh();scene.textures.remove(key+'-source');return key;
}
