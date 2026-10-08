import Phaser from 'phaser';
import { ABILITY_UPGRADES, type AbilityUpgradeId, type AbilityUpgradeRanks } from '../config/abilityUpgrades';

const UPGRADE_LIST = Object.values(ABILITY_UPGRADES);
const HUNTER_LIST = UPGRADE_LIST.map(upgrade => ({
  ...upgrade,
  ...({
    saberArc: { ability: 'RIFLE', title: 'Pulso denso', description: 'Cada grau acrescenta 3 ao dano do disparo básico.' },
    saberReach: { ability: 'RIFLE', title: 'Foco longo', description: 'Cada grau acrescenta 60 unidades ao alcance do rifle.' },
    dashCooldown: { ability: 'PASSO DE FASE', title: 'Recarga de fase', description: 'Cada grau reduz a recarga da esquiva em 120 ms.' },
    dashDuration: { ability: 'PASSO DE FASE', title: 'Passo prolongado', description: 'Cada grau prolonga a esquiva em 20 ms.' },
    chargeWidth: { ability: 'FEIXE', title: 'Núcleo expandido', description: 'Cada grau amplia em 8 unidades a largura do feixe perfurante.' },
    chargePower: { ability: 'FEIXE', title: 'Carga densa', description: 'Cada grau aumenta o dano do feixe: cerca de 7 no mínimo e 11 no máximo, antes do Momentum.' },
  }[upgrade.id]),
}));

// A compact, modal choice shown only at mastery levels. It owns no gameplay rules.
export class AbilityUpgradeDialog {
  private get upgrades() { return this.hunter ? HUNTER_LIST : UPGRADE_LIST; }
  private readonly dialog: HTMLDialogElement;
  private readonly heading: HTMLElement;
  private readonly points: HTMLElement;
  private readonly buttons = new Map<AbilityUpgradeId, HTMLButtonElement>();
  private frame = 0;
  private padButtons: boolean[] = [];

  constructor(scene: Phaser.Scene, private readonly onChoose: (id: AbilityUpgradeId) => boolean,
    private readonly onClose: () => void, private readonly hunter = false) {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'records-dialog ability-upgrade-dialog';
    this.dialog.setAttribute('aria-labelledby', 'ability-upgrade-title');
    this.dialog.innerHTML = `<header><div><small>DOMÍNIO DO GUERREIRO</small><h1 id="ability-upgrade-title">Escolha um aperfeiçoamento</h1></div><strong class="upgrade-points"></strong></header>
      <div class="records-content"><p>O kit continua o mesmo. Escolha como uma de suas técnicas evolui.</p>
      <div class="ability-upgrade-options"></div><small class="records-help">Teclado: setas e Enter · Controle: direcional e A · Touch: toque em uma opção</small></div>`;
    this.heading = this.dialog.querySelector('#ability-upgrade-title')!;
    this.points = this.dialog.querySelector('.upgrade-points')!;
    const options = this.dialog.querySelector('.ability-upgrade-options')!;
    if (hunter) this.dialog.querySelector('header small')!.textContent = 'DOMÍNIO DO STAR HUNTER';
    for (const upgrade of this.upgrades) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ability-upgrade-option';
      button.dataset.upgrade = upgrade.id;
      button.innerHTML = `<small>${upgrade.ability}</small><strong>${upgrade.title}</strong><span>${upgrade.description}</span><b></b>`;
      button.setAttribute('aria-label', `${upgrade.ability}: ${upgrade.title}. ${upgrade.description}`);
      button.addEventListener('click', () => this.choose(upgrade.id));
      button.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch') { event.preventDefault(); this.choose(upgrade.id); }
      });
      options.append(button);
      this.buttons.set(upgrade.id, button);
    }
    this.dialog.addEventListener('cancel', event => event.preventDefault());
    this.dialog.addEventListener('close', () => {
      cancelAnimationFrame(this.frame);
      document.body.classList.remove('records-open');
      this.onClose();
    });
    window.addEventListener('keydown', this.keyDown, true);
    document.body.append(this.dialog);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cancelAnimationFrame(this.frame);
      window.removeEventListener('keydown', this.keyDown, true);
      document.body.classList.remove('records-open');
      this.dialog.remove();
    });
  }

  get isOpen(): boolean { return this.dialog.open; }

  open(level: number, ranks: Readonly<AbilityUpgradeRanks>, available: number): void {
    if (this.dialog.open || available <= 0) return;
    this.heading.textContent = `Nível ${level} · escolha um aperfeiçoamento`;
    this.points.textContent = `${available} ${available === 1 ? 'ponto' : 'pontos'}`;
    for (const upgrade of this.upgrades) {
      const button = this.buttons.get(upgrade.id)!;
      const rank = ranks[upgrade.id];
      button.querySelector('b')!.textContent = `GRAU ${rank}/${upgrade.maxRank}`;
      button.disabled = rank >= upgrade.maxRank;
    }
    document.body.classList.add('records-open');
    this.padButtons = this.readPad()?.buttons.map(button => button.pressed || button.value > 0.5) ?? [];
    this.dialog.showModal();
    this.dialog.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    this.frame = requestAnimationFrame(this.pollPad);
  }

  private choose(id: AbilityUpgradeId): void {
    if (!this.dialog.open || this.buttons.get(id)?.disabled) return;
    if (this.onChoose(id)) this.dialog.close();
  }

  private focusBy(delta: number): void {
    const available = [...this.buttons.values()].filter(button => !button.disabled);
    if (!available.length) return;
    const current = available.indexOf(document.activeElement as HTMLButtonElement);
    available[(current + delta + available.length) % available.length].focus();
  }

  private keyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen) return;
    event.stopImmediatePropagation();
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); this.focusBy(1); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); this.focusBy(-1); }
    else if (/^[1-6]$/.test(event.key)) {
      event.preventDefault();
      const upgrade = this.upgrades[Number(event.key) - 1];
      if (upgrade) this.choose(upgrade.id);
    }
  };

  private readPad(): Gamepad | undefined {
    return navigator.getGamepads?.().find(pad => pad?.connected && pad.mapping === 'standard') ?? undefined;
  }

  private pollPad = (): void => {
    if (!this.isOpen) return;
    const pad = this.readPad();
    const buttons = pad?.buttons.map(button => button.pressed || button.value > 0.5) ?? [];
    const edge = (index: number) => buttons[index] && !this.padButtons[index];
    if (edge(12) || edge(14)) this.focusBy(-1);
    else if (edge(13) || edge(15)) this.focusBy(1);
    else if (edge(0)) (document.activeElement as HTMLButtonElement | null)?.click();
    if (pad && Math.abs(pad.axes[1] ?? 0) > 0.6 && Math.abs(this.padAxesY) <= 0.6) this.focusBy((pad.axes[1] ?? 0) > 0 ? 1 : -1);
    this.padAxesY = pad?.axes[1] ?? 0;
    this.padButtons = buttons;
    if (this.isOpen) this.frame = requestAnimationFrame(this.pollPad);
  };
  private padAxesY = 0;
}
