export type PlayableClass = 'warrior' | 'hunter';
export const CLASS_NAMES = { warrior: 'Guerreiro Galáctico', hunter: 'Star Hunter' } as const;
// Future identities are registered, but never offered as playable kits.
export const CLASS_REGISTRY = {
  warrior: { name: CLASS_NAMES.warrior, playable: true, role: 'CORPO A CORPO · RESISTÊNCIA' },
  hunter: { name: CLASS_NAMES.hunter, playable: true, role: 'DISTÂNCIA · PRECISÃO' },
  astral: { name: 'Manipulador Astral', playable: false, role: 'CONTROLE ELEMENTAL' },
  xenobinder: { name: 'Vinculador de Dante', playable: false, role: 'COMPANHEIRO · SIMBIOSE' },
} as const;
export const HUNTER = {
  speed: 275, hpRatio: .8, dashCooldown: 1450, dashDuration: 240,
  shotCooldown: 340, shotDamage: 22, shotSpeed: 950, shotRange: 700,
  precisionRange: 980, beamHalfWidth: 18, beamDamageMultiplier: 1.8, beamDuration: .34,
  momentumMax: 100, momentumPerSecond: 24, momentumDecay: 12,
} as const;
