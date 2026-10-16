import type { CharacterClass } from '../systems/CharacterProfiles';
import { hunterRiflePose } from '../visual/HunterRiflePose';
import { characterSex, type CharacterSex } from '../config/appearance';
import type {ShoulderSockets} from '../visual/ClothShoulders';
import {CASTER_WALK,CASTER_COLUMNS,CASTER_INSTRUMENTS,casterTargets} from '../visual/CasterPose';
import type {PaintedArmPart} from '../visual/PaintedArmFrames';
import { heldArm, newArm, paintedSegment, paintedHand, projectShoulder, warriorHand } from '../visual/HumanPose';

const images = new Map<string, Promise<HTMLImageElement>>();
const base = `${import.meta.env.BASE_URL}assets/visual/characters/`;
function image(name: string): Promise<HTMLImageElement> {
  let result = images.get(name);
  if (!result) {
    result = new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Prévia indisponível'));
      img.src = base + name;
    });
    images.set(name, result);
  }
  return result;
}

// Menu-only illustration playback. Uses the actual painted body/arm/weapon
// atlases, no Phaser instance, simulation, enemies, sound or gameplay timers.
export class CharacterShowcase {
  readonly canvas = document.createElement('canvas');
  readonly caption = document.createElement('span');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly loaded = new Map<string, HTMLImageElement>();
  private armBounds:PaintedArmPart[]=[];
  private shoulderSockets:ShoulderSockets[]=[];
  private raf = 0;
  private disposed = false;
  private started = 0;
  private lastPaint = -Infinity;
  private pendingDemo = false;
  private pendingManual = false;
  private ready = false;
  private readonly bodyName: string;
  constructor(readonly classId: CharacterClass, readonly sex: CharacterSex = characterSex(classId)) {
    this.bodyName = `wardrobe-${classId}-${sex}-none.png`;
    this.canvas.className = 'showcase-canvas'; this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', classId === 'astral' ? 'Manipulador Astral com manopla tecnológica' : classId === 'hunter' ? 'Star Hunter com rifle de pulso' : 'Guerreiro Galáctico com sabre de energia');
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = 320 * ratio; this.canvas.height = 360 * ratio;
    this.ctx = this.canvas.getContext('2d')!; this.ctx.scale(ratio, ratio);
    this.caption.className = 'showcase-caption'; this.caption.textContent = 'PREPARADO PARA DANTE';
    if(classId==='xenobinder')this.canvas.setAttribute('aria-label','Domador de feras com condutor e companheiro simbionte');
    const names = classId === 'xenobinder'?[this.bodyName,'xenobinder-arm-none.png','xenobinder-starter-weapon.png','dante-symbiont-motion.png']:classId === 'astral'?[this.bodyName,'astral-arm-none.png','astral-starter-weapon.png']:classId === 'hunter' ? [this.bodyName,'hunter-starter-weapon.png','expedition-arm-kit.png'] :
      [this.bodyName, 'expedition-arm-kit.png', 'warrior-starter-weapon.png'];
    void Promise.all(names.map(async name => this.loaded.set(name, await image(name)))).then(async () => {
      if (this.disposed) return;
      if (this.disposed) return;
      if(classId!=='astral'&&classId!=='xenobinder'){
        const registration=await fetch(base+'character-arm-registration.json').then(r=>r.json());
        this.armBounds=registration['expedition-arm-kit'];
        const shoulders=await fetch(base+'character-shoulder-registration.json').then(r=>r.json());
        this.shoulderSockets=shoulders[`${classId}-${sex}`];
      }else{
        const [registration,shoulders]=await Promise.all([
          fetch(base+'caster-arm-registration.json').then(r=>r.json()),
          fetch(base+classId+'-shoulders.json').then(r=>r.json()),
        ]);
        this.armBounds=registration[`${classId}-arm-none`];
        this.shoulderSockets=shoulders.byStyle[sex].none;
      }
      if(this.disposed)return;
      this.ready = true; this.paint(-1);
      if (this.pendingDemo) this.play(this.pendingManual);
    }).catch(() => { if (!this.disposed) this.caption.textContent = 'PRÉVIA INDISPONÍVEL'; });
  }
  play(manual = false): void {
    this.pendingDemo = true; this.pendingManual = manual;
    if (!this.ready || this.disposed) return;
    if (!manual && matchMedia('(prefers-reduced-motion: reduce)').matches) { this.paint(-1); return; }
    cancelAnimationFrame(this.raf); this.started = performance.now(); this.lastPaint = -Infinity;
    this.raf = requestAnimationFrame(this.tick);
  }
  stop(): void {
    cancelAnimationFrame(this.raf); this.raf = 0; this.pendingDemo = false;
    if (this.ready && !this.disposed) this.paint(-1);
  }
  destroy(): void { this.disposed = true; cancelAnimationFrame(this.raf); this.raf = 0; }
  private tick = (now: number): void => {
    if (this.disposed) return;
    const elapsed = (now - this.started) / 1000;
    if (elapsed >= 3.8) { this.raf = 0; this.pendingDemo = false; this.paint(-1); return; }
    if (now - this.lastPaint >= 1000 / 30) { this.lastPaint = now; this.paint(elapsed); }
    this.raf = requestAnimationFrame(this.tick);
  };
  private paint(t: number): void {
    const c = this.ctx;
    c.clearRect(0, 0, 320, 360);
    const dash = t >= 1.15 && t < 1.8, charge = t >= 2 && t < 3.05, release = t >= 3.05 && t < 3.45;
    const strike = t >= .25 && t < .95;
    const phase = dash ? 'dash' : charge ? 'charge' : release ? 'release' : strike ? 'attack' : 'idle';
    if (this.canvas.dataset.demoPhase !== phase) {
      this.canvas.dataset.demoPhase = phase;
      this.caption.textContent = this.classId === 'xenobinder' ?
        ({idle:'VÍNCULO · SIMBIOSE',attack:'ASSISTÊNCIA DO SIMBIONTE',dash:'REPOSICIONAMENTO',charge:'COMANDANDO A INVESTIDA',release:'INVESTIDA · RECUPERAÇÃO'}[phase]):this.classId === 'astral' ?
        ({idle:'ENERGIA ASTRAL · CONTROLE',attack:'PULSO DA MANOPLA',dash:'DESLOCAMENTO EVASIVO',charge:'PROJETANDO UM CAMPO',release:'RESPOSTA ELEMENTAL'}[phase]):this.classId === 'hunter' ?
        ({ idle: 'PRECISÃO · MOBILIDADE', attack: 'RIFLE DE PULSO', dash: 'PASSO DE FASE', charge: 'CARREGANDO O FEIXE', release: 'FEIXE PERFURANTE' }[phase]) :
        ({ idle: 'FORÇA · RESISTÊNCIA', attack: 'SABRE DE ENERGIA', dash: 'ESQUIVA DO VAZIO', charge: 'CARGA CINÉTICA', release: 'ONDA CINÉTICA' }[phase]);
    }
    let shift = 0;
    if (dash) shift = -Math.sin((t - 1.15) / .65 * Math.PI) * (this.classId === 'hunter' ? 17 : 12);
    const displayX=this.classId==='xenobinder'?126:160;
    c.save(); c.translate(displayX, 224); c.scale(2.25, 2.25); c.translate(shift, 0);
    c.fillStyle = '#00000055'; c.beginPath(); c.ellipse(0, 39, 28, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#050c0a88'; c.beginPath(); c.ellipse(0, 39, 16, 4, 0, 0, Math.PI * 2); c.fill();
    if (dash) { c.strokeStyle = '#5fe6d850'; c.lineWidth = 2; c.beginPath(); c.moveTo(-42, 15); c.lineTo(-23, 15); c.moveTo(-38, 23); c.lineTo(-22, 23); c.stroke(); }
    if(this.classId==='xenobinder')this.xenobinder(t,strike,dash,charge,release);else if(this.classId==='astral')this.astral(t,strike,dash,charge,release);else if (this.classId === 'hunter') this.hunter(t, strike, dash, charge, release);
    else this.warrior(t, strike, dash, charge, release);
    if (charge) {
      const progress = (t - 2) / 1.05;
      c.strokeStyle = '#5fe6d833'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 48, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = '#5fe6d8'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 48, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2); c.stroke();
    }
    c.restore();
  }
  private sprite(name: string, frame: number, columns: number, size: number, x: number, y: number, w: number, h: number): void {
    const img = this.loaded.get(name); if (!img) return;
    this.ctx.drawImage(img, frame % columns * size, Math.floor(frame / columns) * size, size, size, x, y, w, h);
  }
  private astral(t:number,strike:boolean,dash:boolean,charge:boolean,release:boolean):void{this.caster('astral',t,strike,dash,charge,release);}
  private xenobinder(t:number,strike:boolean,dash:boolean,charge:boolean,release:boolean):void{this.caster('xenobinder',t,strike,dash,charge,release);}
  private caster(identity:'astral'|'xenobinder',t:number,strike:boolean,dash:boolean,charge:boolean,release:boolean):void{
    const c=this.ctx,frame=dash?CASTER_WALK[Math.floor((t-1.15)*8)%4]:0;
    const main=newArm(),other=newArm(),left={x:0,y:0},right={x:0,y:0};
    const gesture=strike?Math.sin((t-.25)/.7*Math.PI):charge?Math.min(1,(t-2)/1.05):release?Math.max(0,1-(t-3.05)/.4):0;
    const sockets=this.shoulderSockets[frame],aim=Math.PI/2-gesture*.65;
    projectShoulder(sockets.left,0,-19,.5,.5,false,left);
    projectShoulder(sockets.right,0,-19,.5,.5,false,right);
    casterTargets(left.x,left.y,right.x,right.y,aim,strike,charge,dash?Math.sin(t*8):0,main,other);
    // Same opaque sleeve roots and draw order as the actual caster actor.
    this.bone(0,other.shoulder,other.elbow);this.bone(0,main.shoulder,main.elbow);
    this.sprite(this.bodyName,frame,CASTER_COLUMNS,256,-64,-83,128,128);
    this.bone(1,other.elbow,other.wrist);this.bone(1,main.elbow,main.wrist);
    const hp=this.armBounds[2],reverse=other.shoulder.x>0;
    const handAngle=Math.atan2(other.wrist.y-other.elbow.y,other.wrist.x-other.elbow.x)-Math.atan2((hp.tip.y-hp.root.y)*(reverse?-1:1),hp.tip.x-hp.root.x);
    c.save();c.translate(other.wrist.x,other.wrist.y);c.rotate(handAngle);c.scale(1,reverse?-1:1);
    const hs=6.5/Math.hypot(hp.tip.x-hp.root.x,hp.tip.y-hp.root.y);
    this.armPart(2,-hp.root.x*hs,-hp.root.y*hs,hp.width*hs,hp.height*hs);c.restore();
    const p=CASTER_INSTRUMENTS[identity].starter,weapon=this.loaded.get(identity+'-starter-weapon.png'),scale=p.width/128;
    const hand=main.wrist;
    const angle=aim-Math.atan2(p.muzzle.y-p.wrist.y,p.muzzle.x-p.wrist.x);
    c.save();c.translate(hand.x,hand.y);c.rotate(angle);if(weapon)c.drawImage(weapon,-p.wrist.x*scale,-p.wrist.y*scale,p.width,96*scale);c.restore();
    const length=Math.hypot(p.muzzle.x-p.wrist.x,p.muzzle.y-p.wrist.y)*scale,mx=hand.x+Math.cos(aim)*length,my=hand.y+Math.sin(aim)*length;
    if(identity==='astral'){
      if(strike||charge||release){c.fillStyle='#5fe6d8';c.beginPath();c.arc(mx+(release?55:0),my,release?22:charge?4+(t-2)*5:4,0,Math.PI*2);c.fill();}
    }else{
      const petFrame=release?5:charge?4:strike?3:dash?1+Math.floor(t*8)%2:0,advance=release?Math.sin((t-3.05)/.4*Math.PI)*11:0;
      c.fillStyle='#07180b66';c.beginPath();c.ellipse(43+advance,40,21,5,0,0,Math.PI*2);c.fill();
      this.sprite('dante-symbiont-motion.png',petFrame,4,256,15+advance,39-55*244/256,55,55);
      if(charge){c.strokeStyle='#6bb46499';c.lineWidth=1;c.beginPath();c.moveTo(mx,my);c.quadraticCurveTo(24,5,43,27);c.stroke();}
      if(release){c.strokeStyle='#a6dc94';c.lineWidth=2;c.beginPath();c.ellipse(43+advance,39,26,8,0,0,Math.PI*2);c.stroke();}
      if(strike){c.fillStyle='#a6dc94';c.beginPath();c.ellipse(mx+8,my,6,2,0,0,Math.PI*2);c.fill();}
    }
  }
  private hunter(t: number, firing: boolean, dash: boolean, charge: boolean, release: boolean): void {
    const c = this.ctx, aim = .22, pose = hunterRiflePose(aim), cos = Math.cos(aim), sin = Math.sin(aim);
    const frame = dash ? 1 + Math.min(2, Math.floor((t - 1.15) * 7)) : 0;
    this.canvas.dataset.facing = 'front';
    const grip = (along: number, across: number) => ({ x: pose.x + along * cos - across * sin, y: pose.y + along * sin + across * cos });
    const main = grip(-7, 9), support = grip(13, 7);
    const sockets=this.shoulderSockets[frame];
    const arms=()=>{
      this.arm('hunter',sockets.left.x/2-64,sockets.left.y/2-83,main.x,main.y,-1);
      this.arm('hunter',sockets.right.x/2-64,sockets.right.y/2-83,support.x,support.y,1);
    };
    this.sprite(this.bodyName, frame, 4, 256, -64, -83, 128, 128);
    this.armPass=0;arms();
    this.armPass=1;arms();
    const starter=this.loaded.get('hunter-starter-weapon.png');
    c.save();c.translate(pose.x,pose.y);c.rotate(aim);if(starter)c.drawImage(starter,-18,-34/128*30,60,30);c.restore();
    this.glove(main.x,main.y,aim);this.glove(support.x,support.y,aim);
    c.save(); c.translate(pose.muzzleX, pose.muzzleY); c.rotate(aim);
    if (charge) { c.fillStyle = '#baffef'; c.beginPath(); c.arc(0, 0, 2 + (t - 2) * 4, 0, Math.PI * 2); c.fill(); }
    if (firing) {
      const travel = ((t - .25) % .28) * 280;
      c.fillStyle = '#5fe6d8'; c.fillRect(travel, -1, 12, 2);
    }
    if (release) {
      c.globalAlpha = Math.max(0, 1 - (t - 3.05) / .4); c.fillStyle = '#5fe6d82b'; c.fillRect(0, -12, 150, 24);
      c.fillStyle = '#5fe6d8'; c.fillRect(0, -5, 150, 10); c.fillStyle = '#f0fff7'; c.fillRect(0, -1, 150, 2);
    }
    c.restore();
  }
  private warrior(t: number, strike: boolean, dash: boolean, charge: boolean, release: boolean): void {
    const c = this.ctx, frame = dash ? [1,0,2,0][Math.floor((t-1.15)*8)%4] : 0;
    const aim=Math.PI/2,angle=aim+(strike?-1.6+Math.max(0,t-.45)*4.5:release?.9:charge?-.9:-.42);
    const hand={x:0,y:0};warriorHand(aim,frame?-31:-30,charge?-6:release?8:0,strike?3:0,hand);
    const {x,y}=hand;
    const sx = x - 10 * Math.cos(angle), sy = y - 10 * Math.sin(angle);
    const sockets=this.shoulderSockets[frame];
    const arms=()=>{
      this.arm('warrior',sockets.left.x/2-64,sockets.left.y/2-79,x-5.5*Math.cos(angle),y-5.5*Math.sin(angle),-1);
      this.arm('warrior',sockets.right.x/2-64,sockets.right.y/2-79,sx-5.5*Math.cos(angle),sy-5.5*Math.sin(angle),1);
    };
    this.sprite(this.bodyName, frame, 4, 256, -64, -79, 128, 128);
    this.armPass=0;arms();
    this.armPass=1;arms();
    const saber = this.loaded.get('warrior-starter-weapon.png');
    c.save(); c.translate(x, y); c.rotate(angle); if (saber) c.drawImage(saber, -39, -17, 128, 32); c.restore();
    for (const [hx, hy] of [[x, y], [sx, sy]]) {
      this.glove(hx-5.5*Math.cos(angle),hy-5.5*Math.sin(angle),angle);
    }
    if (strike) {
      c.strokeStyle = '#5fe6d85c'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 60, angle - .4, angle + .3); c.stroke();
    }
    if (release) {
      c.save(); c.translate(35 + (t - 3.05) * 160, -5); c.globalAlpha = 1 - (t - 3.05) / .4;
      c.strokeStyle = '#5fe6d8'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 7, 35, 0, 0, Math.PI * 2); c.stroke(); c.restore();
    }
  }
  private armPart(frame:number,x:number,y:number,w:number,h:number):void {const b=this.armBounds[frame],img=this.loaded.get(this.classId==='astral'||this.classId==='xenobinder'?`${this.classId}-arm-none.png`:'expedition-arm-kit.png');if(b&&img)this.ctx.drawImage(img,b.x,b.y,b.width,b.height,x,y,w,h);}
  private armPass=0;
  private arm(kind: CharacterClass, sx: number, sy: number, wx: number, wy: number, side: number): void {
    const p=newArm();heldArm(sx,sy,wx,wy,-side,kind==='warrior'?18:17,kind==='warrior'?12:10,p);
    if(this.armPass===0)this.bone(0,p.shoulder,p.elbow);else this.bone(1,p.elbow,p.wrist);
  }
  private bone(frame:number,a:{x:number;y:number},b:{x:number;y:number}):void{
    const part=this.armBounds[frame],transform=paintedSegment(part,a,b),c=this.ctx;
    c.save();c.translate(a.x,a.y);c.rotate(transform.angle);c.scale(transform.scale,transform.scale);
    if(frame===1&&(this.classId==='astral'||this.classId==='xenobinder')){
      // The authored forearm has a pointed cut edge. At portrait scale that
      // corner looked like a second elbow. Round the joint, keeping its real
      // painted pixels, attachment and proportional scale; no extra limb.
      const dx=part.tip.x-part.root.x,dy=part.tip.y-part.root.y,axis=Math.atan2(dy,dx),length=Math.hypot(dx,dy),radius=part.height*.36;
      c.rotate(axis);c.beginPath();c.moveTo(0,-radius);c.lineTo(length,-radius);c.arc(length,0,radius,-Math.PI/2,Math.PI/2);c.lineTo(0,radius);c.arc(0,0,radius,Math.PI/2,Math.PI*1.5);c.closePath();c.clip();c.rotate(-axis);
    }
    this.armPart(frame,-part.root.x,-part.root.y,part.width,part.height);c.restore();
  }
  private glove(x:number,y:number,angle:number):void{
    const p=this.armBounds[2],t=paintedHand(p,angle),c=this.ctx;
    c.save();c.translate(x,y);c.rotate(t.angle);c.scale(t.scale,t.scale);this.armPart(2,-p.root.x,-p.root.y,p.width,p.height);c.restore();
  }
}
