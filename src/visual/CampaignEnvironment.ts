import Phaser from 'phaser';
import type {JourneyArea} from '../systems/LocalJourney';
import type {Vec2} from '../utils/math';
import type {MovementBounds,Obstacle} from '../systems/Movement';
import {preloadEarlyJourney} from './EarlyJourneyLandmarks';
import {preloadRouteEnvironment,paintRouteEnvironment} from './RouteEnvironment';

type Actor={position:Vec2;isDead:boolean;footOffset?:number};
type Plant={image:Phaser.GameObjects.Image;x:number;y:number;bend:number;velocity:number;touching:boolean;phase:number};
type State={area:JourneyArea;plants:Plant[];ground:boolean;panels:Set<string>};
const states=new WeakMap<Phaser.Scene,State>();
const GREEN=new Set<JourneyArea>(['base','forest','valley','springs','terraces']);
const COLD=new Set<JourneyArea>(['frost','icecave','icenest']);
const ASH=new Set<JourneyArea>(['cinder','obsidian','caldera']);
const DRY=new Set<JourneyArea>(['arid','dunes','sandpit']);
const asset=(name:string)=>`${import.meta.env.BASE_URL}assets/visual/world-finish/${name}-v1.webp`;

export function preloadCampaignEnvironment(scene:Phaser.Scene,area:JourneyArea):void{
 preloadEarlyJourney(scene,area);
 preloadRouteEnvironment(scene,area);
 const floors=area==='base'?['camp']:area==='forest'?['forest']:area==='cavern'?['cave','meadow']:area==='warden'?['cave']:GREEN.has(area)?['meadow']:DRY.has(area)?['arid']:[];
 for(const name of floors)if(!scene.textures.exists(`world-floor-${name}`))scene.load.image(`world-floor-${name}`,asset(`${name}-floor`));
 for(const[key,file]of [['world-green-plants','trail-plants-v1'],['world-regional-plants','regional-plants-v1']])if(!scene.textures.exists(key))scene.load.spritesheet(key,key==='world-green-plants'?`${import.meta.env.BASE_URL}assets/experiments/forest-finish/${file}.webp`:asset('regional-plants'),{frameWidth:256,frameHeight:256});
 if((GREEN.has(area)||area==='cavern')&&!scene.textures.exists('world-overhead'))scene.load.image('world-overhead',`${import.meta.env.BASE_URL}assets/experiments/forest-finish/canopy-v1.webp`);
 if(!scene.textures.exists('finish-hollow'))scene.load.spritesheet('finish-hollow',`${import.meta.env.BASE_URL}assets/experiments/forest-finish/hollow-v3.webp`,{frameWidth:256,frameHeight:256});
}

export function beginCampaignEnvironment(scene:Phaser.Scene,area?:JourneyArea):void{
 scene.data.set('campaign-finish',!!area);
 if(area)states.set(scene,{area,plants:[],ground:false,panels:new Set()});else states.delete(scene);
}
export function hasCampaignGround(scene:Phaser.Scene):boolean{return states.get(scene)?.ground??false;}

/** Static whole material planes, in matching-scale panels for long regions.
 * Raised scenery, physics and all progression objects remain independent. */
