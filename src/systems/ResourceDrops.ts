import Phaser from 'phaser';
import type {Vec2} from '../utils/math';
export type ResourceDrop={uid:string;x:number;y:number;owner:'host'|'guest';tier:number;credits:number;amount:number};
type Entry={pose:ResourceDrop;active:boolean;image:Phaser.GameObjects.Image};
export class ResourceDrops{
 private entries:Entry[]=[];
 constructor(private scene:Phaser.Scene,private viewer:'host'|'guest'){}
 add(position:Vec2,tier:number,owner:'host'|'guest',boss=false){if(this.entries.filter(e=>e.active&&e.pose.owner===owner).length>=32)return;this.show({uid:crypto.randomUUID(),...position,owner,tier,credits:(boss?25:4)*tier,amount:boss?6:1})}
 private show(pose:ResourceDrop){let e=this.entries.find(e=>e.pose.uid===pose.uid)??this.entries.find(e=>!e.active);if(!e){e={pose,active:true,image:this.scene.add.image(0,0,'resource-'+pose.tier)};this.entries.push(e)}e.pose=pose;e.active=true;e.image.setTexture('resource-'+pose.tier).setPosition(pose.x,pose.y).setDisplaySize(24,24).setDepth(pose.y+.5).setVisible(pose.owner===this.viewer)}
 collect(position:Vec2,owner:'host'|'guest',accept:(pose:ResourceDrop)=>boolean){for(const e of this.entries)if(e.active&&e.pose.owner===owner&&Math.hypot(e.pose.x-position.x,e.pose.y-position.y)<48&&accept(e.pose)){e.active=false;e.image.setVisible(false)}}
 snapshot(){return this.entries.filter(e=>e.active).map(e=>({...e.pose}))}
 render(poses:ResourceDrop[]=[]){const safe=poses.slice(0,64).filter(p=>p&&/^[a-zA-Z0-9_-]{1,96}$/.test(p.uid)&&[1,2,3].includes(p.tier)&&Number.isFinite(p.x)&&Number.isFinite(p.y));const live=new Set(safe.map(p=>p.uid));for(const e of this.entries)if(!live.has(e.pose.uid)){e.active=false;e.image.setVisible(false)}for(const p of safe)this.show(p)}
}
