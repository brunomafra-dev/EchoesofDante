import type { Health } from './Health';

export type DamageResult = { applied: boolean; died: boolean; amount: number };

export function applyDamage(health: Health, amount: number): DamageResult {
  if (health.isDead) return { applied: false, died: false, amount: 0 };
  const before = health.current;
  const died = health.damage(amount);
  return { applied: true, died, amount: before - health.current };
}
