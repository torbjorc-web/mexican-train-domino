import {
  DEFAULT_SETTINGS,
  DIFFICULTY_SETTINGS,
  DOUBLE_RULE_SETTINGS,
  MAX_PLAYERS,
  MAX_PIP,
  MIN_PLAYERS,
} from '../config/gameConfig.js';
import {
  clamp,
  cloneTile,
  createDominoSet,
  getHandSize,
  isDouble,
  makeTrain,
  pipSum,
  playableValueForTile,
  shuffle,
  summarizeHand,
  tileLabel,
} from '../utils/dominoes.js';

export function normalizeSettings(settings) {
  const next = {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
  };
  next.totalPlayers = clamp(next.totalPlayers, MIN_PLAYERS, MAX_PLAYERS);
  next.humanPlayers = clamp(next.humanPlayers, 1, next.totalPlayers);
  if (!DIFFICULTY_SETTINGS[next.difficulty]) {
    next.difficulty = DEFAULT_SETTINGS.difficulty;
  }
  if (!DOUBLE_RULE_SETTINGS[next.doubleRule]) {
    next.doubleRule = DEFAULT_SETTINGS.doubleRule;
  }
  return next;
}

export function createMatchState(settings) {
  return {
    roundIndex: 0,
    scores: Array(settings.totalPlayers).fill(0),
    roundsWon: Array(settings.totalPlayers).fill(0),
    completed: false,
    history: [],
  };
}

export function createRoundState(match, settings) {
  const engineValue = MAX_PIP - match.roundIndex;
  const totalPlayers = settings.totalPlayers;
  const handSize = getHandSize(totalPlayers);
  const deck = shuffle(createDominoSet().filter((tile) => !(tile.a === engineValue && tile.b === engineValue)));
  const players = Array.from({ length: totalPlayers }, (_, index) => ({
    name: index < settings.humanPlayers ? `Player ${index + 1}` : `Bot ${index - settings.humanPlayers + 1}`,
    hand: [],
    isHuman: index < settings.humanPlayers,
    hasStartedTrain: false,
  }));

  for (let handIndex = 0; handIndex < handSize; handIndex += 1) {
    for (let playerIndex = 0; playerIndex < totalPlayers; playerIndex += 1) {
      players[playerIndex].hand.push(deck.pop());
    }
  }

  const trains = players.map((player, index) => makeTrain(`${player.name} Train`, index, false, engineValue));
  trains.push(makeTrain('Mexican Train', null, true, engineValue));

  return {
    engineValue,
    players,
    trains,
    boneyard: deck,
    currentPlayer: match.roundIndex % totalPlayers,
    pendingDouble: null,
    extraTurnPending: false,
    roundOver: false,
    roundBlocked: false,
    winner: null,
    mustDrawBeforePass: false,
    lastRoundScores: null,
    openingPhase: settings.strictOpening,
    humanRevealPending: false,
    turnMessage: '',
    log: [
      `Round ${match.roundIndex + 1} starts with engine ${engineValue}|${engineValue}.`,
      settings.strictOpening
        ? 'Opening phase: each player must establish their own train before wider play unlocks.'
        : 'Free opening: players may use any eligible trains immediately.',
    ],
  };
}

export function getMexicanTrainIndex(state) {
  return state.players.length;
}

export function pushLog(state, message, maxEntries = 4) {
  state.log.unshift(message);
  state.log = state.log.slice(0, maxEntries);
}

export function getRequiredTrainIndex(state) {
  return state.pendingDouble ? state.pendingDouble.trainIndex : null;
}

export function canPlayOnTrain(state, playerIndex, trainIndex, tile) {
  const train = state.trains[trainIndex];
  const requiredTrainIndex = getRequiredTrainIndex(state);

  if (!tile) {
    return false;
  }
  if (requiredTrainIndex !== null) {
    return requiredTrainIndex === trainIndex && playableValueForTile(tile, train.endpoint) !== null;
  }
  if (state.openingPhase && trainIndex !== playerIndex) {
    return false;
  }
  if (!train.isMexican && train.ownerIndex !== playerIndex && !train.open) {
    return false;
  }
  return playableValueForTile(tile, train.endpoint) !== null;
}

export function getPlayableTargets(state, playerIndex, tile) {
  return state.trains
    .map((train, trainIndex) => ({ train, trainIndex }))
    .filter(({ trainIndex }) => canPlayOnTrain(state, playerIndex, trainIndex, tile));
}

export function getPlayableTiles(state, playerIndex) {
  return state.players[playerIndex].hand.filter((tile) => getPlayableTargets(state, playerIndex, tile).length > 0);
}

export function getAllLegalMoves(state, playerIndex) {
  const moves = [];
  for (const tile of state.players[playerIndex].hand) {
    for (const target of getPlayableTargets(state, playerIndex, tile)) {
      moves.push({ tileId: tile.id, tile, trainIndex: target.trainIndex });
    }
  }
  return moves;
}

export function markTrainOpen(state, playerIndex, open) {
  state.trains[playerIndex].open = open;
}

export function removeTileFromHand(state, playerIndex, tileId) {
  const hand = state.players[playerIndex].hand;
  const tileIndex = hand.findIndex((tile) => tile.id === tileId);
  if (tileIndex >= 0) {
    return hand.splice(tileIndex, 1)[0];
  }
  return null;
}

export function canCoverAfterDouble(state, playerIndex, tileId, trainIndex) {
  const train = state.trains[trainIndex];
  const endpoint = train.endpoint;
  const remaining = state.players[playerIndex].hand.filter((tile) => tile.id !== tileId);
  return remaining.some((tile) => playableValueForTile(tile, endpoint) !== null);
}

