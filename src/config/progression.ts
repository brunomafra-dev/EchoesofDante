import { PLAYER } from './game';

export const PROGRESSION = {
  levelThresholds: [0, 60, 140],
  maxHpPerLevel: 10,
  hollowXp: 15,
  echoXp: 40,
  baseMaxHp: PLAYER.maxHp,
} as const;
