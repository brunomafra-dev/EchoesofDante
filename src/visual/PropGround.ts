import Phaser from 'phaser';

type Material='earth'|'snow'|'stone'|'sand'|'ash';
type Footing={body:Phaser.GameObjects.Image;ground:Phaser.GameObjects.Image;fixed:boolean;width:number;foot:number};
const scenes=new WeakMap<Phaser.Scene,Footing[]>();
const colors:Record<Material,[string,string,string]>={earth:['#6f6146','#a99b73','#263222'],snow:['#879798','#d6e0dd','#455b60'],stone:['#687b7e','#a4b4b4','#293f44'],sand:['#b69970','#d4bf98','#60513d'],ash:['#68605a','#a5988c','#302c2e']};
function material(scene:Phaser.Scene):Material{
 const area=scene.data.get('campaign-area');
 return area==='frost'?'snow':['icecave','icenest','cavern','warden'].includes(area)?'stone':['arid','dunes','sandpit'].includes(area)?'sand':['cinder','obsidian','caldera'].includes(area)?'ash':'earth';
}
function texture(scene:Phaser.Scene,m:Material,fixed:boolean):string{
 const area=scene.data.get('campaign-area') as string,meadow=m==='earth'&&area!=='base';
 const sourceKey=m==='earth'?(meadow?(area==='forest'?'world-floor-forest':'world-floor-meadow'):'world-floor-camp'):m==='stone'&&['cavern','warden'].includes(area)?'world-floor-cave':`route-floor-${area}`;
 const key=`prop-footing-r3-${m}-${fixed?sourceKey:'contact'}`;
 if(scene.textures.exists(key))return key;
 const t=scene.textures.createCanvas(key,256,128)!,c=t.context,[dark,light,shadow]=colors[m];
 if(fixed){
  // Reuse a small clean material sample from the approved floor, rather than
  // putting a generic flat disc on every biome. This texture is shared/cached.
  c.fillStyle=dark;c.fillRect(0,0,256,128);
  if(scene.textures.exists(sourceKey)){
   const source=scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
   const [x,y,w,h]=m==='earth'?(meadow?[.47,.46,.08,.08]:[.45,.66,.08,.08]):m==='snow'?[.2,.5,.06,.065]:[.4,.5,.06,.065];
   c.drawImage(source,source.width*x,source.height*y,source.width*w,source.height*h,0,0,256,128);
  }
  // Deterministic scuffs, compressed snow and displaced grit. No RNG state,
  // vegetation in ice, bright outline, collider or per-frame drawing.
  for(let i=0;i<65;i++){
   const x=24+(i*73%209),y=20+(i*37%89);c.globalAlpha=.12+(i%4)*.055;c.fillStyle=i%3?dark:light;
   c.beginPath();c.ellipse(x,y,2+i%4,1+i%2,-.2,0,Math.PI*2);c.fill();
  }
  c.globalAlpha=1;
  const mask=document.createElement('canvas');mask.width=256;mask.height=128;const edge=mask.getContext('2d')!;
  edge.translate(128,64);edge.scale(1,.48);const fade=edge.createRadialGradient(0,0,16,0,0,124);fade.addColorStop(0,meadow?'#fffb':'#fff');fade.addColorStop(.35,meadow?'#fff8':'#fffd');fade.addColorStop(1,'#fff0');edge.fillStyle=fade;edge.fillRect(-128,-128,256,256);
  // Break the smooth ellipse with small displaced pockets; avoid a row of
  // identical circular pads under camp furniture.
  edge.globalCompositeOperation='destination-out';for(let i=0;i<9;i++){const a=i*2.399;edge.beginPath();edge.ellipse(Math.cos(a)*107,Math.sin(a)*107,18+i%3*3,11+i%2*4,a,0,Math.PI*2);edge.fill();}
  c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);c.globalCompositeOperation='source-over';
 }
 // Soft short contact, not a second large directional cast shadow (the art
 // already contains one). Temporary objects receive this contact alone.
 c.save();c.translate(128,69);c.scale(1,.38);const contact=c.createRadialGradient(0,0,4,0,0,72);contact.addColorStop(0,shadow+'80');contact.addColorStop(.5,shadow+'48');contact.addColorStop(1,shadow+'00');c.fillStyle=contact;c.fillRect(-100,-100,200,200);c.restore();
 if(fixed&&m==='snow'){
  c.strokeStyle='#dbe4df8a';c.lineWidth=2;
  for(const x of [90,164]){c.beginPath();c.ellipse(x,65,11,4,-.08,0,Math.PI);c.stroke();}
 }
 t.refresh();return key;
}
/** Companion under a whole prop. Static textures are baked only once per
 * material/profile; one scene listener synchronizes visibility/transforms,
 * including caller changes after construction and moving cargo. */
export function groundProp(scene:Phaser.Scene,body:Phaser.GameObjects.Image,options:{fixed?:boolean;width?:number;foot?:number}={}):void{
 const fixed=options.fixed??true,m=material(scene);
 const ground=scene.add.image(body.x,body.y,texture(scene,m,fixed)).setDepth(-9887).setName('prop-footing').setData('material',m).setData('installed',fixed);
 const entry={body,ground,fixed,width:options.width??1.4,foot:options.foot??232/256};
 let list=scenes.get(scene);
 if(!list){
  list=[];scenes.set(scene,list);
  const sync=()=>{for(const e of scenes.get(scene)??[])if(e.body.active){
   const b=e.body,g=e.ground,x=b.x+(.5-b.originX)*b.displayWidth,y=b.y+(e.foot-b.originY)*b.displayHeight,w=b.displayWidth*e.width,h=w*(e.fixed?.5:.3);
   if(g.visible!==b.visible)g.setVisible(b.visible);if(g.alpha!==b.alpha)g.setAlpha(b.alpha);if(g.x!==x||g.y!==y)g.setPosition(x,y);if(g.displayWidth!==w||g.displayHeight!==h)g.setDisplaySize(w,h);
  }};
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE,sync);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{scene.events.off(Phaser.Scenes.Events.POST_UPDATE,sync);scenes.delete(scene);});
 }
 list.push(entry);body.setData('ground-footing',ground);
 body.once(Phaser.GameObjects.Events.DESTROY,()=>{ground.destroy();const list=scenes.get(scene);if(list){const i=list.indexOf(entry);if(i>=0)list.splice(i,1);}});
}
