import { PLAYER } from './game';

export const PROGRESSION = {
  levelThresholds: [0, 60, 140, 360, 660],
  maxHpPerLevel: 10,
  hollowXp: 15,
  echoXp: 40,
  valleyRouteXp: 20,
  baseMaxHp: PLAYER.maxHp,
} as const;
