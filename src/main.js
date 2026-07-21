import { UI_COLORS } from './config/gameConfig.js';
import { TitleScene } from './scenes/TitleScene.js';
import { MexicanTrainScene } from './scenes/MexicanTrainScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  backgroundColor: `#${UI_COLORS.table.toString(16).padStart(6, '0')}`,
  scene: [TitleScene, MexicanTrainScene],
};

new Phaser.Game(config);
