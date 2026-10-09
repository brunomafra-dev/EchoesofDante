import Phaser from 'phaser';
import { EQUIPMENT, type EquipmentId } from '../config/equipment';
import type { Vec2 } from '../utils/math';
export type LootPose={id:EquipmentId;x:number;y:number};

// One reusable object per unique item, bounded to the nine-item catalogue.
export class EquipmentDrops {
  private entries=new Map<EquipmentId,{pose:LootPose;image:Phaser.GameObjects.Image;label:Phaser.GameObjects.Text;active:boolean}>();
  readonly awarded=new Set<EquipmentId>();
  constructor(private scene:Phaser.Scene){}
  add(id:EquipmentId,position:Vec2):void {
    if(this.entries.get(id)?.active)return;
    let entry=this.entries.get(id);
    if(!entry){entry={pose:{id,...position},active:true,image:this.scene.add.image(position.x,position.y,'mineral-growth').setDisplaySize(26,32).setTint(0xffbd54),
      label:this.scene.add.text(position.x,position.y-29,EQUIPMENT[id].name,{fontFamily:'Barlow Condensed',fontSize:'13px',color:'#ffdb9b',stroke:'#07120f',strokeThickness:2}).setOrigin(.5)};this.entries.set(id,entry);}
    entry.pose={id,...position};entry.active=true;entry.image.setPosition(position.x,position.y).setDepth(position.y+1).setVisible(true);
    entry.label.setPosition(position.x,position.y-29).setDepth(10003).setVisible(true);
  }
  collect(players:readonly Vec2[],grant:(id:EquipmentId)=>void):void {
    for(const e of this.entries.values())if(e.active&&players.some(p=>Math.hypot(p.x-e.pose.x,p.y-e.pose.y)<55)){
      e.active=false;e.image.setVisible(false);e.label.setVisible(false);this.awarded.add(e.pose.id);grant(e.pose.id);
    }
  }
  snapshot():LootPose[]{return[...this.entries.values()].filter(e=>e.active).map(e=>e.pose);}
  render(poses:readonly LootPose[]):void {
    const live=new Set(poses.map(p=>p.id));for(const [id,e]of this.entries)if(!live.has(id)){e.active=false;e.image.setVisible(false);e.label.setVisible(false);}
    for(const p of poses.slice(0,9))if(p.id in EQUIPMENT)this.add(p.id,p);
  }
}
