export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const WORLD_WIDTH = 2200;
export const WORLD_HEIGHT = 1500;

export const PLAYER = {
  maxHp: 100,
  speed: 245,
  radius: 18,
  attackDamage: 34,
  attackRange: 106,
  attackHalfAngle: Math.PI * 0.37,
  attackCooldown: 340,
  dashCooldown: 1700,
  dashDuration: 175,
  dashSpeed: 760,
  hurtCooldown: 650,
} as const;

export const KINETIC_CHARGE = {
  speed: 600,
  duration: 180,
  cooldown: 3200,
  damage: 30,
  hitRange: 44,
  hitHalfAngle: 0.45,
} as const;

export const CRAWLER = {
  maxHp: 68,
  speed: 115,
  radius: 18,
  detectionRange: 350,
  attackRange: 42,
  attackDamage: 14,
  attackCooldown: 1050,
  windup: 330,
} as const;
