import {
  DEFAULT_SETTINGS,
  DIFFICULTY_SETTINGS,
  DOUBLE_RULE_SETTINGS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  UI_COLORS,
} from '../config/gameConfig.js';
import {
  clamp,
  isDouble,
} from '../utils/dominoes.js';
import {
  canAnyPlayerMove,
  canPlayOnTrain,
  chooseBotMove,
  createMatchState,
  createRoundState,
  drawForCurrentPlayer,
  finalizeScores,
  getAllLegalMoves,
  getMatchLeaderIndex,
  getMexicanTrainIndex,
  getPlayableTargets,
  getPlayableTiles,
  handleUnableToPlay,
  normalizeSettings,
  playTile,
} from '../state/gameState.js';
import {
  renderBoard,
  renderHand,
  renderPlayerSummary,
  renderScoreboard,
  renderStatus,
} from '../render/gameSceneRenderers.js';

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
    this.settings = normalizeSettings({ ...DEFAULT_SETTINGS, ...(data?.settings || {}) });
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
    this.match = createMatchState(this.settings);
    this.startRound();
  }

  startRound() {
    this.state = createRoundState(this.match, this.settings);

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
    return getMexicanTrainIndex(this.state);
  }

  getRequiredTrainIndex() {
    return this.state.pendingDouble ? this.state.pendingDouble.trainIndex : null;
  }

  toggleSidebar() {
    this.ui.sidebarExpanded = !this.ui.sidebarExpanded;
    this.render();
  }

  canPlayOnTrain(playerIndex, trainIndex, tile) {
    return canPlayOnTrain(this.state, playerIndex, trainIndex, tile);
  }

  getPlayableTargets(playerIndex, tile) {
    return getPlayableTargets(this.state, playerIndex, tile);
  }

  getPlayableTiles(playerIndex) {
    return getPlayableTiles(this.state, playerIndex);
  }

  getAllLegalMoves(playerIndex) {
    return getAllLegalMoves(this.state, playerIndex);
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
    return drawForCurrentPlayer(this.state);
  }

  handleUnableToPlay(playerIndex) {
    handleUnableToPlay(this.state, playerIndex);
  }

  finalizeScores() {
    return finalizeScores(this.state, this.match);
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
    return getMatchLeaderIndex(this.match);
  }

  canAnyPlayerMove() {
    return canAnyPlayerMove(this.state);
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
    const move = chooseBotMove(this.state, this.settings, playerIndex);
    if (move) {
      const result = playTile(this.state, this.settings, playerIndex, move.trainIndex, move.tileId);
      this.render();
      if (this.state.roundOver) {
        return;
      }
      if (this.state.players[playerIndex].hand.length === 0) {
        this.endRound(playerIndex, false);
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
    const drawnMove = drawnTile ? chooseBotMove(this.state, this.settings, playerIndex) : null;
    if (drawnMove) {
      playTile(this.state, this.settings, playerIndex, drawnMove.trainIndex, drawnMove.tileId);
      this.render();
      if (this.state.roundOver) {
        return;
      }
      if (this.state.players[playerIndex].hand.length === 0) {
        this.endRound(playerIndex, false);
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

    playTile(this.state, this.settings, playerIndex, trainIndex, tile.id);
    this.selectedTileId = null;
    this.render();
    if (this.state.players[playerIndex].hand.length === 0) {
      this.endRound(playerIndex, false);
      return;
    }
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

  renderBoard() { renderBoard(this); }

  renderHand() { renderHand(this); }

  renderScoreboard() { renderScoreboard(this); }

  renderPlayerSummary() { renderPlayerSummary(this); }

  renderStatus() { renderStatus(this); }

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