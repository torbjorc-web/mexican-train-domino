import { UI_COLORS } from '../config/gameConfig.js';
import { normalizeHumanPlayerNames } from '../state/gameState.js?v=2';

function promptForName(scene, index) {
  const currentName = scene.settings.humanPlayerNames[index] || `Player ${index + 1}`;
  const nextName = window.prompt(`Enter a name for Player ${index + 1}`, currentName);
  if (nextName === null) {
    return;
  }
  scene.settings.humanPlayerNames[index] = nextName.trim() || `Player ${index + 1}`;
  scene.refreshSelectors();
}

export function createPlayerNameSelector(scene, y, index) {
  const container = scene.add.container(1120, y);
  const valueBox = scene.add.rectangle(60, 0, 124, 30, UI_COLORS.playable)
    .setStrokeStyle(2, UI_COLORS.accentAlt, 1)
    .setInteractive({ useHandCursor: true });
  const valueText = scene.add.text(60, 0, '', {
    fontFamily: 'Georgia',
    fontSize: '13px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
  const editButton = scene.add.rectangle(142, 0, 34, 30, UI_COLORS.panelDark)
    .setStrokeStyle(2, UI_COLORS.accent, 1)
    .setInteractive({ useHandCursor: true });
  const editText = scene.add.text(142, 0, 'Edit', {
    fontFamily: 'Georgia',
    fontSize: '12px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

  const onEdit = () => promptForName(scene, index);
  valueBox.on('pointerup', onEdit);
  valueText.on('pointerup', onEdit);
  editButton.on('pointerup', onEdit);
  editText.on('pointerup', onEdit);

  container.add([valueBox, valueText, editButton, editText]);

  return { container, valueBox, valueText, editButton, editText };
}

export function refreshPlayerNameSelectors(scene) {
  scene.settings.humanPlayerNames = normalizeHumanPlayerNames(scene.settings.humanPlayerNames, scene.settings.humanPlayers);
  scene.ui.playerNameHeader.setVisible(false);
  scene.ui.playerNameSelectors.forEach((selector, index) => {
    const visible = index < scene.settings.humanPlayers;
    selector.container.setVisible(visible);
    if (visible) {
      selector.valueText.setText(scene.settings.humanPlayerNames[index]);
    }
  });
}