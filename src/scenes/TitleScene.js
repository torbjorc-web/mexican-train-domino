import {
  DEFAULT_SETTINGS,
  DIFFICULTY_SETTINGS,
  DOUBLE_RULE_SETTINGS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  UI_COLORS,
} from '../config/gameConfig.js';
import { formatHighScoreEntry, loadHighScores } from '../state/highScoreStore.js';
import { normalizeSettings } from '../state/gameState.js?v=2';
import { clamp } from '../utils/dominoes.js';
import { createTrainColorSelector, refreshTrainColorSelectors } from './titleTrainColorControls.js?v=2';
import { createPlayerNameSelector, refreshPlayerNameSelectors } from './titlePlayerNameControls.js?v=2';

const GAME_MODES = ['local', 'onlineHost', 'onlineJoin'];
const GAME_MODE_LABELS = {
  local: 'Local Pass-and-Play',
  onlineHost: 'Online Host (PartyKit)',
  onlineJoin: 'Online Join (PartyKit)',
};

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title-screen');
    this.settings = { ...DEFAULT_SETTINGS };
    this.ui = {};
  }

  init(data) {
    this.settings = normalizeSettings({ ...DEFAULT_SETTINGS, ...(data?.settings || {}) });
  }

  create() {
    this.cameras.main.setBackgroundColor(UI_COLORS.table);
    this.add.rectangle(640, 360, 1240, 700, UI_COLORS.panel).setStrokeStyle(3, UI_COLORS.accent, 0.35);
    this.add.text(640, 88, 'Mexican Train Dominoes', {
      fontFamily: 'Georgia',
      fontSize: '36px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.add.text(640, 145, 'Local or PartyKit online setup with configurable rules, players, and bot difficulty.', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: UI_COLORS.ink,
    }).setOrigin(0.5, 0.5);

    this.ui.gameMode = this.createSelector(250, 'Game Mode', () => GAME_MODE_LABELS[this.settings.gameMode], () => {
      this.settings.gameMode = this.getAdjacentGameMode(-1);
      this.applyModeConstraints();
      this.refreshSelectors();
    }, () => {
      this.settings.gameMode = this.getAdjacentGameMode(1);
      this.applyModeConstraints();
      this.refreshSelectors();
    });

    this.ui.totalPlayers = this.createSelector(322, 'Total Players', () => `${this.settings.totalPlayers}`, () => {
      this.settings.totalPlayers = this.settings.totalPlayers === MIN_PLAYERS ? MAX_PLAYERS : this.settings.totalPlayers - 1;
      this.settings.humanPlayers = clamp(this.settings.humanPlayers, 1, this.settings.totalPlayers);
      this.refreshSelectors();
    }, () => {
      this.settings.totalPlayers = this.settings.totalPlayers === MAX_PLAYERS ? MIN_PLAYERS : this.settings.totalPlayers + 1;
      this.settings.humanPlayers = clamp(this.settings.humanPlayers, 1, this.settings.totalPlayers);
      this.refreshSelectors();
    });

    this.ui.humanPlayers = this.createSelector(394, 'Human Players', () => `${this.settings.humanPlayers}`, () => {
      this.settings.humanPlayers = this.settings.humanPlayers === 1 ? this.settings.totalPlayers : this.settings.humanPlayers - 1;
      this.refreshSelectors();
    }, () => {
      this.settings.humanPlayers = this.settings.humanPlayers === this.settings.totalPlayers ? 1 : this.settings.humanPlayers + 1;
      this.refreshSelectors();
    });

    this.ui.difficulty = this.createSelector(466, 'Bot Difficulty', () => DIFFICULTY_SETTINGS[this.settings.difficulty].label, () => {
      this.settings.difficulty = this.getAdjacentDifficulty(-1);
      this.refreshSelectors();
    }, () => {
      this.settings.difficulty = this.getAdjacentDifficulty(1);
      this.refreshSelectors();
    });

    this.ui.strictOpening = this.createSelector(538, 'Opening Rule', () => (this.settings.strictOpening ? 'Strict Start' : 'Free Start'), () => {
      this.settings.strictOpening = !this.settings.strictOpening;
      this.refreshSelectors();
    }, () => {
      this.settings.strictOpening = !this.settings.strictOpening;
      this.refreshSelectors();
    });

    this.ui.doubleRule = this.createSelector(610, 'Double Rule', () => DOUBLE_RULE_SETTINGS[this.settings.doubleRule].label, () => {
      this.settings.doubleRule = this.settings.doubleRule === 'cover' ? 'extraTurn' : 'cover';
      this.refreshSelectors();
    }, () => {
      this.settings.doubleRule = this.settings.doubleRule === 'cover' ? 'extraTurn' : 'cover';
      this.refreshSelectors();
    });

    this.ui.onlineSetupButton = this.add.rectangle(640, 636, 220, 46, UI_COLORS.panelDark)
      .setStrokeStyle(2, UI_COLORS.accent, 1)
      .setInteractive({ useHandCursor: true });
    this.ui.onlineSetupLabel = this.add.text(640, 636, 'Online Setup', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.ui.onlineSetupButton.on('pointerup', () => this.configureOnlineSettings());
    this.ui.onlineSetupLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => this.configureOnlineSettings());

    this.ui.trainColorHeader = this.add.text(1095, 190, 'Train Colors', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.ui.trainColorSelectors = Array.from({ length: MAX_PLAYERS }, (_, index) => createTrainColorSelector(this, 296 + (index * 44), index));

    this.ui.playerNameHeader = this.add.text(1095, 430, 'Player Names', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.ui.playerNameHeader.setVisible(false);

    this.ui.playerNameSelectors = Array.from({ length: MAX_PLAYERS }, (_, index) => createPlayerNameSelector(this, 296 + (index * 44), index));

    this.ui.highScoreHeader = this.add.text(1105, 628, 'High Scores', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.ui.highScoreText = this.add.text(1105, 654, '', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: UI_COLORS.ink,
      align: 'left',
      wordWrap: { width: 280 },
      lineSpacing: 2,
    }).setOrigin(0.5, 0);

    const startButton = this.add.rectangle(640, 682, 280, 64, UI_COLORS.accent)
      .setStrokeStyle(2, 0x7c2914, 1)
      .setInteractive({ useHandCursor: true });
    const startLabel = this.add.text(640, 682, 'Start Match', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    startButton.on('pointerup', () => {
      if (!this.prepareSettingsForStart()) {
        return;
      }
      this.scene.start('mexican-train', { settings: { ...this.settings } });
    });
    startLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      if (!this.prepareSettingsForStart()) {
        return;
      }
      this.scene.start('mexican-train', { settings: { ...this.settings } });
    });

    this.applyModeConstraints();
    this.refreshSelectors();
  }

  createSelector(y, label, getValue, onPrev, onNext) {
    this.add.text(400, y, label, {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    const left = this.add.rectangle(470, y, 46, 46, UI_COLORS.panelDark)
      .setStrokeStyle(2, UI_COLORS.accent, 1)
      .setInteractive({ useHandCursor: true });
    const right = this.add.rectangle(770, y, 46, 46, UI_COLORS.panelDark)
      .setStrokeStyle(2, UI_COLORS.accent, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(470, y, '<', {
      fontFamily: 'Georgia',
      fontSize: '26px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true }).on('pointerup', onPrev);
    this.add.text(770, y, '>', {
      fontFamily: 'Georgia',
      fontSize: '26px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true }).on('pointerup', onNext);
    this.add.rectangle(620, y, 220, 52, UI_COLORS.playable).setStrokeStyle(2, UI_COLORS.accentAlt, 1);
    const valueText = this.add.text(640, y, '', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: UI_COLORS.ink,
    }).setOrigin(0.5, 0.5);
    left.on('pointerup', onPrev);
    right.on('pointerup', onNext);
    return { valueText, getValue };
  }

  getAdjacentDifficulty(direction) {
    const keys = Object.keys(DIFFICULTY_SETTINGS);
    const currentIndex = keys.indexOf(this.settings.difficulty);
    return keys[(currentIndex + direction + keys.length) % keys.length];
  }

  getAdjacentGameMode(direction) {
    const currentIndex = GAME_MODES.indexOf(this.settings.gameMode);
    return GAME_MODES[(currentIndex + direction + GAME_MODES.length) % GAME_MODES.length];
  }

  applyModeConstraints() {
    if (this.settings.gameMode === 'local') {
      return;
    }
    this.settings.totalPlayers = clamp(this.settings.totalPlayers, MIN_PLAYERS, MAX_PLAYERS);
    this.settings.humanPlayers = this.settings.totalPlayers;
    this.settings.humanPlayerNames = normalizeSettings(this.settings).humanPlayerNames;
    if (this.settings.gameMode === 'onlineHost') {
      this.settings.humanPlayerNames[0] = this.settings.onlinePlayerName || 'Host';
    }
  }

  configureOnlineSettings() {
    if (this.settings.gameMode === 'local') {
      return;
    }

    const currentHost = this.settings.onlinePartyKitHost || 'your-project.your-account.partykit.dev';
    const host = window.prompt('PartyKit host (without https://)', currentHost);
    if (host === null) {
      return;
    }

    const currentRoom = this.settings.onlineRoomCode || 'hyttedomino';
    const room = window.prompt('Room code', currentRoom);
    if (room === null) {
      return;
    }

    const defaultName = this.settings.gameMode === 'onlineHost' ? 'Host' : 'Guest';
    const currentName = this.settings.onlinePlayerName || defaultName;
    const playerName = window.prompt('Your player name', currentName);
    if (playerName === null) {
      return;
    }

    this.settings.onlinePartyKitHost = host.trim();
    this.settings.onlineRoomCode = room.trim();
    this.settings.onlinePlayerName = playerName.trim() || defaultName;
    this.applyModeConstraints();
    this.refreshSelectors();
  }

  prepareSettingsForStart() {
    this.applyModeConstraints();
    if (this.settings.gameMode === 'local') {
      return true;
    }

    if (!this.settings.onlinePartyKitHost || !this.settings.onlineRoomCode) {
      this.configureOnlineSettings();
    }
    return Boolean(this.settings.onlinePartyKitHost && this.settings.onlineRoomCode);
  }

  refreshSelectors() {
    this.applyModeConstraints();
    this.ui.gameMode.valueText.setText(this.ui.gameMode.getValue());
    this.ui.totalPlayers.valueText.setText(this.ui.totalPlayers.getValue());
    this.ui.humanPlayers.valueText.setText(this.ui.humanPlayers.getValue());
    this.ui.difficulty.valueText.setText(this.ui.difficulty.getValue());
    this.ui.strictOpening.valueText.setText(this.ui.strictOpening.getValue());
    this.ui.doubleRule.valueText.setText(this.ui.doubleRule.getValue());
    this.ui.onlineSetupButton.setVisible(this.settings.gameMode !== 'local');
    this.ui.onlineSetupLabel.setVisible(this.settings.gameMode !== 'local');
    refreshTrainColorSelectors(this);
    refreshPlayerNameSelectors(this);

    const highScores = loadHighScores();
    this.ui.highScoreText.setText(highScores.length > 0
      ? highScores.slice(0, 5).map((entry, index) => formatHighScoreEntry(entry, index)).join('\n')
      : 'No stored high scores yet.');
  }
}