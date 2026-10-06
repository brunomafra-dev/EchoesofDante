import Phaser from 'phaser';
import type { InputMethod } from '../input/Controls';
import type { Vec2 } from '../utils/math';
import { distance } from '../utils/math';
import type { Hud } from './Hud';

export type ExplorationTarget = Vec2 & {
  name: string;
  radius: number;
  instruction: string;
  action?: 'investigate' | 'walk' | 'blocked' | 'observe' | 'enter';
};

// A nearby environmental label and a short next step, not a quest/map framework.
export class ExplorationGuide {
  private label: Phaser.GameObjects.Text;
  private base: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene) {
    this.base = scene.add.ellipse(0, 0, 62, 22, 0xa98cff, 0.07).setStrokeStyle(1, 0xa98cff, 0.6).setVisible(false);
    this.label = scene.add.text(0, 0, '', {
      fontFamily: 'Barlow Condensed, sans-serif', fontSize: '15px', fontStyle: 'bold',
      color: '#d8cfe6', stroke: '#080e0c', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5, 0).setDepth(11000).setVisible(false);
  }

  hide(): void { this.label.setVisible(false); this.base.setVisible(false); }

  update(player: Vec2, dead: boolean, method: InputMethod, title: string, target: ExplorationTarget, hud: Hud): void {
    const gap = distance(player, target);
    const nearby = gap <= target.radius;
    const dx = target.x - player.x, dy = target.y - player.y;
    const vertical = Math.abs(dy) > Math.abs(dx) * 0.45 ? dy < 0 ? 'norte' : 'sul' : '';
    const horizontal = Math.abs(dx) > Math.abs(dy) * 0.45 ? dx < 0 ? 'oeste' : 'leste' : '';
    const direction = vertical && horizontal ? vertical === 'norte'
      ? horizontal === 'leste' ? 'nordeste' : 'noroeste'
      : horizontal === 'leste' ? 'sudeste' : 'sudoeste' : vertical || horizontal;
    const command = target.action === 'enter'
      ? method === 'gamepad' ? '[A] ENTRAR' : method === 'touch' ? 'Toque em ENTRAR' : '[E] ENTRAR'
      : method === 'gamepad' ? '[A] INVESTIGAR' : method === 'touch' ? 'Toque em INVESTIGAR' : '[E] INVESTIGAR';
    const instruction = nearby && (target.action === 'investigate' || target.action === 'enter') ? command : target.instruction;
    hud.setExplorationGuide(title, nearby ? `${target.name} está aqui.` : `${target.name} • ${direction}`, instruction, nearby);
    const visible = !dead && gap <= target.radius + 170;
    this.label.setVisible(visible);
    this.base.setVisible(visible && target.action === 'investigate');
    if (visible) {
      const text = target.action === 'blocked' ? `${target.name}\nPassagem interditada` : target.name;
      if (this.label.text !== text) this.label.setText(text);
      this.label.setPosition(target.x, target.y + 35);
      this.base.setPosition(target.x, target.y + 8).setDepth(target.y + 1);
    }
  }
}
