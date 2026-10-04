import Phaser from 'phaser';
import { GameScene } from '../../scenes/GameScene';
import { VIEW_WIDTH, VIEW_HEIGHT } from '../../config/game';
import '../../style.css';
import './reference.css';

const params = new URLSearchParams(location.search);
const mode = params.has('baseline') ? 'baseline' : 'reference';
const originalWarrior = params.get('warrior') === 'original';
document.querySelector(`[data-mode="${mode === 'baseline' ? 'baseline' : originalWarrior ? 'original-warrior' : 'reference'}"]`)?.setAttribute('aria-current', 'page');
document.querySelector('[data-retry]')?.addEventListener('click', () => location.reload());
const game = new Phaser.Game({
  type: Phaser.AUTO, width: VIEW_WIDTH, height: VIEW_HEIGHT, parent: 'game',
  backgroundColor: '#07151c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, pixelArt: false },
  scene: [new GameScene(mode, originalWarrior)],
});
if (import.meta.env.DEV) Object.assign(window, { __danteGame: game });
