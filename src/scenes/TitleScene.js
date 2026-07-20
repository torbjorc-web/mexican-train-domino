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
    this.add.text(640, 145, 'Pass-and-play setup with configurable human players, rules, and bot difficulty.', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: UI_COLORS.ink,
    }).setOrigin(0.5, 0.5);

    this.ui.totalPlayers = this.createSelector(250, 'Total Players', () => `${this.settings.totalPlayers}`, () => {
      this.settings.totalPlayers = this.settings.totalPlayers === MIN_PLAYERS ? MAX_PLAYERS : this.settings.totalPlayers - 1;
      this.settings.humanPlayers = clamp(this.settings.humanPlayers, 1, this.settings.totalPlayers);
      this.refreshSelectors();
    }, () => {
      this.settings.totalPlayers = this.settings.totalPlayers === MAX_PLAYERS ? MIN_PLAYERS : this.settings.totalPlayers + 1;
      this.settings.humanPlayers = clamp(this.settings.humanPlayers, 1, this.settings.totalPlayers);
      this.refreshSelectors();
    });

    this.ui.humanPlayers = this.createSelector(338, 'Human Players', () => `${this.settings.humanPlayers}`, () => {
      this.settings.humanPlayers = this.settings.humanPlayers === 1 ? this.settings.totalPlayers : this.settings.humanPlayers - 1;
      this.refreshSelectors();
    }, () => {
      this.settings.humanPlayers = this.settings.humanPlayers === this.settings.totalPlayers ? 1 : this.settings.humanPlayers + 1;
      this.refreshSelectors();
    });

    this.ui.difficulty = this.createSelector(426, 'Bot Difficulty', () => DIFFICULTY_SETTINGS[this.settings.difficulty].label, () => {
      this.settings.difficulty = this.getAdjacentDifficulty(-1);
      this.refreshSelectors();
    }, () => {
      this.settings.difficulty = this.getAdjacentDifficulty(1);
      this.refreshSelectors();
    });

    this.ui.strictOpening = this.createSelector(514, 'Opening Rule', () => (this.settings.strictOpening ? 'Strict Start' : 'Free Start'), () => {
      this.settings.strictOpening = !this.settings.strictOpening;
      this.refreshSelectors();
    }, () => {
      this.settings.strictOpening = !this.settings.strictOpening;
      this.refreshSelectors();
    });

    this.ui.doubleRule = this.createSelector(602, 'Double Rule', () => DOUBLE_RULE_SETTINGS[this.settings.doubleRule].label, () => {
      this.settings.doubleRule = this.settings.doubleRule === 'cover' ? 'extraTurn' : 'cover';
      this.refreshSelectors();
    }, () => {
      this.settings.doubleRule = this.settings.doubleRule === 'cover' ? 'extraTurn' : 'cover';
      this.refreshSelectors();
    });

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

    const startButton = this.add.rectangle(640, 668, 280, 64, UI_COLORS.accent)
      .setStrokeStyle(2, 0x7c2914, 1)
      .setInteractive({ useHandCursor: true });
    const startLabel = this.add.text(640, 668, 'Start Match', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    startButton.on('pointerup', () => {
      this.scene.start('mexican-train', { settings: { ...this.settings } });
    });
    startLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.scene.start('mexican-train', { settings: { ...this.settings } });
    });

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

  refreshSelectors() {
    this.ui.totalPlayers.valueText.setText(this.ui.totalPlayers.getValue());
    this.ui.humanPlayers.valueText.setText(this.ui.humanPlayers.getValue());
    this.ui.difficulty.valueText.setText(this.ui.difficulty.getValue());
    this.ui.strictOpening.valueText.setText(this.ui.strictOpening.getValue());
    this.ui.doubleRule.valueText.setText(this.ui.doubleRule.getValue());
    refreshTrainColorSelectors(this);
    refreshPlayerNameSelectors(this);

    const highScores = loadHighScores();
    this.ui.highScoreText.setText(highScores.length > 0
      ? highScores.slice(0, 5).map((entry, index) => formatHighScoreEntry(entry, index)).join('\n')
      : 'No stored high scores yet.');
  }
}