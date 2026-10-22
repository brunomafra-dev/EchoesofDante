import Phaser from 'phaser';
import {REGIONAL_SITES,type RegionalSite} from '../config/regionalExpeditions';
import type {JourneyArea} from './LocalJourney';
import type {MovementBounds,Obstacle} from './Movement';
import type {Missions} from './Missions';
import type {Vec2} from '../utils/math';
import {safeExpeditionPosition} from './ExpeditionReturn';
import {EnvironmentPainter} from '../visual/EnvironmentArt';
import {addSurveyProp} from '../visual/MissionProps';

// Three authored pockets per region, baked once on first access. No generated
// map, waves, dynamic shadows or additional player/combat framework.
export class RegionalExpeditions {
 readonly sites:RegionalSite[]=[];
 private labels:{site:RegionalSite;text:Phaser.GameObjects.Text}[]=[];
 private tick=0;
 constructor(private scene:Phaser.Scene,private area:JourneyArea,private geometry:()=>{bounds?:MovementBounds;obstacles:readonly Obstacle[]}){}
 update(missions:Missions,player:Vec2,now:number):void{
  if(now<this.tick)return;this.tick=now+200;
  const {bounds,obstacles}=this.geometry();
  for(const authored of REGIONAL_SITES.filter(s=>s.area===this.area)){
   if(this.sites.some(s=>s.id===authored.id))continue;
   if(bounds&&(authored.x<bounds.left||authored.x>bounds.right||authored.y<bounds.top||authored.y>bounds.bottom))continue;
   const clear=safeExpeditionPosition(authored,24,obstacles,bounds);if(!clear)continue;
   const site={...authored,...clear};this.sites.push(site);this.bake(site);
  }
  for(const {site,text}of this.labels){
   const near=Math.hypot(player.x-site.x,player.y-site.y)<210,done=missions.has(site.id);
   text.setVisible(near);const value=`${done?'✓':'◇'} ${site.name}`;
   if(text.text!==value)text.setText(value).setColor(done?'#a8c99a':'#e5d2a6');
  }
 }
 private bake(site:RegionalSite):void{
  const ice=['frost','icecave'].includes(this.area),sand=['arid','dunes'].includes(this.area),lava=['cinder','obsidian','caldera'].includes(this.area);
  const tint=ice?0xa9c6d5:sand?0xcbb080:lava?0xb69a82:0xa1b295;
  const cache=this.scene.add.renderTexture(site.x-256,site.y-192,512,384).setOrigin(0).setDepth(-9890);
  const painter=new EnvironmentPainter(this.scene,cache);
  // Irregular low ground, a shallow approach and small base transitions.
  for(const[dx,dy,w,h]of [[-135,85,220,75],[-65,40,190,110],[0,0,230,150]])painter.sediment(site.x+dx,site.y+dy,w,h,tint,.2);
  painter.apron(site.x,site.y+6,90,tint);
  for(const[dx,dy]of [[-145,-65],[130,90]])painter.stamp({key:'world-rock',x:site.x+dx,y:site.y+dy,width:42,height:28,tint,alpha:.8});
  if(site.art==='record')painter.stamp({key:'ancient-remnant',x:site.x,y:site.y-17,width:135,height:87,tint});
  else if(site.art==='mineral')painter.stamp({key:'deep-mineral',x:site.x,y:site.y-17,width:105,height:75,tint});
  else addSurveyProp(this.scene,site.art,site.x,site.y);
  painter.destroy();
  const text=this.scene.add.text(site.x,site.y+52,'',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#e5d2a6',stroke:'#101c18',strokeThickness:3}).setOrigin(.5).setDepth(11000).setVisible(false);
  this.labels.push({site,text});
 }
 at(position:Vec2):RegionalSite|undefined{return this.sites.find(s=>Math.hypot(position.x-s.x,position.y-s.y)<s.radius);}
}
