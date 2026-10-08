export type PlayableClass = 'warrior' | 'hunter';
export const CLASS_NAMES = { warrior: 'Guerreiro Galáctico', hunter: 'Star Hunter' } as const;
export const HUNTER = {
  speed: 275, hpRatio: .8, dashCooldown: 1450, dashDuration: 240,
  shotCooldown: 340, shotDamage: 22, shotSpeed: 950, shotRange: 700,
  precisionRange: 980, beamHalfWidth: 18, beamDamageMultiplier: 1.8, beamDuration: .34,
  momentumMax: 100, momentumPerSecond: 24, momentumDecay: 12,
} as const;
