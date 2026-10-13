import { ELEMENT_COLORS, ELEMENT_NAMES, type AstralElement } from './classes';
import type { SpeciesId } from './bestiary';

// Species traits, never region/equipment scaling. Unlisted matchups stay neutral.
export const ELEMENTAL_WEAKNESSES: Partial<Record<SpeciesId, AstralElement>> = {
  frostPouncer: 'fire', frostSpitter: 'fire', iceCarapace: 'fire', vesper: 'fire',
  dunePouncer: 'water', glassSpitter: 'water', soterrado: 'water',
};
export const ELEMENTAL_ADVANTAGE = 1.25;
export function elementalMultiplier(element?: AstralElement, species?: SpeciesId): number {
  return element && species && ELEMENTAL_WEAKNESSES[species] === element ? ELEMENTAL_ADVANTAGE : 1;
}
export function weaknessHint(species: SpeciesId): string {
  const element = ELEMENTAL_WEAKNESSES[species];
  return element ? `Fraqueza: ${ELEMENT_NAMES[element]} (+25% de dano elemental).` : '';
}
export function damageTextColor(color: number, neutral = '#e8efce'): string {
  if (color === 0xff8f82) return '#ff968a'; // Incoming damage keeps its own language.
  return Object.values(ELEMENT_COLORS).some(value => value === color)
    ? `#${color.toString(16).padStart(6, '0')}` : neutral;
}
export const damageText = (damage: number, effective = false): string => `${damage}${effective ? ' ↑' : ''}`;
