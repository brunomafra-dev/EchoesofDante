// Encounter values live here; the Warrior's combat and movement values stay unchanged.
export const WARDEN = {
  maxHp: 900,
  radius: 62,
  artSize: 250,
  speed: 118,
  standOff: 124,
  introMs: 2600,
  phaseMs: 1050,
  deathMs: 2400,
  phaseTwoAt: 0.65,
  phaseThreeAt: 0.30,
  knockbackResistance: 0.08,
  // The shell rejects frontal pressure; committed attacks leave its rear exposed.
  guardHalfAngle: Math.PI * 0.64,
  pressureHits: 3,
  pressureWindowMs: 6500,
  pressureCounterDelayMs: 220,
  openingDamage: 1.6,
  closedRecoverMs: 420,
  idleMs: [380, 300, 240],
  sweep: { damage: 30, telegraphMs: 720, executeMs: 1250, recoverMs: 1300, range: 188, halfAngle: 1.05, strikeMs: 220, returnMs: 950 },
  rush: { damage: 38, telegraphMs: 820, executeMs: 760, recoverMs: 1450, speed: 680, distance: 455, halfWidth: 62 },
  slam: { damage: 40, telegraphMs: 900, executeMs: 1580, recoverMs: 1500, radius: 165, strikeMs: 280, waveMs: 980, waveDurationMs: 520, waveStart: 70, waveRadius: 350, waveWidth: 16, waveDamage: 28 },
  signal: { damage: 26, telegraphMs: 760, executeMs: 2200, recoverMs: 1250, speed: 420, range: 600, radius: 12, spread: 0.29, firstMs: 200, secondMs: 720 },
  echoes: { damage: 36, telegraphMs: 850, executeMs: 1450, recoverMs: 1350, radius: 86, spacing: 146, intervalMs: 420, strikeMs: 220 },
} as const;

export type WardenAttack = 'sweep' | 'rush' | 'slam' | 'signal' | 'echoes';
export type WardenPhase = 1 | 2 | 3;

// Intentional, learnable compositions. The last phase combines ranged pressure and
// delayed ground marks, but every activation still has its own warning and recovery.
export const WARDEN_PATTERNS: Readonly<Record<WardenPhase, readonly WardenAttack[]>> = {
  1: ['sweep', 'slam', 'rush', 'sweep'],
  2: ['signal', 'sweep', 'rush', 'slam', 'signal'],
  3: ['echoes', 'rush', 'sweep', 'signal', 'slam'],
};