export function paintCampaignGround(scene:Phaser.Scene,width:number,height=1500,original?:string,x=0,y=0):boolean{
 const state=states.get(scene);if(!state)return false;
 const area=state.area;
 if(paintRouteEnvironment(scene,area,state.panels)){state.ground=true;return true;}
 let name=area==='base'?'camp':area==='forest'?'forest':area==='cavern'||area==='warden'?'cave':GREEN.has(area)?'meadow':DRY.has(area)&&area!=='sandpit'?'arid':undefined;
 const key=name?`world-floor-${name}`:original;
 if(!key||!scene.textures.exists(key))return false;
 state.ground=true;
 if((area==='forest'||area==='cavern')&&height>1500){
  // Preserve the approved material scale instead of stretching existing roots
  // and rocks to the enlarged height. Cache alpha variants once per texture.
  const feather=(texture:string,fx:boolean,fy:boolean):string=>{
   if(!fx&&!fy)return texture;
   const name=`${texture}-extension-${Number(fx)}${Number(fy)}`;
   if(!scene.textures.exists(name)){
    const source=scene.textures.get(texture).getSourceImage() as HTMLImageElement;
    const canvas=scene.textures.createCanvas(name,source.width,source.height)!,c=canvas.context;
    c.drawImage(source,0,0);c.globalCompositeOperation='destination-in';
    for(const axis of [fx?'x':'',fy?'y':''].filter(Boolean)){
     const fade=axis==='x'?c.createLinearGradient(0,0,source.width*160/2200,0):c.createLinearGradient(0,0,0,source.height*160/1500);
     fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,1)');c.fillStyle=fade;c.fillRect(0,0,source.width,source.height);
    }
    canvas.refresh();
   }
   return name;
  };
  if(area==='cavern')paintCampaignGround(scene,width,1500,original,x,0);
  for(let row=area==='cavern'?1:0;row<2;row++)for(let col=0;col<(area==='cavern'?2:Math.ceil(width/2040));col++){
   const px=area==='cavern'?col*2200:col*2040,py=row*1340;
   const id=`extension/${px}/${py}`;if(state.panels.has(id))continue;state.panels.add(id);
   scene.add.image(px,py,feather(key,area==='forest'&&col>0,row>0)).setOrigin(0).setDisplaySize(2200,1500)
    .setDepth(-10001.5+row*.1+(area==='forest'&&col>0?.01:0)).setName('campaign-continuous-ground');
  }
  return true;
 }
 if(area==='base'){
  scene.add.tileSprite(0,0,512,512,'forest-ground').setOrigin(0).setDisplaySize(width,height).setTileScale(512/width,512/height).setTint(0x89977d).setDepth(-10002);
  scene.add.image(0,0,key,'__BASE').setOrigin(0).setDisplaySize(1400,1050).setDepth(-10001.5).setName('campaign-continuous-ground');return true;
 }
 if(!name){scene.add.image(x,y,key,'__BASE').setOrigin(0).setDisplaySize(width,height).setTint(COLD.has(area)?0xe3edf2:ASH.has(area)?0xe3d4c6:0xf0e2ca).setDepth(-10001.5).setName('campaign-continuous-ground');return true;}
 const panelWidth=Math.min(2200,width);
 for(let px=Math.floor(x/panelWidth)*panelWidth;px<x+width;px+=panelWidth){
  const exterior=area==='cavern'&&px>=4400;
  const texture=exterior&&scene.textures.exists('world-floor-meadow')?'world-floor-meadow':key;
  const id=`${texture}/${px}/${y}/${height}`;if(state.panels.has(id))continue;state.panels.add(id);
  if(area==='cavern'&&px===4400){
   // Bake the material transition once. The alpha edge overlaps intact cave
   // ground; no per-frame mask or rectangular cave/grass boundary.
   const blendKey='world-floor-meadow-entry';
   if(!scene.textures.exists(blendKey)){
    const source=scene.textures.get(texture).getSourceImage() as HTMLImageElement,canvas=scene.textures.createCanvas(blendKey,source.width,source.height)!,c=canvas.context;
    c.drawImage(source,0,0);c.globalCompositeOperation='destination-in';const g=c.createLinearGradient(0,0,source.width*280/(panelWidth+280),0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');c.fillStyle=g;c.fillRect(0,0,source.width,source.height);canvas.refresh();
   }
   scene.add.image(px-280,y,blendKey,'__BASE').setOrigin(0).setDisplaySize(panelWidth+280,height).setDepth(-10001.4).setName('campaign-continuous-ground');continue;
  }
  scene.add.image(px,y,texture,'__BASE').setOrigin(0).setDisplaySize(panelWidth,height).setFlipX(Math.round(px/panelWidth)%2===1).setDepth(-10001.5).setName('campaign-continuous-ground');
 }
 return true;
}

export function addCampaignPlant(scene:Phaser.Scene,x:number,y:number,size:number):Phaser.GameObjects.Image|undefined{
 const state=states.get(scene);if(!state||state.plants.length>=36)return;
 // Adjacent bake sections may overlap, but must not duplicate living props.
 if(state.plants.some(p=>Math.hypot(p.x-x,p.y-y)<38))return;
 const green=GREEN.has(state.area)||state.area==='cavern'&&x>4350;
 const frame=green?state.plants.length%3:DRY.has(state.area)?0:COLD.has(state.area)?1:ASH.has(state.area)?3:2;
 const key=green?'world-green-plants':'world-regional-plants';if(!scene.textures.exists(key))return;
 const image=scene.add.image(x,y,key,frame).setOrigin(.5,.83).setDisplaySize(size,size).setDepth(y-39).setName('campaign-reactive-plant');
 state.plants.push({image,x,y,bend:0,velocity:0,touching:false,phase:state.plants.length*1.71});return image;
}

