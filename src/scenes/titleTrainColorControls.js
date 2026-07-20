import {
  getNextTrainColorKey,
  getTrainColorLabel,
  normalizeHumanTrainColors,
} from '../config/trainColors.js';
import { UI_COLORS } from '../config/gameConfig.js';

export function createTrainColorSelector(scene, y, index) {
  const label = scene.add.text(905, y, `Player ${index + 1}`, {
    fontFamily: 'Georgia',
    fontSize: '16px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(1, 0.5);
  const left = scene.add.rectangle(950, y, 34, 34, UI_COLORS.panelDark)
    .setStrokeStyle(2, UI_COLORS.accent, 1)
    .setInteractive({ useHandCursor: true });
  const valueBox = scene.add.rectangle(1055, y, 170, 38, UI_COLORS.playable)
    .setStrokeStyle(2, UI_COLORS.accentAlt, 1);
  const valueText = scene.add.text(1055, y, '', {
    fontFamily: 'Georgia',
    fontSize: '16px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5);
  const right = scene.add.rectangle(1160, y, 34, 34, UI_COLORS.panelDark)
    .setStrokeStyle(2, UI_COLORS.accent, 1)
    .setInteractive({ useHandCursor: true });

  const onPrev = () => {
    scene.settings.humanTrainColors[index] = getNextTrainColorKey(scene.settings.humanTrainColors, index, -1);
    scene.refreshSelectors();
  };
  const onNext = () => {
    scene.settings.humanTrainColors[index] = getNextTrainColorKey(scene.settings.humanTrainColors, index, 1);
    scene.refreshSelectors();
  };

  scene.add.text(950, y, '<', {
    fontFamily: 'Georgia',
    fontSize: '22px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true }).on('pointerup', onPrev);
  scene.add.text(1160, y, '>', {
    fontFamily: 'Georgia',
    fontSize: '22px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true }).on('pointerup', onNext);
  left.on('pointerup', onPrev);
  right.on('pointerup', onNext);
  valueText.setInteractive({ useHandCursor: true }).on('pointerup', onNext);

  return { label, left, valueBox, valueText, right };
}

export function refreshTrainColorSelectors(scene) {
  scene.settings.humanTrainColors = normalizeHumanTrainColors(scene.settings.humanTrainColors, scene.settings.humanPlayers);
  scene.ui.trainColorHeader.setVisible(scene.settings.humanPlayers > 0);
  scene.ui.trainColorSelectors.forEach((selector, index) => {
    const visible = index < scene.settings.humanPlayers;
    selector.label.setVisible(visible);
    selector.left.setVisible(visible);
    selector.valueBox.setVisible(visible);
    selector.valueText.setVisible(visible);
    selector.right.setVisible(visible);
    if (visible) {
      selector.valueText.setText(getTrainColorLabel(scene.settings.humanTrainColors[index]));
    }
  });
}