export function playTile(state, settings, playerIndex, trainIndex, tileId) {
  const tile = removeTileFromHand(state, playerIndex, tileId);
  if (!tile) {
    return { ok: false, tile: null };
  }

  const train = state.trains[trainIndex];
  const nextEndpoint = playableValueForTile(tile, train.endpoint);
  if (nextEndpoint === null) {
    state.players[playerIndex].hand.push(tile);
    return { ok: false, tile: null };
  }

  state.extraTurnPending = false;
  train.tiles.push(cloneTile(tile));
  train.endpoint = nextEndpoint;
  if (!train.isMexican && train.ownerIndex === playerIndex) {
    train.open = false;
    state.players[playerIndex].hasStartedTrain = true;
  }

  const actor = state.players[playerIndex].name;
  pushLog(state, `${actor} played ${tileLabel(tile)} on ${train.name}.`);

  if (isDouble(tile) && settings.doubleRule === 'cover') {
    state.pendingDouble = { trainIndex, value: tile.a, setter: playerIndex };
    state.turnMessage = `${actor} played a double and must cover it.`;
  } else if (state.pendingDouble && state.pendingDouble.trainIndex === trainIndex) {
    state.pendingDouble = null;
    state.turnMessage = `${actor} covered the double.`;
  } else if (isDouble(tile) && settings.doubleRule === 'extraTurn') {
    state.extraTurnPending = true;
    state.turnMessage = `${actor} played a double and earns another move.`;
  }

  if (state.openingPhase && state.players.every((player) => player.hasStartedTrain)) {
    state.openingPhase = false;
    pushLog(state, 'All personal trains are started. Regular play is now open.');
    state.turnMessage = 'Opening phase complete. Regular play is now open.';
  }

  return { ok: true, tile };
}

export function scoreMove(state, settings, playerIndex, move) {
  const { tile, trainIndex } = move;
  const playerTrain = state.trains[playerIndex];
  const targetTrain = state.trains[trainIndex];
  let score = pipSum(tile) * (settings.difficulty === 'hard' ? 3 : 2);

  if (state.pendingDouble) {
    score += settings.difficulty === 'hard' ? 150 : 100;
  }
  if (trainIndex === playerIndex) {
    score += settings.difficulty === 'hard' ? 16 : 12;
    if (playerTrain.open) {
      score += settings.difficulty === 'hard' ? 18 : 12;
    }
    if (state.openingPhase && !state.players[playerIndex].hasStartedTrain) {
      score += 40;
    }
  }
  if (targetTrain.isMexican) {
    score += settings.difficulty === 'easy' ? 2 : 5;
  }
  if (!targetTrain.isMexican && targetTrain.ownerIndex !== playerIndex) {
    score -= settings.difficulty === 'hard' ? 7 : 4;
    if (targetTrain.open) {
      score += 2;
    }
  }
  if (isDouble(tile)) {
    if (settings.doubleRule === 'cover') {
      score += canCoverAfterDouble(state, playerIndex, tile.id, trainIndex) ? (settings.difficulty === 'hard' ? 18 : 12) : -18;
    } else {
      score += 10;
    }
  }
  if (state.openingPhase && trainIndex !== playerIndex) {
    score -= 50;
  }
  const nextEndpoint = playableValueForTile(tile, targetTrain.endpoint);
  if (nextEndpoint !== null && nextEndpoint >= 9) {
    score += settings.difficulty === 'hard' ? 4 : 2;
  }
  return score;
}

export function chooseBotMove(state, settings, playerIndex) {
  const legalMoves = getAllLegalMoves(state, playerIndex);
  if (legalMoves.length === 0) {
    return null;
  }
  const difficulty = DIFFICULTY_SETTINGS[settings.difficulty];
  if (difficulty.chooser === 'random') {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }
  const scored = legalMoves
    .map((move) => ({ move, score: scoreMove(state, settings, playerIndex, move) }))
    .sort((left, right) => right.score - left.score);

  if (difficulty.chooser === 'top-three') {
    const shortlist = scored.slice(0, Math.min(3, scored.length));
    return shortlist[Math.floor(Math.random() * shortlist.length)].move;
  }
  return scored[0].move;
}

export function drawForCurrentPlayer(state) {
  if (state.boneyard.length === 0) {
    return null;
  }
  const tile = state.boneyard.pop();
  state.players[state.currentPlayer].hand.push(tile);
  pushLog(state, `${state.players[state.currentPlayer].name} drew ${tileLabel(tile)}.`);
  return tile;
}

export function handleUnableToPlay(state, playerIndex) {
  markTrainOpen(state, playerIndex, true);
  const player = state.players[playerIndex];
  if (state.openingPhase && !player.hasStartedTrain) {
    state.turnMessage = `${player.name} could not start their train and opened it.`;
    pushLog(state, `${player.name} could not start their train and opened it.`);
    return;
  }
  if (state.pendingDouble) {
    state.turnMessage = `${player.name} could not cover the double. Their train is now open.`;
    pushLog(state, `${player.name} could not cover the double and opened their train.`);
    return;
  }
  state.turnMessage = `${player.name} could not play and opened their train.`;
  pushLog(state, `${player.name} could not play and opened their train.`);
}

export function finalizeScores(state, match) {
  const roundScores = state.players.map((player) => summarizeHand(player.hand));
  roundScores.forEach((score, index) => {
    match.scores[index] += score;
  });
  return roundScores;
}

export function getMatchLeaderIndex(match) {
  return match.scores
    .map((score, index) => ({ score, index, roundsWon: match.roundsWon[index] }))
    .sort((left, right) => left.score - right.score || right.roundsWon - left.roundsWon)[0].index;
}

export function canAnyPlayerMove(state) {
  return state.players.some((_, index) => getPlayableTiles(state, index).length > 0);
}