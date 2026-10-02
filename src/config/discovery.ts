export const NORTHERN_DISCOVERY = {
  x: 1500,
  y: 285,
  radius: 150,
  messageDuration: 4200,
} as const;

export const FOREST_ECHOES = {
  mineral: { id: 'mineral-signal', x: 1870, y: 995, radius: 145, message: 'SINAL MINERAL\nPADRÃO: NÃO NATURAL' },
  trace: { id: 'unknown-trace', x: 560, y: 620, radius: 115, message: 'VESTÍGIO DETECTADO\nIDADE: DESCONHECIDA' },
} as const;

export const ECHO_COUNT = 3;

export const SIGNAL_THRESHOLD = {
  x: 1870,
  y: 245,
  radius: 128,
  obstacleRadius: 62,
  synchronizedMessage: 'SINAL SINCRONIZADO\nORIGEM: ENCOSTA AO NORTE',
  thresholdMessage: 'FONTE DO SINAL: ABAIXO\nPASSAGEM SELADA',
  mechanismX: 1670,
  mechanismY: 230,
  mechanismRadius: 85,
  openingMessage: 'DANTE RESPONDE\nA PASSAGEM ESTÁ SE ABRINDO',
  openedMessage: 'PASSAGEM ABERTA\nCAMINHE PARA DENTRO DA FISSURA',
} as const;
