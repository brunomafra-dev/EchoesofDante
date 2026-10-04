import Phaser from 'phaser';

// One text texture per creature, using the approved valley name style.
// Position/visibility follow its actor; the text is never rebuilt per frame.
export function createEnemyName(scene: Phaser.Scene, x: number, y: number, name: string): Phaser.GameObjects.Text {
  return scene.add.text(x, y, name, {
    fontFamily: 'Barlow Condensed, sans-serif', fontSize: '12px', color: '#e2e1c4',
    stroke: '#172926', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(10001).setVisible(false);
}
