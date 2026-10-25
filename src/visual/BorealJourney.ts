import type Phaser from 'phaser';
import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';
import {borealTrails,BOREAL_NEST_TRACES} from '../config/borealJourney';
import {EnvironmentPainter} from './EnvironmentArt';

export function composeBorealTrails(scene:Phaser.Scene,area:JourneyArea,solids:Obstacle[]):void{
 for(const trail of borealTrails(area)){
  const {x,y,radius}=trail.ridge;
  solids.push({...trail.ridge});
  const layer=scene.add.renderTexture(x-256,y-180,512,360).setOrigin(0).setDepth(y-30).setName('boreal-trail-ridge');
  const p=new EnvironmentPainter(scene,layer),tint=area==='frost'?0xb9c9c7:0x9db7c5;
  p.sediment(x,y+24,310,110,tint,.17);p.contact(x,y+17,radius*2.6,38,.4);
  p.stamp({key:'world-rock',x,y,width:radius*2.45,height:radius*1.6,tint});
  if(trail.art==='roots')p.stamp({key:'root-growth',x:x+20,y:y+26,width:155,height:42,tint:0xa7b5a1});
  if(trail.art==='buried')p.stamp({key:'ancient-remnant',x,y:y+12,width:radius*1.6,height:radius*.85,tint,alpha:.75});
  p.destroy();
 }
 if(area==='icenest'){
  const layer=scene.add.renderTexture(300,850,512,300).setOrigin(0).setDepth(-9880).setName('boreal-nest-traces');
  const p=new EnvironmentPainter(scene,layer);
  const scratches=scene.add.graphics();
  for(const t of BOREAL_NEST_TRACES){
   p.sediment(t.x,t.y,130,38,0xa7c3d4,.24);
   // Three shallow parallel cuts and scraped frost. Baked in world space;
   // these flat marks do not depict a solid rock on the walking corridor.
   for(let i=0;i<3;i++){
    const angle=t.angle*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
    const points=Array.from({length:5},(_,j)=>{
     const x=(j/4-.5)*(t.width*.6-i*7)+i*3,y=(i-1)*9+Math.sin(j*1.3+i)*3;
     return {x:t.x+x*cos-y*sin,y:t.y+x*sin+y*cos};
    });
    for(let j=1;j<points.length;j++){
     const a=points[j-1],b=points[j];
     scratches.lineStyle(j===2?2:1,0x263f52,.3).lineBetween(a.x,a.y,b.x,b.y);
     scratches.lineStyle(1,0xd4e5eb,.28).lineBetween(a.x,a.y+2,b.x,b.y+2);
    }
   }
  }
  layer.draw(scratches,-layer.x,-layer.y);scratches.destroy();p.destroy();
 }
}
