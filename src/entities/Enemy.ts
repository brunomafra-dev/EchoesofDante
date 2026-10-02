import type { Health } from '../combat/Health';
import type { MovementBounds, Obstacle } from '../systems/Movement';
import type { Vec2 } from '../utils/math';

export type EnemyImpact = { damage: number; ranged?: boolean };
// The existing melee/wave target contract, plus update and feedback. No AI framework.
export interface Enemy {
  readonly position: Vec2;
  readonly radius: number;
  readonly health: Health;
  isDead: boolean;
  readonly attackRange?: number;
  readonly attackDamage?: number;
  update(now: number, dt: number, player: Vec2, playerDead: boolean, obstacles: readonly Obstacle[], onAttack: (impact?: EnemyImpact) => void, bounds?: MovementBounds): void;
  hurt(now: number, from: Vec2, force?: number): void;
  die(): void;
}
