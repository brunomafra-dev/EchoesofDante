export const DIFFICULTIES = {
  easy: { name: 'Fezes puríssima', hp: 0.7, damage: 0.45 },
  normal: { name: 'Marromenos', hp: 1, damage: 1 },
  hard: { name: 'Chama 🔥', hp: 1.35, damage: 1.35 },
} as const;
export type DifficultyId = keyof typeof DIFFICULTIES;
export const difficultyId = (value: unknown): DifficultyId => value === 'easy' || value === 'hard' ? value : 'normal';
// Party size is fixed when the campaign is created. It never follows equipment.
export function partyThreat(size: number, boss = false) {
  const n = Math.max(1, Math.min(4, Math.floor(size)));
  return { hp: (boss ? [1, 1.65, 2.3, 3] : [1, 1.55, 2.05, 2.6])[n - 1], damage: [1, 1.05, 1.1, 1.15][n - 1] };
}
