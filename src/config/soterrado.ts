export const SANDPIT = {
  width: 1800, height: 1500,
  bounds: { left: 250, right: 1580, top: 420, bottom: 1140 },
  entry: { x: 430, y: 790 }, ascent: { x: 345, y: 790, radius: 95 },
  spawn: { x: 1080, y: 760 }, awakeningX: 690,
  clue: { x: 1450, y: 730, radius: 115 },
  rocks: [{ x: 690, y: 430, radius: 48 }, { x: 1310, y: 431, radius: 46 },
    { x: 700, y: 1130, radius: 47 }, { x: 1350, y: 1115, radius: 50 }],
} as const;

export const SOTERRADO = {
  maxHp: 850, radius: 60, artSize: 265, speed: 85, standOff: 130,
  introMs: 2200, phaseMs: 1600, deathMs: 1900, xp: 180,
  patterns: {
    1: ['sweep', 'rush', 'burrow', 'sweep'] as const,
    2: ['burrow', 'sweep', 'fissure', 'rush', 'sweep'] as const,
  },
  sweep: { tell: 900, execute: 220, recover: 1150, damage: 18, range: 170, halfAngle: 1.05 },
  rush: { tell: 1150, execute: 800, recover: 1400, damage: 24, speed: 560, distance: 350, halfWidth: 62 },
  burrow: { tell: 1250, execute: 320, recover: 1800, damage: 26, radius: 114 },
  fissure: { tell: 1400, execute: 1000, recover: 1500, damage: 20, radius: 80, interval: 300 },
} as const;
export type SoterradoAttack = 'sweep' | 'rush' | 'burrow' | 'fissure';
export type SoterradoState = 'DORMANT' | 'INTRO' | 'IDLE' | 'TELEGRAPH' | 'EXECUTE' | 'RECOVER' | 'PHASE' | 'DEATH';
