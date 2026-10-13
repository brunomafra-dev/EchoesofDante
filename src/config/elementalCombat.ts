import { ELEMENT_COLORS, ELEMENT_NAMES, type AstralElement } from './classes';
import type { SpeciesId } from './bestiary';

// Every species must have a profile. New species cannot silently remain unclassified.
// Traits follow anatomy/material, never region/equipment scaling.
export const ELEMENTAL_PROFILES = {
  crawler: { weakness: 'fire', resistance: 'earth' }, // Organic, grounded carapace.
  skitter: { weakness: 'earth', resistance: 'fire' }, // Light body, heat-adapted shell.
  spitter: { weakness: 'energy', resistance: 'water' }, // Conductive fluid sacs.
  carapace: { weakness: 'energy', resistance: 'earth' }, // Dense mineral shell.
  thorn: { weakness: 'fire', resistance: 'water' }, // Vegetal tissue.
  warden: { weakness: 'earth', resistance: 'energy' }, // Ancient powered plates.
  frostPouncer: { weakness: 'fire', resistance: 'water' },
  frostSpitter: { weakness: 'fire', resistance: 'water' },
  iceCarapace: { weakness: 'fire', resistance: 'water' },
  vesper: { weakness: 'fire', resistance: 'water' },
  dunePouncer: { weakness: 'water', resistance: 'fire' },
  glassSpitter: { weakness: 'water', resistance: 'fire' },
  soterrado: { weakness: 'water', resistance: 'fire' },
} as const satisfies Record<SpeciesId, { weakness: AstralElement; resistance: AstralElement }>;
export const ELEMENTAL_ADVANTAGE = 1.25;
export const ELEMENTAL_RESISTANCE = .75;
export function elementalMultiplier(element?: AstralElement, species?: SpeciesId): number {
  if (!element || !species) return 1;
  const profile = ELEMENTAL_PROFILES[species];
  return element === profile.weakness ? ELEMENTAL_ADVANTAGE
    : element === profile.resistance ? ELEMENTAL_RESISTANCE : 1;
}
export function weaknessHint(species: SpeciesId): string {
  const profile = ELEMENTAL_PROFILES[species];
  return `Fraqueza: ${ELEMENT_NAMES[profile.weakness]} (+25% de dano elemental). Resistência: ${ELEMENT_NAMES[profile.resistance]} (−25%).`;
}
export function damageTextColor(color: number, neutral = '#e8efce'): string {
  if (color === 0xff8f82) return '#ff968a'; // Incoming damage keeps its own language.
  return Object.values(ELEMENT_COLORS).some(value => value === color)
    ? `#${color.toString(16).padStart(6, '0')}` : neutral;
}
export const damageText = (damage: number, effective = false, resisted = false): string =>
  `${damage}${effective ? ' ↑' : resisted ? ' ↓' : ''}`;
