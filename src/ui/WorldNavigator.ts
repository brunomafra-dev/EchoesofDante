import Phaser from 'phaser';
import { PLAYER, WORLD_HEIGHT, WORLD_WIDTH } from '../config/game';
import type { MovementBounds, Obstacle } from '../systems/Movement';
import type { Vec2 } from '../utils/math';
import type { ExplorationTarget } from './ExplorationGuide';

// Navigation only. A coarse, cached map of existing collision data; it never
// moves actors, changes colliders or controls enemy AI.
export class WorldNavigator {
  private readonly element = document.createElement('section');
  private readonly map = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private readonly floor = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  private readonly solid = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  private readonly line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  private readonly destination = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  private readonly playerMarker = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  private readonly button = document.createElement('button');
  private readonly arrow: Phaser.GameObjects.Triangle;
  private readonly explored = new Set<number>();
  private bounds!: MovementBounds;
  private columns = 0;
  private rows = 0;
  private walkable = new Uint8Array();
  private geometryKey = '';
  private nextUpdate = 0;
  private routeKey = '';
  private drawKey = '';
  private route: Vec2[] = [];
  private target?: ExplorationTarget;
  private readonly cell = 48;
  private collapsed = false;

  constructor(scene: Phaser.Scene,
    private readonly geometry: () => { bounds?: MovementBounds; obstacles: readonly Obstacle[] }) {
    this.element.className = 'world-minimap';
    this.map.setAttribute('viewBox', '0 0 156 112'); this.map.setAttribute('role', 'img');
    this.map.setAttribute('aria-label', 'Mapa local: seta do jogador, caminho descoberto e próximo destino');
    this.floor.setAttribute('fill', '#556456'); this.solid.setAttribute('fill', '#252d28');
    this.line.setAttribute('fill', 'none'); this.line.setAttribute('stroke', '#a98cff');
    this.line.setAttribute('stroke-width', '1.2'); this.line.setAttribute('stroke-dasharray', '2 4');
    this.destination.setAttribute('fill', 'none'); this.destination.setAttribute('stroke', '#ffbd54');
    this.destination.setAttribute('stroke-width', '2'); this.destination.setAttribute('width', '6'); this.destination.setAttribute('height', '6');
    this.playerMarker.setAttribute('d', 'M6 0L-4 -4L-2 0L-4 4Z');
    this.map.append(this.floor, this.solid, this.line, this.destination, this.playerMarker);
    this.button.type = 'button'; this.button.textContent = 'MAPA';
    this.button.setAttribute('aria-expanded', 'true');
    this.button.addEventListener('click', () => this.toggle());
    this.element.append(this.button, this.map); document.body.append(this.element);
    this.arrow = scene.add.triangle(0, 0, 0, 9, -7, -5, 7, -5, 0xa98cff, .82)
      .setStrokeStyle(1, 0xe8dcff, .8).setDepth(14980).setVisible(false);
    window.addEventListener('keydown', this.onKey);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onKey); this.element.remove();
    });
  }

  private onKey = (event: KeyboardEvent): void => {
    if (event.code === 'KeyM' && !event.repeat && !document.querySelector('dialog[open]') &&
      !(event.target instanceof HTMLInputElement)) { event.preventDefault(); this.toggle(); }
  };
  private toggle(): void {
    this.collapsed = !this.collapsed; this.element.classList.toggle('is-collapsed', this.collapsed);
    this.button.setAttribute('aria-expanded', String(!this.collapsed));
  }
  setTarget(target?: ExplorationTarget): void { this.target = target; if (!target) this.arrow.setVisible(false); }

  update(player: Vec2, aim: number, dead: boolean, now: number): void {
    if (now < this.nextUpdate) return;
    this.nextUpdate = now + 160;
    this.refreshGeometry();
    const start = this.nearest(player), goal = this.target ? this.nearest(this.target) : -1;
    if (start >= 0) {
      const sx = start % this.columns, sy = Math.floor(start / this.columns);
      for (let y = sy - 3; y <= sy + 3; y++) for (let x = sx - 3; x <= sx + 3; x++) {
        if (x >= 0 && y >= 0 && x < this.columns && y < this.rows) this.explored.add(y * this.columns + x);
      }
    }
    const key = `${start}:${goal}:${this.geometryKey}`;
    if (key !== this.routeKey) { this.routeKey = key; this.route = this.findRoute(start, goal); }
    const target = this.target, gap = target ? Math.hypot(target.x - player.x, target.y - player.y) : 0;
    const show = !dead && !!target && target.action !== 'blocked' && target.action !== 'observe' &&
      gap > target.radius && this.route.length > 0;
    this.arrow.setVisible(show);
    if (show) {
      const next = this.route.find(p => Math.hypot(p.x - player.x, p.y - player.y) > 62) ?? this.route.at(-1)!;
      const angle = Math.atan2(next.y - player.y, next.x - player.x);
      this.arrow.setPosition(player.x + Math.cos(angle) * 48, player.y + Math.sin(angle) * 34 + 10)
        .setRotation(angle - Math.PI / 2);
    }
    const title = target ? `Próximo destino: ${target.name} · M recolhe o mapa` : 'M recolhe o mapa';
    if (this.button.title !== title) this.button.title = title;
    const drawKey = `${player.x.toFixed(0)},${player.y.toFixed(0)},${aim.toFixed(2)},${dead},${key}`;
    if (!this.collapsed && drawKey !== this.drawKey) { this.draw(player, aim, dead); this.drawKey = drawKey; }
  }

  private refreshGeometry(): void {
    const { bounds, obstacles } = this.geometry();
    const b = bounds ?? { left: 56, right: WORLD_WIDTH - 56, top: 56, bottom: WORLD_HEIGHT - 56 };
    const key = `${b.left},${b.top},${b.right},${b.bottom},${obstacles.length}`;
    if (key === this.geometryKey) return;
    this.geometryKey = key; this.bounds = { ...b };
    this.columns = Math.ceil((b.right - b.left) / this.cell); this.rows = Math.ceil((b.bottom - b.top) / this.cell);
    this.walkable = new Uint8Array(this.columns * this.rows);
    this.explored.clear();
    for (let i = 0; i < this.walkable.length; i++) {
      const p = this.point(i);
      this.walkable[i] = Number(p.x <= b.right - PLAYER.radius && p.y <= b.bottom - PLAYER.radius &&
        p.x >= b.left + PLAYER.radius && p.y >= b.top + PLAYER.radius &&
        !obstacles.some(o => Math.hypot(o.x - p.x, o.y - p.y) < o.radius + PLAYER.radius + 5));
    }
  }
  private point(index: number): Vec2 {
    return { x: this.bounds.left + (index % this.columns + .5) * this.cell,
      y: this.bounds.top + (Math.floor(index / this.columns) + .5) * this.cell };
  }
  private nearest(p: Vec2): number {
    const x = Math.max(0, Math.min(this.columns - 1, Math.floor((p.x - this.bounds.left) / this.cell)));
    const y = Math.max(0, Math.min(this.rows - 1, Math.floor((p.y - this.bounds.top) / this.cell)));
    if (this.walkable[y * this.columns + x]) return y * this.columns + x;
    let found = -1, best = Infinity;
    for (let i = 0; i < this.walkable.length; i++) if (this.walkable[i]) {
      const q = this.point(i), d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (d < best) { best = d; found = i; }
    }
    return found;
  }
  private findRoute(start: number, goal: number): Vec2[] {
    if (start < 0 || goal < 0) return [];
    const parent = new Int32Array(this.walkable.length).fill(-1), queue = [start]; parent[start] = start;
    for (let at = 0; at < queue.length && parent[goal] < 0; at++) {
      const i = queue[at], x = i % this.columns, y = Math.floor(i / this.columns);
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy, n = ny * this.columns + nx;
        if (nx < 0 || ny < 0 || nx >= this.columns || ny >= this.rows || !this.walkable[n] || parent[n] >= 0) continue;
        parent[n] = i; queue.push(n);
      }
    }
    if (parent[goal] < 0) return [];
    const path: Vec2[] = [];
    for (let i = goal; i !== start; i = parent[i]) path.push(this.point(i));
    path.push(this.point(start)); return path.reverse();
  }
  private draw(player: Vec2, aim: number, dead: boolean): void {
    const scale = 156 / 1050, project = (p: Vec2) => ({ x: 78 + (p.x - player.x) * scale, y: 56 + (p.y - player.y) * scale });
    let floor = '', solid = '';
    for (const i of this.explored) {
      const p = project(this.point(i)); if (p.x < -8 || p.y < -8 || p.x > 164 || p.y > 120) continue;
      const rect = `M${(p.x - this.cell * scale / 2).toFixed(1)} ${(p.y - this.cell * scale / 2).toFixed(1)}h${(this.cell * scale + .5).toFixed(1)}v${(this.cell * scale + .5).toFixed(1)}h-${(this.cell * scale + .5).toFixed(1)}Z`;
      if (this.walkable[i]) floor += rect; else solid += rect;
    }
    this.floor.setAttribute('d', floor); this.solid.setAttribute('d', solid);
    let route = 'M78 56';
    for (const point of this.route) { const p = project(point); route += `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`; if (p.x < 0 || p.y < 0 || p.x > 156 || p.y > 112) break; }
    this.line.setAttribute('d', route);
    this.destination.style.display = this.target ? '' : 'none';
    if (this.target) {
      const p = project(this.target), x = Math.max(7, Math.min(149, p.x)), y = Math.max(7, Math.min(105, p.y));
      this.destination.setAttribute('x', String(x - 3)); this.destination.setAttribute('y', String(y - 3));
    }
    this.playerMarker.setAttribute('fill', dead ? '#ff6a4a' : '#5fe6d8');
    this.playerMarker.setAttribute('transform', `translate(78 56) rotate(${aim * 180 / Math.PI})`);
  }
}
