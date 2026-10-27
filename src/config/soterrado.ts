export const SANDPIT = {
  width: 1800, height: 1500,
  bounds: { left: 250, right: 1580, top: 420, bottom: 1140 },
  entry: { x: 430, y: 790 }, ascent: { x: 345, y: 790, radius: 95 },
  spawn: { x: 1080, y: 760 }, awakeningX: 690,
  clue: { x: 1450, y: 730, radius: 115 },
  rocks: [{ x: 690, y: 430, radius: 48 }, { x: 1310, y: 431, radius: 46 },
    { x: 700, y: 1130, radius: 47 }, { x: 1350, y: 1115, radius: 50 },
    // Low mineral anchors: clear lanes on both sides, away from entry/clue.
    { x: 820, y: 590, radius: 44 }, { x: 1190, y: 965, radius: 44 }],
} as const;

export const SOTERRADO = {
  maxHp: 850, radius: 60, artSize: 265, speed: 120, standOff: 150,
  introMs: 2200, phaseMs: 950, deathMs: 1900, xp: 180,
  idleMs: 300, crashMs: 3600, openingAt: 320, closingMs: 160, openingDamage: 1.65,
  patterns: {
    1: ['rush', 'burrow', 'sweep', 'rush'] as const,
    2: ['rush', 'fissure', 'burrow', 'rush', 'sweep'] as const,
  },
  sweep: { tell: 680, execute: 540, recover: 280, contact: 220, damage: 34, range: 185, halfAngle: 1.15 },
  rush: { tell: 950, execute: 1080, recover: 320, damage: 40, speed: 740, distance: 700, halfWidth: 62 },
  burrow: { tell: 1250, execute: 750, recover: 340, contact: 280, damage: 38, radius: 120 },
  fissure: { tell: 950, execute: 1360, recover: 280, contact: 180, damage: 30, radius: 84, interval: 420 },
} as const;
export type SoterradoAttack = 'sweep' | 'rush' | 'burrow' | 'fissure';
export type SoterradoState = 'DORMANT' | 'INTRO' | 'IDLE' | 'TELEGRAPH' | 'EXECUTE' | 'RECOVER' | 'PHASE' | 'DEATH';
