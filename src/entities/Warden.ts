import {createCreatureShadow,type CreatureShadow} from '../visual/CreatureArt';
import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inMeleeArc, inShockwaveSweep } from '../combat/HitDetection';
import { PLAYER } from '../config/game';
import { WARDEN, WARDEN_PATTERNS, type WardenAttack, type WardenPhase } from '../config/warden';
import { moveWithCollisions, type MovementBounds, type Obstacle } from '../systems/Movement';
import { clamp, distance, type Vec2 } from '../utils/math';
import type { Enemy, EnemyImpact } from './Enemy';
import { createEnemyName } from '../ui/EnemyName';

const warningProgressFor=(now:number,start:number,end:number)=>clamp((now-start)/Math.max(1,end-start),0,1);

export type { WardenAttack } from '../config/warden';

export type WardenState = 'DORMANT' | 'INTRO' | 'IDLE' | 'TELEGRAPH' | 'EXECUTE' | 'RECOVER' | 'PHASE' | 'DEATH';
export type WardenCue = 'intro' | 'telegraph' | 'execute' | 'impact' | 'recover' | 'phase' | 'death' | 'defeated';

type SignalShot = {
  pulse: number;
  active: boolean;
  x: number;
  y: number;
  angle: number;
  travelled: number;
  previous: Vec2;
  image: Phaser.GameObjects.Ellipse;
};

type GroundMark = {
  x: number;
  y: number;
  spent: boolean;
  visual: Phaser.GameObjects.Graphics;
};

