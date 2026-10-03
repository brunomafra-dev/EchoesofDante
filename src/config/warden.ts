// Encounter values live here; the Warrior's combat and movement values stay unchanged.
export const WARDEN = {
  maxHp: 900,
  radius: 62,
  artSize: 250,
  speed: 74,
  standOff: 142,
  introMs: 2600,
  phaseMs: 1700,
  deathMs: 2400,
  phaseTwoAt: 0.65,
  phaseThreeAt: 0.30,
  knockbackResistance: 0.08,
  idleMs: [680, 560, 460],
  sweep: { damage: 16, telegraphMs: 1000, executeMs: 300, recoverMs: 1400, range: 188, halfAngle: 1.05 },
  rush: { damage: 20, telegraphMs: 1150, executeMs: 660, recoverMs: 1500, speed: 550, distance: 363, halfWidth: 62 },
  slam: { damage: 22, telegraphMs: 1250, executeMs: 300, recoverMs: 1500, radius: 185 },
  signal: { damage: 14, telegraphMs: 1050, executeMs: 2600, recoverMs: 1300, speed: 265, range: 670, radius: 12, spread: 0.29 },
  echoes: { damage: 24, telegraphMs: 1250, executeMs: 1180, recoverMs: 1400, radius: 86, spacing: 146, intervalMs: 460 },
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
