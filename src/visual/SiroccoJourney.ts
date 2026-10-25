import type Phaser from 'phaser';
import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';
import {siroccoTrails} from '../config/siroccoJourney';
import {EnvironmentPainter} from './EnvironmentArt';

// Three small static caches per region. No update callback, tween, listener,
// extra shadow pass or new texture file; approved floor and wind remain intact.
export function composeSiroccoTrails(scene:Phaser.Scene,area:JourneyArea,solids:Obstacle[]):void{
 for(const trail of siroccoTrails(area)){
  const {x,y,radius}=trail.ridge;
  solids.push({...trail.ridge});
  const layer=scene.add.renderTexture(x-256,y-180,512,360).setOrigin(0).setDepth(y-30).setName('sirocco-trail-ridge');
  const painter=new EnvironmentPainter(scene,layer);
  const tint=area==='valley'?0xc2c0a0:area==='arid'?0xc8a17b:0xc4ae8a;
  painter.sediment(x,y+24,330,130,tint,.18);
  painter.contact(x,y+17,radius*2.6,38,.4);
  // A low formation, not a huge landmark covering the hero. Its base matches
  // the one circular collider, rather than a decorative wall without physics.
  painter.stamp({key:'world-rock',x,y,width:radius*2.45,height:radius*1.6,tint});
  if(trail.art==='roots')painter.stamp({key:'root-growth',x:x+24,y:y+32,width:190,height:53,tint,angle:-12});
  if(trail.art==='buried')painter.stamp({key:'ancient-remnant',x,y:y+12,width:radius*1.6,height:radius*.85,tint,alpha:.75});
  painter.destroy();
 }
}
