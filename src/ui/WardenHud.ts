import Phaser from 'phaser';
import { VIEW_WIDTH } from '../config/game';
export type BossDisplay = {state:string;isDead:boolean;phase:number;attackName:string|null;health:{current:number;max:number}};

// A bounded encounter display; the existing exploration/player HUD remains in use.
export class WardenHud {
  private readonly group: Phaser.GameObjects.Container;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly cue: Phaser.GameObjects.Text;
  private compactViewport?: boolean;

  constructor(scene: Phaser.Scene, private readonly bossName = 'O WARDEN') {
    const back = scene.add.rectangle(0, 0, 360, 65, 0x080e0c, 0.38);
    const track = scene.add.rectangle(-168, 0, 336, 5, 0x344035).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(-168, 0, 336, 5, 0xa98cff).setOrigin(0, 0.5);
    const style = { fontFamily: 'Barlow Condensed, sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#e4dcff', shadow: { offsetX: 0, offsetY: 1, color: '#030807', blur: 3, fill: true } };
    this.title = scene.add.text(0, -26, '', style).setOrigin(0.5, 0);
    this.cue = scene.add.text(0, 10, '', { ...style, fontSize: '14px', color: '#ffdb9b' }).setOrigin(0.5, 0);
    this.group = scene.add.container(VIEW_WIDTH / 2, 74, [back, track, this.fill, this.title, this.cue]).setScrollFactor(0).setDepth(20000).setVisible(false);
  }

  update(boss?: BossDisplay): void {
    this.group.setVisible(!!boss && boss.state !== 'DORMANT' && !boss.isDead);
    if (!boss) return;
    const compact = this.group.scene.scale.displaySize.height < 500;
    if (compact !== this.compactViewport) {
      this.compactViewport = compact;
      this.title.setFontSize(compact ? 20 : 17);
      this.cue.setFontSize(compact ? 18 : 14);
    }
    this.fill.setScale(Math.max(0, boss.health.current / boss.health.max), 1);
    const title = `${this.bossName}   /   FASE ${boss.phase}`;
    if (this.title.text !== title) this.title.setText(title);
    const names: Record<string, string> = { breath: 'SOPRO GLACIAL', tail: 'VARREDURA DA CAUDA', eruption: 'ERUPÇÕES DE GELO', sweep: 'VARREDURA', rush: 'INVESTIDA', slam: 'IMPACTO', signal: 'DESCARGA', echoes: 'ECOS NO SOLO', burrow: 'EMERSÃO', fissure: 'FISSURAS EM SEQUÊNCIA' };
    const cue = boss.state === 'INTRO' ? this.bossName === 'O SOTERRADO' ? 'ALGO EMERGE DA AREIA' : 'PRESENÇA ANCESTRAL' : boss.state === 'PHASE' ? 'O SINAL ESTÁ MUDANDO' : boss.state === 'TELEGRAPH' ? `${names[boss.attackName ?? ''] ?? 'ATAQUE'} — SAIA DA MARCA` : boss.state === 'RECOVER' ? 'JANELA PARA ATACAR' : 'LEIA O MOVIMENTO';
    if (this.cue.text !== cue) this.cue.setText(cue);
  }
}
