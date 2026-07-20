export const MAX_PIP = 12;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const TOTAL_ROUNDS = 13;

export const UI_COLORS = {
  table: 0xf2e7d4,
  panel: 0xf8f1e4,
  panelDark: 0xe7d9c2,
  ink: '#1f2430',
  accent: 0xb14a2d,
  accentAlt: 0x3f6b52,
  selected: 0xffd166,
  disabled: 0xd5ccb9,
  open: 0xc04d3a,
  closed: 0x608b6d,
  playable: 0xfff8eb,
  muted: 0xe4d7c4,
  boardLine: 0x8b7355,
  dominoBack: 0x8d5b4c,
  shadow: 0x000000,
};

export const DIFFICULTY_SETTINGS = {
  easy: {
    label: 'Easy',
    thinkMs: 950,
    chooser: 'random',
  },
  normal: {
    label: 'Normal',
    thinkMs: 650,
    chooser: 'top-three',
  },
  hard: {
    label: 'Hard',
    thinkMs: 350,
    chooser: 'best',
  },
};

export const DOUBLE_RULE_SETTINGS = {
  cover: {
    label: 'Cover Double',
  },
  extraTurn: {
    label: 'Extra Turn',
  },
};

export const DEFAULT_SETTINGS = {
  totalPlayers: 4,
  humanPlayers: 1,
  humanPlayerNames: ['Player 1'],
  humanTrainColors: ['crimson'],
  difficulty: 'normal',
  strictOpening: true,
  doubleRule: 'cover',
};

export const PIP_LAYOUTS = {
  0: [],
  1: [[0, 0]],
  2: [[-12, -12], [12, 12]],
  3: [[-12, -12], [0, 0], [12, 12]],
  4: [[-12, -12], [12, -12], [-12, 12], [12, 12]],
  5: [[-12, -12], [12, -12], [0, 0], [-12, 12], [12, 12]],
  6: [[-12, -14], [12, -14], [-12, 0], [12, 0], [-12, 14], [12, 14]],
  7: [[-12, -14], [12, -14], [0, -6], [-12, 0], [12, 0], [-12, 14], [12, 14]],
  8: [[-12, -16], [12, -16], [-12, -5], [12, -5], [-12, 5], [12, 5], [-12, 16], [12, 16]],
  9: [[-12, -16], [12, -16], [-12, -5], [0, -5], [12, -5], [-12, 5], [0, 5], [12, 5], [0, 16]],
  10: [[-12, -18], [12, -18], [-12, -6], [12, -6], [0, 0], [-12, 6], [12, 6], [-12, 18], [12, 18], [0, -18]],
  11: [[-12, -18], [12, -18], [0, -18], [-12, -6], [12, -6], [0, 0], [-12, 6], [12, 6], [0, 18], [-12, 18], [12, 18]],
  12: [[-12, -18], [12, -18], [-12, -6], [12, -6], [-12, 6], [12, 6], [-12, 18], [12, 18], [0, -18], [0, -6], [0, 6], [0, 18]],
};