const CLUMPS:Record<JourneyArea,readonly number[][]>={
 base:[[245,500,88],[190,740,94],[880,900,82],[1100,590,88],[1140,900,90]],
 forest:[[510,1060,82],[820,1015,78],[1360,820,82],[1730,1100,92],[2350,1050,85],[2800,1160,80],[2470,1680,85],[1090,1700,75]],
 cavern:[[1130,1280,72],[2040,1360,74],[3820,1400,72],[735,1045,76],[1400,950,78],[1900,905,78],[2360,955,80],[2980,970,74],[3660,1010,78],[4450,1020,90],[5060,1100,86],[5810,1020,88]],
 warden:[[715,1100,72],[1680,1110,75],[1770,590,70]],
 valley:[[3220,1000,86],[3710,605,78],[4320,1030,90],[4790,650,86]],
 springs:[],terraces:[],
 arid:[[730,1080,80],[1530,680,78],[2360,1060,84],[3440,1050,78],[4100,655,82],[4590,1100,80]],
 dunes:[[750,800,80],[1720,1530,78],[2100,1680,82],[1410,510,76]],
 sandpit:[[680,1180,76],[1430,1080,78]],
 frost:[[790,1240,78],[1380,610,80],[2160,1230,78]],
 icecave:[[660,1220,76],[1190,610,78],[2100,1250,76]],
 icenest:[[640,1200,72],[1570,1260,76],[2060,600,74]],
 cinder:[[730,1170,74],[1530,570,76],[2240,1160,78]],
 obsidian:[[830,620,72],[1740,1210,76],[2580,630,74]],
 caldera:[[700,1190,72],[1880,1230,74],[2240,600,74]],
};

