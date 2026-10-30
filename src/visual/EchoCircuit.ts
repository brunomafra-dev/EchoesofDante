import Phaser from 'phaser';
import {addQuestProp} from './QuestProps';
import {ECHO_CIRCUIT as C,circuitFlags,circuitTurn,circuitTarget,circuitPath,circuitLength,circuitPoint,type CircuitNode,type CircuitPulse} from '../config/echoCircuit';
import type {Missions} from '../systems/Missions';
import type {PermanenceSite} from '../config/permanence';
import type {Obstacle} from '../systems/Movement';
import type {Vec2} from '../utils/math';

// Whole existing ruins/equipment; floor connections are cached images. Only
// transforms/alpha change during play. All interaction decisions run on host.
export class EchoCircuit{
 private nodes=new Map<string,{body:Phaser.GameObjects.Image;ray?:Phaser.GameObjects.Image;label:Phaser.GameObjects.Text}>();
 private light?:Phaser.GameObjects.Image;
 private pulse?:CircuitPulse;
 private visible=false;
 private installed=false;
 private archived=false;
 constructor(private scene:Phaser.Scene,private area:string,private solids:Obstacle[]){
  if(!scene.textures.exists('echo-circuit-ray')){const t=scene.textures.createCanvas('echo-circuit-ray',64,8)!;const g=t.context.createLinearGradient(0,0,0,8);g.addColorStop(0,'#c8afff00');g.addColorStop(.5,'#c8afff');g.addColorStop(1,'#c8afff00');t.context.fillStyle=g;t.context.fillRect(0,0,64,8);t.refresh();}
  if(!scene.textures.exists('echo-circuit-glow')){const t=scene.textures.createCanvas('echo-circuit-glow',32,32)!;const g=t.context.createRadialGradient(16,16,1,16,16,16);g.addColorStop(0,'#ffffff');g.addColorStop(.2,'#ecdeff');g.addColorStop(.5,'#bba2ef99');g.addColorStop(1,'#bba2ef00');t.context.fillStyle=g;t.context.fillRect(0,0,32,32);t.refresh();}
  if(area!=='cavern')return;

  for(const key of ['source','a','b','sink'] as const){const p=C[key];
   const body=(key==='source'?addQuestProp(scene,'emitter',p.x,p.y+22,72):scene.add.image(p.x,p.y-20,'deep-relay').setDisplaySize(64,70).setDepth(p.y-15)).setVisible(false).setName('echo-circuit-'+key);
   const label=scene.add.text(p.x,p.y+44,key==='source'?'EMISSOR ISOLADO':key==='sink'?'RETORNO DO REGISTRO':`DESVIADOR ${key==='a'?'I':'II'}`,{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#d5cbe8',stroke:'#14212a',strokeThickness:3}).setOrigin(.5).setDepth(11000).setVisible(false);
   const ray=key==='sink'?undefined:scene.add.image(p.x,p.y,'echo-circuit-ray').setOrigin(0,.5).setDepth(-5).setVisible(false).setName('echo-circuit-link-'+key);
   this.nodes.set(key,{body,ray,label});
  }
  this.light=scene.add.image(C.source.x,C.source.y,'echo-circuit-glow').setDisplaySize(28,28).setDepth(10999).setVisible(false).setName('echo-circuit-pulse');
 }
 private active(m:Missions):boolean{return this.area==='cavern'&&m.status('settle-echo')==='active'&&m.has('pr-origin')&&!m.has('pr-flow');}
 at(p:Vec2,m:Missions):PermanenceSite|undefined{
  if(!this.active(m))return;
  const key=(['source','a','b'] as const).find(key=>Math.hypot(p.x-C[key].x,p.y-C[key].y)<C.radius);if(!key)return;
  return{id:'pr-flow',mission:'settle-echo',area:'cavern',...C[key],radius:C.radius,name:key==='source'?'Emissor de comparação':`Desviador ${key==='a'?'I':'II'}`,art:'record',action:key==='source'?'EMITIR PULSO':'GIRAR',finding:'',circuit:key};
 }
 interact(key:CircuitNode,m:Missions,now:number):string{
  if(!this.active(m))return 'O circuito aguarda a comparação com o Primeiro Eco.';
  if(this.pulse)return 'O pulso está percorrendo a ligação. Observe onde a luz termina.';
  if(key==='source'){this.pulse={at:now,...circuitPath(circuitTurn('a',id=>m.has(id)),circuitTurn('b',id=>m.has(id)))};return 'Pulso de comparação emitido. Acompanhe a luz entre os desviadores e o retorno do registro.';}
  const turn=(circuitTurn(key,id=>m.has(id))+1)%3,[one,two]=circuitFlags(key);
  m.setCircuitTurn(one,two,turn);
  return 'Desviador girado. A nervura iluminada mostra a nova direção; emita outro pulso quando a ligação estiver pronta.';
 }
 update(m:Missions,player:Vec2,now:number,authority:boolean,remote?:CircuitPulse):boolean{
  if(this.area==='base'&&m.has('pr-store')&&!this.archived){this.archived=true;
   addQuestProp(this.scene,'routeArchive',1250,610,75).setName('echo-route-archive');this.solids.push({x:1250,y:595,radius:17});
   this.scene.add.text(1250,635,'MAPA DOS RETORNOS',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#d5cbe8',stroke:'#14212a',strokeThickness:3}).setOrigin(.5).setDepth(11000);
  }
  if(this.area!=='cavern')return false;
  const installed=m.has('pr-origin');
  if(installed&&!this.installed){this.installed=true;for(const key of ['source','a','b','sink'] as const){const p=C[key];this.solids.push({x:p.x,y:p.y-(key==='source'?16:28),radius:key==='source'?20:16});}}
  if(!authority)this.pulse=remote&&Number.isFinite(remote.at)&&Array.isArray(remote.path)&&remote.path.length>=2&&remote.path.length<=4&&remote.path.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))?remote:undefined;
  const active=this.active(m);this.visible=installed;
  for(const [key,n]of this.nodes){n.body.setVisible(this.visible);n.label.setVisible(active&&key!=='source'&&key!=='sink'&&Math.hypot(player.x-n.body.x,player.y-n.body.y)<530);if(n.ray){const p=C[key as CircuitNode],q=key==='source'?C.a:circuitTarget(key as 'a'|'b',circuitTurn(key as 'a'|'b',id=>m.has(id)));n.ray.setVisible(installed).setRotation(Math.atan2(q.y-p.y,q.x-p.x)).setDisplaySize(Math.hypot(q.x-p.x,q.y-p.y),5).setAlpha(m.has('pr-flow')?.5:.24);}}
  this.light?.setVisible(!!this.pulse&&active);
  if(!this.pulse)return false;
  const travelled=Math.max(0,(now-this.pulse.at)/1000*C.speed),point=circuitPoint(this.pulse.path,travelled);this.light?.setPosition(point.x,point.y).setTint(this.pulse.success?0xe1d4ff:0xffcc8b);
  if(authority&&travelled>=circuitLength(this.pulse.path)){const success=this.pulse.success;this.pulse=undefined;if(success&&active){m.record('pr-flow');return true;}}
  return false;
 }
 snapshot():CircuitPulse|undefined{return this.pulse?{...this.pulse,path:this.pulse.path.map(p=>({...p}))}:undefined;}
}
