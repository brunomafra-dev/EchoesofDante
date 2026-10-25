import type Phaser from 'phaser';
import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';
import {embersTrails} from '../config/embersJourney';
import {EnvironmentPainter} from './EnvironmentArt';

// Static raster composition only. One matching low circular solid per loop;
// no extra hazard, listener, dynamic shadow or per-frame scenery drawing.
export function composeEmbersTrails(scene:Phaser.Scene,area:JourneyArea,solids:Obstacle[]):void{
 for(const trail of embersTrails(area)){
  const {x,y,radius}=trail.ridge;solids.push({...trail.ridge});
  const cache=scene.add.renderTexture(x-256,y-180,512,360).setOrigin(0).setDepth(y-30).setName('embers-trail-ridge');
  const p=new EnvironmentPainter(scene,cache),tint=area==='cinder'?0xb0a18d:area==='obsidian'?0x9c92aa:0xac9c8a;
  p.sediment(x,y+22,300,105,tint,.17);p.contact(x,y+17,radius*2.6,38,.4);
  p.stamp({key:'world-rock',x,y,width:radius*2.45,height:radius*1.6,tint});
  if(trail.art==='buried')p.stamp({key:'ancient-remnant',x,y:y+12,width:radius*1.6,height:radius*.85,tint,alpha:.75});
  p.destroy();
 }
}
