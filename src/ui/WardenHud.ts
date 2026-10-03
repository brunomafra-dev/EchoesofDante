import Phaser from 'phaser';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../config/game';
import type { Warden } from '../entities/Warden';

// A bounded encounter display; the existing exploration/player HUD remains in use.
export class WardenHud {
  private readonly group: Phaser.GameObjects.Container;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly cue: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const back = scene.add.rectangle(0, 0, 460, 80, 0x07151c, 0.88).setStrokeStyle(1, 0xa98cff, 0.5);
    const track = scene.add.rectangle(-204, 3, 408, 9, 0x344345).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(-204, 3, 408, 9, 0xa98cff).setOrigin(0, 0.5);
    const style = { fontFamily: 'Barlow Condensed, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#e4dcff' };
    this.title = scene.add.text(0, -32, '', style).setOrigin(0.5, 0);
    this.cue = scene.add.text(0, 14, '', { ...style, fontSize: '19px', color: '#ffdb9b' }).setOrigin(0.5, 0);
    this.group = scene.add.container(VIEW_WIDTH / 2, VIEW_HEIGHT - 119, [back, track, this.fill, this.title, this.cue]).setScrollFactor(0).setDepth(20000).setVisible(false);
  }

  update(boss?: Warden): void {
    this.group.setVisible(!!boss && boss.state !== 'DORMANT' && !boss.isDead);
    if (!boss) return;
    this.fill.setScale(Math.max(0, boss.health.current / boss.health.max), 1);
    const title = `O WARDEN   /   FASE ${boss.phase}`;
    if (this.title.text !== title) this.title.setText(title);
    const names: Record<string, string> = { sweep: 'VARREDURA', rush: 'INVESTIDA', slam: 'IMPACTO', signal: 'DESCARGA', echoes: 'ECOS NO SOLO' };
    const cue = boss.state === 'INTRO' ? 'PRESENÇA ANCESTRAL' : boss.state === 'PHASE' ? 'O SINAL ESTÁ MUDANDO' : boss.state === 'TELEGRAPH' ? `${names[boss.attackName ?? ''] ?? 'ATAQUE'} — SAIA DA MARCA` : boss.state === 'RECOVER' ? 'JANELA PARA ATACAR' : 'LEIA O MOVIMENTO';
    if (this.cue.text !== cue) this.cue.setText(cue);
  }
}
