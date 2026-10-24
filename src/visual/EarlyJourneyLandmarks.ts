import Phaser from 'phaser';
import {EARLY_LANDMARKS} from '../config/earlyJourney';
import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';
import type {Vec2} from '../utils/math';
import {addSurveyProp} from './MissionProps';

const basin='early-living-basin',cave='early-cavern-landmarks';
export function preloadEarlyJourney(scene:Phaser.Scene,area:JourneyArea):void {
 const root=`${import.meta.env.BASE_URL}assets/visual/early-journey/`;
 if(area==='forest'&&!scene.textures.exists(basin))scene.load.image(basin,root+'living-basin-v1.webp');
 if(area==='cavern'&&!scene.textures.exists(cave))scene.load.spritesheet(cave,root+'cavern-landmarks-v1.webp',{frameWidth:512,frameHeight:512});
}

/** A few static authored landmarks; no additional RenderTextures or listeners.
 * Labels only appear near an entrance, keeping the combat layer quiet. */
export class EarlyJourneyLandmarks {
 private labels:{text:Phaser.GameObjects.Text;x:number;y:number}[]=[];
 private glints:Phaser.GameObjects.Ellipse[]=[];
 private announced=new Set<number>();
 private places:{x:number;y:number;name:string;detail:string}[]=[];
 constructor(scene:Phaser.Scene,area:JourneyArea,obstacles:Obstacle[]){
  if(area==='forest'&&scene.textures.exists(basin)){
   scene.add.image(1750,750,basin).setOrigin(0).setDisplaySize(1300,1300).setDepth(-10000.8).setName('living-basin');
   obstacles.push(...EARLY_LANDMARKS.forest.map(p=>({...p})));
   this.sign(scene,2050,1140,'BACIA DO LEITO VIVO →');
   this.places.push({x:2450,y:1310,name:'BACIA DO LEITO VIVO',detail:'A água desaparece sob as raízes. Lia pode analisar a margem.'});
   this.glint(scene,2760,1090,42,6);this.glint(scene,2810,1160,30,4);
  }else if(area==='cavern'&&scene.textures.exists(cave)){
   const specs=[{x:990,y:1305,w:320,h:270},{x:2275,y:1440,w:280,h:250},{x:3895,y:1360,w:300,h:260}];
   specs.forEach((p,i)=>{
    // The pool stays on the ground; tall fossils and conduit sort by their base.
    scene.add.image(p.x,p.y,cave,i).setOrigin(.5,i===0?.5:.72).setDisplaySize(p.w,p.h).setDepth(i===0?-9997:p.y-2).setName('early-chamber-'+i);
   });
   obstacles.push(...EARLY_LANDMARKS.cavern.map(p=>({...p})));
   for(const[x,name]of [[1140,'CONDENSAÇÃO ↓'],[2120,'JARDIM MINERAL ↓'],[3720,'CONDUTO SOTERRADO ↓']] as const)this.sign(scene,x-95,1080,name);
   this.places=[{x:1200,y:1320,name:'CÂMARA DA CONDENSAÇÃO',detail:'Gotas se acumulam numa bacia mineral.'},{x:2090,y:1400,name:'JARDIM MINERAL',detail:'Raízes antigas foram substituídas por mineral.'},{x:3750,y:1350,name:'CONDUTO SOTERRADO',detail:'Ainda existe energia sob a crosta.'}];
   this.glint(scene,990,1310,24,4);
  }
 }
 private sign(scene:Phaser.Scene,x:number,y:number,title:string):void{
  addSurveyProp(scene,'route-west',x-25,y+25).setDisplaySize(32,45);
  const text=scene.add.text(x,y-18,title,{fontFamily:'Arial',fontSize:'13px',color:'#e3d7b4',stroke:'#152123',strokeThickness:3}).setOrigin(.5,1).setDepth(y+65).setVisible(false);
  this.labels.push({text,x,y});
 }
 private glint(scene:Phaser.Scene,x:number,y:number,w:number,h:number):void{
  this.glints.push(scene.add.ellipse(x,y,w,h,0xabc8ad,.15).setDepth(-9996));
 }
 update(time:number,position:Vec2,discover:(message:string)=>void):void{
  for(const s of this.labels)s.text.setVisible(Math.hypot(s.x-position.x,s.y-position.y)<340);
  this.glints.forEach((g,i)=>g.setAlpha(.10+.06*Math.sin(time*.0007+i*2)));
  this.places.forEach((p,i)=>{
   if(!this.announced.has(i)&&Math.hypot(p.x-position.x,p.y-position.y)<190){this.announced.add(i);discover(p.name+'\n'+p.detail);}
  });
 }
}
