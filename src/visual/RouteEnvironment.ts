import type Phaser from 'phaser';
import {ROUTE_IDENTITY} from '../config/routeIdentity';
import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';

export const routeTexture=(area:JourneyArea)=>'route-floor-'+area;
export function preloadRouteEnvironment(scene:Phaser.Scene,area:JourneyArea):void{
 if(!ROUTE_IDENTITY[area]||scene.data.get('route-art-previous'))return;
 const key=routeTexture(area);
 if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/route-identity/${area}-v1.webp`);
}
// Called by the existing ground compositor; a single quad replaces the whole
// region's repeated/mirrored panels. No additional runtime texture allocation.
export function paintRouteEnvironment(scene:Phaser.Scene,area:JourneyArea,panels:Set<string>):boolean{
 const config=ROUTE_IDENTITY[area],key=routeTexture(area);
 if(!config||scene.data.get('route-art-previous')||!scene.textures.exists(key))return false;
 if(!panels.has(key)){
  panels.add(key);scene.add.image(0,config.groundY??0,key).setOrigin(0).setDisplaySize(config.width,config.groundHeight??config.height).setDepth(-10001.5).setName('campaign-continuous-ground').setData('route-identity',area);
 }
 return true;
}
export function addRouteFootprints(scene:Phaser.Scene,area:JourneyArea,obstacles:Obstacle[]):void{
 if(!scene.data.get('route-art-previous')&&scene.textures.exists(routeTexture(area)))obstacles.push(...(ROUTE_IDENTITY[area]?.solids??[]).map(p=>({...p})));
}
