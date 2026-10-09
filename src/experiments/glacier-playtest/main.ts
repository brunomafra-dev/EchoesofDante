import Phaser from 'phaser';
import { GameScene } from '../../scenes/GameScene';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../../config/game';
import '../../style.css';
import './playtest.css';

const params = new URLSearchParams(location.search);
const area = params.get('area') === 'icenest' ? 'icenest' : 'icecave';
const classId = params.get('class') === 'hunter' ? 'hunter' : 'warrior';
for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-area], [data-class]'))) {
  const nextArea = link.dataset.area ?? area;
  const nextClass = link.dataset.class ?? classId;
  link.href = `glacier-playtest.html?area=${nextArea}&class=${nextClass}`;
  if (link.dataset.area === area || link.dataset.class === classId) link.setAttribute('aria-current', 'true');
}
document.querySelector('[data-retry]')?.addEventListener('click', () => location.reload());
const game = new Phaser.Game({
  type: Phaser.AUTO, width: VIEW_WIDTH, height: VIEW_HEIGHT, parent: 'game', backgroundColor: '#07151c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, pixelArt: false },
  scene: [new GameScene(false, false, undefined, { area, classId })],
});
if (import.meta.env.DEV) Object.assign(window, { __danteGame: game });
