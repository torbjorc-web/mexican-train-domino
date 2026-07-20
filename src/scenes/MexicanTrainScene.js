import {
  DEFAULT_SETTINGS,
  DIFFICULTY_SETTINGS,
  DOUBLE_RULE_SETTINGS,
  MAX_PLAYERS,
  MAX_PIP,
  MIN_PLAYERS,
  TOTAL_ROUNDS,
  UI_COLORS,
} from '../config/gameConfig.js';
import { createDominoSprite } from '../render/createDominoSprite.js';
import {
  clamp,
  cloneTile,
  createDominoSet,
  getHandSize,
  getTrainAnchors,
  isDouble,
  makeTrain,
  pipSum,
  playableValueForTile,
  shuffle,
  summarizeHand,
  tileLabel,
} from '../utils/dominoes.js';

export class MexicanTrainScene extends Phaser.Scene {
  constructor() {
    super('mexican-train');
    this.settings = { ...DEFAULT_SETTINGS };
    this.match = null;
    this.state = null;
    this.selectedTileId = null;
    this.draggingTileId = null;
    this.ui = {};
  }

  init(data) {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(data?.settings || {}),
    };
    this.settings.totalPlayers = clamp(this.settings.totalPlayers, MIN_PLAYERS, MAX_PLAYERS);
    this.settings.humanPlayers = clamp(this.settings.humanPlayers, 1, this.settings.totalPlayers);
    if (!DIFFICULTY_SETTINGS[this.settings.difficulty]) {
      this.settings.difficulty = DEFAULT_SETTINGS.difficulty;
    }
    if (!DOUBLE_RULE_SETTINGS[this.settings.doubleRule]) {
      this.settings.doubleRule = DEFAULT_SETTINGS.doubleRule;
    }
  }

  create() {
    this.cameras.main.setBackgroundColor(UI_COLORS.table);
    this.buildStaticUi();
    this.startMatch();
  }

  buildStaticUi() {
    this.add.rectangle(640, 360, 1240, 700, UI_COLORS.panel).setStrokeStyle(3, UI_COLORS.accent, 0.35);
    this.add.rectangle(965, 360, 520, 650, UI_COLORS.panelDark, 0.35).setStrokeStyle(2, UI_COLORS.boardLine, 0.3);

    this.ui.title = this.add.text(28, 18, 'Mexican Train Dominoes', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    });
    this.ui.roundMeta = this.add.text(28, 56, '', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: UI_COLORS.ink,
    });
    this.ui.status = this.add.text(28, 84, '', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: UI_COLORS.ink,
      wordWrap: { width: 620 },
    });

    this.ui.scoreboard = this.add.text(28, 170, '', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: UI_COLORS.ink,
      lineSpacing: 4,
      wordWrap: { width: 300 },
    });
    this.ui.playerSummary = this.add.text(28, 382, '', {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: UI_COLORS.ink,
      lineSpacing: 3,
      wordWrap: { width: 300 },
    });
    this.ui.log = this.add.text(28, 560, '', {
      fontFamily: 'Courier New',
      fontSize: '12px',
      color: UI_COLORS.ink,
      lineSpacing: 3,
      wordWrap: { width: 300 },
    });

    this.ui.sidebarExpanded = true;
    this.ui.sidebarToggle = this.add.rectangle(320, 28, 48, 34, UI_COLORS.panelDark)
      .setStrokeStyle(2, UI_COLORS.boardLine, 1)
      .setInteractive({ useHandCursor: true });
    this.ui.sidebarToggleLabel = this.add.text(320, 28, 'Hide', {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.ui.sidebarToggle.on('pointerup', () => this.toggleSidebar());
    this.ui.sidebarToggleLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => this.toggleSidebar());

    this.ui.historyPanel = this.add.rectangle(250, 676, 448, 58, UI_COLORS.playable).setStrokeStyle(2, UI_COLORS.boardLine, 0.7);
    this.ui.historyText = this.add.text(28, 652, '', {
      fontFamily: 'Courier New',
      fontSize: '11px',
      color: UI_COLORS.ink,
      wordWrap: { width: 430 },
      lineSpacing: 2,
    });

    this.ui.boardTitle = this.add.text(760, 26, 'Board', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.ui.boardHint = this.add.text(760, 56, '', {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: UI_COLORS.ink,
      align: 'center',
      wordWrap: { width: 720 },
    }).setOrigin(0.5, 0);

    this.ui.boardGroup = this.add.group();
    this.ui.handGroup = this.add.group();

    this.ui.handTitle = this.add.text(340, 585, '', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    });
    this.ui.handHint = this.add.text(340, 615, '', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: UI_COLORS.ink,
    });

    this.ui.drawButton = this.add.rectangle(1040, 628, 160, 56, UI_COLORS.accentAlt)
      .setStrokeStyle(2, 0x2f4e3b, 1)
      .setInteractive({ useHandCursor: true });
    this.ui.drawLabel = this.add.text(1040, 628, 'Draw / Pass', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.ui.drawButton.on('pointerup', () => this.onDrawOrPass());
    this.ui.drawLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => this.onDrawOrPass());

    this.ui.advanceButton = this.add.rectangle(1210, 628, 120, 56, UI_COLORS.accent)
      .setStrokeStyle(2, 0x7c2914, 1)
      .setInteractive({ useHandCursor: true });
    this.ui.advanceLabel = this.add.text(1210, 628, 'Next', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.ui.advanceButton.on('pointerup', () => this.onAdvanceButton());
    this.ui.advanceLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => this.onAdvanceButton());

    this.ui.menuButton = this.add.rectangle(1110, 28, 180, 40, UI_COLORS.panelDark)
      .setStrokeStyle(2, UI_COLORS.boardLine, 1)
      .setInteractive({ useHandCursor: true });
    this.ui.menuLabel = this.add.text(1110, 28, 'Title / Settings', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.ui.menuButton.on('pointerup', () => this.scene.start('title-screen', { settings: this.settings }));
    this.ui.menuLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('title-screen', { settings: this.settings }));

    this.ui.overlay = this.add.container(0, 0);
    const overlayBg = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.52);
    const overlayPanel = this.add.rectangle(640, 360, 520, 250, UI_COLORS.panel).setStrokeStyle(3, UI_COLORS.accent, 0.4);
    this.ui.overlayTitle = this.add.text(640, 295, '', {
      fontFamily: 'Georgia',
      fontSize: '30px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0.5);
    this.ui.overlayBody = this.add.text(640, 360, '', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: UI_COLORS.ink,
      align: 'center',
      wordWrap: { width: 420 },
      lineSpacing: 6,
    }).setOrigin(0.5, 0.5);
    this.ui.overlayButton = this.add.rectangle(640, 430, 220, 56, UI_COLORS.accent)
      .setStrokeStyle(2, 0x7c2914, 1)
      .setInteractive({ useHandCursor: true });
    this.ui.overlayLabel = this.add.text(640, 430, 'Reveal Hand', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.ui.overlay.add([overlayBg, overlayPanel, this.ui.overlayTitle, this.ui.overlayBody, this.ui.overlayButton, this.ui.overlayLabel]);
    this.ui.overlay.setVisible(false);
    this.ui.overlayButton.on('pointerup', () => this.revealHumanTurn());
    this.ui.overlayLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => this.revealHumanTurn());

    this.input.on('dragstart', (_, gameObject) => {
      if (!this.canHumanAct()) {
        return;
      }
      this.draggingTileId = gameObject.getData('tileId');
      gameObject.setDepth(12);
    });
    this.input.on('drag', (_, gameObject, dragX, dragY) => {
      if (!this.canHumanAct()) {
        return;
      }
      gameObject.x = dragX;
      gameObject.y = dragY;
    });
    this.input.on('dragend', (_, gameObject, dropped) => {
      this.draggingTileId = null;
      gameObject.setDepth(0);
      if (!dropped) {
        this.render();
      }
    });
    this.input.on('drop', (_, gameObject, dropZone) => {
      if (!this.canHumanAct()) {
        return;
      }
      const tileId = gameObject.getData('tileId');
      const trainIndex = dropZone.getData('trainIndex');
      this.selectedTileId = tileId;
      this.onTrainButton(trainIndex);
    });
  }

  startMatch() {
    this.match = {
      roundIndex: 0,
      scores: Array(this.settings.totalPlayers).fill(0),
      roundsWon: Array(this.settings.totalPlayers).fill(0),
      completed: false,
      history: [],
    };
    this.startRound();
  }

  startRound() {
    const engineValue = MAX_PIP - this.match.roundIndex;
    const totalPlayers = this.settings.totalPlayers;
    const handSize = getHandSize(totalPlayers);
    const deck = shuffle(createDominoSet().filter((tile) => !(tile.a === engineValue && tile.b === engineValue)));
    const players = Array.from({ length: totalPlayers }, (_, index) => ({
      name: index < this.settings.humanPlayers ? `Player ${index + 1}` : `Bot ${index - this.settings.humanPlayers + 1}`,
      hand: [],
      isHuman: index < this.settings.humanPlayers,
      hasStartedTrain: false,
    }));

    for (let handIndex = 0; handIndex < handSize; handIndex += 1) {
      for (let playerIndex = 0; playerIndex < totalPlayers; playerIndex += 1) {
        players[playerIndex].hand.push(deck.pop());
      }
    }

    const trains = players.map((player, index) => makeTrain(`${player.name} Train`, index, false, engineValue));
    trains.push(makeTrain('Mexican Train', null, true, engineValue));

    this.state = {
      engineValue,
      players,
      trains,
      boneyard: deck,
      currentPlayer: this.match.roundIndex % totalPlayers,
      pendingDouble: null,
      extraTurnPending: false,
      roundOver: false,
      roundBlocked: false,
      winner: null,
      mustDrawBeforePass: false,
      lastRoundScores: null,
      openingPhase: this.settings.strictOpening,
      humanRevealPending: false,
      turnMessage: '',
      log: [
        `Round ${this.match.roundIndex + 1} starts with engine ${engineValue}|${engineValue}.`,
        this.settings.strictOpening
          ? 'Opening phase: each player must establish their own train before wider play unlocks.'
          : 'Free opening: players may use any eligible trains immediately.',
      ],
    };

    this.selectedTileId = null;
    this.draggingTileId = null;
    this.beginCurrentTurn();
  }

  get difficulty() {
    return DIFFICULTY_SETTINGS[this.settings.difficulty];
  }

  get currentPlayer() {
    return this.state.players[this.state.currentPlayer];
  }

  canHumanAct() {
    return Boolean(this.state)
      && !this.state.roundOver
      && this.currentPlayer.isHuman
      && !this.state.humanRevealPending;
  }

  getSelectedTile() {
    return this.currentPlayer.hand.find((tile) => tile.id === this.selectedTileId) || null;
  }

  getMexicanTrainIndex() {
    return this.state.players.length;
  }

  getRequiredTrainIndex() {
    return this.state.pendingDouble ? this.state.pendingDouble.trainIndex : null;
  }

  toggleSidebar() {
    this.ui.sidebarExpanded = !this.ui.sidebarExpanded;
    this.render();
  }

  canPlayOnTrain(playerIndex, trainIndex, tile) {
    const train = this.state.trains[trainIndex];
    const requiredTrainIndex = this.getRequiredTrainIndex();

    if (!tile) {
      return false;
    }
    if (requiredTrainIndex !== null) {
      return requiredTrainIndex === trainIndex && playableValueForTile(tile, train.endpoint) !== null;
    }
    if (this.state.openingPhase && trainIndex !== playerIndex) {
      return false;
    }
    if (!train.isMexican && train.ownerIndex !== playerIndex && !train.open) {
      return false;
    }
    return playableValueForTile(tile, train.endpoint) !== null;
  }

  getPlayableTargets(playerIndex, tile) {
    return this.state.trains
      .map((train, trainIndex) => ({ train, trainIndex }))
      .filter(({ trainIndex }) => this.canPlayOnTrain(playerIndex, trainIndex, tile));
  }

  getPlayableTiles(playerIndex) {
    return this.state.players[playerIndex].hand.filter((tile) => this.getPlayableTargets(playerIndex, tile).length > 0);
  }

  getAllLegalMoves(playerIndex) {
    const moves = [];
    for (const tile of this.state.players[playerIndex].hand) {
      for (const target of this.getPlayableTargets(playerIndex, tile)) {
        moves.push({ tileId: tile.id, tile, trainIndex: target.trainIndex });
      }
    }
    return moves;
  }

  addLog(message) {
    this.state.log.unshift(message);
    this.state.log = this.state.log.slice(0, 4);
  }

  markTrainOpen(playerIndex, open) {
    this.state.trains[playerIndex].open = open;
  }

  removeTileFromHand(playerIndex, tileId) {
    const hand = this.state.players[playerIndex].hand;
    const tileIndex = hand.findIndex((tile) => tile.id === tileId);
    if (tileIndex >= 0) {
      return hand.splice(tileIndex, 1)[0];
    }
    return null;
  }

  canCoverAfterDouble(playerIndex, tileId, trainIndex) {
    const train = this.state.trains[trainIndex];
    const endpoint = train.endpoint;
    const remaining = this.state.players[playerIndex].hand.filter((tile) => tile.id !== tileId);
    return remaining.some((tile) => playableValueForTile(tile, endpoint) !== null);
  }

  playTile(playerIndex, trainIndex, tileId) {
    const tile = this.removeTileFromHand(playerIndex, tileId);
    if (!tile) {
      return false;
    }

    const train = this.state.trains[trainIndex];
    const nextEndpoint = playableValueForTile(tile, train.endpoint);
    if (nextEndpoint === null) {
      this.state.players[playerIndex].hand.push(tile);
      return false;
    }

    this.state.extraTurnPending = false;
    train.tiles.push(cloneTile(tile));
    train.endpoint = nextEndpoint;
    if (!train.isMexican && train.ownerIndex === playerIndex) {
      train.open = false;
      this.state.players[playerIndex].hasStartedTrain = true;
    }

    const actor = this.state.players[playerIndex].name;
    this.addLog(`${actor} played ${tileLabel(tile)} on ${train.name}.`);

    if (isDouble(tile) && this.settings.doubleRule === 'cover') {
      this.state.pendingDouble = { trainIndex, value: tile.a, setter: playerIndex };
      this.state.turnMessage = `${actor} played a double and must cover it.`;
    } else if (this.state.pendingDouble && this.state.pendingDouble.trainIndex === trainIndex) {
      this.state.pendingDouble = null;
      this.state.turnMessage = `${actor} covered the double.`;
    } else if (isDouble(tile) && this.settings.doubleRule === 'extraTurn') {
      this.state.extraTurnPending = true;
      this.state.turnMessage = `${actor} played a double and earns another move.`;
    }

    if (this.state.openingPhase && this.state.players.every((player) => player.hasStartedTrain)) {
      this.state.openingPhase = false;
      this.addLog('All personal trains are started. Regular play is now open.');
      this.state.turnMessage = 'Opening phase complete. Regular play is now open.';
    }

    if (this.state.players[playerIndex].hand.length === 0) {
      this.endRound(playerIndex, false);
      return true;
    }

    return true;
  }

  scoreMove(playerIndex, move, mode) {
    const { tile, trainIndex } = move;
    const playerTrain = this.state.trains[playerIndex];
    const targetTrain = this.state.trains[trainIndex];
    let score = pipSum(tile) * (mode === 'hard' ? 3 : 2);

    if (this.state.pendingDouble) {
      score += mode === 'hard' ? 150 : 100;
    }
    if (trainIndex === playerIndex) {
      score += mode === 'hard' ? 16 : 12;
      if (playerTrain.open) {
        score += mode === 'hard' ? 18 : 12;
      }
      if (this.state.openingPhase && !this.state.players[playerIndex].hasStartedTrain) {
        score += 40;
      }
    }
    if (targetTrain.isMexican) {
      score += mode === 'easy' ? 2 : 5;
    }
    if (!targetTrain.isMexican && targetTrain.ownerIndex !== playerIndex) {
      score -= mode === 'hard' ? 7 : 4;
      if (targetTrain.open) {
        score += 2;
      }
    }
    if (isDouble(tile)) {
      if (this.settings.doubleRule === 'cover') {
        score += this.canCoverAfterDouble(playerIndex, tile.id, trainIndex) ? (mode === 'hard' ? 18 : 12) : -18;
      } else {
        score += 10;
      }
    }
    if (this.state.openingPhase && trainIndex !== playerIndex) {
      score -= 50;
    }

    const nextEndpoint = playableValueForTile(tile, targetTrain.endpoint);
    if (nextEndpoint !== null && nextEndpoint >= 9) {
      score += mode === 'hard' ? 4 : 2;
    }
    return score;
  }

  chooseBotMove(legalMoves, playerIndex) {
    if (legalMoves.length === 0) {
      return null;
    }
    if (this.difficulty.chooser === 'random') {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    const scored = legalMoves
      .map((move) => ({ move, score: this.scoreMove(playerIndex, move, this.settings.difficulty) }))
      .sort((left, right) => right.score - left.score);

    if (this.difficulty.chooser === 'top-three') {
      const shortlist = scored.slice(0, Math.min(3, scored.length));
      return shortlist[Math.floor(Math.random() * shortlist.length)].move;
    }
    return scored[0].move;
  }

  advanceTurn() {
    if (this.state.roundOver) {
      this.render();
      return;
    }
    this.state.currentPlayer = (this.state.currentPlayer + 1) % this.state.players.length;
    this.state.mustDrawBeforePass = false;
    this.state.extraTurnPending = false;
    this.selectedTileId = null;
    this.beginCurrentTurn();
  }

  beginCurrentTurn() {
    if (this.state.roundOver) {
      this.render();
      return;
    }
    const player = this.currentPlayer;
    if (player.isHuman) {
      this.state.humanRevealPending = this.settings.humanPlayers > 1;
      this.state.turnMessage = this.state.humanRevealPending ? `${player.name}'s turn. Reveal the hand when ready.` : `${player.name}'s turn.`;
      this.render();
      return;
    }

    this.state.humanRevealPending = false;
    this.state.turnMessage = `${player.name} is thinking...`;
    this.render();
    this.scheduleBots();
  }

  revealHumanTurn() {
    if (!this.state || !this.currentPlayer.isHuman) {
      return;
    }
    this.state.humanRevealPending = false;
    this.state.turnMessage = `${this.currentPlayer.name}'s turn.`;
    this.render();
  }

  drawForCurrentPlayer() {
    if (this.state.boneyard.length === 0) {
      return null;
    }
    const tile = this.state.boneyard.pop();
    this.currentPlayer.hand.push(tile);
    this.addLog(`${this.currentPlayer.name} drew ${tileLabel(tile)}.`);
    return tile;
  }

  handleUnableToPlay(playerIndex) {
    this.markTrainOpen(playerIndex, true);
    const player = this.state.players[playerIndex];
    if (this.state.openingPhase && !player.hasStartedTrain) {
      this.state.turnMessage = `${player.name} could not start their train and opened it.`;
      this.addLog(`${player.name} could not start their train and opened it.`);
      return;
    }
    if (this.state.pendingDouble) {
      this.state.turnMessage = `${player.name} could not cover the double. Their train is now open.`;
      this.addLog(`${player.name} could not cover the double and opened their train.`);
      return;
    }
    this.state.turnMessage = `${player.name} could not play and opened their train.`;
    this.addLog(`${player.name} could not play and opened their train.`);
  }

  finalizeScores() {
    const roundScores = this.state.players.map((player) => summarizeHand(player.hand));
    roundScores.forEach((score, index) => {
      this.match.scores[index] += score;
    });
    return roundScores;
  }

  endRound(winnerIndex, blocked) {
    this.state.roundOver = true;
    this.state.roundBlocked = blocked;
    this.state.winner = winnerIndex;
    this.state.lastRoundScores = this.finalizeScores();
    this.match.roundsWon[winnerIndex] += 1;
    this.match.history.unshift({
      round: this.match.roundIndex + 1,
      engineValue: this.state.engineValue,
      winnerIndex,
      blocked,
      scores: [...this.state.lastRoundScores],
    });
    this.match.history = this.match.history.slice(0, 5);

    this.state.turnMessage = blocked
      ? `${this.state.players[winnerIndex].name} had the lowest blocked hand and takes the round.`
      : `${this.state.players[winnerIndex].name} wins the round.`;
    this.addLog(blocked ? 'The round ended because the table was blocked.' : `${this.state.players[winnerIndex].name} emptied their hand.`);
    this.addLog(this.state.players.map((player, index) => `${player.name}: +${this.state.lastRoundScores[index]}`).join(' | '));

    if (this.match.roundIndex === TOTAL_ROUNDS - 1) {
      this.match.completed = true;
      const champion = this.getMatchLeaderIndex();
      this.state.turnMessage = `${this.state.players[champion].name} wins the match with ${this.match.scores[champion]} points.`;
      this.addLog(`Match complete. ${this.state.players[champion].name} finished lowest.`);
    }

    this.render();
  }

  getMatchLeaderIndex() {
    return this.match.scores
      .map((score, index) => ({ score, index, roundsWon: this.match.roundsWon[index] }))
      .sort((left, right) => left.score - right.score || right.roundsWon - left.roundsWon)[0].index;
  }

  canAnyPlayerMove() {
    return this.state.players.some((_, index) => this.getPlayableTiles(index).length > 0);
  }

  checkStalemate() {
    if (!this.state.roundOver && this.state.boneyard.length === 0 && !this.canAnyPlayerMove()) {
      const lowestScoreIndex = this.state.players
        .map((player, index) => ({ index, score: summarizeHand(player.hand) }))
        .sort((left, right) => left.score - right.score)[0].index;
      this.addLog('No legal moves remain and the boneyard is empty.');
      this.endRound(lowestScoreIndex, true);
    }
  }

  runBotTurn() {
    if (this.state.roundOver || this.currentPlayer.isHuman) {
      return;
    }

    const playerIndex = this.state.currentPlayer;
    const move = this.chooseBotMove(this.getAllLegalMoves(playerIndex), playerIndex);
    if (move) {
      this.playTile(playerIndex, move.trainIndex, move.tileId);
      this.render();
      if (this.state.roundOver) {
        return;
      }
      if (this.state.pendingDouble || this.state.extraTurnPending) {
        this.time.delayedCall(this.difficulty.thinkMs, () => this.runBotTurn());
      } else {
        this.time.delayedCall(this.difficulty.thinkMs, () => {
          this.advanceTurn();
          this.checkStalemate();
        });
      }
      return;
    }

    const drawnTile = this.drawForCurrentPlayer();
    const drawnMoves = drawnTile ? this.getAllLegalMoves(playerIndex) : [];
    const drawnMove = this.chooseBotMove(drawnMoves, playerIndex);
    if (drawnMove) {
      this.playTile(playerIndex, drawnMove.trainIndex, drawnMove.tileId);
      this.render();
      if (this.state.roundOver) {
        return;
      }
      if (this.state.pendingDouble || this.state.extraTurnPending) {
        this.time.delayedCall(this.difficulty.thinkMs, () => this.runBotTurn());
      } else {
        this.time.delayedCall(this.difficulty.thinkMs, () => {
          this.advanceTurn();
          this.checkStalemate();
        });
      }
      return;
    }

    this.handleUnableToPlay(playerIndex);
    this.render();
    this.time.delayedCall(this.difficulty.thinkMs, () => {
      this.advanceTurn();
      this.checkStalemate();
    });
  }

  scheduleBots() {
    this.time.delayedCall(this.difficulty.thinkMs, () => this.runBotTurn());
  }

  tryHumanMove(trainIndex) {
    const playerIndex = this.state.currentPlayer;
    const tile = this.getSelectedTile();
    if (!tile || !this.canPlayOnTrain(playerIndex, trainIndex, tile)) {
      this.state.turnMessage = 'That tile cannot be played on that train.';
      this.render();
      return;
    }

    this.playTile(playerIndex, trainIndex, tile.id);
    this.selectedTileId = null;
    this.render();
    if (this.state.roundOver) {
      return;
    }
    if (this.state.pendingDouble || this.state.extraTurnPending) {
      return;
    }
    this.advanceTurn();
    this.checkStalemate();
  }

  onTrainButton(trainIndex) {
    if (!this.canHumanAct()) {
      return;
    }
    this.tryHumanMove(trainIndex);
  }

  onDrawOrPass() {
    if (!this.canHumanAct()) {
      return;
    }

    const playerIndex = this.state.currentPlayer;
    if (!this.state.mustDrawBeforePass) {
      const drawnTile = this.drawForCurrentPlayer();
      this.state.mustDrawBeforePass = true;
      if (!drawnTile) {
        this.handleUnableToPlay(playerIndex);
        this.render();
        this.advanceTurn();
        this.checkStalemate();
        return;
      }
      this.state.turnMessage = this.state.openingPhase && !this.currentPlayer.hasStartedTrain
        ? 'You drew a tile. You still need to start your own train if possible.'
        : 'You drew a tile. Play it if you can, or click Draw / Pass again to open your train.';
      this.selectedTileId = drawnTile.id;
      this.render();
      return;
    }

    if (this.getPlayableTiles(playerIndex).length > 0) {
      this.state.turnMessage = 'You still have a legal play available.';
      this.render();
      return;
    }

    this.handleUnableToPlay(playerIndex);
    this.render();
    this.advanceTurn();
    this.checkStalemate();
  }

  onAdvanceButton() {
    if (!this.state || !this.state.roundOver) {
      return;
    }
    if (this.match.completed) {
      this.scene.start('title-screen', { settings: this.settings });
      return;
    }
    this.match.roundIndex += 1;
    this.startRound();
  }

  renderBoard() {
    this.ui.boardGroup.clear(true, true);
    const center = { x: 760, y: 305 };
    const anchors = getTrainAnchors(this.settings.totalPlayers);
    const mexicanAnchor = { x: 760, y: 515, align: 'center' };
    const trainAnchors = [...anchors, mexicanAnchor];

    const centerRing = this.add.circle(center.x, center.y, 76, 0xf6ecdc).setStrokeStyle(3, UI_COLORS.accent, 0.4);
    const engineTile = createDominoSprite(this, { a: this.state.engineValue, b: this.state.engineValue }, center.x, center.y, {
      vertical: true,
      faceUp: true,
    });
    this.ui.boardGroup.addMultiple([centerRing, engineTile]);

    trainAnchors.forEach((anchor, trainIndex) => {
      const train = this.state.trains[trainIndex];
      const dx = anchor.x - center.x;
      const dy = anchor.y - center.y;
      const distance = Math.sqrt((dx * dx) + (dy * dy));
      const ux = dx / distance;
      const uy = dy / distance;
      const selectedTile = this.getSelectedTile();
      const enabled = this.canHumanAct() && selectedTile && this.canPlayOnTrain(this.state.currentPlayer, trainIndex, selectedTile);
      const lineColor = enabled ? UI_COLORS.selected : (train.open || train.isMexican ? UI_COLORS.open : UI_COLORS.closed);
      const rail = this.add.line(0, 0, center.x, center.y, anchor.x, anchor.y, lineColor, 0.42).setLineWidth(5, 5);
      const endpoint = this.add.circle(anchor.x, anchor.y, 28, enabled ? 0xfff5db : 0xffffff).setStrokeStyle(3, lineColor, 1);
      endpoint.setInteractive({ useHandCursor: true });
      endpoint.on('pointerup', () => this.onTrainButton(trainIndex));
      const zone = this.add.zone(anchor.x - 50, anchor.y - 34, 100, 68).setOrigin(0, 0).setRectangleDropZone(100, 68);
      zone.setData('trainIndex', trainIndex);

      const labelLines = [train.name, `End ${train.endpoint} | ${train.isMexican ? 'public' : (train.open ? 'open' : 'closed')}`];
      if (this.state.openingPhase && !train.isMexican && !this.state.players[train.ownerIndex].hasStartedTrain) {
        labelLines.push('not started');
      }
      if (this.state.pendingDouble && this.state.pendingDouble.trainIndex === trainIndex) {
        labelLines.push('cover required');
      }
      const labelX = anchor.align === 'left' ? anchor.x - 85 : (anchor.align === 'right' ? anchor.x + 85 : anchor.x);
      const label = this.add.text(labelX, anchor.y - 10, labelLines.join('\n'), {
        fontFamily: 'Georgia',
        fontSize: '14px',
        color: UI_COLORS.ink,
        align: anchor.align === 'left' ? 'right' : (anchor.align === 'right' ? 'left' : 'center'),
      }).setOrigin(anchor.align === 'left' ? 1 : (anchor.align === 'right' ? 0 : 0.5), 0.5);

      this.ui.boardGroup.addMultiple([rail, endpoint, zone, label]);

      const visibleTiles = train.tiles.slice(-4);
      const startDistance = Math.max(110, distance - ((visibleTiles.length - 1) * 72) - 48);
      visibleTiles.forEach((tile, tileIndex) => {
        const offset = startDistance + (tileIndex * 72);
        const tileSprite = createDominoSprite(this, tile, center.x + (ux * offset), center.y + (uy * offset), {
          vertical: Math.abs(uy) > Math.abs(ux) || isDouble(tile),
          faceUp: true,
          highlight: this.state.pendingDouble && this.state.pendingDouble.trainIndex === trainIndex && tileIndex === visibleTiles.length - 1 && isDouble(tile),
        });
        this.ui.boardGroup.add(tileSprite);
      });
    });
  }

  renderHand() {
    this.ui.handGroup.clear(true, true);
    if (this.state.roundOver) {
      this.ui.handTitle.setText('Round complete');
      this.ui.handHint.setText('Use Next to continue, or return to the title screen after the match.');
      return;
    }
    if (!this.currentPlayer.isHuman) {
      this.ui.handTitle.setText('Bot turn');
      this.ui.handHint.setText(`${this.currentPlayer.name} is evaluating moves at ${DIFFICULTY_SETTINGS[this.settings.difficulty].label.toLowerCase()} difficulty.`);
      return;
    }
    if (this.state.humanRevealPending) {
      this.ui.handTitle.setText('Hand hidden');
      this.ui.handHint.setText('Reveal the hand when the next player is ready.');
      return;
    }

    this.ui.handTitle.setText(`${this.currentPlayer.name} Hand`);
    this.ui.handHint.setText('Drag a domino onto a train endpoint, or click a domino and then click an endpoint.');
    const hand = [...this.currentPlayer.hand].sort((left, right) => pipSum(right) - pipSum(left) || right.a - left.a);
    hand.forEach((tile, index) => {
      const column = index % 8;
      const row = Math.floor(index / 8);
      const x = 392 + (column * 102);
      const y = 654 + (row * 64);
      const playable = this.getPlayableTargets(this.state.currentPlayer, tile).length > 0;
      const selected = tile.id === this.selectedTileId;
      const domino = createDominoSprite(this, tile, x, y, {
        vertical: false,
        faceUp: true,
        highlight: selected || playable,
        tileId: tile.id,
        interactive: true,
      });
      domino.list[1].setFillStyle(selected ? UI_COLORS.selected : (playable ? UI_COLORS.playable : UI_COLORS.muted), 1);
      this.input.setDraggable(domino, true);
      domino.on('pointerup', () => {
        if (!this.canHumanAct() || this.draggingTileId === tile.id) {
          return;
        }
        this.selectedTileId = this.selectedTileId === tile.id ? null : tile.id;
        this.render();
      });
      this.ui.handGroup.add(domino);
    });
  }

  renderScoreboard() {
    const openingText = this.state.openingPhase ? 'Opening phase active' : 'Regular play';
    const lines = [
      'Match Scoreboard',
      `Difficulty: ${DIFFICULTY_SETTINGS[this.settings.difficulty].label}`,
      `Double: ${DOUBLE_RULE_SETTINGS[this.settings.doubleRule].label}`,
      `Mode: ${this.settings.humanPlayers} human / ${this.settings.totalPlayers - this.settings.humanPlayers} bot`,
      `State: ${openingText}`,
    ];
    this.state.players.forEach((player, index) => {
      lines.push(`${player.name}: ${this.match.scores[index]} total, ${this.match.roundsWon[index]} rounds won`);
    });
    if (this.state.lastRoundScores) {
      lines.push('Last Round:');
      this.state.players.forEach((player, index) => {
        lines.push(`${player.name}: +${this.state.lastRoundScores[index]}`);
      });
    }
    this.ui.scoreboard.setText(lines.join('\n'));
  }

  renderPlayerSummary() {
    const lines = ['Player Trains'];
    this.state.players.forEach((player, index) => {
      const train = this.state.trains[index];
      const shortName = player.name.replace('Player ', 'P').replace('Bot ', 'B');
      const openFlag = train.open ? 'O' : 'C';
      const startFlag = player.hasStartedTrain ? 'S' : 'N';
      lines.push(`${shortName}: hand ${player.hand.length}, end ${train.endpoint}, ${openFlag}, ${startFlag}`);
    });
    lines.push(`Mexican: end ${this.state.trains[this.getMexicanTrainIndex()].endpoint}`);
    lines.push(`Yard: ${this.state.boneyard.length}`);
    this.ui.playerSummary.setText(lines.join('\n'));
  }

  renderStatus() {
    const pendingText = this.state.pendingDouble ? ` Pending double on ${this.state.trains[this.state.pendingDouble.trainIndex].name}.` : '';
    const openingHint = this.state.openingPhase ? ' During the opening phase, players may only work on their own trains.' : '';
    this.ui.roundMeta.setText(`Round ${this.match.roundIndex + 1} of ${TOTAL_ROUNDS} | Engine ${this.state.engineValue}|${this.state.engineValue}`);
    this.ui.status.setText(`${this.state.turnMessage}${pendingText}${openingHint}`);
    this.ui.boardHint.setText(this.state.openingPhase
      ? 'Each player must establish their personal train before shared and open-train play begins.'
      : 'The Mexican Train is always public. Open trains may be used by any player.');
    this.ui.log.setText(this.state.log.join('\n'));
    this.ui.historyText.setText(this.match.history.length > 0
      ? this.match.history.map((entry) => `R${entry.round}: ${this.state.players[entry.winnerIndex]?.name || `P${entry.winnerIndex + 1}`} ${entry.blocked ? 'blocked' : 'out'} + ${entry.scores.join('/')}`).join('\n')
      : 'No completed rounds yet.');

    this.ui.drawButton.setFillStyle(this.canHumanAct() ? UI_COLORS.accentAlt : UI_COLORS.disabled, 1);
    this.ui.advanceButton.setFillStyle(this.state.roundOver ? UI_COLORS.accent : UI_COLORS.disabled, 1);
    this.ui.advanceLabel.setText(this.match.completed ? 'Finish' : 'Next');
    this.ui.sidebarToggleLabel.setText(this.ui.sidebarExpanded ? 'Hide' : 'Show');

    this.ui.scoreboard.setVisible(this.ui.sidebarExpanded);
    this.ui.playerSummary.setVisible(this.ui.sidebarExpanded);
    this.ui.log.setVisible(this.ui.sidebarExpanded);
    this.ui.historyPanel.setVisible(this.ui.sidebarExpanded);
    this.ui.historyText.setVisible(this.ui.sidebarExpanded);

    const overlayVisible = this.currentPlayer.isHuman && this.state.humanRevealPending && !this.state.roundOver;
    this.ui.overlay.setVisible(overlayVisible);
    if (overlayVisible) {
      this.ui.overlayTitle.setText(`${this.currentPlayer.name}'s Turn`);
      this.ui.overlayBody.setText('Hands are hidden between human players.\nReveal the hand when this player is ready.');
    }
  }

  render() {
    if (!this.state) {
      return;
    }
    this.renderStatus();
    this.renderScoreboard();
    this.renderPlayerSummary();
    this.renderBoard();
    this.renderHand();
  }
}