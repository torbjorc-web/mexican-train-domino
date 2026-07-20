import {
  DEFAULT_SETTINGS,
  DIFFICULTY_SETTINGS,
  DOUBLE_RULE_SETTINGS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  UI_COLORS,
} from '../config/gameConfig.js';
import { clamp } from '../utils/dominoes.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title-screen');
    this.settings = { ...DEFAULT_SETTINGS };
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
    this.add.rectangle(640, 360, 1240, 700, UI_COLORS.panel).setStrokeStyle(3, UI_COLORS.accent, 0.35);
    this.add.text(640, 88, 'Mexican Train Dominoes', {
      fontFamily: 'Georgia',
      fontSize: '40px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.add.text(640, 145, 'Pass-and-play setup with configurable human players, rules, and bot difficulty.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
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

    this.ui.humanPlayers = this.createSelector(340, 'Human Players', () => `${this.settings.humanPlayers}`, () => {
      this.settings.humanPlayers = this.settings.humanPlayers === 1 ? this.settings.totalPlayers : this.settings.humanPlayers - 1;
      this.refreshSelectors();
    }, () => {
      this.settings.humanPlayers = this.settings.humanPlayers === this.settings.totalPlayers ? 1 : this.settings.humanPlayers + 1;
      this.refreshSelectors();
    });

    this.ui.difficulty = this.createSelector(430, 'Bot Difficulty', () => DIFFICULTY_SETTINGS[this.settings.difficulty].label, () => {
      this.settings.difficulty = this.getAdjacentDifficulty(-1);
      this.refreshSelectors();
    }, () => {
      this.settings.difficulty = this.getAdjacentDifficulty(1);
      this.refreshSelectors();
    });

    this.ui.strictOpening = this.createSelector(520, 'Opening Rule', () => (this.settings.strictOpening ? 'Strict Start' : 'Free Start'), () => {
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

    this.ui.summary = this.add.text(1010, 455, '', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: UI_COLORS.ink,
      align: 'left',
      wordWrap: { width: 360 },
      lineSpacing: 4,
    }).setOrigin(0.5, 0.5);

    const startButton = this.add.rectangle(640, 670, 280, 64, UI_COLORS.accent)
      .setStrokeStyle(2, 0x7c2914, 1)
      .setInteractive({ useHandCursor: true });
    const startLabel = this.add.text(640, 670, 'Start Match', {
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
    this.add.text(430, y, label, {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    const left = this.add.rectangle(485, y, 50, 50, UI_COLORS.panelDark)
      .setStrokeStyle(2, UI_COLORS.accent, 1)
      .setInteractive({ useHandCursor: true });
    const right = this.add.rectangle(795, y, 50, 50, UI_COLORS.panelDark)
      .setStrokeStyle(2, UI_COLORS.accent, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(485, y, '<', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true }).on('pointerup', onPrev);
    this.add.text(795, y, '>', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: UI_COLORS.ink,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true }).on('pointerup', onNext);
    this.add.rectangle(640, y, 250, 56, UI_COLORS.playable).setStrokeStyle(2, UI_COLORS.accentAlt, 1);
    const valueText = this.add.text(640, y, '', {
      fontFamily: 'Georgia',
      fontSize: '24px',
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
    const botCount = this.settings.totalPlayers - this.settings.humanPlayers;
    this.ui.summary.setText([
      `${this.settings.humanPlayers} human ${this.settings.humanPlayers === 1 ? 'player' : 'players'} and ${botCount} ${botCount === 1 ? 'bot' : 'bots'}.`,
      `Opening rule: ${this.settings.strictOpening ? 'everyone starts their own train first' : 'free opening on any eligible train'}.`,
      `Double rule: ${DOUBLE_RULE_SETTINGS[this.settings.doubleRule].label.toLowerCase()}.`,
      `Bots use the ${DIFFICULTY_SETTINGS[this.settings.difficulty].label.toLowerCase()} heuristic set.`,
    ].join('\n'));
  }
}