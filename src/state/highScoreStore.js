const STORAGE_KEY = 'mexican-train-high-scores-v1';
const MAX_ENTRIES = 10;

function getStorage(storage) {
  return storage || globalThis.localStorage || null;
}

export function loadHighScores(storage) {
  const activeStorage = getStorage(storage);
  if (!activeStorage) {
    return [];
  }
  try {
    const raw = activeStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHighScores(entries, storage) {
  const activeStorage = getStorage(storage);
  if (!activeStorage) {
    return entries;
  }
  const normalized = [...entries]
    .filter((entry) => entry && Number.isFinite(entry.score))
    .sort((left, right) => left.score - right.score || new Date(left.date).getTime() - new Date(right.date).getTime())
    .slice(0, MAX_ENTRIES);
  activeStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function recordHighScore({ name, score, players, roundsWon, date = new Date().toISOString() }, storage) {
  const existing = loadHighScores(storage);
  const next = saveHighScores([
    {
      name: name || 'Unknown',
      score,
      players,
      roundsWon,
      date,
    },
    ...existing,
  ], storage);
  return next;
}

export function formatHighScoreEntry(entry, index) {
  const suffix = entry.players ? ` | ${entry.players} players` : '';
  return `${index + 1}. ${entry.name}: ${entry.score}${suffix}`;
}