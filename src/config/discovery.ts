export const NORTHERN_DISCOVERY = {
  x: 1500,
  y: 285,
  radius: 150,
  messageDuration: 4200,
} as const;

export const FOREST_ECHOES = {
  mineral: { id: 'mineral-signal', x: 1870, y: 995, radius: 145, message: 'MINERAL SIGNAL\nPATTERN: NON-NATURAL' },
  trace: { id: 'unknown-trace', x: 560, y: 620, radius: 115, message: 'TRACE DETECTED\nAGE: UNKNOWN' },
} as const;

export const ECHO_COUNT = 3;
