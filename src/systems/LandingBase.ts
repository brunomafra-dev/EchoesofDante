import Phaser from 'phaser';
import {BASE} from '../config/base';
import type {Obstacle} from './Movement';
export class LandingBase{
 readonly bounds={left:70,right:1330,top:90,bottom:970};
 readonly obstacles:Obstacle[]=[{x:550,y:370,radius:112},{x:420,y:360,radius:62},{x:680,y:360,radius:62},...BASE.services.flatMap(s=>[{x:s.x,y:s.y-22,radius:20},{x:s.x,y:s.y-100,radius:55}])];
 constructor(scene:Phaser.Scene,refugees=false){
  const floor=scene.add.renderTexture(0,0,BASE.width,BASE.height).setOrigin(0).setDepth(-10000);
  const soil=scene.add.image(700,525,'forest-ground').setDisplaySize(1400,1050).setTint(0xa5ae92);floor.draw(soil);soil.destroy();
  for(const[x,y,w,h]of[[550,500,650,190],[650,730,740,150],[1040,610,210,340]]){const stamp=scene.add.image(x,y,'terrain-blend').setDisplaySize(w,h).setAlpha(.45);floor.draw(stamp);stamp.destroy();}
  for(const[x,y,r]of[[130,260,90],[1200,300,105],[200,860,70],[1180,930,80]]){const rock=scene.add.image(x,y,'world-rock').setDisplaySize(r*1.8,r*1.4);floor.draw(rock);rock.destroy();}
  scene.add.image(550,360,'landing-shuttle').setDisplaySize(490,330).setDepth(430);
  for(const s of BASE.services){
   scene.add.image(s.x,s.y-98,'field-shelter').setDisplaySize(180,150).setDepth(s.y-50);
   const platform=scene.add.image(s.x,s.y+8,'world-shadow').setDisplaySize(110,45).setAlpha(.65);floor.draw(platform);platform.destroy();
   scene.add.image(s.x,s.y,'base-'+s.id).setOrigin(.5,.88).setDisplaySize(72,110).setDepth(s.y);
   scene.add.text(s.x,s.y-185,s.name,{fontFamily:'Barlow Condensed',fontSize:'16px',color:'#e3dfc7',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(10003);
  }
  if(refugees)for(const[x,y]of[[380,500],[820,490]])scene.add.image(x,y,'base-expedition').setDisplaySize(58,88).setDepth(y);
  scene.add.text(550,160,'DANTE-01 · BASE DE POUSO',{fontFamily:'Barlow Condensed',fontSize:'22px',color:'#d0c6aa',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(10003);
  scene.add.text(BASE.exit.x,BASE.exit.y-70,'FLORESTA →',{fontFamily:'Barlow Condensed',fontSize:'18px',color:'#b8caaa'}).setOrigin(.5).setDepth(10003);
 }
}
