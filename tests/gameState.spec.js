import {
  canPlayOnTrain,
  createMatchState,
  createRoundState,
  getAllLegalMoves,
  getMexicanTrainIndex,
  normalizeSettings,
  playTile,
} from '../src/state/gameState.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function forceSingleTileHand(state, playerIndex, tile, endpoint) {
  state.players[playerIndex].hand = [tile];
  state.trains[playerIndex].endpoint = endpoint;
  state.players[playerIndex].hasStartedTrain = false;
}

export function runGameStateTests() {
  const results = [];

  const strictSettings = normalizeSettings({ totalPlayers: 4, humanPlayers: 1, strictOpening: true, doubleRule: 'cover' });
  const strictMatch = createMatchState(strictSettings);
  const strictRound = createRoundState(strictMatch, strictSettings);
  const mexIndex = getMexicanTrainIndex(strictRound);
  const openingTile = { id: 9991, a: strictRound.engineValue, b: 3 };
  forceSingleTileHand(strictRound, 0, openingTile, strictRound.engineValue);
  assert(canPlayOnTrain(strictRound, 0, 0, openingTile), 'Own train should be playable during strict opening');
  assert(!canPlayOnTrain(strictRound, 0, mexIndex, openingTile), 'Mexican Train should be locked during strict opening');
  results.push('strict opening blocks Mexican Train until a personal train is started');

  const freeSettings = normalizeSettings({ totalPlayers: 4, humanPlayers: 1, strictOpening: false, doubleRule: 'cover' });
  const freeMatch = createMatchState(freeSettings);
  const freeRound = createRoundState(freeMatch, freeSettings);
  const freeMexIndex = getMexicanTrainIndex(freeRound);
  const freeTile = { id: 9992, a: freeRound.engineValue, b: 6 };
  forceSingleTileHand(freeRound, 0, freeTile, freeRound.engineValue);
  assert(canPlayOnTrain(freeRound, 0, freeMexIndex, freeTile), 'Mexican Train should be available in free opening mode');
  results.push('free opening allows broader play immediately');

  const coverSettings = normalizeSettings({ totalPlayers: 4, humanPlayers: 1, strictOpening: false, doubleRule: 'cover' });
  const coverMatch = createMatchState(coverSettings);
  const coverRound = createRoundState(coverMatch, coverSettings);
  const coverTile = { id: 9993, a: coverRound.engineValue, b: coverRound.engineValue };
  forceSingleTileHand(coverRound, 0, coverTile, coverRound.engineValue);
  const coverResult = playTile(coverRound, coverSettings, 0, 0, coverTile.id);
  assert(coverResult.ok, 'Double should play successfully under cover rule');
  assert(Boolean(coverRound.pendingDouble), 'Cover rule should leave a pending double to satisfy');
  results.push('cover rule leaves an unresolved double on the train');

  const extraTurnSettings = normalizeSettings({ totalPlayers: 4, humanPlayers: 1, strictOpening: false, doubleRule: 'extraTurn' });
  const extraMatch = createMatchState(extraTurnSettings);
  const extraRound = createRoundState(extraMatch, extraTurnSettings);
  const extraTile = { id: 9994, a: extraRound.engineValue, b: extraRound.engineValue };
  forceSingleTileHand(extraRound, 0, extraTile, extraRound.engineValue);
  const extraResult = playTile(extraRound, extraTurnSettings, 0, 0, extraTile.id);
  assert(extraResult.ok, 'Double should play successfully under extra-turn rule');
  assert(!extraRound.pendingDouble, 'Extra-turn rule should not leave a pending double');
  assert(extraRound.extraTurnPending, 'Extra-turn rule should mark an extra turn');
  results.push('extra-turn rule grants another move instead of forcing a cover');

  const botSettings = normalizeSettings({ totalPlayers: 4, humanPlayers: 1, strictOpening: false, doubleRule: 'cover' });
  const botMatch = createMatchState(botSettings);
  const botRound = createRoundState(botMatch, botSettings);
  const botMoves = getAllLegalMoves(botRound, 1);
  assert(botMoves.length > 0, 'A fresh round should usually give the next player at least one legal opening move');
  results.push('legal move generation returns playable moves for bot turns');

  const colorSettings = normalizeSettings({
    totalPlayers: 5,
    humanPlayers: 3,
    strictOpening: false,
    doubleRule: 'cover',
    humanTrainColors: ['gold', 'gold', 'bogus'],
  });
  const colorMatch = createMatchState(colorSettings);
  const colorRound = createRoundState(colorMatch, colorSettings);
  const assignedColors = colorRound.players.map((player) => player.colorKey);
  assert(new Set(assignedColors).size === assignedColors.length, 'Every train should receive a unique color');
  assert(colorRound.players.slice(0, 3).every((player) => Boolean(player.colorKey)), 'Human players should have explicit train colors');
  results.push('train color assignment keeps every train unique');

  return results;
}