/** Bounded cosmetic motion only. No timers, tweens, physics or network state. */
export class CampaignEnvironment{
 private previous=new Map<Actor,Vec2>();
 private lastUpdate?:number;
 private lastStep?:Vec2;
 private leafIndex=0;
 private readonly leaves:{image:Phaser.GameObjects.Image;x:number;y:number;born:number;angle:number}[]=[];
 private readonly canopy:{image:Phaser.GameObjects.Image;shadow?:Phaser.GameObjects.Image;x:number;y:number;angle:number;phase:number;alpha:number}[]=[];
 private readonly dust:{image:Phaser.GameObjects.Arc;x:number;y:number;phase:number}[]=[];
 private readonly glints:Phaser.GameObjects.Ellipse[]=[];
 private readonly still=matchMedia('(prefers-reduced-motion: reduce)').matches;
 private readonly state:State;
 constructor(private scene:Phaser.Scene,readonly area:JourneyArea,bounds:MovementBounds|undefined,obstacles:readonly Obstacle[]){
  this.state=states.get(scene)!;
  for(const object of [...scene.children.list])if(object instanceof Phaser.GameObjects.Image&&['sirocco-ground','sirocco-east-ground','dunes-ground','sandpit-ground','frost-ground','glacier-ground','cinder-ground','obsidian-ground','caldera-ground'].includes(object.texture.key)){
   if(paintCampaignGround(scene,object.displayWidth,object.displayHeight,object.texture.key,object.x,object.y))object.setVisible(false);
  }
  for(const[x,y,w]of CLUMPS[area]){
   if(bounds&&(x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom))continue;
   if(obstacles.some(o=>Math.hypot(o.x-x,o.y-y)<o.radius+15))continue;
   addCampaignPlant(scene,x,y,w);
  }
  for(const object of scene.children.list){
   if(!(object instanceof Phaser.GameObjects.Image)||!['dante-canopy-green','dante-canopy-blue'].includes(object.texture.key))continue;
   scene.tweens.killTweensOf(object);this.canopy.push({image:object,x:object.x,y:object.y,angle:object.angle,phase:object.x*.007,alpha:object.alpha});
  }
  // A few real alpha boughs frame open spaces; no forest foliage in arid/ice/lava.
  const boughs:readonly number[][]=area==='base'?[[110,220,500],[1290,1010,500]]:area==='forest'?[[130,850,590],[2040,400,550]]:area==='valley'?[[230,400,540],[3120,320,500],[5100,1170,500]]:area==='springs'||area==='terraces'?[[160,310,500],[2460,1190,520]]:area==='cavern'?[[4580,280,540],[6140,1190,500]]:[];
  if(scene.textures.exists('world-overhead'))for(const[x,y,w]of boughs){
   const image=scene.add.image(x,y,'world-overhead').setDisplaySize(w,w*2/3).setDepth(14000).setAlpha(.85).setName('campaign-overhead');
   const shadow=scene.add.image(x+35,y+75,'world-overhead').setDisplaySize(w,w*.45).setTintFill(0x12201a).setAlpha(.12).setDepth(-9997);
   this.canopy.push({image,shadow,x,y,angle:0,phase:x*.007,alpha:image.alpha});
  }
  for(let i=0;i<6;i++)this.leaves.push({image:scene.add.image(0,0,'world-green-plants',3).setDisplaySize(18,18).setVisible(false).setName('campaign-step-leaf'),x:0,y:0,born:-Infinity,angle:i});
  const color=COLD.has(area)?0xd6e6ee:ASH.has(area)?0xcbb3a0:DRY.has(area)?0xcbb78b:area==='cavern'||area==='warden'?0xa9a7c8:0xe5d5a6;
  for(let i=0;i<8;i++)this.dust.push({image:scene.add.circle(0,0,COLD.has(area)?1.5:i%3===0?1.2:.7,color,.12).setDepth(13800).setName('campaign-air-mote'),x:(i*173)%1200,y:(i*127)%700,phase:i*1.73});
  if(area==='springs')for(const[x,y]of [[1250,760],[1300,780],[1800,500]])this.glints.push(scene.add.ellipse(x,y,40,9).setStrokeStyle(1,0xcbe8dc,.16).setDepth(-9997));
 }
 update(now:number,player:Actor,others:readonly Actor[]):void{
  const dt=Phaser.Math.Clamp((now-(this.lastUpdate??now-16.67))/1000,0,1/30);this.lastUpdate=now;
  const time=this.still?0:now*.001,draft=this.area==='cavern'||this.area==='warden'||this.area==='icecave'?.45:1;
  const actors=[player,...others],view=this.scene.cameras.main.worldView;
  let brushing=false;
  for(const p of this.state.plants){
   if(!p.image.active)continue;
   let push=0,contact=false,impulse=0;
   for(const actor of actors){
    if(actor.isDead)continue;const foot=actor.footOffset??(actor===player||'maxHp' in actor?39:18),dx=p.x-actor.position.x,dy=p.y-actor.position.y-foot,d=Math.hypot(dx,dy);if(d>=64)continue;
    const old=this.previous.get(actor),moved=old?Math.hypot(actor.position.x-old.x,actor.position.y-old.y):0,speed=moved<100&&dt>0?Math.min(1,moved/dt/200):0,sign=dx>=0?1:-1;
    push+=sign*(1-d/64)*(3+speed*7);if(d<45){contact=true;impulse+=sign*speed*20;if(actor===player)brushing=true;}
   }
   if(contact&&!p.touching)p.velocity+=Phaser.Math.Clamp(impulse,-25,25);p.touching=contact;
   p.velocity+=((Phaser.Math.Clamp(push,-11,11)-p.bend)*70-p.velocity*10)*dt;p.bend+=p.velocity*dt;
   p.image.setAngle(this.still?0:(Math.sin(time*.8+p.x*.002)*.9+Math.sin(time*1.35+p.phase)*.35)*draft+p.bend);
  }
  const travelled=this.lastStep?Math.hypot(player.position.x-this.lastStep.x,player.position.y-this.lastStep.y):0;
  if(!this.lastStep||travelled>32){if(brushing&&GREEN.has(this.area)&&!this.still&&!player.isDead&&travelled>0&&travelled<100){const l=this.leaves[this.leafIndex++%6];l.x=player.position.x-8;l.y=player.position.y+(player.footOffset??39);l.born=now;l.image.setVisible(true).setDepth(player.position.y-1);}this.lastStep={...player.position};}
  this.previous.clear();for(const actor of actors)if(!actor.isDead)this.previous.set(actor,{...actor.position});
  for(const l of this.leaves){const age=(now-l.born)/800;l.image.setVisible(age<1);if(age<1)l.image.setPosition(l.x+Math.sin(age*3+l.angle)*12,l.y-age*12-Math.sin(age*Math.PI)*5).setRotation(l.angle+age*1.5).setAlpha((1-age)*.62);}
  for(const c of this.canopy){
   if(!c.image.active||!view.contains(c.x,c.y)&&Math.hypot(c.x-view.centerX,c.y-view.centerY)>Math.max(view.width,view.height))continue;
   c.image.setAngle(c.angle+Math.sin(time*.52+c.phase)*.8).setY(c.y+Math.sin(time*.65+c.phase)*1.5);
   if(c.shadow)c.shadow.setPosition(c.x+35+Math.sin(time*.52+c.phase)*3,c.y+75+Math.sin(time*.65+c.phase));
   const gap=Math.hypot((player.position.x-c.x)/(c.image.displayWidth*.45),(player.position.y-c.y)/(c.image.displayHeight*.4));c.image.setAlpha(c.alpha*(.4+.6*Phaser.Math.Clamp((gap-.5)/.5,0,1)));
  }
  for(const m of this.dust)m.image.setVisible(!this.still).setPosition(view.x+(m.x+time*8*draft)%Math.max(1,view.width),view.y+(m.y+Math.sin(time*.35+m.phase)*14)%Math.max(1,view.height)).setAlpha(.07+(.5+.5*Math.sin(time*.6+m.phase))*.08);
  for(let i=0;i<this.glints.length;i++){const phase=(time*.13+i/3)%1;this.glints[i].setScale(.7+phase*.6).setAlpha(Math.sin(phase*Math.PI)*.3);}
 }
}
