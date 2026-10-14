import type { CharacterClass } from '../systems/CharacterProfiles';
import { hunterRiflePose } from '../visual/HunterRiflePose';
import { characterSex, hunterBody, warriorBody, type CharacterSex } from '../config/appearance';
import type {ShoulderSockets} from '../visual/ClothShoulders';
import {CASTER_WALK,CASTER_COLUMNS,CASTER_INSTRUMENTS,casterTargets,type ArmPose} from '../visual/CasterPose';

type Part = { frame: number; width: number; height: number; axisY?: number };
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
let metadata: Promise<Part[]> | undefined;
function rifleParts(): Promise<Part[]> {
  return metadata ??= fetch(base + 'star-hunter-weapon-v2.json').then(r => {
    if (!r.ok) throw new Error('Prévia indisponível'); return r.json() as Promise<Part[]>;
  }).catch(() => [] as Part[]);
}

// Menu-only illustration playback. Uses the actual painted body/arm/weapon
// atlases, no Phaser instance, simulation, enemies, sound or gameplay timers.
export class CharacterShowcase {
  readonly canvas = document.createElement('canvas');
  readonly caption = document.createElement('span');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly loaded = new Map<string, HTMLImageElement>();
  private parts: Part[] = [];
  private armBounds:{x:number;y:number;width:number;height:number}[]=[];
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
    this.bodyName = `${classId==='xenobinder'?`wardrobe-xenobinder-${sex}-none`:classId==='astral'?`wardrobe-astral-${sex}-none`:classId==='hunter'?hunterBody(sex):warriorBody(sex,'front')}.png`;
    this.canvas.className = 'showcase-canvas'; this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', classId === 'astral' ? 'Manipulador Astral com manopla tecnológica' : classId === 'hunter' ? 'Star Hunter com rifle de pulso' : 'Guerreiro Galáctico com sabre de energia');
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = 320 * ratio; this.canvas.height = 360 * ratio;
    this.ctx = this.canvas.getContext('2d')!; this.ctx.scale(ratio, ratio);
    this.caption.className = 'showcase-caption'; this.caption.textContent = 'PREPARADO PARA DANTE';
    if(classId==='xenobinder')this.canvas.setAttribute('aria-label','Vinculador de Dante com condutor e companheiro simbionte');
    const names = classId === 'xenobinder'?[this.bodyName,'xenobinder-starter-weapon.png','dante-symbiont-motion.png','xenobinder-arm-none.png']:classId === 'astral'?[this.bodyName,'astral-starter-weapon.png','astral-arm-none.png']:classId === 'hunter' ? [this.bodyName, 'star-hunter-weapon-v2.png','hunter-starter-weapon.png','expedition-arm-kit.png'] :
      [this.bodyName, 'expedition-arm-kit.png', 'warrior-starter-weapon.png'];
    void Promise.all(names.map(async name => this.loaded.set(name, await image(name)))).then(async () => {
      if (this.disposed) return;
      if (classId === 'hunter') this.parts = await rifleParts();
      if (this.disposed) return;
      const caster=classId==='astral'||classId==='xenobinder';
      const registration=await fetch(base+(caster?'caster-arm-registration.json':'character-arm-registration.json')).then(r=>r.json());
      this.armBounds=registration[caster?`${classId}-arm-none`:'expedition-arm-kit'];
      const shoulders=await fetch(base+'character-shoulder-registration.json').then(r=>r.json());
      this.shoulderSockets=classId==='xenobinder'?await fetch(base+'xenobinder-shoulders.json').then(r=>r.json()).then(d=>d[sex]):classId==='astral'?await fetch(base+'astral-shoulders.json').then(r=>r.json()).then(d=>d[sex]):shoulders[`${classId}-${sex}`];
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
    c.save(); c.translate(135, 224); c.scale(2.25, 2.25); c.translate(shift, 0);
    c.fillStyle = '#00000055'; c.beginPath(); c.ellipse(0, 39, 28, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#050c0a88'; c.beginPath(); c.ellipse(0, 39, 16, 4, 0, 0, Math.PI * 2); c.fill();
    if (dash) { c.strokeStyle = '#5fe6d850'; c.lineWidth = 2; c.beginPath(); c.moveTo(26, 15); c.lineTo(51, 15); c.moveTo(22, 23); c.lineTo(40, 23); c.stroke(); }
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
    const c=this.ctx,frame=dash?CASTER_WALK[Math.floor((t-1.15)*8)%4]:0,sockets=this.shoulderSockets[frame];
    this.sprite(this.bodyName,frame,CASTER_COLUMNS,256,-64,-83,128,128);
    const pose=():ArmPose=>({shoulder:{x:0,y:0},elbow:{x:0,y:0},wrist:{x:0,y:0}});
    const main=pose(),other=pose(),aim=.1;
    casterTargets(sockets.left.x/2-64,sockets.left.y/2-83,sockets.right.x/2-64,sockets.right.y/2-83,aim,strike,charge,dash?Math.sin(t*8):0,main,other);
    for(const segment of [0,1])for(const arm of [other,main]){
      const a=segment?arm.elbow:arm.shoulder,b=segment?arm.wrist:arm.elbow,overlap=segment?2:5;
      const width=Math.hypot(b.x-a.x,b.y-a.y)+overlap+1;
      c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));this.armPart(segment,-overlap,-(segment?10.5:12)/2,width,segment?10.5:12);c.restore();
    }
    c.save();c.translate(other.wrist.x,other.wrist.y);c.rotate(Math.atan2(other.wrist.y-other.elbow.y,other.wrist.x-other.elbow.x));this.armPart(2,-1.2,-4.5,8,9);c.restore();
    const p=CASTER_INSTRUMENTS[identity].starter,weapon=this.loaded.get(identity+'-starter-weapon'),angle=aim-Math.atan2(p.muzzle.y-p.wrist.y,p.muzzle.x-p.wrist.x),scale=p.width/128;
    c.save();c.translate(main.wrist.x,main.wrist.y);c.rotate(angle);if(weapon)c.drawImage(weapon,-p.wrist.x*scale,-p.wrist.y*scale,p.width,96*scale);c.restore();
    const length=Math.hypot(p.muzzle.x-p.wrist.x,p.muzzle.y-p.wrist.y)*scale,mx=main.wrist.x+Math.cos(aim)*length,my=main.wrist.y+Math.sin(aim)*length;
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
    if (!this.parts.length) return;
    const grip = (along: number, across: number) => ({ x: pose.x + along * cos - across * sin, y: pose.y + along * sin + across * cos });
    const main = grip(-4, 9), support = grip(16, 7);
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
    this.part(4, main.x, main.y, aim, 7.5, 9, .65, .5); this.part(5, support.x, support.y, aim, 7.5, 9, .65, .5);
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
    const angle = strike ? -1.6 + Math.max(0, t - .45) * 4.5 : release ? -.2 : charge ? -1.6 : -1.1;
    const x = strike ? 20 : 15, y = charge ? -24 : -17;
    const sx = x - 10 * Math.cos(angle), sy = y - 10 * Math.sin(angle);
    const sockets=this.shoulderSockets[frame];
    const arms=()=>{
      this.arm('warrior',sockets.left.x/2-64,sockets.left.y/2-79,x-4*Math.cos(angle),y-4*Math.sin(angle),-1);
      this.arm('warrior',sockets.right.x/2-64,sockets.right.y/2-79,sx-4*Math.cos(angle),sy-4*Math.sin(angle),1);
    };
    this.sprite(this.bodyName, frame, 4, 256, -64, -79, 128, 128);
    this.armPass=0;arms();
    this.armPass=1;arms();
    const saber = this.loaded.get('warrior-starter-weapon.png');
    c.save(); c.translate(x, y); c.rotate(angle); if (saber) c.drawImage(saber, -39, -17, 128, 32); c.restore();
    for (const [hx, hy] of [[x, y], [sx, sy]]) {
      c.save(); c.translate(hx, hy); c.rotate(angle); this.armPart(2,-5,-5,8,10); c.restore();
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
  private part(frame: number, x: number, y: number, angle: number, w: number, h: number, ox: number, oy: number): void {
    if(frame>=2){const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);this.armPart(frame<4?frame-2:2,-w*ox,-h*oy,w,h);c.restore();return;}
    const p = this.parts[frame], img = this.loaded.get('star-hunter-weapon-v2.png'); if (!p || !img) return;
    const c = this.ctx; c.save(); c.translate(x, y); c.rotate(angle);
    c.drawImage(img, frame % 2 * 256 + Math.floor((256 - p.width) / 2), Math.floor(frame / 2) * 256 + 16,
      p.width, p.height, -w * ox, -h * oy, w, h); c.restore();
  }
  private arm(kind: CharacterClass, sx: number, sy: number, wx: number, wy: number, side: number): void {
    const dx = wx - sx, dy = wy - sy, distance = Math.max(.001, Math.hypot(dx, dy));
    const length = Math.max(17, distance / 2 + .5), bend = Math.min(10, Math.sqrt(Math.max(0, length * length - distance * distance / 4)));
    const ex = sx + dx / 2 - dy / distance * bend * side, ey = sy + dy / 2 + dx / distance * bend * side;
    for (const [fromX, fromY, toX, toY, segment] of [[sx, sy, ex, ey, 0], [ex, ey, wx, wy, 1]]) {
      if(segment!==this.armPass)continue;
      const overlap=segment?2:5;
      const angle = Math.atan2(toY - fromY, toX - fromX), width = Math.hypot(toX - fromX, toY - fromY) + 2+overlap;
      if (kind === 'hunter') this.part(2 + segment, fromX, fromY, angle, width, segment ? 10 : 11.5, overlap/width, .5);
      else { const c = this.ctx; c.save(); c.translate(fromX, fromY); c.rotate(angle);
        this.armPart(segment,-overlap,-(segment?10.5:12.5)/2,width,segment?10.5:12.5); c.restore(); }
    }
  }
}
