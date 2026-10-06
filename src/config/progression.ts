import { PLAYER } from './game';

export const PROGRESSION = {
  // Levels 1–5 retain the XP curve used by existing local journeys.
  levelThresholds: [0, 60, 140, 360, 660, 960, 1300, 1680, 2100, 2560],
  maxHpPerLevel: 10,
  laterMaxHpPerLevel: 5,
  legacyHpThroughLevel: 5,
  hollowXp: 15,
  echoXp: 40,
  valleyRouteXp: 20,
  baseMaxHp: PLAYER.maxHp,
} as const;
