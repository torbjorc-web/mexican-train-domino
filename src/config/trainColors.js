export const TRAIN_COLOR_OPTIONS = [
  { key: 'crimson', label: 'Crimson', fill: 0xb14a4a, stroke: 0x7c2f2f },
  { key: 'gold', label: 'Gold', fill: 0xc8a13c, stroke: 0x8a6c19 },
  { key: 'teal', label: 'Teal', fill: 0x4d9882, stroke: 0x2f6759 },
  { key: 'navy', label: 'Navy', fill: 0x4d6fb4, stroke: 0x314e86 },
  { key: 'plum', label: 'Plum', fill: 0x8957b5, stroke: 0x623b86 },
  { key: 'olive', label: 'Olive', fill: 0x87954c, stroke: 0x5f6a2e },
];

export const MEXICAN_TRAIN_COLOR = {
  key: 'mexican',
  label: 'Mexican',
  fill: 0xc39a3c,
  stroke: 0x7d6021,
};

const TRAIN_COLOR_LOOKUP = Object.fromEntries([
  ...TRAIN_COLOR_OPTIONS,
  MEXICAN_TRAIN_COLOR,
].map((option) => [option.key, option]));

export function getTrainColorStyle(colorKey) {
  return TRAIN_COLOR_LOOKUP[colorKey] || MEXICAN_TRAIN_COLOR;
}

export function getTrainColorLabel(colorKey) {
  return getTrainColorStyle(colorKey).label;
}

export function normalizeHumanTrainColors(colorKeys = [], humanPlayers = 1) {
  const normalized = [];
  const used = new Set();
  for (let index = 0; index < humanPlayers; index += 1) {
    const candidate = colorKeys[index];
    if (TRAIN_COLOR_LOOKUP[candidate] && candidate !== MEXICAN_TRAIN_COLOR.key && !used.has(candidate)) {
      normalized.push(candidate);
      used.add(candidate);
      continue;
    }

    const fallback = TRAIN_COLOR_OPTIONS.find((option) => !used.has(option.key));
    const fallbackKey = fallback ? fallback.key : TRAIN_COLOR_OPTIONS[0].key;
    normalized.push(fallbackKey);
    used.add(fallbackKey);
  }
  return normalized;
}

export function getNextTrainColorKey(colorKeys = [], humanIndex = 0, direction = 1) {
  const normalized = normalizeHumanTrainColors(colorKeys, Math.max(colorKeys.length, humanIndex + 1));
  const currentKey = normalized[humanIndex] || TRAIN_COLOR_OPTIONS[0].key;
  const currentIndex = TRAIN_COLOR_OPTIONS.findIndex((option) => option.key === currentKey);
  if (currentIndex < 0) {
    return TRAIN_COLOR_OPTIONS[0].key;
  }

  const step = direction >= 0 ? 1 : -1;
  for (let offset = 1; offset <= TRAIN_COLOR_OPTIONS.length; offset += 1) {
    const candidateIndex = (currentIndex + (step * offset) + TRAIN_COLOR_OPTIONS.length) % TRAIN_COLOR_OPTIONS.length;
    const candidate = TRAIN_COLOR_OPTIONS[candidateIndex].key;
    const conflict = normalized.some((key, index) => index !== humanIndex && key === candidate);
    if (!conflict) {
      return candidate;
    }
  }

  return currentKey;
}

export function normalizeHumanPlayerNames(playerNames = [], humanPlayers = 1) {
  return Array.from({ length: humanPlayers }, (_, index) => {
    const candidate = `${playerNames[index] || ''}`.trim();
    return candidate || `Player ${index + 1}`;
  });
}