import Phaser from 'phaser';
import {coopSession as room} from '../network/CoopSession';
import type {Player} from '../entities/Player';

type Tag={name:Phaser.GameObjects.Text;bubble:Phaser.GameObjects.Text;stem:Phaser.GameObjects.Rectangle;message:string};
// The same presentation for local and remote heroes. At most eight Text objects.
export class CoopNames{
 readonly tags=new Map<string,Tag>();
 constructor(private readonly scene:Phaser.Scene,private readonly players:()=>Map<string,Player>){
  scene.game.events.on('poststep',this.update);
  scene.events.once('shutdown',()=>{scene.game.events.off('poststep',this.update);for(const t of this.tags.values()){t.name.destroy();t.bubble.destroy();t.stem.destroy();}this.tags.clear();});
 }
 private update=():void=>{
  const active=(room.role==='host'||room.role==='guest')&&!room.endedMessage;
  if(!active&&!this.tags.size)return;
  const members=active?room.members:[],live=new Set(members.map(m=>m.id)),players=this.players(),now=performance.now();
  for(const [id,t]of this.tags)if(!live.has(id)){t.name.destroy();t.bubble.destroy();t.stem.destroy();this.tags.delete(id);}
  for(const member of members){
   const p=players.get(member.id);if(!p)continue;
   let t=this.tags.get(member.id);
   if(!t){const style={fontFamily:'Barlow Condensed, sans-serif',fontSize:'13px',color:'#e2e7d7',stroke:'#0b1412',strokeThickness:3};
    t={name:this.scene.add.text(0,0,member.profile.name,style).setName('coop-name-'+member.id).setOrigin(.5,1).setDepth(23000),bubble:this.scene.add.text(0,0,'',{...style,fontSize:'12px',backgroundColor:'#10201c',padding:{x:6,y:4},wordWrap:{width:168,useAdvancedWrap:true}}).setName('coop-speech-'+member.id).setOrigin(.5,1).setDepth(23001).setVisible(false),stem:this.scene.add.rectangle(0,0,1,1,0xb3c09e,.4).setOrigin(.5,0).setDepth(22999).setVisible(false),message:''};this.tags.set(member.id,t);}
   t.name.setText(member.profile.name).setPosition(p.position.x,p.position.y-94);
   const speech=room.speech.get(member.id);
   if(speech&&speech.until>now){
    if(t.message!==speech.id){const lines=t.bubble.getWrappedText(speech.text);t.bubble.setText(lines.slice(0,3).map((line,i)=>i===2&&lines.length>3?line.slice(0,-1)+'…':line).join('\n'));t.message=speech.id;}
    t.bubble.setPosition(p.position.x,p.position.y-113).setVisible(true);
   }else{t.bubble.setVisible(false);if(speech)room.speech.delete(member.id);}t.stem.setVisible(false);
  }
  // Recent speech stays closest to its author. Older nearby bubbles stack
  // above it, with a quiet contact line rather than overlapping text.
  const placed:Phaser.Geom.Rectangle[]=[];
  const speaking=[...this.tags].filter(([,t])=>t.bubble.visible).sort(([a],[b])=>(room.speech.get(b)?.until??0)-(room.speech.get(a)?.until??0));
  for(const [,t]of speaking){
   const anchor=t.bubble.y;
   for(let pass=0;pass<4;pass++){let changed=false;const box=t.bubble.getBounds();for(const other of placed)if(Phaser.Geom.Intersects.RectangleToRectangle(box,other)){t.bubble.y=other.top-6;changed=true;break;}if(!changed)break;}
   const gap=anchor-t.bubble.y;t.stem.setPosition(t.bubble.x,t.bubble.y).setDisplaySize(1,Math.max(1,gap)).setVisible(gap>0);placed.push(t.bubble.getBounds());
  }
 };
}
