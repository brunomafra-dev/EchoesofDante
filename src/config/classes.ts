export type PlayableClass = 'warrior' | 'hunter' | 'astral' | 'xenobinder';
export const PLAYABLE_CLASSES = ['warrior','hunter','astral','xenobinder'] as const;
export const CLASS_NAMES = { warrior: 'Guerreiro Galáctico', hunter: 'Caçador estelar', astral: 'Manipulador Astral',xenobinder:'Domador de feras' } as const;
// Playable identities share input actions, each with its own combat kit.
export const CLASS_REGISTRY = {
  warrior: { name: CLASS_NAMES.warrior, playable: true, role: 'CORPO A CORPO · RESISTÊNCIA' },
  hunter: { name: CLASS_NAMES.hunter, playable: true, role: 'DISTÂNCIA · PRECISÃO' },
  astral: { name: CLASS_NAMES.astral, playable: true, role: 'MÉDIO ALCANCE · CONTROLE ELEMENTAL' },
  xenobinder: { name: CLASS_NAMES.xenobinder, playable: true, role: 'COMPANHEIRO · SIMBIOSE' },
} as const;
export const XENOBINDER={
 speed:250,hpRatio:.9,dashCooldown:1750,dashDuration:175,
 bondMax:100,bondInitial:35,bondPerHit:8,bondPerAssist:10,commandCost:35,commandCooldown:6000,
 shotDamage:16,shotCooldown:460,shotRange:420,shotSpeed:720,muzzleDistance:42,markDuration:2200,
 companionRadius:14,companionSize:94,followDistance:70,followSpeed:230,biteDamage:20,biteCooldown:850,biteRange:45,
 commandSpeed:540,commandRange:150,chargedRange:230,commandWidth:24,commandDamage:60,chargedDamage:40,
 pulseRadius:112,healBase:.08,healCharged:.06,color:0x6bb464,
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
