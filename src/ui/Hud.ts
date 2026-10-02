import Phaser from 'phaser';
import { KINETIC_CHARGE, VIEW_HEIGHT, VIEW_WIDTH } from '../config/game';
import { ECHO_COUNT, NORTHERN_DISCOVERY } from '../config/discovery';
import type { KineticPhase } from '../combat/KineticCharge';
import type { InputMethod } from '../input/Controls';

export class Hud {
  private hpFill: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private dashFill: Phaser.GameObjects.Rectangle;
  private dashText: Phaser.GameObjects.Text;
  private chargeText: Phaser.GameObjects.Text;
  private controlsPanel: Phaser.GameObjects.Graphics;
  private controlHints: Phaser.GameObjects.Text[] = [];
  private inputMethod: InputMethod = 'keyboard';
  private deathButtonText: Phaser.GameObjects.Text;
  private promptVisible = false;
  private deathGroup: Array<{ setVisible(value: boolean): unknown }> = [];
  private discoveryPrompt: Phaser.GameObjects.Text;
  private discoveryMessage: Phaser.GameObjects.Text;
  private progressText: Phaser.GameObjects.Text;
  private levelMessage: Phaser.GameObjects.Text;
  private signalPanel: Phaser.GameObjects.Graphics;
  private signalObjective: Phaser.GameObjects.Text;
  private explorationHint: Phaser.GameObjects.Text;
  private actionHint: Phaser.GameObjects.Text;
  private areaSubtitle: Phaser.GameObjects.Text;
  private discoveryTimer?: Phaser.Time.TimerEvent;
  private levelTimer?: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene, onRestart: () => void) {
    const text = (x: number, y: number, value: string, size: number, color = '#e8f1ed', condensed = false) => scene.add.text(x, y, value, {
      fontFamily: condensed ? 'Barlow Condensed, sans-serif' : 'DM Sans, sans-serif',
      fontSize: `${size}px`, color, fontStyle: condensed ? 'bold' : 'normal', letterSpacing: condensed ? 1.8 : 0.4,
    }).setScrollFactor(0).setDepth(20002);
    const panel = scene.add.graphics().setScrollFactor(0).setDepth(19990);
    const box = (x: number, y: number, w: number, h: number) => {
      panel.fillStyle(0x071b24, 0.88).fillRoundedRect(x, y, w, h, 8);
      panel.lineStyle(1, 0x668e91, 0.4).strokeRoundedRect(x, y, w, h, 8);
      panel.fillStyle(0x82c9cb, 0.65).fillRect(x + 12, y, 34, 2);
    };
    box(24, 16, 340, 79);
    box(24, 103, 340, 45);
    box(380, 16, 500, 79);
    box(896, 16, 360, 79);
    this.controlsPanel = scene.add.graphics().setScrollFactor(0).setDepth(19990);
    this.controlsPanel.fillStyle(0x071b24, 0.86).fillRoundedRect(24, VIEW_HEIGHT - 68, 1232, 48, 8);
    this.controlsPanel.lineStyle(1, 0x668e91, 0.32).strokeRoundedRect(24, VIEW_HEIGHT - 68, 1232, 48, 8);
    this.controlsPanel.fillStyle(0x82c9cb, 0.65).fillRect(39, VIEW_HEIGHT - 68, 46, 2);

    text(45, 24, 'ECHOES OF DANTE', 26, '#ecf5ee', true);
    this.areaSubtitle = text(47, 61, 'FLORESTA DE DANTE   /   EXPLORAÇÃO', 12, '#83a8a8');
    this.progressText = text(44, 112, 'NV 1   XP 0 / 60   ECOS 0 / 3', 17, '#d8e9dc', true);
    this.signalPanel = scene.add.graphics().setScrollFactor(0).setDepth(19990);
    this.signalPanel.fillStyle(0x071b24, 0.88).fillRoundedRect(24, 156, 340, 90, 8);
    this.signalPanel.lineStyle(1, 0xa98cff, 0.55).strokeRoundedRect(24, 156, 340, 90, 8);
    this.signalPanel.fillStyle(0xa98cff, 0.7).fillRect(36, 156, 34, 2);
    this.signalObjective = text(44, 165, 'INVESTIGUE OS 3 ECOS', 17, '#b9adff', true);
    this.explorationHint = text(44, 191, 'Procure vestígios que emitem luz.', 13, '#c4d6ce');
    this.actionHint = text(44, 218, 'Aproxime-se para investigar.', 12, '#8eb8b5');
    text(401, 25, 'GUERREIRO GALÁCTICO', 19, '#eaf3ec', true);
    text(402, 58, 'VIDA', 12, '#8eb8b5', true);
    scene.add.rectangle(474, 57, 264, 13, 0x17343c).setOrigin(0).setScrollFactor(0).setDepth(20000);
    this.hpFill = scene.add.rectangle(476, 59, 260, 9, 0x9fd9c1).setOrigin(0).setScrollFactor(0).setDepth(20001);
    this.hpText = text(752, 49, '100 / 100 PV', 18, '#e5f3e8', true);
    text(917, 25, 'ESQUIVA DO VAZIO', 19, '#eaf3ec', true);
    text(918, 58, 'RECARGA', 12, '#8eb8b5', true);
    scene.add.rectangle(990, 57, 135, 13, 0x17343c).setOrigin(0).setScrollFactor(0).setDepth(20000);
    this.dashFill = scene.add.rectangle(992, 59, 131, 9, 0x8fd9df).setOrigin(0).setScrollFactor(0).setDepth(20001);
    this.dashText = text(1144, 48, 'PRONTO', 19, '#a4e5e6', true);
    this.chargeText = text(918, 77, '[Q]  CARGA CINÉTICA PRONTA', 12, '#a4e5e6');

    const key = (x: number, w: number, name: string, action: string) => {
      this.controlsPanel.fillStyle(0x24434c, 0.8).fillRoundedRect(x, VIEW_HEIGHT - 58, w, 28, 5);
      this.controlsPanel.lineStyle(1, 0x7bafb1, 0.45).strokeRoundedRect(x, VIEW_HEIGHT - 58, w, 28, 5);
      this.controlHints.push(text(x + 10, VIEW_HEIGHT - 57, name, 16, '#d6f0e8', true));
      this.controlHints.push(text(x + w + 11, VIEW_HEIGHT - 53, action, 13, '#9bb5b1'));
    };
    key(43, 88, 'W A S D', 'MOVER');
    key(254, 82, 'MOUSE', 'MIRAR');
    key(449, 88, 'CLIQUE', 'SABRE (BOT. ESQ.)');
    key(748, 95, 'ESPAÇO', 'ESQUIVA DO VAZIO');
    this.controlHints.push(text(1020, VIEW_HEIGHT - 57, 'Q: SEGURE E SOLTE\nE: INVESTIGAR', 12, '#9bb5b1'));
    this.discoveryPrompt = text(VIEW_WIDTH / 2, VIEW_HEIGHT - 115, '[ E ]  INVESTIGAR', 20, '#c4e5d9', true)
      .setOrigin(0.5).setBackgroundColor('#0b2730').setPadding(16, 9).setVisible(false);
    this.discoveryMessage = text(VIEW_WIDTH / 2, VIEW_HEIGHT - 184, 'SINAL DETECTADO\nFONTE: DESCONHECIDA', 22, '#c4e5d9', true)
      .setOrigin(0.5, 0).setAlign('center').setBackgroundColor('#0b2730').setPadding(22, 12).setVisible(false);
    this.levelMessage = text(VIEW_WIDTH / 2, 115, 'NOVO NÍVEL', 25, '#e4f6dc', true)
      .setOrigin(0.5, 0).setAlign('center').setBackgroundColor('#0b2730').setPadding(20, 8).setVisible(false);

    const veil = scene.add.rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, 0x05141b, 0.79).setOrigin(0).setScrollFactor(0).setDepth(30000).setVisible(false);
    const frame = scene.add.graphics().setScrollFactor(0).setDepth(30001).setVisible(false);
    frame.fillStyle(0x0b2730, 0.97).fillRoundedRect(347, 199, 586, 334, 11);
    frame.lineStyle(2, 0x689b9c, 0.65).strokeRoundedRect(347, 199, 586, 334, 11);
    frame.fillStyle(0xda938b).fillRect(374, 199, 65, 3);
    const overline = text(640, 232, 'SINAL PERDIDO   /   DANTE 01', 17, '#d99a91', true).setOrigin(0.5).setDepth(30002).setVisible(false);
    const title = text(640, 289, 'GUERREIRO CAÍDO', 58, '#eff3e9', true).setOrigin(0.5).setDepth(30002).setVisible(false);
    const subtitle = text(640, 373, 'Dante ainda está à escuta.', 17, '#aac5bf').setOrigin(0.5).setDepth(30002).setVisible(false);
    const button = scene.add.rectangle(640, 467, 248, 55, 0x9edacf).setScrollFactor(0).setDepth(30002).setInteractive({ useHandCursor: true }).setVisible(false);
    this.deathButtonText = text(640, 467, 'RENASCER   [ R ]', 26, '#12303a', true).setOrigin(0.5).setDepth(30003).setVisible(false);
    button.on('pointerover', () => button.setFillStyle(0xc1eee1));
    button.on('pointerout', () => button.setFillStyle(0x9edacf));
    button.on('pointerdown', onRestart);
    this.deathGroup = [veil, frame, overline, title, subtitle, button, this.deathButtonText];
  }

  update(hp: number, maxHp: number, dashProgress: number, chargeProgress: number, chargePhase: KineticPhase, chargeLevel: number): void {
    this.hpFill.width = 260 * hp / maxHp;
    this.hpFill.setFillStyle(hp < maxHp * 0.3 ? 0xdb8c81 : 0x9fd9c1);
    this.hpText.setText(`${hp} / ${maxHp} PV`);
    this.dashFill.width = 131 * dashProgress;
    this.dashText.setText(dashProgress >= 1 ? 'PRONTO' : `${Math.ceil((1 - dashProgress) * 1.7 * 10) / 10}s`);
    this.dashText.setColor(dashProgress >= 1 ? '#a4e5e6' : '#7b9c9c');
    const chargeKey = this.inputMethod === 'gamepad' ? '[LT]' : this.inputMethod === 'touch' ? '' : '[Q]';
    this.chargeText.setText(chargePhase === 'CHARGING' ? `${chargeKey}  CARREGANDO ${Math.round(chargeLevel * 100)}%` : chargePhase === 'RELEASE' ? `${chargeKey}  ONDA CINÉTICA` : chargeProgress >= 1 ? `${chargeKey}  SEGURE E SOLTE PARA A ONDA` : `${chargeKey}  CARGA ${((1 - chargeProgress) * KINETIC_CHARGE.cooldown / 1000).toFixed(1)}s`);
    this.chargeText.setColor(chargePhase !== 'READY' || chargeProgress >= 1 ? '#a4e5e6' : '#7b9c9c');
  }

  setInputMethod(method: InputMethod): void {
    if (this.inputMethod === method) return;
    this.inputMethod = method;
    this.controlsPanel.setVisible(method !== 'touch');
    this.controlHints.forEach(hint => hint.setVisible(method !== 'touch'));
    if (method !== 'touch') {
      const keys = method === 'gamepad' ? ['LS', 'RS', 'RT', 'RB'] : ['W A S D', 'MOUSE', 'CLIQUE', 'ESPAÇO'];
      [0, 2, 4, 6].forEach((index, i) => this.controlHints[index].setText(keys[i]));
      this.controlHints[8].setText(method === 'gamepad' ? 'LT: SEGURE E SOLTE\nA: INVESTIGAR' : 'Q: SEGURE E SOLTE\nE: INVESTIGAR');
    }
    this.discoveryPrompt.setText(method === 'gamepad' ? '[ A ]  INVESTIGAR' : '[ E ]  INVESTIGAR');
    this.discoveryPrompt.setVisible(this.promptVisible && method !== 'touch');
    this.deathButtonText.setText(method === 'gamepad' ? 'RENASCER   [ START ]' : method === 'touch' ? 'RENASCER' : 'RENASCER   [ R ]');
  }
  setDiscoveryPrompt(visible: boolean): void {
    this.promptVisible = visible;
    this.discoveryPrompt.setVisible(visible && this.inputMethod !== 'touch');
  }

  setProgress(level: number, xp: number, nextLevelXp: number | null, echoes: number): void {
    this.progressText.setText(`NV ${level}   XP ${nextLevelXp === null ? `${xp} / MÁX` : `${xp} / ${nextLevelXp}`}   ECOS ${echoes} / ${ECHO_COUNT}`);
  }

  setSignalObjective(synchronized: boolean, sourceLocated: boolean, passageOpen = false, inCavern = false, depthSeen = false, deepAreaSeen = false): void {
    this.signalPanel.setVisible(true);
    this.signalObjective.setVisible(true);
    this.areaSubtitle.setText(inCavern ? 'CAVERNA   /   PRIMEIRA DESCIDA' : 'FLORESTA DE DANTE   /   EXPLORAÇÃO');
    if (synchronized) this.signalObjective.setText(inCavern ? deepAreaSeen ? 'SIGA O SINAL  /  ABAIXO' : depthSeen ? 'O SINAL CONTINUA  /  ABAIXO' : 'EXPLORE A CAVERNA' : passageOpen ? 'ENTRE NA CAVERNA' : sourceLocated ? 'INVESTIGUE O MECANISMO' : 'SIGA O SINAL  /  NORTE');
  }

  setExplorationGuide(title: string, direction: string, action: string): void {
    // Text textures only change when the target, direction or input method changes.
    if (this.signalObjective.text !== title) this.signalObjective.setText(title);
    if (this.explorationHint.text !== direction) this.explorationHint.setText(direction);
    if (this.actionHint.text !== action) this.actionHint.setText(action);
  }

  showDiscovery(message: string): void {
    this.discoveryTimer?.remove(false);
    this.discoveryMessage.setText(message);
    this.discoveryMessage.setVisible(true);
    this.discoveryTimer = this.scene.time.delayedCall(NORTHERN_DISCOVERY.messageDuration, () => this.discoveryMessage.setVisible(false));
  }

  setCavernDepth(deep: boolean): void {
    this.areaSubtitle.setText(deep ? 'CAVERNA PROFUNDA   /   SINAL PRESENTE' : 'CAVERNA   /   PRIMEIRA DESCIDA');
  }

  setContinuationArea(exterior: boolean, fragmentSeen: boolean, firstEchoSeen = false): void {
    this.areaSubtitle.setText(exterior ? firstEchoSeen ? 'EXTERIOR   /   PRIMEIRO ECO REGISTRADO' : 'EXTERIOR DA CAVERNA   /   AR LIVRE' : 'PROFUNDEZAS   /   VESTÍGIOS ANTIGOS');
    this.signalObjective.setText(exterior ? fragmentSeen ? 'SIGA A RESPOSTA' : 'INVESTIGUE O FRAGMENTO' : 'SIGA O SINAL');
  }

  showLevelUp(level: number): void {
    this.levelTimer?.remove(false);
    this.levelMessage.setText(`NOVO NÍVEL   /   NÍVEL ${level}\nVIDA RESTAURADA`).setVisible(true);
    this.levelTimer = this.scene.time.delayedCall(2000, () => this.levelMessage.setVisible(false));
  }

  showDeath(): void {
    this.discoveryPrompt.setVisible(false);
    this.discoveryMessage.setVisible(false);
    this.levelMessage.setVisible(false);
    this.deathGroup.forEach(item => item.setVisible(true));
  }
}
