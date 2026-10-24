import Phaser from 'phaser';

// Complete painted poses, registered offline. Existing texture keys/frame indices
// are also the co-op wire contract, so visitors render the same art as the host.
const sheets: Readonly<Record<string, string>> = {
  'dante-skitter-motion': 'skitter',
  'dante-spitter-motion': 'spitter',
  'dante-carapace-motion': 'carapace',
  'dante-thorn-motion': 'thorn',
  'dante-dune-pouncer-motion': 'dunePouncer',
  'dante-glass-spitter-motion': 'glassSpitter',
  'dante-frost-pouncer-motion': 'frostPouncer',
  'dante-frost-spitter-motion': 'frostSpitter',
  'dante-iceCarapace-motion': 'iceCarapace',
  'ember-hound-motion': 'emberHound',
  'fumarole-motion': 'fumarole',
  'slagback-motion': 'slagback',
  'dante-bankGrazer-motion': 'bankGrazer',
  'dante-reedSpitter-motion': 'reedSpitter',
  'warden-motion': 'warden',
  'soterrado-motion': 'soterrado',
  'vesper-motion': 'vesper',
  'titan-motion': 'titan',
};

export function preloadCreatureSheet(scene: Phaser.Scene, key: string, original: string, frame: number): void {
  if (scene.textures.exists(key)) return;
  const id = sheets[key];
  const url = id && !scene.data.get('creature-art-original')
    ? `${import.meta.env.BASE_URL}assets/visual/creature-finish/${id}-v1.webp` : original;
  scene.load.spritesheet(key, url, { frameWidth: frame, frameHeight: frame });
}

export type CreatureShadow = Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse;

/** One cached radial texture, one draw per actor, no dynamic lights or tween. */
export function createCreatureShadow(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color = 0x071518, alpha = .65): CreatureShadow {
  if (scene.data.get('creature-art-original')) return scene.add.ellipse(x,y,width,height,color,alpha);
  const key = 'creature-contact-soft';
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key,128,128)!;
    const ctx = texture.context, gradient = ctx.createRadialGradient(64,64,0,64,64,63);
    gradient.addColorStop(0,'rgba(5,12,15,.88)');
    gradient.addColorStop(.32,'rgba(5,12,15,.64)');
    gradient.addColorStop(.68,'rgba(5,12,15,.23)');
    gradient.addColorStop(1,'rgba(5,12,15,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);texture.refresh();
  }
  return scene.add.image(x,y,key).setDisplaySize(width*1.2,height*1.5).setAlpha(alpha).setName('creature-contact-shadow');
}
