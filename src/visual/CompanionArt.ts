import Phaser from'phaser';
export function preloadCompanionArt(scene:Phaser.Scene):void{
 for(const id of ['bulwark','frostling'])if(!scene.textures.exists('companion-'+id))scene.load.spritesheet('companion-'+id,`${import.meta.env.BASE_URL}assets/visual/companions/${id}-v1.webp`,{frameWidth:192,frameHeight:192});
}
export function companionCrystal(scene:Phaser.Scene):string{
 const key='companion-glacial-bolt';if(scene.textures.exists(key))return key;
 const t=scene.textures.createCanvas(key,80,32)!,c=t.context;
 c.fillStyle='#447c9b';c.beginPath();c.moveTo(0,16);c.lineTo(50,7);c.lineTo(78,16);c.lineTo(50,25);c.closePath();c.fill();
 c.fillStyle='#a5dce8';c.beginPath();c.moveTo(20,16);c.lineTo(49,10);c.lineTo(78,16);c.lineTo(49,22);c.closePath();c.fill();
 c.fillStyle='#e5f6ef';c.beginPath();c.moveTo(28,16);c.lineTo(54,13);c.lineTo(78,16);c.closePath();c.fill();t.refresh();return key;
}
