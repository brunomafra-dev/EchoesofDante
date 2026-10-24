import Phaser from 'phaser';
import { FOREST_SIZE, FOREST_BOUNDS, FOREST_CONTOUR, FOREST_BRANCH_PATHS, FOREST_BRANCH_CLEARINGS, EARLY_LANDMARKS } from '../config/earlyJourney';
import { insideGround } from './WalkableGround';
import { FOREST_CLEARINGS, FOREST_PATHS, FOREST_ROCKS } from '../config/forest';
import { FOREST_STRUCTURE_FOOTPRINTS, treeFootprint, totemFootprint } from '../config/environmentCollision';
import type { Obstacle } from './Movement';
import { groundContour, EnvironmentPainter, contactStamp, rockStamps,createEnvironmentGround, type EnvironmentStamp } from '../visual/EnvironmentArt';

export class Arena {
  readonly obstacles: Obstacle[] = [];
  readonly bounds = FOREST_BOUNDS;
  private readonly structuralFootprints: Obstacle[] = [];
  private seed = 92341;
  private readonly paintings: EnvironmentStamp[] = [];

  constructor(private scene: Phaser.Scene) {
    if(scene.data.get('campaign-finish'))createEnvironmentGround(scene,FOREST_SIZE.width,'forest-ground',0xb7c4b5,FOREST_SIZE.height);
    this.draw();
    this.bakeStaticScenery();
    // Register after composition: tree placement must keep its original rock-only test.
    this.obstacles.push(...this.structuralFootprints, ...FOREST_STRUCTURE_FOOTPRINTS);
  }

  private bakeStaticScenery(): void {
    // Graphics are costly to replay every frame. Capture the static art once,
    // keeping narrow depth bands so the player can still pass among the trees.
    const graphics = this.scene.children.list.filter((object): object is Phaser.GameObjects.Graphics =>
      object instanceof Phaser.GameObjects.Graphics);
    const floor = graphics.find(object => object.depth === -10000);
    if (floor) {
      const layer = this.scene.add.renderTexture(0, 0, FOREST_SIZE.width, FOREST_SIZE.height)
        .setOrigin(0).setDepth(floor.depth).draw(floor.setAlpha(this.scene.data.get('campaign-finish')?.04:.72));
      const painter = new EnvironmentPainter(this.scene, layer);
      // Let the painted soil read as a material plane under the existing
      // clearings and paths, instead of a barely visible noise overlay.
      painter.ground('forest-ground', 0.42);
      for(const path of FOREST_BRANCH_PATHS)for(let i=1;i<path.points.length;i++){
        const a=path.points[i-1],b=path.points[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/150);
        for(let j=0;j<=steps;j++)painter.sediment(a.x+(b.x-a.x)*j/steps,a.y+(b.y-a.y)*j/steps,
          340,235,0x7e7755,.1);
      }
      for (const [x, y, w, h] of [[360,450,330,135],[1030,640,410,160],[1510,1010,340,135],[1900,420,310,145]]) {
        painter.contact(x, y, w, h, 0.16);
      }
      this.paintings.filter(stamp => stamp.depth === -10000).forEach(stamp => painter.stamp(stamp));
      painter.destroy();
    }
    const bandHeight = 100;
    const bands = new Map<number, (Phaser.GameObjects.Graphics | EnvironmentStamp)[]>();
    for (const object of graphics) {
      if (object === floor) continue;
      const band = Math.floor(Phaser.Math.Clamp(object.depth, 0, FOREST_SIZE.height - 1) / bandHeight);
      const group = bands.get(band) ?? [];
      group.push(object);
      bands.set(band, group);
    }
    for (const stamp of this.paintings) {
      if (stamp.depth === -10000) continue;
      const band = Math.floor(Phaser.Math.Clamp(stamp.depth ?? 0, 0, FOREST_SIZE.height - 1) / bandHeight);
      const group = bands.get(band) ?? [];
      group.push(stamp);
      bands.set(band, group);
    }
    for (const [band, group] of bands) {
      const top = Math.max(0, band * bandHeight - 170);
      const bottom = Math.min(FOREST_SIZE.height, (band + 1) * bandHeight + 150);
      // Sparse banks must not allocate a transparent strip across the entire
      // enlarged world. Merge occupied spans, then cap each static cache width.
      const span=(o:Phaser.GameObjects.Graphics|EnvironmentStamp)=>{
        const half=o instanceof Phaser.GameObjects.Graphics?110:(o.width+o.height*.15)/2+16;
        return {left:Math.max(0,Math.floor(o.x-half)),right:Math.min(FOREST_SIZE.width,Math.ceil(o.x+half))};
      };
      const ranges:{left:number;right:number}[]=[];
      for(const next of group.map(span).sort((a,b)=>a.left-b.left)){
        const last=ranges.at(-1);
        if(last&&next.left<=last.right+48)last.right=Math.max(last.right,next.right);
        else ranges.push({...next});
      }
      const ordered=group.sort((a,b)=>(a.depth??0)-(b.depth??0));
      for(const range of ranges)for(let left=range.left;left<range.right;left+=1024){
        const right=Math.min(range.right,left+1024);
        const layer=this.scene.add.renderTexture(left,top,right-left,bottom-top)
          .setOrigin(0).setDepth(band*bandHeight+bandHeight/2);
        const painter=new EnvironmentPainter(this.scene,layer);
        for(const object of ordered){
          const s=span(object);if(s.right<=left||s.left>=right)continue;
          if(object instanceof Phaser.GameObjects.Graphics)layer.draw(object,object.x-left,object.y-top);
          else painter.stamp(object);
        }
        painter.destroy();
      }
    }
    graphics.forEach(object => object.destroy());
    this.paintings.length = 0;
  }

