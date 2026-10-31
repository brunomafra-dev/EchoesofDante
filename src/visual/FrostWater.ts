import Phaser from 'phaser';
import {FROST_WATER as W,coldFlow,nearColdControl,type ColdValve} from '../config/frostWater';
import type {Missions} from '../systems/Missions';
import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';
import type {Vec2} from '../utils/math';
import type {PermanenceSite} from '../config/permanence';
import {addQuestProp} from './QuestProps';

// Pipes are baked on installation. Flow/handles only change transforms or
// visibility. All state is existing durable, replicated mission evidence.
export class FrostWater{
 private installed=false;
 private labels:Phaser.GameObjects.Text[]=[];
 private handles:Phaser.GameObjects.Image[]=[];
 private stream:Phaser.GameObjects.Arc[]=[];
 private vessel?:Phaser.GameObjects.Rectangle;
 private signature='';
 private toVessel=new Phaser.Curves.Path(840,1020).cubicBezierTo(940,980,865,1005,910,1025);
 private toReturn=new Phaser.Curves.Path(840,1020).cubicBezierTo(1090,1050,930,1040,1030,1000);
 constructor(private scene:Phaser.Scene,private area:JourneyArea,private obstacles:Obstacle[]){}
 update(m:Missions,player:Vec2,now:number):void{
  if(this.area!=='frost'||!m.has('pg-mount'))return;
  if(!this.installed){
   this.installed=true;
   const g=this.scene.make.graphics({x:0,y:0});
   const hoses=[new Phaser.Curves.Path(30,10).cubicBezierTo(80,150,5,80,25,125),new Phaser.Curves.Path(80,150).cubicBezierTo(180,110,105,135,150,155),new Phaser.Curves.Path(180,110).cubicBezierTo(330,180,220,180,300,130)];
   for(const hose of hoses){const points=hose.getPoints(40);g.lineStyle(7,0x393f36,.7).strokePoints(points,false);g.lineStyle(4,0x81745a,.95).strokePoints(points,false);g.lineStyle(1,0xb2a383,.6).strokePoints(points,false);}
   const key='frost-water-pipe';if(!this.scene.textures.exists(key))g.generateTexture(key,360,200);g.destroy();
   this.scene.add.image(760,870,key).setOrigin(0).setDepth(-15).setName('frost-water-pipe');
   addQuestProp(this.scene,'coldCollector',W.body.x,W.body.y+36,132).setDepth(W.body.y-2).setName('frost-water-collector');
   this.obstacles.push({x:W.body.x,y:W.body.y-7,radius:25});
   for(const [i,p]of [W.inlet,W.bypass].entries()){
    this.handles.push(addQuestProp(this.scene,'valve',p.x,p.y+22,58).setName('frost-water-valve-'+i));
    this.obstacles.push({x:p.x,y:p.y-8,radius:13});
   }
   for(const p of [W.inlet,W.bypass,W.sample])this.labels.push(this.scene.add.text(p.x,p.y+42,'',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#dce7dc',stroke:'#182c30',strokeThickness:3}).setOrigin(.5).setDepth(11000));
   for(let i=0;i<5;i++)this.stream.push(this.scene.add.circle(0,0,3,0xb5e6e2,.85).setDepth(-14).setName('frost-water-flow'));
   this.vessel=this.scene.add.rectangle(W.body.x,W.body.y-13,7,20,0x9ddbd4,.65).setDepth(W.body.y+1).setVisible(false);
  }
  const inlet=m.has('pg-inlet-open'),closed=m.has('pg-return-closed'),filled=m.has('pg-fill'),state=coldFlow(inlet,closed),near=nearColdControl(player,W.mount)||Math.hypot(player.x-W.body.x,player.y-W.body.y)<250;
  const signature=[inlet,closed,filled].join();
  if(signature!==this.signature){this.signature=signature;this.labels[0].setText('ENTRADA · '+(inlet?'ABERTA':'FECHADA'));this.labels[1].setText('RETORNO · '+(closed?'FECHADO':'ABERTO'));this.labels[2].setText(filled?'LOTE LACRADO':'RECIPIENTE · COLETAR');this.handles[0].setTint(inlet?0xd1e4bc:0xbab8a5);this.handles[1].setTint(closed?0xd1e4bc:0xbab8a5);}
  this.labels.forEach(l=>l.setVisible(near&&!filled));
  this.vessel?.setVisible(filled||state==='vessel');
  for(const [i,s]of this.stream.entries()){
   s.setVisible(!filled&&state!=='dry');const t=(now*.00045+i/5)%1;
   const point=(state==='return'?this.toReturn:this.toVessel).getPoint(t);s.setPosition(point.x,point.y);
  }
 }
 at(p:Vec2,m:Missions):PermanenceSite|undefined{
  if(this.area!=='frost'||m.status('settle-frost')!=='active'||!m.has('pg-mount')||m.has('pg-fill'))return;
  for(const[node,q,name]of [['inlet',W.inlet,'Válvula de entrada'],['bypass',W.bypass,'Válvula de retorno'],['sample',W.sample,'Recipiente térmico']] as const){
   if(nearColdControl(p,q))return{id:node==='sample'?'pg-fill':node==='inlet'?'pg-inlet-open':'pg-return-closed',mission:'settle-frost',area:'frost',...q,radius:W.radius,name,art:'water',action:node==='sample'?'LACRAR LOTE':'GIRAR VÁLVULA',finding:'',coldValve:node};
  }
 }
 interact(node:ColdValve,m:Missions):string{
  if(this.area!=='frost'||m.status('settle-frost')!=='active'||!m.has('pg-mount')||m.has('pg-fill'))return 'O coletor está recolhido ou o lote já foi lacrado.';
  if(node!=='sample'){
   const id=node==='inlet'?'pg-inlet-open':'pg-return-closed';m.setColdValve(id,!m.has(id));
   return node==='inlet'?(m.has(id)?'Entrada aberta. Observe para onde a água segue.':'Entrada fechada. O recipiente não recebe água.'):(m.has(id)?'Retorno fechado. Confira o caminho até o recipiente.':'Retorno aberto. A água escoa pela mangueira externa.');
  }
  const flow=coldFlow(m.has('pg-inlet-open'),m.has('pg-return-closed'));
  if(flow==='dry')return 'O recipiente está vazio. A entrada continua fechada; observe as válvulas do coletor.';
  if(flow==='return')return 'A água escapa pela mangueira de retorno. O recipiente não recebe o lote; ajuste o caminho antes de lacrar.';
  m.record('pg-fill');
  return 'LOTE TÉRMICO LACRADO\nA coleta protegida conservou a amostra. Água morna ainda precisa do tratamento de Lia; nenhum item pessoal foi consumido.';
 }
}
