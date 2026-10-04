import type { Obstacle } from '../systems/Movement';

export const VALLEY = {
  cameraWidth: 3000,
  bounds: { left: 260, right: 2660, top: 400, bottom: 1180 },
  entry: { x: 530, y: 850 },
  portal: { x: 370, y: 850 },
  checkpoint: { x: 1860, y: 570 },
  landmark: { x: 2190, y: 650, radius: 140 },
  end: { x: 2500, y: 860, radius: 115 },
} as const;

export type ValleyKind = 'carapace' | 'thorn';
export const VALLEY_CREATURES = {
  carapace: { name: 'CASCO ERRANTE', hp: 136, radius: 25, size: 126, speed: 74, detection: 340,
    range: 105, damage: 18, windup: 850, recovery: 850, cooldown: 2300 },
  thorn: { name: 'ESPINHANTE', hp: 78, radius: 17, size: 101, speed: 96, detection: 370,
    range: 320, damage: 11, windup: 950, recovery: 700, cooldown: 2800 },
} as const;

// Stable habitat IDs; renewal state is stored independently of actor instances.
// None of these encounters is a door/portal unlock condition.
export const VALLEY_ENCOUNTERS = [
  { id: 900, kind: 'carapace', x: 900, y: 855 },
  { id: 901, kind: 'thorn', x: 1270, y: 605 },
  { id: 902, kind: 'carapace', x: 1470, y: 990 },
  { id: 903, kind: 'thorn', x: 1590, y: 1010 },
  { id: 904, kind: 'carapace', x: 2080, y: 1080 },
  { id: 905, kind: 'thorn', x: 2360, y: 1080 },
  { id: 906, kind: 'carapace', x: 1380, y: 575 },
  { id: 907, kind: 'thorn', x: 2440, y: 1070 },
] as const;

// Authored groups share existing creature AI; no waves or mandatory clearing.
export const VALLEY_ENCOUNTER_GROUPS = [
  { name: 'Passagem entre cristas', residents: [900] },
  { name: 'Desvio mineral', residents: [901, 906] },
  { name: 'Bacia enraizada', residents: [902, 903] },
  { name: 'Margem além do crescimento', residents: [904, 905, 907] },
] as const;

export const VALLEY_RENEWAL = { delayMs: 90_000, safeDistance: 480 } as const;
export const VALLEY_ROUTES = [
  { id: 'ridge', name: 'Passagem entre cristas', x: 1050, y: 760, radius: 145,
    hint: 'O caminho central passa entre as formações.',
    residents: 'Um Casco Errante ocupa a passagem.', tactic: 'Há espaço para contornar sua aproximação.' },
  { id: 'mineral', name: 'Desvio mineral', x: 1270, y: 555, radius: 125,
    hint: 'Explore a margem norte e suas formações âmbar.',
    residents: 'Casco Errante e Espinhante dividem a margem.', tactic: 'Use as rochas para separar o leque de espinhos da varredura.' },
  { id: 'roots', name: 'Bacia enraizada', x: 1510, y: 1040, radius: 130,
    hint: 'A rota sul contorna a crista por entre raízes.',
    residents: 'Uma dupla ocupa a bacia de raízes.', tactic: 'A crista divide o espaço; escolha por qual lado se aproximar.' },
] as const;

export const VALLEY_ROCKS: readonly Obstacle[] = [
  { x: 750, y: 715, radius: 44 }, { x: 1090, y: 910, radius: 52 },
  { x: 1430, y: 730, radius: 62 }, { x: 1790, y: 980, radius: 45 },
  { x: 2190, y: 650, radius: 53 }, { x: 2590, y: 840, radius: 98 },
];
export const VALLEY_BORDERS: readonly Obstacle[] = [
  ...[430,680,980,1300,1650,1970,2310,2570].map((x, i) => ({ x, y: 446 + (i % 3) * 9, radius: 68 })),
  ...[430,780,1140,1520,1920,2290,2570].map((x, i) => ({ x, y: 1160 - (i % 2) * 18, radius: 64 })),
];