  private random(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  private draw(): void {
    const scene = this.scene;
    const floor = scene.add.graphics().setDepth(-10000);
    floor.fillStyle(0x0b252a).fillRect(0, 0, FOREST_SIZE.width, FOREST_SIZE.height);
    for (let i = 0; i < 25; i++) {
      this.patch(floor, 80 + this.random() * 2040, 80 + this.random() * 1340, 95 + this.random() * 220, 60 + this.random() * 135, i % 3 === 0 ? 0x173d3d : 0x123239, 0.75);
    }
    // Broad, connected soil trails leave room to dodge and read nearby enemies.
    for (const path of [...FOREST_PATHS,...FOREST_BRANCH_PATHS]) {
      for (let i = 1; i < path.points.length; i++) {
        const a = path.points[i - 1];
        const b = path.points[i];
        floor.lineStyle(path.width, 0x284a40).lineBetween(a.x, a.y, b.x, b.y);
        floor.fillStyle(0x284a40).fillCircle(a.x, a.y, path.width / 2).fillCircle(b.x, b.y, path.width / 2);
        floor.lineStyle(path.width * 0.38, 0x496353, 0.24).lineBetween(a.x, a.y, b.x, b.y);
      }
    }
    for (const clearing of [...FOREST_CLEARINGS,...FOREST_BRANCH_CLEARINGS]) {
      this.patch(floor, clearing.x, clearing.y, clearing.rx, clearing.ry, 0x2d5144, 0.85);
      this.patch(floor, clearing.x, clearing.y, clearing.rx * 0.7, clearing.ry * 0.65, 0x3c5c49, 0.3);
    }
    for (let i = 0; i < 18; i++) {
      const x = 130 + this.random() * 1940;
      const y = 120 + this.random() * 1250;
      this.patch(floor, x, y, 26 + this.random() * 65, 12 + this.random() * 32, i % 2 ? 0x53766b : 0x294e52, 0.2);
    }
    // A modest survey pad establishes the origin; worn paving suggests a route north.
    floor.fillStyle(0x40595a).fillRoundedRect(310, 1180, 180, 130, 14);
    floor.lineStyle(3, 0xa0bdb1, 0.55).strokeRoundedRect(320, 1190, 160, 110, 10);
    for (let y = 1195; y < 1270; y += 25) {
      floor.lineStyle(4, 0xa5c5bd, 0.55).lineBetween(380, y + 12, 400, y);
      floor.lineBetween(400, y, 420, y + 12);
    }
    for (let i = 0; i < 5; i++) {
      floor.fillStyle(0x6b8378, 0.45).fillRoundedRect(1440 + i * 28, 375 - i * 18, 20, 35, 3);
    }
    for (let i = 0; i < 290; i++) {
      const x = 72 + this.random() * (FOREST_SIZE.width - 144);
      const y = 72 + this.random() * (FOREST_SIZE.height - 144);
      const r = 1 + this.random() * 2.8;
      floor.fillStyle(this.random() > 0.84 ? 0x8fb69b : 0x648d78, 0.17 + this.random() * 0.28).fillCircle(x, y, r);
    }
    FOREST_ROCKS.forEach(([x, y, radius]) => this.rock(x, y, radius));
    // A connected perimeter opens the east/south circuit. Banks are authored
    // against the same contour as movement, with no invisible rectangular wall.
    for (let i=0;i<FOREST_CONTOUR.length;i++) {
      const a=FOREST_CONTOUR[i],b=FOREST_CONTOUR[(i+1)%FOREST_CONTOUR.length];
      const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/145);
      for(let j=0;j<n;j++){
        const t=j/n,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
        this.rock(x,y,62+this.random()*15);
        if(j%2===0)this.plant(x,y-18,48+this.random()*20);
      }
    }
    let trees = 0;
    for (let i = 0; i < 320 && trees < 98; i++) {
      const x = 210 + this.random() * (FOREST_SIZE.width - 420);
      const y = 210 + this.random() * (FOREST_SIZE.height - 420);
      if (!insideGround({x,y},FOREST_CONTOUR) || this.nearRoute(x, y, 65)) continue;
      if(EARLY_LANDMARKS.forest.some(p=>Math.hypot(x-p.x,y-p.y)<p.radius+90))continue;
      if (this.obstacles.some(rock => Math.hypot(x - rock.x, y - rock.y) < rock.radius + 55)) continue;
      this.plant(x, y, 32 + this.random() * 34, trees % 16 === 0);
      trees++;
    }
    for (let i = 0; i < 35; i++) {
      const x = 100 + this.random() * 2000;
      const y = 110 + this.random() * 1280;
      if (this.nearRoute(x, y, 0)) continue;
      this.fern(x, y, 8 + this.random() * 12);
    }
    this.plant(420, 390, 110, true, false);
    this.obstacles.push({ x: 420, y: 390, radius: 25 });
    [-70, 0, 70].forEach(offset => this.obstacles.push({ x: 1500 + offset, y: 285, radius: 35 }));
    this.rock(1980, 920, 50);
    this.rock(1980, 1270, 45);
    this.beacon(1860, 1120);
    this.beacon(290, 1220);
    this.beacon(510, 1220);
    this.beacon(1740, 220);
    // Small cover and distinct rest pockets; no interactive HUD decoration.
    for(const [x,y,r] of [[2310,900,36],[2850,1320,43],[2420,1480,32],[1030,1570,30]])this.rock(x,y,r);
    this.motes();
  }