// One encounter-specific state machine, implementing the existing Enemy contract.
// Telegraph geometry is drawn on transitions. All projectiles and ground marks are reused.
export class Warden implements Enemy {
  readonly position: Vec2;
  readonly health = new Health(WARDEN.maxHp);
  readonly radius = WARDEN.radius;
  readonly attackRange = WARDEN.sweep.range;
  readonly attackDamage = WARDEN.sweep.damage;
  readonly view: Phaser.GameObjects.Container;
  readonly shadow: CreatureShadow;
  readonly telegraph: Phaser.GameObjects.Graphics;
  readonly body: Phaser.GameObjects.Image;
  isDead = false;
  get coopObjects(): Phaser.GameObjects.GameObject[] { return [this.shadow,this.name,this.body,this.core,this.shell,this.closedShell,this.telegraph,this.impactFlash,this.shockwave,...this.shots.map(s=>s.image),...this.marks.map(m=>m.visual)]; }
  private readonly impactFlash: Phaser.GameObjects.Image;
  private readonly shockwave: Phaser.GameObjects.Image;
  private impactAt = -Infinity;
  private impactScale = 1;
  private lastWaveRadius: number = WARDEN.slam.waveStart;
  private connectedStrike = false;
  private fired = [false, false, false];
  private readonly shell: Phaser.GameObjects.Graphics;
  private readonly closedShell: Phaser.GameObjects.Graphics;
  private guardAngle = Math.PI;
  private pressure = 0;
  private lastPressureAt = -Infinity;
  private deflectedUntil = 0;
  private victims = [new Set<Vec2>(),new Set<Vec2>(),new Set<Vec2>()];
  private participants?: readonly Vec2[];
  private readonly core: Phaser.GameObjects.Ellipse;
  private readonly name: Phaser.GameObjects.Text;
  private readonly shots: SignalShot[];
  private readonly marks: GroundMark[];
  private readonly velocity: Vec2 = { x: 0, y: 0 };
  private readonly push: Vec2 = { x: 0, y: 0 };
  private readonly previous: Vec2 = { x: 0, y: 0 };
  private readonly attackOrigin: Vec2 = { x: 0, y: 0 };
  private _state: WardenState = 'DORMANT';
  private _phase: WardenPhase = 1;
  private _attackName: WardenAttack | null = null;
  private introduced = false;
  private stateAt = 0;
  private stateUntil = 0;
  private attackAngle = Math.PI;
  private patternIndex = 0;
  private rushTravelled = 0;
  private hurtUntil = 0;
  private travelPhase = 0;
  private facingLeft = true;
  private stopped = false;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly arenaBounds: MovementBounds,
    private readonly onCue: (cue: WardenCue, attack?: WardenAttack) => void,
    private readonly onDefeated: () => void,
  ) {
    this.position = { x, y };
    this.shadow = createCreatureShadow(scene,x, y + 15, 174, 60, 0x071518, 0.7).setDepth(y - 2);
    this.body = scene.add.image(0, 30, 'warden-motion', 0)
      .setOrigin(0.5, 0.83).setDisplaySize(WARDEN.artSize, WARDEN.artSize).setFlipX(true);
    this.core = scene.add.ellipse(0, -40, 27, 17, 0xa98cff, 0.13).setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(!!scene.data.get('creature-art-original'));
    // The new full poses contain the core and its Signal flare. A fixed ellipse
    // over the chest would detach from its painted anatomy during a strike.
    this.view = scene.add.container(x, y, [this.body, this.core]).setDepth(y);
    this.name = createEnemyName(scene, x, y - 182, 'O WARDEN');
    this.telegraph = scene.add.graphics().setVisible(false);
    this.bakeImpactTextures();
    this.impactFlash = scene.add.image(x,y,'warden-ground-impact').setVisible(false);
    this.shockwave = scene.add.image(x,y,'warden-shockwave').setVisible(false);
    // Fixed geometry, drawn once. Position/rotation/visibility also travel in protocol 15.
    this.shell = scene.add.graphics().lineStyle(6, 0xc9b4ed, 0.85)
      .beginPath().arc(0, 0, 80, -WARDEN.guardHalfAngle, WARDEN.guardHalfAngle, false).strokePath()
      .lineStyle(3, 0xf7e8c2, 1).lineBetween(75, -16, 88, 0).lineBetween(88, 0, 75, 16)
      .setVisible(false);
    this.closedShell=scene.add.graphics().lineStyle(6,0xc9b4ed,.85).strokeCircle(0,0,80).setVisible(false);
    this.shots = Array.from({ length: 6 }, (_,index) => ({
      pulse: Math.floor(index/3),
      active: false, x, y, angle: 0, travelled: 0, previous: { x, y },
      image: scene.add.ellipse(x, y, 30, 19, 0xffbd54, 0.95)
        .setStrokeStyle(3, 0xff6a4a, 1).setVisible(false),
    }));
    this.marks = Array.from({ length: 3 }, () => ({ x, y, spent: false, visual: scene.add.graphics().setVisible(false) }));
  }

  get phase(): WardenPhase { return this._phase; }
  get state(): WardenState { return this._state; }
  get attackName(): WardenAttack | null { return this._attackName; }
  get introComplete(): boolean { return this.introduced; }
  get coreExposed(): boolean { return this._state === 'RECOVER' && !this.connectedStrike; }
  get canBeHit(): boolean {
    return !this.isDead && !this.stopped && this.introduced
      && this._state !== 'INTRO' && this._state !== 'PHASE' && this._state !== 'DORMANT';
  }

  // Called on the authoritative hit path for every kit, including guest attacks.
  // Incoming travel angle, rather than the shooter's later position, handles bolts/DOT.
  receiveStrike(now: number, travelAngle: number): number {
    if (!this.canBeHit) return 0;
    if (this._state === 'EXECUTE') return 0;
    if (this._state === 'RECOVER') return this.coreExposed ? WARDEN.openingDamage : 0;
    const contactAngle = travelAngle + Math.PI;
    const difference = Math.abs(Math.atan2(Math.sin(contactAngle - this.guardAngle), Math.cos(contactAngle - this.guardAngle)));
    if (difference > WARDEN.guardHalfAngle) return 1;
    this.deflectedUntil = now + 180;
    if (this._state === 'IDLE' || this._state === 'TELEGRAPH') {
      this.pressure = now - this.lastPressureAt > WARDEN.pressureWindowMs ? 1 : this.pressure + 1;
      this.lastPressureAt = now;
      if (this.pressure >= WARDEN.pressureHits) {
        // Bring forward a fully telegraphed counter; never damage on a blocked hit.
        if (this._state === 'IDLE') this.stateUntil = Math.min(this.stateUntil, now + WARDEN.pressureCounterDelayMs);
      }
    }
    return 0;
  }

  beginIntro(now: number): void {
    if (this._state !== 'DORMANT' || this.isDead || this.stopped) return;
    this.setState('INTRO', now, WARDEN.introMs);
    this.onCue('intro');
  }

  update(now: number, dt: number, player: Vec2, playerDead: boolean,
    obstacles: readonly Obstacle[], onAttack: (impact?: EnemyImpact) => boolean | void, _bounds?: MovementBounds, participants?: readonly Vec2[]): void {
    this.participants=participants;
    if (this.isDead || this.stopped) return;
    if (playerDead) { this.suspend(); return; }
    const elapsed = Math.min(dt, 0.04);
    this.velocity.x = this.velocity.y = 0;
    this.previous.x = this.position.x;
    this.previous.y = this.position.y;

    if (this._state === 'DORMANT') { this.render(now, 0); return; }
    if (this._state === 'INTRO') {
      if (now >= this.stateUntil) {
        this.introduced = true;
        this.setState('IDLE', now, WARDEN.idleMs[0]);
      }
      this.render(now, 0);
      return;
    }

    const ratio = this.health.current / this.health.max;
    const targetPhase: WardenPhase = ratio <= WARDEN.phaseThreeAt ? 3 : ratio <= WARDEN.phaseTwoAt ? 2 : 1;
    if (targetPhase > this._phase && (this._state === 'IDLE' || this._state === 'RECOVER')) {
      this._phase = targetPhase;
      this.patternIndex = 0;
      this.clearHazards();
      this._attackName = null;
      this.setState('PHASE', now, WARDEN.phaseMs);
      this.onCue('phase');
    }

    if (this._state === 'PHASE') {
      if (now >= this.stateUntil) this.setState('IDLE', now, WARDEN.idleMs[this._phase - 1]);
    } else if (this._state === 'IDLE') {
      const dx = player.x - this.position.x, dy = player.y - this.position.y;
      const gap = Math.hypot(dx, dy);
      this.guardAngle = Math.atan2(dy, dx);
      if (Math.abs(dx) > 12) this.facingLeft = dx < 0;
      if (gap > WARDEN.standOff) {
        this.velocity.x = dx / gap * WARDEN.speed;
        this.velocity.y = dy / gap * WARDEN.speed;
      }
      if (now >= this.stateUntil) {
        const pattern = WARDEN_PATTERNS[this._phase];
        const selected = pattern[this.patternIndex++ % pattern.length];
        // Faraway targets receive a readable approach rather than repeated empty swipes.
        const counter = this.pressure >= WARDEN.pressureHits;
        if (counter) this.pressure = 0;
        this.beginAttack(now, counter ? (gap > 230 ? 'rush' : 'slam') : gap > 320 && selected === 'sweep' ? 'rush' : selected, player);
        this.velocity.x = this.velocity.y = 0;
      }
    } else if (this._state === 'TELEGRAPH') {
      if (now >= this.stateUntil) this.execute(now);
    } else if (this._state === 'EXECUTE') {
      this.updateAttack(now, elapsed, player, obstacles, onAttack);
      if (this.stopped) return;
      if (now >= this.stateUntil || (this._attackName === 'rush' && this.rushTravelled >= WARDEN.rush.distance)) {
        const recovery = this._attackName ? WARDEN[this._attackName].recoverMs : 1400;
        this.clearHazards();
        this.setState('RECOVER', now, this.connectedStrike ? WARDEN.closedRecoverMs : recovery);
        if (this.coreExposed) this.onCue('recover');
        this.velocity.x = this.velocity.y = 0;
      }
    } else if (this._state === 'RECOVER' && now >= this.stateUntil) {
      this._attackName = null;
      this.setState('IDLE', now, WARDEN.idleMs[this._phase - 1]);
    }

    if (now < this.hurtUntil && (this._state === 'IDLE' || this._state === 'RECOVER')) {
      this.velocity.x += this.push.x;
      this.velocity.y += this.push.y;
      this.push.x *= Math.max(0, 1 - elapsed * 14);
      this.push.y *= Math.max(0, 1 - elapsed * 14);
    }

    // Rush performs its own swept collision step. All other movement uses the same solver.
    if (this._state !== 'EXECUTE' || this._attackName !== 'rush') {
      moveWithCollisions(this.position, this.velocity, elapsed, this.radius, obstacles, this.arenaBounds);
    }
    const travelled = distance(this.position, this.previous);
    this.render(now, travelled);
  }

  private setState(state: WardenState, now: number, duration: number): void {
    this._state = state;
    this.stateAt = now;
    this.stateUntil = now + duration;
  }

  private beginAttack(now: number, attack: WardenAttack, player: Vec2): void {
    this.clearHazards();
    this._attackName = attack;
    this.connectedStrike = false;
    this.victims.forEach(v=>v.clear());
    this.fired.fill(false);
    this.lastWaveRadius = WARDEN.slam.waveStart;
    this.rushTravelled = 0;
    this.attackOrigin.x = this.position.x;
    this.attackOrigin.y = this.position.y;
    this.attackAngle = Math.atan2(player.y - this.position.y, player.x - this.position.x);
    this.guardAngle = this.attackAngle;
    if (Math.abs(Math.cos(this.attackAngle)) > 0.1) this.facingLeft = Math.cos(this.attackAngle) < 0;
    this.setState('TELEGRAPH', now, WARDEN[attack].telegraphMs);
    this.drawTelegraph(attack, player);
    this.onCue('telegraph', attack);
  }

  private execute(now: number): void {
    const attack = this._attackName;
    if (!attack) return;
    this.setState('EXECUTE', now, WARDEN[attack].executeMs);
    if (attack === 'signal') this.telegraph.setVisible(false);
    this.onCue('execute', attack);
  }

  private updateAttack(now: number, dt: number, player: Vec2, obstacles: readonly Obstacle[], onAttack: (impact?: EnemyImpact) => boolean | void): void {
    const attack = this._attackName;
    if (!attack) return;
    const activeFor = now - this.stateAt;
    if (attack === 'sweep') {
      for(let pulse=0;pulse<2;pulse++)if(!this.fired[pulse]&&activeFor>=(pulse?WARDEN.sweep.returnMs:WARDEN.sweep.strikeMs)){
        this.fired[pulse]=true;
        this.showImpact(now,this.attackOrigin);
        const angle=this.attackAngle+(pulse?Math.PI:0);
        for(const victim of this.participants??[player])if(inMeleeArc(this.attackOrigin,angle,victim,WARDEN.sweep.range,WARDEN.sweep.halfAngle,PLAYER.radius))this.hit(onAttack,victim,WARDEN.sweep.damage,pulse);
      }
    } else if (attack === 'slam') {
      if(!this.fired[0]&&activeFor>=WARDEN.slam.strikeMs){
        this.fired[0]=true;this.showImpact(now,this.attackOrigin);
        this.telegraph.clear().lineStyle(2,0xd1b1f5,0.5).strokeCircle(0,0,WARDEN.slam.waveRadius);
        for(const victim of this.participants??[player])if(distance(this.attackOrigin,victim)<=WARDEN.slam.radius+PLAYER.radius)this.hit(onAttack,victim);
      }
      if(activeFor>=WARDEN.slam.waveMs&&this.lastWaveRadius<WARDEN.slam.waveRadius){
        const progress=clamp((activeFor-WARDEN.slam.waveMs)/WARDEN.slam.waveDurationMs,0,1);
        const radius=WARDEN.slam.waveStart+(WARDEN.slam.waveRadius-WARDEN.slam.waveStart)*progress;
        if(!this.fired[1]){this.fired[1]=true;this.showImpact(now,this.attackOrigin);}
        this.shockwave.setPosition(this.attackOrigin.x,this.attackOrigin.y).setDisplaySize(radius*2,radius*2).setDepth(this.attackOrigin.y-1).setAlpha(1-progress*.4).setVisible(true);
        for(const victim of this.participants??[player]){
          const gap=distance(this.attackOrigin,victim),margin=WARDEN.slam.waveWidth+PLAYER.radius;
          if(gap>=this.lastWaveRadius-margin&&gap<=radius+margin)this.hit(onAttack,victim,WARDEN.slam.waveDamage,1);
        }
        this.lastWaveRadius=radius;
      }else if(activeFor>=WARDEN.slam.waveMs)this.shockwave.setVisible(false);
    } else if (attack === 'rush') {
      const beforeX = this.position.x, beforeY = this.position.y;
      this.velocity.x = Math.cos(this.attackAngle) * WARDEN.rush.speed;
      this.velocity.y = Math.sin(this.attackAngle) * WARDEN.rush.speed;
      moveWithCollisions(this.position, this.velocity, dt, this.radius, obstacles, this.arenaBounds);
      const moved = Math.hypot(this.position.x - beforeX, this.position.y - beforeY);
      this.rushTravelled += moved;
      for(const victim of this.participants??[player]) if (inShockwaveSweep(this.previous, this.attackAngle, victim, 0, moved,
        WARDEN.rush.halfWidth, this.radius * 2, PLAYER.radius)) this.hit(onAttack,victim);
      if (moved < WARDEN.rush.speed * dt * 0.4) this.stateUntil = now;
    } else if (attack === 'signal') {
      for(let volley=0;volley<2;volley++)if(!this.fired[volley]&&activeFor>=(volley?WARDEN.signal.secondMs:WARDEN.signal.firstMs)){
        this.fired[volley]=true;this.showImpact(now,this.position);
        for(let index=0;index<3;index++){
          const shot=this.shots[volley*3+index];shot.angle=this.attackAngle+(index-1+(volley?.5:0))*WARDEN.signal.spread;
          shot.x=this.position.x+Math.cos(shot.angle)*(this.radius+8);shot.y=this.position.y+Math.sin(shot.angle)*(this.radius+8);
          shot.travelled=0;shot.active=true;
        }
      }
      for (const shot of this.shots) {
        if (!shot.active) continue;
        const step = Math.min(WARDEN.signal.speed * dt, WARDEN.signal.range - shot.travelled);
        shot.previous.x = shot.x;
        shot.previous.y = shot.y;
        shot.x += Math.cos(shot.angle) * step;
        shot.y += Math.sin(shot.angle) * step;
        shot.travelled += step;
        const blocked = obstacles.some(obstacle => inShockwaveSweep(shot.previous, shot.angle, obstacle, 0, step,
          WARDEN.signal.radius, 0, obstacle.radius));
        const contacts=(this.participants??[player]).filter(victim=>!blocked && inShockwaveSweep(shot.previous, shot.angle, victim, 0, step, WARDEN.signal.radius, 0, PLAYER.radius));
        const hit=contacts.length>0;
        for(const victim of contacts)this.hit(onAttack,victim,WARDEN.signal.damage,shot.pulse);
        if (hit || blocked || shot.travelled >= WARDEN.signal.range
          || shot.x < this.arenaBounds.left || shot.x > this.arenaBounds.right
          || shot.y < this.arenaBounds.top || shot.y > this.arenaBounds.bottom) {
          shot.active = false;
          shot.image.setVisible(false);
        } else shot.image.setPosition(shot.x, shot.y).setRotation(shot.angle).setDepth(shot.y + 3).setVisible(true);
      }
    } else if (attack === 'echoes') {
      for (let index = 0; index < this.marks.length; index++) {
        const mark = this.marks[index];
        if (!mark.spent && activeFor >= WARDEN.echoes.strikeMs + index * WARDEN.echoes.intervalMs) {
          mark.spent = true;
          this.showImpact(now,mark);
          for(const victim of this.participants??[player]) if (distance(mark, victim) <= WARDEN.echoes.radius + PLAYER.radius) this.hit(onAttack,victim,WARDEN.echoes.damage,index);
        }
        if (mark.spent) mark.visual.setAlpha(Math.max(0, 1 - (activeFor - WARDEN.echoes.strikeMs - index * WARDEN.echoes.intervalMs) / 220));
      }
    }
  }

  private hit(onAttack: (impact?: EnemyImpact) => boolean | void, victim:Vec2, damage?:number, pulse=0): void {
    if (this.victims[pulse].has(victim) || !this._attackName) return;
    this.victims[pulse].add(victim);
    // A dash or hurt-grace can reject this attempt in GameScene. It still consumes
    // the activation, preventing a lingering shape from hitting after invulnerability.
    if(onAttack({ damage: damage??WARDEN[this._attackName].damage, ranged: true, victim })===true)this.connectedStrike=true;
  }

  private drawTelegraph(attack: WardenAttack, player: Vec2): void {
    const graphic = this.telegraph;
    graphic.clear().setScale(1).setAlpha(1).setPosition(this.attackOrigin.x, this.attackOrigin.y)
      .setRotation(this.attackAngle).setDepth(this.attackOrigin.y - 1).setVisible(true);
    graphic.fillStyle(0xff6a4a, 0.15).lineStyle(3, 0xffbd54, 0.95);
    if (attack === 'sweep') {
      graphic.beginPath().moveTo(0, 0).arc(0, 0, WARDEN.sweep.range, -WARDEN.sweep.halfAngle, WARDEN.sweep.halfAngle, false)
        .closePath().fillPath().strokePath();
      this.arrow(graphic, 74, 0, 0);
      graphic.fillStyle(0xa98cff,0.08).lineStyle(2,0xcbb0f4,0.8);
      graphic.beginPath().moveTo(0,0).arc(0,0,WARDEN.sweep.range,Math.PI-WARDEN.sweep.halfAngle,Math.PI+WARDEN.sweep.halfAngle,false).closePath().fillPath().strokePath();
      this.arrow(graphic,-74,0,Math.PI);
    } else if (attack === 'rush') {
      graphic.fillRect(-this.radius, -WARDEN.rush.halfWidth, WARDEN.rush.distance + this.radius * 2, WARDEN.rush.halfWidth * 2);
      graphic.strokeRect(-this.radius, -WARDEN.rush.halfWidth, WARDEN.rush.distance + this.radius * 2, WARDEN.rush.halfWidth * 2);
      this.arrow(graphic, 130, 0, 0);
      this.arrow(graphic, 250, 0, 0);
    } else if (attack === 'slam') {
      this.groundWarning(graphic, WARDEN.slam.radius);
      graphic.lineStyle(2,0xd1b1f5,0.65).strokeCircle(0,0,WARDEN.slam.waveRadius);
    } else if (attack === 'signal') {
      graphic.lineStyle(3, 0xffbd54, 0.7);
      for (let index = 0; index < 6; index++) {
        const angle = (index%3-1+(index>=3?.5:0)) * WARDEN.signal.spread;
        const x = Math.cos(angle), y = Math.sin(angle);
        graphic.lineBetween(x * this.radius, y * this.radius, x * 520, y * 520);
        this.arrow(graphic, x * 160, y * 160, angle);
      }
    } else {
      graphic.setVisible(false);
      // All positions lock now; later circles never chase the player during execution.
      for (let index = 0; index < this.marks.length; index++) {
        const mark = this.marks[index];
        const side = index === 0 ? 0 : index === 1 ? -1 : 1;
        mark.x = clamp(player.x - Math.sin(this.attackAngle) * side * WARDEN.echoes.spacing,
          this.arenaBounds.left + WARDEN.echoes.radius, this.arenaBounds.right - WARDEN.echoes.radius);
        mark.y = clamp(player.y + Math.cos(this.attackAngle) * side * WARDEN.echoes.spacing,
          this.arenaBounds.top + WARDEN.echoes.radius, this.arenaBounds.bottom - WARDEN.echoes.radius);
        mark.spent = false;
        mark.visual.clear().setPosition(mark.x, mark.y).setRotation(0).setDepth(mark.y - 1).setAlpha(1).setVisible(true);
        this.groundWarning(mark.visual, WARDEN.echoes.radius);
        // One/two/three short notches communicate the order without relying on color.
        mark.visual.lineStyle(5, 0xffe0a3, 1);
        for (let notch = 0; notch <= index; notch++) mark.visual.lineBetween(-index * 8 + notch * 16, -30, -index * 8 + notch * 16, -18);
      }
    }
  }

  private groundWarning(graphic: Phaser.GameObjects.Graphics, radius: number): void {
    graphic.fillStyle(0xff6a4a, 0.15).fillCircle(0, 0, radius);
    graphic.lineStyle(3, 0xffbd54, 0.95).strokeCircle(0, 0, radius);
    graphic.lineBetween(-12, -12, 12, 12).lineBetween(12, -12, -12, 12);
    // Four edge strokes make the extent readable against both rock and vegetation.
    for (let index = 0; index < 4; index++) {
      const angle = index * Math.PI / 2;
      graphic.lineBetween(Math.cos(angle) * (radius - 13), Math.sin(angle) * (radius - 13),
        Math.cos(angle) * (radius + 4), Math.sin(angle) * (radius + 4));
    }
  }

  private arrow(graphic: Phaser.GameObjects.Graphics, x: number, y: number, angle: number): void {
    const forwardX = Math.cos(angle), forwardY = Math.sin(angle);
    const sideX = -forwardY, sideY = forwardX;
    graphic.lineBetween(x - forwardX * 14 + sideX * 10, y - forwardY * 14 + sideY * 10, x, y);
    graphic.lineBetween(x - forwardX * 14 - sideX * 10, y - forwardY * 14 - sideY * 10, x, y);
  }

  private bakeImpactTextures(): void {
    for(const key of ['warden-ground-impact','warden-shockwave']){
      if(this.scene.textures.exists(key))continue;
      const texture=this.scene.textures.createCanvas(key,512,512)!,ctx=texture.context;
      ctx.translate(256,256);
      if(key==='warden-shockwave'){
        ctx.strokeStyle='rgba(202,158,247,.3)';ctx.lineWidth=24;ctx.beginPath();ctx.arc(0,0,238,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle='#f1dcc4';ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,0,240,0,Math.PI*2);ctx.stroke();
      }else{
        const glow=ctx.createRadialGradient(0,0,15,0,0,235);glow.addColorStop(0,'rgba(240,218,177,.45)');glow.addColorStop(.4,'rgba(183,133,237,.2)');glow.addColorStop(1,'rgba(90,69,52,0)');ctx.fillStyle=glow;ctx.fillRect(-256,-256,512,512);
        for(let i=0;i<13;i++){
          const angle=(i+.28*Math.sin(i*3.3))*Math.PI*2/13,radius=125+Math.sin(i*7)*35;
          ctx.save();ctx.rotate(angle);ctx.strokeStyle=i%2?'rgba(174,150,117,.65)':'rgba(59,48,38,.65)';ctx.lineWidth=2+i%3;
          ctx.beginPath();ctx.moveTo(30,Math.sin(i)*12);ctx.lineTo(radius*.6,-9);ctx.lineTo(radius,12);ctx.lineTo(radius+18,-4);ctx.stroke();
          const dust=ctx.createRadialGradient(radius+10,0,2,radius+10,0,36);dust.addColorStop(0,'rgba(180,160,135,.36)');dust.addColorStop(1,'rgba(130,110,90,0)');ctx.fillStyle=dust;ctx.fillRect(radius-28,-38,76,76);
          ctx.fillStyle=i%2?'#a89375':'#6c6261';ctx.beginPath();ctx.moveTo(radius+15,-7);ctx.lineTo(radius+24,-4);ctx.lineTo(radius+20,3);ctx.lineTo(radius+12,1);ctx.fill();ctx.restore();
        }
      }
      texture.refresh();
    }
  }

  private showImpact(now:number,position:Vec2):void {
    this.impactAt=now;
    this.impactScale=(this._attackName==='slam'?WARDEN.slam.radius*2:this._attackName==='echoes'?WARDEN.echoes.radius*2:160)/512;
    this.impactFlash.setPosition(position.x,position.y).setDepth(position.y-1).setScale(this.impactScale).setAlpha(1).setVisible(true);
    this.onCue('impact',this._attackName??undefined);
  }

  private render(now: number, travelled: number): void {
    const moving = travelled > 0.1 && (this._state === 'IDLE' || (this._state === 'EXECUTE' && this._attackName === 'rush'));
    if (moving) this.travelPhase += travelled / 62;
    const warning = this._state === 'TELEGRAPH';
    const execution = this._state === 'EXECUTE';
    const signalPose = this._attackName === 'signal' || this._attackName === 'echoes';
    const frame = this.coreExposed || this._state === 'PHASE' || (warning && signalPose) ? 6
      : warning ? 3 : execution ? signalPose ? 6 : this._attackName === 'slam' ? 5 : 4
      : moving ? 1 + Math.floor(this.travelPhase) % 2 : 0;
    const slam=this._attackName==='slam'&&(warning||execution||this.coreExposed);
    if(slam){
      const age=now-this.stateAt;
      const slamFrame=warning?(warningProgressFor(now,this.stateAt,this.stateUntil)<.35?0:warningProgressFor(now,this.stateAt,this.stateUntil)<.7?1:2)
        :this.coreExposed?7:age<100?2:age<210?3:age<410?4:age<750?5:age<980?6:7;
      this.body.setTexture('warden-slam-motion',slamFrame);
    }else this.body.setTexture('warden-motion',frame);
    this.body.setFlipX(this.facingLeft);
    if (now < this.hurtUntil) this.body.setTintFill(0xf3e4cd);
    else this.body.clearTint();
    const warningProgress = warning ? clamp((now - this.stateAt) / (this.stateUntil - this.stateAt), 0, 1) : 0;
    const introProgress = this._state === 'INTRO' ? clamp((now - this.stateAt) / WARDEN.introMs, 0, 1) : 1;
    // Full painted poses carry the weight change; keep their foot plane fixed.
    const age=now-this.stateAt;
    const lean=execution&&this._attackName==='sweep'?(age<WARDEN.sweep.returnMs?Math.sin(clamp((age-WARDEN.sweep.strikeMs+100)/300,0,1)*Math.PI)*.12:-Math.sin(clamp((age-WARDEN.sweep.returnMs+100)/300,0,1)*Math.PI)*.12):0;
    this.body.setPosition(0,30).setRotation(lean);
    this.view.setPosition(this.position.x, this.position.y).setDepth(this.position.y).setRotation(0);
    this.name.setPosition(this.position.x, this.position.y - 182).setVisible(this._state !== 'DORMANT');
    // Grounded steps use actual travel; a blocked creature never cycles through a glide.
    this.shadow.setPosition(this.position.x, this.position.y + 15).setDepth(this.position.y - 2)
      .setScale(1 + warningProgress * 0.04, 1 - warningProgress * 0.08);
    const fullyGuarded=execution||this._state==='RECOVER'&&!this.coreExposed;
    this.shell.setPosition(this.position.x, this.position.y).setRotation(this.guardAngle)
      .setDepth(this.position.y - 1).setVisible(this.canBeHit && !this.coreExposed&&!fullyGuarded)
      .setAlpha(now < this.deflectedUntil ? 1 : this._state === 'EXECUTE' ? 0.35 : 0.65);
    this.closedShell.setPosition(this.position.x,this.position.y).setDepth(this.position.y-1)
      .setVisible(this.canBeHit&&fullyGuarded).setAlpha(now<this.deflectedUntil?1:.65);
    if (this.coreExposed) this.body.setTint(0xd5f5ec);
    const impactProgress=clamp((now-this.impactAt)/360,0,1);
    this.impactFlash.setVisible(impactProgress<1).setAlpha(1-impactProgress).setScale(this.impactScale*(1+impactProgress*.35));
    this.core.setFillStyle(this._phase === 3 ? 0xffbd54 : 0xa98cff)
      .setAlpha(this._state === 'DORMANT' ? 0.08 : (0.18 + this._phase * 0.07 + warningProgress * 0.38) * introProgress)
      .setScale(this._state === 'PHASE' ? 1.5 : 1 + Math.sin(now * 0.004) * 0.08 + warningProgress * 0.3);
    if (warning) {
      this.telegraph.setAlpha(0.62 + warningProgress * 0.38);
      if (this._attackName === 'echoes') for (const mark of this.marks) mark.visual.setAlpha(0.62 + warningProgress * 0.38);
    } else if (execution && this._attackName !== 'echoes' && this._attackName !== 'signal') {
      this.telegraph.setAlpha(1 - clamp((now - this.stateAt) / (this.stateUntil - this.stateAt), 0, 1) * 0.7);
    }
  }

  private clearHazards(): void {
    this.telegraph.setVisible(false);
    for (const shot of this.shots) { shot.active = false; shot.image.setVisible(false); }
    for (const mark of this.marks) { mark.spent = true; mark.visual.setVisible(false); }
    this.shockwave.setVisible(false);
  }

  // Called by GameScene immediately on player death, before its dead-player early return.
  suspend(): void {
    if (this.isDead || this.stopped) return;
    this.stopped = true;
    this.clearHazards();
    this.shell.setVisible(false);
    this.closedShell.setVisible(false);
    this.impactFlash.setVisible(false);
    this._state = 'DORMANT';
    this._attackName = null;
    this.velocity.x = this.velocity.y = this.push.x = this.push.y = 0;
    this.body.setTexture('warden-motion',0).setRotation(0).clearTint();
    this.name.setVisible(false);
    this.core.setAlpha(0.15);
  }

  hurt(now: number, from: Vec2, force = 300): void {
    if (!this.canBeHit) return;
    this.hurtUntil = now + 115;
    const dx = this.position.x - from.x, dy = this.position.y - from.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    this.push.x = dx / length * force * WARDEN.knockbackResistance;
    this.push.y = dy / length * force * WARDEN.knockbackResistance;
    // Its mass prevents Saber stunlock and preserves
    // committed warning geometry; reduced knockback is applied in idle/recovery only.
    this.body.setTintFill(0xf3e4cd);
  }

  die(): void {
    if (this.isDead) return;
    this.health.current = 0;
    this.isDead = true;
    this.name.destroy();
    this._state = 'DEATH';
    this._attackName = null;
    this.clearHazards();
    this.shell.setVisible(false);
    this.closedShell.setVisible(false);
    this.impactFlash.setVisible(false);
    this.body.clearTint().setTexture('warden-motion',7).setRotation(0);
    this.onCue('death');
    this.scene.tweens.add({ targets: this.core, alpha: 0, scale: 0.25, duration: 1400 });
    this.scene.tweens.add({ targets: this.view, scaleY: 0.87, alpha: 0.58, duration: 1700, ease: 'Sine.easeOut' });
    this.scene.tweens.add({ targets: this.shadow, scaleY: 0.7, alpha: 0.52, duration: 1700 });
    // Scene-owned finite timer is disposed on restart; completion cannot duplicate.
    this.scene.time.delayedCall(WARDEN.deathMs, () => {
      this.onCue('defeated');
      this.onDefeated();
    });
  }
}
