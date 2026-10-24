import {preloadCreatureSheet} from '../visual/CreatureArt';
import Phaser from 'phaser';
import {COLONY,COLONY_ROCKS,COLONY_SITES,HABITAT,HABITAT_SOLIDS,type ColonyArea} from '../config/colonization';
import {EnvironmentPainter,createEnvironmentGround,trackEnvironmentOcclusion} from '../visual/EnvironmentArt';
import type {MovementBounds,Obstacle} from './Movement';
import {addSurveyProp} from '../visual/MissionProps';

export function preloadColonization(scene:Phaser.Scene):void{
 for(const key of ['camp-supplies','spring-pool','first-habitat','camp-ground'])if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/colonization/${key}.png`);
 for(const key of ['bankGrazer','reedSpitter'])if(!scene.textures.exists(`dante-${key}-motion`))preloadCreatureSheet(scene,`dante-${key}-motion`,`${import.meta.env.BASE_URL}assets/colonization/dante-${key}-motion.png`,256);
}
export class ColonizationArea{
 readonly bounds:MovementBounds={left:105,right:2490,top:350,bottom:1245};
 readonly obstacles:Obstacle[];
 private settled=false;
 private habitat:Phaser.GameObjects.Image[]=[];
 private structures:Obstacle[]=HABITAT_SOLIDS.map(o=>({...o}));
 constructor(scene:Phaser.Scene,readonly area:ColonyArea,settled:boolean){
  this.obstacles=COLONY_ROCKS[area].map(o=>({...o}));
  const border=[...Array.from({length:11},(_,i)=>({x:130+i*235,y:340+(i%3)*8,radius:63})),...Array.from({length:11},(_,i)=>({x:130+i*235,y:1280-(i%2)*12,radius:64}))];
  this.obstacles.push(...border);
  createEnvironmentGround(scene,2600,'forest-ground',area==='springs'?0x8fb4a1:0xb4bca0);
  for(const tileX of [0,1300]){
   const floor=scene.add.renderTexture(tileX,200,1300,1200).setOrigin(0).setDepth(-10000),p=new EnvironmentPainter(scene,floor);
   const visible=(x:number,w:number)=>x+w/2>tileX&&x-w/2<tileX+1300;
   for(const[x,y,w,h]of [[450,1010,500,190],[800,1020,520,190],[1050,530,510,140],[1600,1070,550,180],[2040,750,480,220],[2310,910,300,200]])if(visible(x,w))p.sediment(x,y,w,h,area==='springs'?0x526e56:0x7c7850,.27);
   for(const o of border)if(visible(o.x,280)){const i=Math.round((o.x-130)/235);p.apron(o.x,o.y+18,180,0x97ae80);p.stamp({key:i%3===0?'world-rock':'deep-stratum',x:o.x,y:o.y-22,width:225+Math.sin(o.x)*28,height:112+Math.cos(o.x)*15,angle:Math.sin(o.x*.02)*7,tint:area==='springs'?0x9bb3a0:0xb8baa1,flipX:i%2===0});}
   const rocks=COLONY_ROCKS[area].filter(o=>area!=='springs'||o.radius<60);
   for(const o of rocks)if(o.x>=tileX&&o.x<tileX+1300)p.rock(o.x,o.y,o.radius,0xb3c1a1,true);
   for(const[x,y,w]of [[420,540,100],[650,1150,130],[980,450,115],[1500,1170,145],[1640,480,130],[2210,1180,130],[2350,470,120]])if(visible(x,w)){p.stamp({key:'dante-canopy-green',x,y,width:w,height:w*.55,tint:0x98ba83,alpha:.8});p.stamp({key:'root-growth',x:x+35,y:y+26,width:w*1.4,height:w*.3,tint:0xa4b68c});}
   if(area==='springs'){for(const[x,y,w,h]of [[1270,745,670,430],[1800,490,365,235]])if(visible(x,w))p.stamp({key:'spring-pool',x,y,width:w,height:h});}
   else if(visible(1280,500)){p.apron(1280,800,430,0x9daa7c);p.stamp({key:'rock-shelf',x:1280,y:760,width:515,height:120,tint:0xa7b49a});}
   if(area==='terraces'&&visible(HABITAT.x,650))p.stamp({key:'camp-ground',x:HABITAT.x,y:HABITAT.y,width:650,height:420,alpha:.7});
   p.destroy();
  }
  const label=(x:number,y:number,text:string)=>scene.add.text(x,y,text,{fontFamily:'Barlow Condensed',fontSize:'16px',color:'#e5d5b1',stroke:'#14251a',strokeThickness:3}).setOrigin(.5).setDepth(y);
  label(COLONY[area].back.x+40,COLONY[area].back.y-55,area==='springs'?'← VALE DA RESSONÂNCIA':'← BACIA DAS NASCENTES');
  if(area==='springs')label(COLONY.springs.exit.x,COLONY.springs.exit.y-70,'TERRAÇOS DO AMANHECER →');
  for(const site of COLONY_SITES)if(site.area===area&&site.id!=='shelter-built'){
   addSurveyProp(scene,site.id,site.x,site.y);
  }
  if(area==='terraces'){
   const building=scene.add.image(HABITAT.x,HABITAT.y,'first-habitat').setOrigin(.5,1).setDisplaySize(HABITAT.width,HABITAT.height).setDepth(HABITAT.y-20).setName('first-colonist-habitat');trackEnvironmentOcclusion(scene,building);this.habitat.push(building);
   for(const[key,x,y]of [['a',2010,920],['b',2380,915]] as const){const npc=scene.add.image(x,y,'base-refugee-'+key).setOrigin(.5,1).setDisplaySize(58,89).setDepth(y);this.habitat.push(npc);const shadow=scene.add.image(x,y+1,'world-shadow','ground-contact').setDisplaySize(32,9).setAlpha(.65).setDepth(y-2);this.habitat.push(shadow);}
   this.habitat.forEach(o=>o.setVisible(false));this.setSettled(settled);
  }
 }
 setSettled(value:boolean):void{if(this.area!=='terraces'||value===this.settled)return;this.settled=value;this.habitat.forEach(o=>o.setVisible(value));if(value)this.obstacles.push(...this.structures);else for(const o of this.structures){const i=this.obstacles.indexOf(o);if(i>=0)this.obstacles.splice(i,1);}}
}
