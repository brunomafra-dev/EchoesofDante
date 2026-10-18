import type { CharacterClass } from '../systems/CharacterProfiles';
import { characterSex,type CharacterSex } from '../config/appearance';
import { COMPLETE_FRAME,COMPLETE_FEET,completeFrame,completeMuzzle } from '../visual/CompleteActorFrames';
const images=new Map<string,Promise<HTMLImageElement>>();
function image(path:string):Promise<HTMLImageElement>{
 let p=images.get(path);
 if(!p){p=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Prévia indisponível'));img.src=import.meta.env.BASE_URL+'assets/visual/'+path;});images.set(path,p);}return p;
}
// Same complete painted poses as gameplay. No articulated anatomy in the menu.
export class CharacterShowcase {
 readonly canvas=document.createElement('canvas');readonly caption=document.createElement('span');
 private readonly ctx:CanvasRenderingContext2D;private atlas?:HTMLImageElement;private pet?:HTMLImageElement;
 private raf=0;private disposed=false;private started=0;private lastPaint=-Infinity;
 private pendingDemo=false;private pendingManual=false;private ready=false;
 constructor(readonly classId:CharacterClass,readonly sex:CharacterSex=characterSex(classId)){
  this.canvas.className='showcase-canvas';this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label',({warrior:'Guerreiro Galáctico',hunter:'Star Hunter',astral:'Manipulador Astral',xenobinder:'Domador de feras'})[classId]);this.canvas.dataset.representation='complete';
  const ratio=Math.min(2,window.devicePixelRatio||1);this.canvas.width=320*ratio;this.canvas.height=360*ratio;this.ctx=this.canvas.getContext('2d')!;this.ctx.scale(ratio,ratio);
  this.caption.className='showcase-caption';this.caption.textContent='PREPARADO PARA DANTE';
  void Promise.all([image(`complete-actors/${classId}-${sex}-none.png`).then(img=>this.atlas=img),classId==='xenobinder'?image('characters/dante-symbiont-motion.png').then(img=>this.pet=img):Promise.resolve()]).then(()=>{if(this.disposed)return;this.ready=true;this.paint(-1);if(this.pendingDemo)this.play(this.pendingManual);}).catch(()=>{if(!this.disposed)this.caption.textContent='PRÉVIA INDISPONÍVEL';});
 }
 play(manual=false):void{this.pendingDemo=true;this.pendingManual=manual;if(!this.ready||this.disposed)return;if(!manual&&matchMedia('(prefers-reduced-motion: reduce)').matches){this.paint(-1);return;}cancelAnimationFrame(this.raf);this.started=performance.now();this.lastPaint=-Infinity;this.raf=requestAnimationFrame(this.tick);}
 stop():void{cancelAnimationFrame(this.raf);this.raf=0;this.pendingDemo=false;if(this.ready&&!this.disposed)this.paint(-1);}
 destroy():void{this.disposed=true;cancelAnimationFrame(this.raf);this.raf=0;}
 private tick=(now:number):void=>{if(this.disposed)return;const t=(now-this.started)/1000;if(t>=3.8){this.raf=0;this.pendingDemo=false;this.paint(-1);return;}if(now-this.lastPaint>=1000/24){this.lastPaint=now;this.paint(t);}this.raf=requestAnimationFrame(this.tick);};
 private paint(t:number):void{
  const c=this.ctx;c.clearRect(0,0,320,360);const dash=t>=1.15&&t<1.8,charge=t>=2&&t<3.05,release=t>=3.05&&t<3.45,strike=t>=.25&&t<.95;
  const phase=dash?'dash':charge?'charge':release?'release':strike?'attack':'idle';this.canvas.dataset.demoPhase=phase;this.canvas.dataset.facing='front';
  this.caption.textContent=charge?'SEGURAR · MIRAR':release?'SOLTAR · EXECUTAR':dash?'REPOSICIONAMENTO':strike?({warrior:'ATAQUE DO SABRE',hunter:'DISPARO DE PULSO',astral:'PULSO ELEMENTAL',xenobinder:'ASSISTÊNCIA DO SIMBIONTE'})[this.classId]:({warrior:'FORÇA · RESISTÊNCIA',hunter:'PRECISÃO · MOBILIDADE',astral:'ENERGIA ASTRAL · CONTROLE',xenobinder:'VÍNCULO · SIMBIOSE'})[this.classId];
  const aim=strike||charge||release?Math.PI/4:Math.PI/2,frame=completeFrame(aim,Math.max(0,t-1.15)*180,dash,strike||charge||release,this.classId);this.canvas.dataset.frame=String(frame);
  c.save();c.translate(this.classId==='xenobinder'?123:160,224);c.scale(2.25,2.25);if(dash)c.translate(-Math.sin((t-1.15)/.65*Math.PI)*(this.classId==='hunter'?17:12),0);
  c.fillStyle='#00000055';c.beginPath();c.ellipse(0,39,28,8,0,0,Math.PI*2);c.fill();c.fillStyle='#050c0a88';c.beginPath();c.ellipse(0,39,16,4,0,0,Math.PI*2);c.fill();
  if(this.atlas)c.drawImage(this.atlas,frame%4*COMPLETE_FRAME,Math.floor(frame/4)*COMPLETE_FRAME,COMPLETE_FRAME,COMPLETE_FRAME,-64,39-COMPLETE_FEET*128/COMPLETE_FRAME,128,128);
  const p=completeMuzzle(this.classId,aim);
  if(charge){c.strokeStyle=this.classId==='xenobinder'?'#6bb464':'#5fe6d8';c.lineWidth=2;c.beginPath();c.arc(0,0,44,-Math.PI/2,-Math.PI/2+(t-2)/1.05*Math.PI*2);c.stroke();}
  if(strike||release){c.save();c.translate(p.x,p.y);c.rotate(aim);c.fillStyle=this.classId==='xenobinder'?'#a6dc94':'#5fe6d8';if(this.classId==='hunter')c.fillRect(0,release?-3:-1,release?110:12,release?6:2);else if(this.classId==='warrior'){c.strokeStyle='#5fe6d888';c.lineWidth=3;c.beginPath();c.arc(0,0,36,-.7,.4);c.stroke();}else{c.beginPath();c.ellipse(release?25:8,0,release?13:4,release?7:2,0,0,Math.PI*2);c.fill();}c.restore();}
  if(this.pet){const f=release?5:charge?4:strike?3:dash?1+Math.floor(t*8)%2:0;c.fillStyle='#07180b66';c.beginPath();c.ellipse(43,40,21,5,0,0,Math.PI*2);c.fill();c.drawImage(this.pet,f%4*256,Math.floor(f/4)*256,256,256,15,39-55*244/256,55,55);}
  c.restore();
 }
}
