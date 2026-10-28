import Phaser from 'phaser';
import {BASE} from '../config/base';
import type {Obstacle} from './Movement';
import {EnvironmentPainter,createEnvironmentGround,trackEnvironmentOcclusion} from '../visual/EnvironmentArt';
export class LandingBase{
 readonly bounds={left:70,right:1330,top:90,bottom:970};
 readonly obstacles:Obstacle[]=[{x:550,y:370,radius:112},{x:420,y:360,radius:62},{x:680,y:360,radius:62},...BASE.services.flatMap(s=>[{x:s.x,y:s.y-22,radius:20},{x:s.x,y:s.y-100,radius:55}])];
 constructor(scene:Phaser.Scene){
  // Wide viewports can see beyond this small playable camp. Continue the
  // existing ground and bake a woodland fringe; movement bounds stay intact.
  createEnvironmentGround(scene,BASE.width+1024,'forest-ground',0xa3af91);
  const fringe=scene.add.renderTexture(BASE.width-80,0,640,BASE.height).setOrigin(0).setDepth(-9999),edge=new EnvironmentPainter(scene,fringe);
  for(const[x,y,w]of [[80,220,190],[260,360,170],[65,560,180],[340,670,190],[150,850,175],[460,930,200]]){
   edge.stamp({key:'root-growth',x,y:y+40,width:w,height:w*.3,tint:0x9bb57e,alpha:.8});
   edge.stamp({key:'dante-canopy-green',x,y,width:w,height:w*.7,tint:0xa3af91,alpha:.95});
  }
  const floor=scene.add.renderTexture(0,0,BASE.width,BASE.height).setOrigin(0).setDepth(-10000),painter=new EnvironmentPainter(scene,floor);
  painter.stamp({key:'camp-ground',x:710,y:605,width:1270,height:800,alpha:.9});
  // Worn soil is dark and low contrast. The old oversized untinted white
  // feather masks read as fog painted on top of the campsite.
  for(const[x,y,w,h]of [[550,515,350,95],[720,585,270,105],[935,660,230,120],[1080,760,285,100],[610,745,350,105],[400,750,230,100],[1010,560,120,230]])painter.sediment(x,y,w,h,0x5f6345,.24);
  for(const[x,y,r]of[[130,260,90],[1200,300,105],[200,860,70],[1180,930,80]]){const rock=scene.add.image(x,y,'world-rock').setDisplaySize(r*1.8,r*1.4);floor.draw(rock);rock.destroy();}
  scene.add.image(550,360,'landing-shuttle').setDisplaySize(490,330).setDepth(430);
  for(const s of BASE.services){
   painter.sediment(s.x,s.y-30,235,135,0x737251,.22);painter.contact(s.x,s.y-34,145,24,.55);
   const shelter=scene.add.image(s.x,s.y-98,'field-shelter').setDisplaySize(180,150).setDepth(s.y-50);trackEnvironmentOcclusion(scene,shelter);
   scene.add.text(s.x,s.y-185,s.name,{fontFamily:'Barlow Condensed',fontSize:'16px',color:'#e3dfc7',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(10003);
  }
  for(const[x,y,w]of [[440,650,105],[895,625,112],[1120,420,100]]){
   painter.contact(x,y+4,w*.8,15,.5);scene.add.image(x,y,'camp-supplies').setOrigin(.5,1).setDisplaySize(w,w*319/512).setDepth(y);this.obstacles.push({x,y:y-17,radius:20});
  }
  for(const[x,y,w]of [[160,700,100],[170,950,155],[1180,530,105],[1160,945,135],[260,470,85]]){painter.stamp({key:'root-growth',x,y,width:w,height:w*.25,tint:0xa1b38b,alpha:.65});painter.stamp({key:'dante-canopy-green',x:x-18,y:y-17,width:w*.65,height:w*.35,tint:0x9bb57e,alpha:.75});}
  painter.destroy();
  scene.add.text(550,160,'DANTE-01 · BASE DE POUSO',{fontFamily:'Barlow Condensed',fontSize:'22px',color:'#d0c6aa',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(10003);
  scene.add.text(BASE.exit.x,BASE.exit.y-70,'FLORESTA →',{fontFamily:'Barlow Condensed',fontSize:'18px',color:'#b8caaa'}).setOrigin(.5).setDepth(10003);
 }
}
