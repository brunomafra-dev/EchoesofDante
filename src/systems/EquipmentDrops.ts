import Phaser from 'phaser';
import { EQUIPMENT,RARITY_COLORS,validItem,type EquipmentId,type InventoryItem } from '../config/equipment';
import type { Vec2 } from '../utils/math';
export type LootPose=InventoryItem&{x:number;y:number;owner:'host'|'guest';classId:'warrior'|'hunter'};
export const PICKUP_RADIUS=64;
export function itemIcon(id:EquipmentId,classId='warrior'):string {const d=EQUIPMENT[id];return `${d.slot==='weapon'?classId+'-weapon':d.slot}-${d.tier}`;}
export function preloadItemIcons(scene:Phaser.Scene):void {
 for(const tier of [1,2,3])for(const slot of ['helmet','armor','legs','boots','gloves','accessory','warrior-weapon','hunter-weapon']){
  const key=`${slot}-${tier}`;if(!scene.textures.exists('item-'+key))scene.load.image('item-'+key,`${import.meta.env.BASE_URL}assets/items/${key}.png`);}
}
type Entry={pose:LootPose;image:Phaser.GameObjects.Image;label:Phaser.GameObjects.Text;active:boolean};
// At most 24 ground items per participant/region. Views are pooled and reused.
export class EquipmentDrops {
 private entries:Entry[]=[];
 constructor(private scene:Phaser.Scene,private viewer:'host'|'guest'='host'){}
 add(id:EquipmentId,position:Vec2,owner:'host'|'guest'='host',classId:'warrior'|'hunter'='warrior',uid=crypto.randomUUID()):LootPose|undefined {
  if(this.entries.filter(e=>e.active&&e.pose.owner===owner).length>=24)return;
  const pose={uid,id,...position,owner,classId};this.show(pose);return pose;
 }
 private show(pose:LootPose):void {
  let entry=this.entries.find(e=>e.pose.uid===pose.uid)??this.entries.find(e=>!e.active);
  if(!entry){entry={pose,active:false,image:this.scene.add.image(0,0,'item-'+itemIcon(pose.id,pose.classId)),label:this.scene.add.text(0,0,'',{fontFamily:'Barlow Condensed',fontSize:'13px',stroke:'#07120f',strokeThickness:3}).setOrigin(.5)};this.entries.push(entry);}
  entry.pose=pose;entry.active=true;const visible=pose.owner===this.viewer;
  entry.image.setTexture('item-'+itemIcon(pose.id,pose.classId)).setDisplaySize(30,30).setPosition(pose.x,pose.y).setDepth(pose.y+1).setVisible(visible);
  entry.label.setText(EQUIPMENT[pose.id].name).setColor(RARITY_COLORS[EQUIPMENT[pose.id].rarity]).setPosition(pose.x,pose.y-22).setDepth(10003).setVisible(visible);
 }
 nearest(position:Vec2,owner:'host'|'guest'=this.viewer):LootPose|undefined {
  let nearest:LootPose|undefined,range=PICKUP_RADIUS;
  for(const e of this.entries)if(e.active&&e.pose.owner===owner){const d=Math.hypot(e.pose.x-position.x,e.pose.y-position.y);if(d<range){range=d;nearest=e.pose;}}return nearest;
 }
 take(uid:string):void {const e=this.entries.find(e=>e.active&&e.pose.uid===uid);if(e){e.active=false;e.image.setVisible(false);e.label.setVisible(false);}}
 snapshot():LootPose[]{return this.entries.filter(e=>e.active).map(e=>({...e.pose}));}
 render(poses:readonly LootPose[]):void {
  const safe=poses.slice(0,48).filter(p=>validItem(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y));const live=new Set(safe.map(p=>p.uid));
  for(const e of this.entries)if(!live.has(e.pose.uid)){e.active=false;e.image.setVisible(false);e.label.setVisible(false);}for(const p of safe)this.show(p);
 }
}
