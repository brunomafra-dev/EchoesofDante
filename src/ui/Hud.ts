import Phaser from 'phaser';
import { KINETIC_CHARGE, PLAYER, VIEW_HEIGHT, VIEW_WIDTH } from '../config/game';
import { ECHO_COUNT, NORTHERN_DISCOVERY } from '../config/discovery';
import { PROGRESSION } from '../config/progression';
import type { KineticPhase } from '../combat/KineticCharge';
import type { InputMethod } from '../input/Controls';

export class Hud {
  setAreaName(name:string):void{this.areaSubtitle.setText(name);}
  private momentum = 0;
  setHunterMomentum(value: number): void { this.momentum = Math.round(value); }
  private hpFill: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private dashFill: Phaser.GameObjects.Rectangle;
  private dashText: Phaser.GameObjects.Text;
  private chargeText: Phaser.GameObjects.Text;
  private readonly chargeFill?: Phaser.GameObjects.Rectangle;
  private readonly momentumText?: Phaser.GameObjects.Text;
  private controlHints: Phaser.GameObjects.Text[] = [];
  private controlsTimer?: Phaser.Time.TimerEvent;
  private inputMethod: InputMethod = 'keyboard';
  private deathButtonText: Phaser.GameObjects.Text;
  private promptVisible = false;
  private interactionAction = 'INVESTIGAR';
  private deathGroup: Array<{ setVisible(value: boolean): unknown }> = [];
  private discoveryPrompt: Phaser.GameObjects.Text;
  private discoveryMessage: Phaser.GameObjects.Text;
  private progressText: Phaser.GameObjects.Text;
  private progressHint: Phaser.GameObjects.Text;
  private levelMessage: Phaser.GameObjects.Text;
  private signalObjective: Phaser.GameObjects.Text;
  private explorationHint: Phaser.GameObjects.Text;
  private actionHint: Phaser.GameObjects.Text;
  private areaSubtitle: Phaser.GameObjects.Text;
  private xpFill: Phaser.GameObjects.Rectangle;
  private compactViewport?: boolean;
  private discoveryTimer?: Phaser.Time.TimerEvent;
  private levelTimer?: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene, onRestart: () => void, private readonly hunter = false) {
    const text = (x: number, y: number, value: string, size: number, color = '#e8f1ed', condensed = false) => scene.add.text(x, y, value, {
      fontFamily: condensed ? 'Barlow Condensed, sans-serif' : 'DM Sans, sans-serif',
      fontSize: `${size}px`, color, fontStyle: condensed ? 'bold' : 'normal', letterSpacing: condensed ? 0.8 : 0.2,
      shadow: { offsetX: 0, offsetY: 1, color: '#030807', blur: 3, fill: true },
    }).setScrollFactor(0).setDepth(20002);
    const panel = scene.add.graphics().setScrollFactor(0).setDepth(19990);
    // Two small neutral scrims; no frames or full-width instruction strip.
    panel.fillStyle(0x080e0c, 0.38).fillRoundedRect(16, 14, 220, 90, 4);
    panel.fillStyle(0x080e0c, 0.32).fillRoundedRect(1040, 14, 224, 72, 4);
    text(28, 22, 'VIDA', 12, '#b8c1ae', true);
    this.hpText = text(224, 20, '100 / 100', 16, '#e5eddb', true).setOrigin(1, 0);
    scene.add.rectangle(28, 46, 196, 6, 0x26372b).setOrigin(0).setScrollFactor(0).setDepth(20000);
    this.hpFill = scene.add.rectangle(28, 46, 196, 6, 0xa4c68b).setOrigin(0).setScrollFactor(0).setDepth(20001);
    this.progressText = text(28, 58, '', 14, '#d8e2cc', true);
    this.progressHint = text(28, 78, '', 11, '#aab6a0');
    scene.add.rectangle(28, 103, 196, 2, 0x26372b).setOrigin(0).setScrollFactor(0).setDepth(20000);
    this.xpFill = scene.add.rectangle(28, 103, 0, 2, 0xffbd54).setOrigin(0).setScrollFactor(0).setDepth(20001);
    this.areaSubtitle = text(VIEW_WIDTH / 2, 19, 'Floresta de Dante', 14, '#b7c3ad').setOrigin(0.5, 0);
    this.signalObjective = text(24, 118, 'INVESTIGUE OS 3 ECOS', 14, '#c3b4e1', true);
    this.explorationHint = text(24, 140, 'Procure vestígios que emitem luz.', 12, '#bac5b1');
    this.actionHint = text(24, 140, '', 12, '#d3dcbf').setVisible(false);
    for (const hint of [this.signalObjective, this.explorationHint, this.actionHint]) hint.setWordWrapWidth(252);
    this.dashText = text(1052, 22, '', 14, '#b6c6b2', true);
    scene.add.rectangle(1052, 45, 196, 2, 0x26372b).setOrigin(0).setScrollFactor(0).setDepth(20000);
    this.dashFill = scene.add.rectangle(1052, 45, 196, 2, 0x9caf99).setOrigin(0).setScrollFactor(0).setDepth(20001);
    this.chargeText = text(1052, 57, '', 14, '#b6c6b2', true);
    if (this.hunter) {
      this.momentumText = text(1052, 83, '', 11, '#aab6a0', true);
      scene.add.rectangle(1052, 78, 196, 2, 0x26372b).setOrigin(0).setScrollFactor(0).setDepth(20000);
      this.chargeFill = scene.add.rectangle(1052, 78, 196, 2, 0x5fe6d8).setOrigin(0).setScrollFactor(0).setDepth(20001);
    }
    this.controlHints.push(text(VIEW_WIDTH / 2, VIEW_HEIGHT - 22, '', 12, '#c5cdb9').setOrigin(0.5, 1));
    this.showControlHelp();
    this.discoveryPrompt = text(VIEW_WIDTH / 2, VIEW_HEIGHT - 73, '[ E ]  INVESTIGAR', 17, '#ddd4f2', true)
      .setOrigin(0.5).setVisible(false);
    this.discoveryMessage = text(VIEW_WIDTH / 2, VIEW_HEIGHT - 154, '', 18, '#d3d9c5', true)
      .setOrigin(0.5, 0).setAlign('center').setWordWrapWidth(560).setVisible(false);
    this.levelMessage = text(VIEW_WIDTH / 2, 136, '', 19, '#e4ebc9', true)
      .setOrigin(0.5, 0).setVisible(false);
    const veil = scene.add.rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, 0x05141b, 0.79).setOrigin(0).setScrollFactor(0).setDepth(30000).setVisible(false);
    const frame = scene.add.graphics().setScrollFactor(0).setDepth(30001).setVisible(false);
    frame.fillStyle(0x111c16, 0.97).fillRoundedRect(347, 199, 586, 334, 6);
    frame.lineStyle(1, 0x7d8c72, 0.3).strokeRoundedRect(347, 199, 586, 334, 6);
    frame.fillStyle(0xda938b).fillRect(374, 199, 65, 3);
    const overline = text(640, 232, 'SINAL PERDIDO   /   DANTE 01', 17, '#d99a91', true).setOrigin(0.5).setDepth(30002).setVisible(false);
    const title = text(640, 289, this.hunter ? 'CAÇADOR CAÍDO' : 'GUERREIRO CAÍDO', 58, '#eff3e9', true).setOrigin(0.5).setDepth(30002).setVisible(false);
    const subtitle = text(640, 373, 'Dante ainda está à escuta.', 17, '#aac5bf').setOrigin(0.5).setDepth(30002).setVisible(false);
    const button = scene.add.rectangle(640, 467, 248, 55, 0x9edacf).setScrollFactor(0).setDepth(30002).setInteractive({ useHandCursor: true }).setVisible(false);
    this.deathButtonText = text(640, 467, 'RENASCER   [ R ]', 26, '#12303a', true).setOrigin(0.5).setDepth(30003).setVisible(false);
    button.on('pointerover', () => button.setFillStyle(0xc1eee1));
    button.on('pointerout', () => button.setFillStyle(0x9edacf));
    button.on('pointerdown', onRestart);
    this.deathGroup = [veil, frame, overline, title, subtitle, button, this.deathButtonText];
  }

  update(hp: number, maxHp: number, dashProgress: number, chargeProgress: number, chargePhase: KineticPhase, chargeLevel: number,
    dashCooldown: number = PLAYER.dashCooldown, chargeCooldown: number = KINETIC_CHARGE.cooldown): void {
    this.refreshTypography();
    this.hpFill.width = 196 * hp / maxHp;
    this.hpFill.setFillStyle(hp < maxHp * 0.3 ? 0xff6a4a : 0xa4c68b);
    this.hpText.setText(`${hp} / ${maxHp}`);
    this.dashFill.width = 196 * dashProgress;
    const dashKey = this.inputMethod === 'gamepad' ? '[RB]' : this.inputMethod === 'touch' ? '' : '[ESPAÇO]';
    this.dashText.setText(`${dashKey} ESQUIVA · ${dashProgress >= 1 ? 'PRONTA' : `${((1 - dashProgress) * dashCooldown / 1000).toFixed(1)}s`}`.trim());
    this.dashText.setColor(dashProgress >= 1 ? '#b6c6b2' : '#8a9989');
    const chargeKey = this.inputMethod === 'gamepad' ? '[LT]' : this.inputMethod === 'touch' ? '' : '[Q]';
    const chargeStatus = chargePhase === 'CHARGING' ? `${Math.round(chargeLevel * 100)}%` : chargePhase === 'RELEASE' ? 'ONDA' : chargeProgress >= 1 ? 'PRONTA' : `${((1 - chargeProgress) * chargeCooldown / 1000).toFixed(1)}s`;
    this.chargeText.setText(this.hunter ? `${chargeKey} FEIXE · ${chargePhase === 'RELEASE' ? 'DISPARO' : chargeStatus}`.trim() : `${chargeKey} CARGA · ${chargeStatus}`.trim());
    this.chargeText.setColor(chargePhase === 'CHARGING' ? '#5fe6d8' : chargeProgress >= 1 ? '#b6c6b2' : '#8a9989');
    if (this.chargeFill) this.chargeFill.width = 196 * (chargePhase === 'CHARGING' ? chargeLevel : chargeProgress);
    this.momentumText?.setText(`MOM ${this.momentum}`);
  }

  private refreshTypography(): void {
    // FIT scales the logical canvas down. Keep essential text readable on phones.
    const compact = this.scene.scale.displaySize.height < 500;
    if (this.compactViewport === compact) return;
    this.compactViewport = compact;
    const sizes: [Phaser.GameObjects.Text, number, number][] = [
      [this.hpText, 16, 20], [this.progressText, 14, 18], [this.progressHint, 11, 16],
      [this.signalObjective, 14, 18], [this.explorationHint, 12, 16], [this.actionHint, 12, 16],
      [this.dashText, 14, 18], [this.chargeText, 14, 18], [this.areaSubtitle, 14, 18],
      [this.levelMessage, 19, 22], [this.discoveryPrompt, 17, 20],
    ];
    sizes.forEach(([label, desktop, mobile]) => label.setFontSize(compact ? mobile : desktop));
    this.progressText.setY(compact ? 54 : 58);
    const hintY = this.signalObjective.y + this.signalObjective.height + 5;
    this.explorationHint.setY(hintY); this.actionHint.setY(hintY);
  }

  private showControlHelp(): void {
    this.controlsTimer?.remove(false);
    const hint = this.controlHints[0];
    hint.setText(this.inputMethod === 'gamepad' ? 'LS mover · RS mirar · RT sabre · RB esquiva · Segure LT: carga · A investigar · Voltar: registros'
      : 'WASD mover · Mouse mirar · Clique sabre · Espaço esquiva · Segure Q: carga · E investigar · B registros');
    if (this.hunter) hint.setText(hint.text.replace('sabre', 'disparo').replace('carga', 'feixe de luz'));
    hint.setVisible(this.inputMethod !== 'touch');
    this.controlsTimer = this.scene.time.delayedCall(10000, () => hint.setVisible(false));
  }

  setInputMethod(method: InputMethod): void {
    if (this.inputMethod === method) return;
    this.inputMethod = method;
    this.showControlHelp();
    this.refreshInteractionPrompt();
    this.discoveryPrompt.setVisible(this.promptVisible && method !== 'touch');
    this.deathButtonText.setText(method === 'gamepad' ? 'RENASCER   [ START ]' : method === 'touch' ? 'RENASCER' : 'RENASCER   [ R ]');
  }
  setDiscoveryPrompt(visible: boolean, action = 'INVESTIGAR'): void {
    this.promptVisible = visible;
    const nextAction = action.toLocaleUpperCase('pt-BR');
    if (this.interactionAction !== nextAction) {
      this.interactionAction = nextAction;
      this.refreshInteractionPrompt();
    }
    this.discoveryPrompt.setVisible(visible && this.inputMethod !== 'touch');
  }

  private refreshInteractionPrompt(): void {
    const key = this.inputMethod === 'gamepad' ? '[ A ]' : '[ E ]';
    const text = `${key}  ${this.interactionAction}`;
    if (this.discoveryPrompt.text !== text) this.discoveryPrompt.setText(text);
  }

  setProgress(level: number, xp: number, nextLevelXp: number | null, echoes: number): void {
    this.progressText.setText(`NV ${level}   ·   ECOS ${echoes}/${ECHO_COUNT}`);
    this.progressHint.setText(nextLevelXp === null ? `XP ${xp} · Nível máximo` : `XP ${xp} / ${nextLevelXp}`);
    const previous = PROGRESSION.levelThresholds[level - 1] ?? 0;
    this.xpFill.width = 196 * (nextLevelXp === null ? 1 : Phaser.Math.Clamp((xp - previous) / (nextLevelXp - previous), 0, 1));
  }

  showExperienceAt(x: number, y: number, amount: number): void {
    const reward = this.scene.add.text(x, y - 40, `+${amount} XP`, {
      fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ffdb9b',
      stroke: '#1a1710', strokeThickness: 3, shadow: { offsetX: 0, offsetY: 2, color: '#030807', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(15002);
    this.scene.tweens.add({ targets: reward, y: y - 72, alpha: 0, duration: 1450, ease: 'Sine.Out', onComplete: () => reward.destroy() });
  }

  setSignalObjective(synchronized: boolean, sourceLocated: boolean, passageOpen = false, inCavern = false, depthSeen = false, deepAreaSeen = false): void {
    this.signalObjective.setVisible(true);
    this.areaSubtitle.setText(inCavern ? 'Caverna de Dante' : 'Floresta de Dante');
    if (synchronized) this.signalObjective.setText(inCavern ? deepAreaSeen ? 'SIGA O SINAL  /  ABAIXO' : depthSeen ? 'O SINAL CONTINUA  /  ABAIXO' : 'EXPLORE A CAVERNA' : passageOpen ? 'ENTRE NA CAVERNA' : sourceLocated ? 'INVESTIGUE O MECANISMO' : 'SIGA O SINAL  /  NORTE');
  }

  setExplorationGuide(title: string, direction: string, action: string, nearby = false): void {
    // Text textures only change when the target, direction or input method changes.
    if (this.signalObjective.text !== title) this.signalObjective.setText(title);
    if (this.explorationHint.text !== direction) this.explorationHint.setText(direction);
    if (this.actionHint.text !== action) this.actionHint.setText(action);
    const hintY = this.signalObjective.y + this.signalObjective.height + 5;
    this.explorationHint.setY(hintY);
    this.actionHint.setY(hintY);
    // Keep one supporting line. Nearby instructions replace the distant heading.
    this.explorationHint.setVisible(!nearby);
    this.actionHint.setVisible(nearby);
  }

  showDiscovery(message: string): void {
    this.discoveryTimer?.remove(false);
    this.discoveryMessage.setText(message);
    this.discoveryMessage.setVisible(true);
    this.discoveryTimer = this.scene.time.delayedCall(NORTHERN_DISCOVERY.messageDuration, () => this.discoveryMessage.setVisible(false));
  }

  setCavernDepth(deep: boolean): void {
    this.areaSubtitle.setText(deep ? 'Caverna profunda' : 'Caverna de Dante');
  }

  setWardenArea(): void {
    this.areaSubtitle.setText('Domínio do Guardião');
  }

  setValleyArea(frontier = false): void {
    this.areaSubtitle.setText(frontier ? 'Escarpa da Ressonância' : 'Vale da Ressonância');
  }

  setAridArea(signalRecorded = false, expeditionComplete = false): void {
    this.areaSubtitle.setText(signalRecorded ? 'Bacia do Siroco · Margem Leste' : 'Bacia do Siroco');
    this.signalObjective.setText(expeditionComplete ? 'SIGA PARA AS DUNAS' : signalRecorded ? 'EXPLORE A MARGEM LESTE' : 'EXPLORE A BACIA');
  }

  setDunesArea(ruinsSeen: boolean, depthSeen: boolean): void {
    this.areaSubtitle.setText(depthSeen ? 'Dunas Interiores · Depressão de Areia' : 'Dunas Interiores');
    this.signalObjective.setText(depthSeen ? 'SINAL SOB A AREIA' : ruinsSeen ? 'SIGA A DESCIDA' : 'EXPLORE AS DUNAS');
  }

  setGlacierArea(nest: boolean, recorded: boolean, defeated: boolean): void {
    this.areaSubtitle.setText(nest ? 'Ninho da Geada' : 'Galerias do Degelo');
    this.signalObjective.setText(nest ? defeated ? 'INVESTIGUE O NINHO' : 'VÉSPER · LEIA AS MARCAS' : recorded ? 'SIGA PARA O NINHO' : 'EXPLORE AS GALERIAS');
  }

  setFrostArea(recorded: boolean): void {
    this.areaSubtitle.setText('Fratura Boreal');
    this.signalObjective.setText(recorded ? 'SIGA A FRATURA' : 'EXPLORE A FRATURA BOREAL');
  }

  setSandpitArea(defeated: boolean, clueSeen: boolean): void {
    this.areaSubtitle.setText('Siroco · Bacia Soterrada');
    this.signalObjective.setText(clueSeen ? 'O SINAL SEGUE AO NORTE' : defeated ? 'INVESTIGUE A PASSAGEM REVELADA' : 'DESCUBRA O QUE SE MOVE ABAIXO');
  }

  setContinuationArea(exterior: boolean, fragmentSeen: boolean, firstEchoSeen = false): void {
    this.areaSubtitle.setText(exterior ? firstEchoSeen ? 'Exterior · Primeiro Eco' : 'Exterior da caverna' : 'Profundezas');
    this.signalObjective.setText(exterior ? fragmentSeen ? 'SIGA A RESPOSTA' : 'INVESTIGUE O FRAGMENTO' : 'SIGA O SINAL');
  }

  showLevelUp(level: number, _maxHp: number, gainedHp: number, upgradeAvailable = false): void {
    this.levelTimer?.remove(false);
    this.levelMessage.setText(`NÍVEL ${level} · +${gainedHp} PV${upgradeAvailable ? ' · APRIMORAMENTO' : ''}`).setVisible(true);
    this.levelTimer = this.scene.time.delayedCall(2000, () => this.levelMessage.setVisible(false));
  }

  showDeath(): void {
    this.discoveryPrompt.setVisible(false);
    this.discoveryMessage.setVisible(false);
    this.levelMessage.setVisible(false);
    this.controlHints.forEach(hint => hint.setVisible(false));
    this.deathGroup.forEach(item => item.setVisible(true));
  }
}
