import { MAX_PIP } from '../config/gameConfig.js';

export function createDominoSet() {
  const tiles = [];
  let id = 0;
  for (let high = 0; high <= MAX_PIP; high += 1) {
    for (let low = 0; low <= high; low += 1) {
      tiles.push({ id: id += 1, a: high, b: low });
    }
  }
  return tiles;
}

export function shuffle(array) {
  const items = [...array];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

export function tileLabel(tile) {
  return `${tile.a}|${tile.b}`;
}

export function isDouble(tile) {
  return tile.a === tile.b;
}

export function pipSum(tile) {
  return tile.a + tile.b;
}

export function playableValueForTile(tile, endpoint) {
  if (tile.a === endpoint) {
    return tile.b;
  }
  if (tile.b === endpoint) {
    return tile.a;
  }
  return null;
}

export function summarizeHand(hand) {
  return hand.reduce((sum, tile) => sum + pipSum(tile), 0);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getHandSize(totalPlayers) {
  return totalPlayers <= 4 ? 15 : 12;
}

export function makeTrain(name, ownerIndex, isMexican, engineValue, colorKey = null) {
  return {
    name,
    ownerIndex,
    isMexican,
    colorKey,
    open: isMexican,
    tiles: [],
    endpoint: engineValue,
  };
}

export function cloneTile(tile) {
  return { id: tile.id, a: tile.a, b: tile.b };
}

export function getTrainIndicesForCount(totalPlayers) {
  const layouts = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 5],
    5: [0, 1, 2, 3, 5],
    6: [0, 1, 2, 3, 4, 5],
  };
  return layouts[totalPlayers] || layouts[4];
}

export function getTrainAnchors(totalPlayers) {
  const slots = [
    { x: 445, y: 185, align: 'left' },
    { x: 640, y: 110, align: 'center' },
    { x: 920, y: 125, align: 'right' },
    { x: 1090, y: 285, align: 'right' },
    { x: 960, y: 490, align: 'right' },
    { x: 495, y: 500, align: 'left' },
  ];
  return getTrainIndicesForCount(totalPlayers).map((slotIndex) => slots[slotIndex]);
}