  private nearRoute(x: number, y: number, margin: number): boolean {
    if ([...FOREST_CLEARINGS,...FOREST_BRANCH_CLEARINGS].some(c => ((x - c.x) / (c.rx + margin)) ** 2 + ((y - c.y) / (c.ry + margin)) ** 2 < 1)) return true;
    return [...FOREST_PATHS,...FOREST_BRANCH_PATHS].some(path => path.points.slice(1).some((b, i) => {
      const a = path.points[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const t = Phaser.Math.Clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
      return Math.hypot(x - a.x - t * dx, y - a.y - t * dy) < path.width / 2 + margin;
    }));
  }

  private patch(g: Phaser.GameObjects.Graphics, x: number, y: number, rx: number, ry: number, color: number, alpha: number): void {
    const points = [];
    for (let i = 0; i <= 15; i++) {
      const angle = i / 15 * Math.PI * 2;
      const wobble = i === 15 ? 1 : 0.84 + this.random() * 0.31;
      points.push({ x: x + Math.cos(angle) * rx * wobble, y: y + Math.sin(angle) * ry * wobble });
    }
    g.fillStyle(color, alpha).fillPoints(groundContour(points), true);
  }

  private plant(x: number, y: number, size: number, sway = false, addFootprint = true): void {
    const shade = this.random();
    this.paintings.push(contactStamp(x + size * 0.02, y + size * 0.1, size * 0.65, size * 0.23, 0.8));
    this.scene.add.image(x, y, 'dante-tree-trunk').setOrigin(0.5, 100 / 155).setScale(size / 100).setDepth(y + 2);
    // The landmark tree already has its original radius-25 footprint below.
    if (addFootprint) this.structuralFootprints.push(treeFootprint(x, y, size));
    const canopy = this.scene.add.image(x, y - size * 0.9, shade < 0.3 ? 'dante-canopy-blue' : 'dante-canopy-green')
      .setOrigin(0.5, 0.6).setScale(size / 100).setDepth(y + 12);
    if (shade < 0.3) canopy.setTint(0xa3c5d0);
    if (sway) {
      this.scene.tweens.add({ targets: canopy, angle: 2.5, duration: 2200 + this.random() * 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private fern(x: number, y: number, size: number): void {
    this.paintings.push({ key: 'dante-canopy-green', x, y: y - size * 0.35,
      width: size * 2.4, height: size * 1.8, depth: y + 1, tint: 0x9cbd9d });
  }

  private rock(x: number, y: number, radius: number): void {
    this.obstacles.push({ x, y, radius: radius * 0.72 });
    this.paintings.push(...rockStamps(x, y, radius, 0xc6d1bc));
  }

  private beacon(x: number, y: number): void {
    this.structuralFootprints.push(totemFootprint(x, y));
    const g = this.scene.add.graphics().setDepth(y - 5).setPosition(x, y);
    g.fillStyle(0x081d25, 0.62).fillEllipse(0, 16, 88, 29);
    g.fillStyle(0x526e70).fillEllipse(0, 8, 48, 25);
    g.fillStyle(0x16343e).fillRoundedRect(-11, -63, 22, 70, 4);
    g.fillStyle(0x617e82).fillRoundedRect(-11, -63, 22, 11, 2);
    g.lineStyle(2, 0x80c4c0, 0.7).lineBetween(-5, -48, -5, -16);
    g.lineBetween(5, -48, 5, -16);
    g.fillStyle(0xa3ded0).fillCircle(0, -42, 4);
    g.fillStyle(0x8c81ae).fillCircle(0, -12, 3);
  }

  private motes(): void {
    for (let i = 0; i < 18; i++) {
      const x = 120 + this.random() * (FOREST_SIZE.width - 240);
      const y = 120 + this.random() * (FOREST_SIZE.height - 240);
      const mote = this.scene.add.circle(x, y, 1.5 + this.random() * 1.4, i % 5 === 0 ? 0xa9a2ca : 0xb4dfc5, 0.24).setDepth(y + 20);
      this.scene.tweens.add({ targets: mote, y: y - 13, alpha: 0.07, duration: 1900 + this.random() * 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}
