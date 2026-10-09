import type { Obstacle } from '../systems/Movement';

export type GlacierAreaId = 'icecave' | 'icenest';
export const GLACIER = {
  icecave: {
    name: 'Galerias do Degelo', width: 3100, height: 1800,
    bounds: { left: 190, right: 2890, top: 390, bottom: 1430 },
    entry: { x: 390, y: 960 }, back: { x: 245, y: 960 },
    checkpoint: { x: 1530, y: 450 }, relay: { x: 1680, y: 650, radius: 130 },
    exit: { x: 2760, y: 980 },
    rocks: [
      { x: 860, y: 890, radius: 70 }, { x: 980, y: 900, radius: 58 },
      { x: 1260, y: 1230, radius: 65 }, { x: 1680, y: 610, radius: 45 },
      { x: 1960, y: 800, radius: 68 }, { x: 2190, y: 1190, radius: 70 },
      { x: 2390, y: 720, radius: 56 },
    ] as readonly Obstacle[],
  },
  icenest: {
    name: 'Ninho da Geada', width: 2500, height: 1800,
    bounds: { left: 210, right: 2250, top: 440, bottom: 1400 },
    entry: { x: 415, y: 990 }, back: { x: 280, y: 990 },
    checkpoint: { x: 680, y: 970 }, relay: { x: 2070, y: 800, radius: 145 },
    exit: { x: 2070, y: 1000 },
    rocks: [
      { x: 805, y: 490, radius: 60 }, { x: 805, y: 585, radius: 60 },
      { x: 805, y: 680, radius: 60 }, { x: 805, y: 775, radius: 60 },
      { x: 805, y: 870, radius: 60 }, { x: 805, y: 1110, radius: 60 },
      { x: 805, y: 1205, radius: 60 }, { x: 805, y: 1300, radius: 60 },
      { x: 805, y: 1390, radius: 60 },
      { x: 700, y: 510, radius: 52 }, { x: 760, y: 1370, radius: 55 },
      { x: 1600, y: 490, radius: 58 }, { x: 1850, y: 1380, radius: 60 },
      { x: 2070, y: 740, radius: 45 },
    ] as readonly Obstacle[],
  },
} as const;

export const GLACIER_ROUTES = [
  { id: 'glacier-thaw-pool', name: 'Poço do Degelo', x: 1120, y: 520, radius: 100 },
  { id: 'glacier-fossil-wing', name: 'Asas na Pedra', x: 2120, y: 1350, radius: 100 },
] as const;
export const GLACIER_ENCOUNTERS = [
  { id: 1300, kind: 'frostPouncer', x: 700, y: 1130 },
  { id: 1301, kind: 'frostSpitter', x: 1110, y: 570 },
  { id: 1302, kind: 'iceCarapace', x: 1260, y: 870 },
  { id: 1303, kind: 'frostPouncer', x: 1380, y: 810 },
  { id: 1304, kind: 'frostSpitter', x: 1860, y: 1120 },
  { id: 1305, kind: 'iceCarapace', x: 2180, y: 1000 },
  { id: 1306, kind: 'frostPouncer', x: 2380, y: 1100 },
  { id: 1307, kind: 'frostSpitter', x: 2540, y: 930 },
] as const;

export type IceAttack = 'breath' | 'tail' | 'rush' | 'eruption';
export const VESPER = {
  hp: 1100, radius: 58, size: 290, spawn: { x: 1420, y: 960 },
  awakeningX: 870, speed: 86, xp: 220,
  bounds: { left: 890, right: 2010, top: 570, bottom: 1300 },
  patterns: {
    1: ['breath', 'tail', 'rush', 'tail'] as readonly IceAttack[],
    2: ['eruption', 'breath', 'rush', 'tail', 'breath'] as readonly IceAttack[],
    3: ['breath', 'eruption', 'rush', 'tail', 'eruption'] as readonly IceAttack[],
  },
  breath: { tell: 1300, duration: 900, recovery: 1650, damage: 22, range: 390, halfAngle: .40 },
  tail: { tell: 900, duration: 220, recovery: 1350, damage: 18, range: 175, halfAngle: 1.35 },
  rush: { tell: 1150, duration: 760, recovery: 1700, damage: 24, speed: 480, distance: 340, halfWidth: 62 },
  eruption: { tell: 1300, duration: 1150, recovery: 1600, damage: 20, radius: 72, interval: 330 },
} as const;
