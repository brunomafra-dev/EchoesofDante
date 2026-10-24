import type Phaser from 'phaser';
import { CAVERN_POCKETS } from '../config/earlyJourney';
import type { Obstacle } from '../systems/Movement';
import { EnvironmentPainter } from './EnvironmentArt';

/** Three finite caches. The mouths stay clear; cover has matching footprints. */
export class CavernSideChambers {
  constructor(scene:Phaser.Scene,obstacles:Obstacle[]) {
    // Reuse the approved entry painting's quiet stone. One shared feathered
    // canvas removes the giant repeated rubble pattern inside the new pockets.
    const floorKey='early-chamber-quiet-floor';
    if(!scene.textures.exists(floorKey)&&scene.textures.exists('cavern-entry-floor')){
      const source=scene.textures.get('cavern-entry-floor').getSourceImage() as HTMLImageElement;
      const canvas=scene.textures.createCanvas(floorKey,768,512)!,c=canvas.context;
      c.drawImage(source,source.width*.16,source.height*.16,source.width*.68,source.height*.68,0,0,768,512);
      c.globalCompositeOperation='destination-in';c.save();c.translate(384,256);c.scale(384,256);
      const fade=c.createRadialGradient(0,0,.52,0,0,1);fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=fade;c.fillRect(-1,-1,2,2);c.restore();canvas.refresh();
    }
    for(const [index,p] of CAVERN_POCKETS.entries()){
      if(scene.textures.exists(floorKey))scene.add.image((p.left+p.right)/2,1280,floorKey).setDisplaySize(p.right-p.left+320,850).setDepth(-9999).setName('early-chamber-quiet-ground');
      const cache=scene.add.renderTexture(p.left-170,950,p.right-p.left+340,p.bottom-950+180)
        .setOrigin(0).setDepth(-9998).setName('cavern-side-chamber');
      const paint=new EnvironmentPainter(scene,cache);
      paint.sediment((p.left+p.right)/2,1250,p.right-p.left,450,0x89816b,.25);
      paint.sediment(p.entry,1150,260,260,0xafa487,.15);
      // Shared bank shape, lightly irregular, with a broad unobstructed mouth.
      const rim=[[p.left,1120],[p.left+40,p.bottom-100],[p.left+160,p.bottom],
        [p.right-190,p.bottom],[p.right-70,p.bottom-80],[p.right,1120]];
      for(let i=1;i<rim.length;i++){
        const a=rim[i-1],b=rim[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/100);
        for(let j=0;j<n;j++){
          const x=a[0]+(b[0]-a[0])*j/n,y=a[1]+(b[1]-a[1])*j/n;
          paint.sediment(x,y,190,100,0x182b2c,.45);
          paint.stamp({key:'rock-shelf',x,y:y-18,width:145,height:110,tint:0x9cafa2,flipX:j%2===0});
          paint.contact(x,y+17,125,34,.55);
        }
      }
      // Cover splits each encounter; the centre of the investigation is quiet.
      const rock={x:p.entry-145,y:1215,radius:32};obstacles.push(rock);
      paint.rock(rock.x,rock.y,rock.radius,0xb1bca4,true);
      paint.stamp({key:'root-growth',x:p.left+165,y:p.bottom-65,width:220,height:60,tint:0x94a28a,alpha:.65});
      paint.stamp({key:index===1?'mineral-growth':'deep-mineral',x:p.right-140,y:1275,width:80,height:65,tint:0xc2baa3});
      paint.destroy();
    }
  }
}
