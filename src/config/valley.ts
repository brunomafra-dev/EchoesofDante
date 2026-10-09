import type { Obstacle } from '../systems/Movement';

export const VALLEY = {
  cameraWidth: 5500,
  bounds: { left: 260, right: 5200, top: 400, bottom: 1180 },
  entry: { x: 530, y: 850 },
  portal: { x: 370, y: 850 },
  checkpoint: { x: 1860, y: 570 },
  landmark: { x: 2190, y: 650, radius: 140 },
  end: { x: 2500, y: 860, radius: 115 },
  frontier: {
    threshold: { x: 2810, y: 640 },
    checkpoint: { x: 2865, y: 640 },
    signal: { x: 4230, y: 710, radius: 145 },
    end: { x: 4920, y: 795, radius: 165 },
    portal: { x: 5050, y: 795 },
  },
} as const;

export type ValleyKind = 'carapace' | 'thorn' | 'iceCarapace';
export const VALLEY_CREATURES = {
  iceCarapace: { name: 'CASCO GLACIAL', hp: 170, radius: 27, size: 132, speed: 62, detection: 350, range: 118, damage: 17, windup: 1050, recovery: 1150, cooldown: 2600 },
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
  { id: 908, kind: 'carapace', x: 3270, y: 820 },
  { id: 909, kind: 'thorn', x: 3520, y: 1010 },
  { id: 910, kind: 'thorn', x: 4480, y: 605 },
  { id: 911, kind: 'carapace', x: 4650, y: 990 },
] as const;

// Authored groups share existing creature AI; no waves or mandatory clearing.
export const VALLEY_ENCOUNTER_GROUPS = [
  { name: 'Passagem entre cristas', residents: [900] },
  { name: 'Desvio mineral', residents: [901, 906] },
  { name: 'Bacia enraizada', residents: [902, 903] },
  { name: 'Margem além do crescimento', residents: [904, 905, 907] },
  { name: 'Crista mineral', residents: [908, 909] },
  { name: 'Fenda oriental', residents: [910, 911] },
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
  { x: 3490, y: 825, radius: 108 }, { x: 3830, y: 590, radius: 58 },
  { x: 3840, y: 1060, radius: 66 }, { x: 4680, y: 1060, radius: 65 },
  { x: 3220, y: 578, radius: 38 }, { x: 3570, y: 1050, radius: 30 },
  { x: 4490, y: 598, radius: 42 }, { x: 4230, y: 768, radius: 45 },
];
export const VALLEY_BORDERS: readonly Obstacle[] = [
  ...[430,680,980,1300,1650,1970,2310,2570,3000,3370,3740,4110,4490,4860].map((x, i) => ({ x, y: 446 + (i % 3) * 9, radius: 68 })),
  ...[430,780,1140,1520,1920,2290,2570,2940,3300,3690,4060,4430,4800].map((x, i) => ({ x, y: 1160 - (i % 2) * 18, radius: 64 })),
  ...[540,755,970].map(y => ({ x: 5190, y, radius: 108 })),
];
