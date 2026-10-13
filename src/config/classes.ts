export type PlayableClass = 'warrior' | 'hunter' | 'astral';
export const PLAYABLE_CLASSES = ['warrior','hunter','astral'] as const;
export const CLASS_NAMES = { warrior: 'Guerreiro Galáctico', hunter: 'Star Hunter', astral: 'Manipulador Astral' } as const;
// Future identities are registered, but never offered as playable kits.
export const CLASS_REGISTRY = {
  warrior: { name: CLASS_NAMES.warrior, playable: true, role: 'CORPO A CORPO · RESISTÊNCIA' },
  hunter: { name: CLASS_NAMES.hunter, playable: true, role: 'DISTÂNCIA · PRECISÃO' },
  astral: { name: CLASS_NAMES.astral, playable: true, role: 'MÉDIO ALCANCE · CONTROLE ELEMENTAL' },
  xenobinder: { name: 'Vinculador de Dante', playable: false, role: 'COMPANHEIRO · SIMBIOSE' },
} as const;
export const ASTRAL = {
  speed:250, hpRatio:.85, dashCooldown:1650, dashDuration:185,
  energyMax:100, energyPerHit:10, energyRegen:3, castCost:30,
  shotCooldown:420, shotDamage:18, shotSpeed:680, shotRange:480, muzzleDistance:42,
  castRange:140, chargedRange:240, radius:52, chargedRadius:24,
  earthPush:420, earthRise:.16,
} as const;
export const ASTRAL_ELEMENTS = ['energy','fire','water','earth'] as const;
export type AstralElement = typeof ASTRAL_ELEMENTS[number];
export const ELEMENT_NAMES = {energy:'Energia',fire:'Fogo',water:'Água',earth:'Terra'} as const;
export const ELEMENT_COLORS = {energy:0x5fe6d8,fire:0xff6a4a,water:0x83ccd8,earth:0xffbd54} as const;
export const HUNTER = {
  speed: 275, hpRatio: .8, dashCooldown: 1450, dashDuration: 240,
  shotCooldown: 340, shotDamage: 22, shotSpeed: 950, shotRange: 700,
  precisionRange: 980, beamHalfWidth: 18, beamDamageMultiplier: 1.8, beamDuration: .34,
  momentumMax: 100, momentumPerSecond: 24, momentumDecay: 12,
} as const;
