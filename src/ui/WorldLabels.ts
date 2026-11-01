import Phaser from 'phaser';
import type {MissionId} from '../config/missions';
import type {Vec2} from '../utils/math';

type Label={text:Phaser.GameObjects.Text;mission?:MissionId;range:number;priority:number};
const scenes=new WeakMap<Phaser.Scene,{labels:Label[];next:number}>();

// Labels keep their authored eligibility/visibility. This bounded layout only
// controls text alpha and scale; props, physics and their opacity are untouched.
export function worldLabel(scene:Phaser.Scene,text:Phaser.GameObjects.Text,options:{mission?:MissionId;range?:number;priority?:number}={}):Phaser.GameObjects.Text{
 let state=scenes.get(scene);
 if(!state){state={labels:[],next:0};scenes.set(scene,state);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scenes.delete(scene));}
 if(!state.labels.some(l=>l.text===text))state.labels.push({text,mission:options.mission,range:options.range??185,priority:options.priority??0});
 text.setData('context-label',true).setDepth(11000).setPadding(4,2).setWordWrapWidth(190).setAlign('center').setBackgroundColor('rgba(7,20,17,0.82)').setAlpha(0);
 return text;
}

export function layoutWorldLabels(scene:Phaser.Scene,player:Vec2,current:MissionId|undefined,now:number):void{
 const state=scenes.get(scene);if(!state||now<state.next)return;state.next=now+100;
 const zoom=scene.cameras.main.zoom;
 const cssScale=scene.game.canvas.getBoundingClientRect().width/scene.scale.gameSize.width;
 const candidates:({entry:Label;score:number;bounds:Phaser.Geom.Rectangle})[]=[];
 const hero=new Phaser.Geom.Rectangle(player.x-26,player.y-85,52,90);
 for(const entry of state.labels){
  const text=entry.text;if(!text.active)continue;
  const gap=Math.hypot(player.x-text.x,player.y-(text.y-35));
  const scale=Math.min(8,Math.max(1,12/(parseFloat(text.style.fontSize as string)*zoom*cssScale)));
  if(text.scaleX!==scale)text.setScale(scale);
  if(text.visible&&text.text&&gap<=entry.range){
   const bounds=text.getBounds();
   if(!Phaser.Geom.Intersects.RectangleToRectangle(hero,bounds))candidates.push({entry,bounds,score:entry.priority+(entry.mission===current&&current?8:0)+(gap<100?6:0)-gap/18});
  }
  if(text.alpha!==0)text.setAlpha(0);
 }
 candidates.sort((a,b)=>b.score-a.score);
 const shown:Phaser.Geom.Rectangle[]=[];
 for(const candidate of candidates){
  if(shown.length>=2)break;
  const rect=Phaser.Geom.Rectangle.Clone(candidate.bounds);Phaser.Geom.Rectangle.Inflate(rect,9/zoom,5/zoom);
  if(shown.some(other=>Phaser.Geom.Intersects.RectangleToRectangle(rect,other)))continue;
  candidate.entry.text.setAlpha(1);shown.push(rect);
 }
}
