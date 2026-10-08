import type { CharacterClass } from '../systems/CharacterProfiles';
import { hunterRiflePose } from '../visual/HunterRiflePose';

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
  private raf = 0;
  private disposed = false;
  private started = 0;
  private lastPaint = -Infinity;
  private pendingDemo = false;
  private pendingManual = false;
  private ready = false;
  constructor(readonly classId: CharacterClass) {
    this.canvas.className = 'showcase-canvas'; this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', classId === 'hunter' ? 'Star Hunter com rifle de pulso' : 'Guerreiro Galáctico com sabre de energia');
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = 320 * ratio; this.canvas.height = 360 * ratio;
    this.ctx = this.canvas.getContext('2d')!; this.ctx.scale(ratio, ratio);
    this.caption.className = 'showcase-caption'; this.caption.textContent = 'PREPARADO PARA DANTE';
    const names = classId === 'hunter' ? ['star-hunter-body-v2.png', 'star-hunter-weapon-v2.png'] :
      ['warrior-poses-front.png', 'warrior-arm-kit.png', 'warrior-saber-painted.png'];
    void Promise.all(names.map(async name => this.loaded.set(name, await image(name)))).then(async () => {
      if (this.disposed) return;
      if (classId === 'hunter') this.parts = await rifleParts();
      if (this.disposed) return;
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
      this.caption.textContent = this.classId === 'hunter' ?
        ({ idle: 'PRECISÃO · MOBILIDADE', attack: 'RIFLE DE PULSO', dash: 'PASSO DE FASE', charge: 'CARREGANDO O FEIXE', release: 'FEIXE PERFURANTE' }[phase]) :
        ({ idle: 'FORÇA · RESISTÊNCIA', attack: 'SABRE DE ENERGIA', dash: 'ESQUIVA DO VAZIO', charge: 'CARGA CINÉTICA', release: 'ONDA CINÉTICA' }[phase]);
    }
    let shift = 0;
    if (dash) shift = -Math.sin((t - 1.15) / .65 * Math.PI) * (this.classId === 'hunter' ? 17 : 12);
    c.save(); c.translate(135, 224); c.scale(2.25, 2.25); c.translate(shift, 0);
    c.fillStyle = '#00000055'; c.beginPath(); c.ellipse(0, 39, 28, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#050c0a88'; c.beginPath(); c.ellipse(0, 39, 16, 4, 0, 0, Math.PI * 2); c.fill();
    if (dash) { c.strokeStyle = '#5fe6d850'; c.lineWidth = 2; c.beginPath(); c.moveTo(26, 15); c.lineTo(51, 15); c.moveTo(22, 23); c.lineTo(40, 23); c.stroke(); }
    if (this.classId === 'hunter') this.hunter(t, strike, dash, charge, release);
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
  private hunter(t: number, firing: boolean, dash: boolean, charge: boolean, release: boolean): void {
    const c = this.ctx, aim = .22, pose = hunterRiflePose(aim), cos = Math.cos(aim), sin = Math.sin(aim);
    const frame = dash ? 1 + Math.min(2, Math.floor((t - 1.15) * 7)) : 0;
    this.canvas.dataset.facing = 'front';
    this.sprite('star-hunter-body-v2.png', frame, 4, 256, -64, -83, 128, 128);
    if (!this.parts.length) return;
    const grip = (along: number, across: number) => ({ x: pose.x + along * cos - across * sin, y: pose.y + along * sin + across * cos });
    const main = grip(-4, 9), support = grip(16, 7);
    this.arm('hunter', -15, -34, main.x, main.y, -1);
    this.arm('hunter', 15, -34, support.x, support.y, 1);
    const rifle = this.parts[0];
    this.part(0, pose.x, pose.y, aim, 60, 60 * rifle.height / rifle.width, .3, rifle.axisY ?? .38);
    this.part(4, main.x, main.y, aim, 10, 10, .65, .5); this.part(5, support.x, support.y, aim, 10, 10, .65, .5);
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
    const c = this.ctx, frame = dash ? 7 : charge ? 6 : release ? 5 : strike ? t < .45 ? 4 : 5 : 0;
    this.sprite('warrior-poses-front.png', frame, 4, 256, -64, -79, 128, 128);
    const angle = strike ? -1.6 + Math.max(0, t - .45) * 4.5 : release ? -.2 : charge ? -1.6 : -1.1;
    const x = strike ? 20 : 15, y = charge ? -24 : -17;
    const sx = x - 10 * Math.cos(angle), sy = y - 10 * Math.sin(angle);
    this.arm('warrior', -15, -30, x - 4 * Math.cos(angle), y - 4 * Math.sin(angle), -1);
    this.arm('warrior', 15, -30, sx - 4 * Math.cos(angle), sy - 4 * Math.sin(angle), 1);
    const saber = this.loaded.get('warrior-saber-painted.png');
    c.save(); c.translate(x, y); c.rotate(angle); if (saber) c.drawImage(saber, -39, -17, 128, 32); c.restore();
    for (const [hx, hy] of [[x, y], [sx, sy]]) {
      c.save(); c.translate(hx, hy); c.rotate(angle); this.sprite('warrior-arm-kit.png', 2, 3, 128, -7, -7, 12, 14); c.restore();
    }
    if (strike) {
      c.strokeStyle = '#5fe6d85c'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 60, angle - .4, angle + .3); c.stroke();
    }
    if (release) {
      c.save(); c.translate(35 + (t - 3.05) * 160, -5); c.globalAlpha = 1 - (t - 3.05) / .4;
      c.strokeStyle = '#5fe6d8'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 7, 35, 0, 0, Math.PI * 2); c.stroke(); c.restore();
    }
  }
  private part(frame: number, x: number, y: number, angle: number, w: number, h: number, ox: number, oy: number): void {
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
      const angle = Math.atan2(toY - fromY, toX - fromX), width = Math.hypot(toX - fromX, toY - fromY) + 2;
      if (kind === 'hunter') this.part(2 + segment, fromX, fromY, angle, width, segment ? 12 : 14, 0, .5);
      else { const c = this.ctx; c.save(); c.translate(fromX, fromY); c.rotate(angle);
        this.sprite('warrior-arm-kit.png', segment, 3, 128, 0, -9, width, segment ? 17 : 19); c.restore(); }
    }
  }
}
