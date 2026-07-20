import {
  getNextTrainColorKey,
  getTrainColorLabel,
  normalizeHumanTrainColors,
} from '../config/trainColors.js?v=2';
import { UI_COLORS } from '../config/gameConfig.js';

export function createTrainColorSelector(scene, y, index) {
  const container = scene.add.container(905, y);
  const label = scene.add.text(-145, 0, `Player ${index + 1}`, {
    fontFamily: 'Georgia',
    fontSize: '16px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(1, 0.5);
  const left = scene.add.rectangle(-100, 0, 34, 34, UI_COLORS.panelDark)
    .setStrokeStyle(2, UI_COLORS.accent, 1)
    .setInteractive({ useHandCursor: true });
  const leftText = scene.add.text(-100, 0, '<', {
    fontFamily: 'Georgia',
    fontSize: '22px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
  const valueBox = scene.add.rectangle(10, 0, 170, 38, UI_COLORS.playable)
    .setStrokeStyle(2, UI_COLORS.accentAlt, 1);
  const valueText = scene.add.text(10, 0, '', {
    fontFamily: 'Georgia',
    fontSize: '16px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5);
  const right = scene.add.rectangle(112, 0, 34, 34, UI_COLORS.panelDark)
    .setStrokeStyle(2, UI_COLORS.accent, 1)
    .setInteractive({ useHandCursor: true });
  const rightText = scene.add.text(112, 0, '>', {
    fontFamily: 'Georgia',
    fontSize: '22px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

  const onPrev = () => {
    scene.settings.humanTrainColors[index] = getNextTrainColorKey(scene.settings.humanTrainColors, index, -1);
    scene.refreshSelectors();
  };
  const onNext = () => {
    scene.settings.humanTrainColors[index] = getNextTrainColorKey(scene.settings.humanTrainColors, index, 1);
    scene.refreshSelectors();
  };

  leftText.on('pointerup', onPrev);
  rightText.on('pointerup', onNext);
  left.on('pointerup', onPrev);
  right.on('pointerup', onNext);
  valueText.setInteractive({ useHandCursor: true }).on('pointerup', onNext);

  container.add([label, left, leftText, valueBox, valueText, right, rightText]);

  return { container, label, left, leftText, valueBox, valueText, right, rightText };
}

export function refreshTrainColorSelectors(scene) {
  scene.settings.humanTrainColors = normalizeHumanTrainColors(scene.settings.humanTrainColors, scene.settings.humanPlayers);
  scene.ui.trainColorHeader.setVisible(scene.settings.humanPlayers > 0);
  scene.ui.trainColorSelectors.forEach((selector, index) => {
    const visible = index < scene.settings.humanPlayers;
    selector.container.setVisible(visible);
    if (visible) {
      selector.valueText.setText(getTrainColorLabel(scene.settings.humanTrainColors[index]));
    }
  });
}