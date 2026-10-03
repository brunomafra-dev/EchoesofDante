import type { Obstacle } from '../systems/Movement';

// A quiet extension of the existing exterior. The final threshold stays sealed.
export const WARDEN_PREPARATION = {
  right: 6180,
  cameraWidth: 6800,
  respawn: { x: 5430, y: 740 },
  echo: { x: 5530, y: 735, radius: 140, approachRadius: 260 },
  threshold: { x: 6100, y: 740, radius: 130 },
  responseMs: 5200,
  revelation: 'PRIMEIRO ECO\nASSINATURA HUMANA: JÁ REGISTRADA\nDATA DO REGISTRO: ILEGÍVEL',
  confirmation: 'COMPATIBILIDADE CONFIRMADA\nORIGEM DO REGISTRO: DESCONHECIDA',
  continuation: 'AS INSCRIÇÕES RESPONDERAM\nSIGA ATÉ O LIMIAR',
  presence: 'LIMIAR DO GUARDIÃO\nALGO SE MOVE DO OUTRO LADO\nINVESTIGUE A PASSAGEM',
} as const;

export const WARDEN_FOOTPRINTS: readonly Obstacle[] = [
  { x: 5460, y: 455, radius: 60 }, { x: 5500, y: 1000, radius: 70 },
  { x: 5530, y: 685, radius: 45 },
  { x: 5720, y: 495, radius: 70 }, { x: 5770, y: 1020, radius: 80 },
  { x: 5900, y: 475, radius: 80 }, { x: 5930, y: 1040, radius: 80 },
  { x: 6400, y: 740, radius: 250 },
];
