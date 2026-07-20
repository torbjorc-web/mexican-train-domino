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
  const label = scene.add.text(1015, y, `Player ${index + 1}`, {
    fontFamily: 'Georgia',
    fontSize: '16px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(1, 0.5);
  const valueBox = scene.add.rectangle(1165, y, 170, 30, UI_COLORS.playable)
    .setStrokeStyle(2, UI_COLORS.accentAlt, 1)
    .setInteractive({ useHandCursor: true });
  const valueText = scene.add.text(1165, y, '', {
    fontFamily: 'Georgia',
    fontSize: '15px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
  const editButton = scene.add.rectangle(1270, y, 34, 30, UI_COLORS.panelDark)
    .setStrokeStyle(2, UI_COLORS.accent, 1)
    .setInteractive({ useHandCursor: true });
  const editText = scene.add.text(1270, y, 'Edit', {
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

  return { label, valueBox, valueText, editButton, editText };
}

export function refreshPlayerNameSelectors(scene) {
  scene.settings.humanPlayerNames = normalizeHumanPlayerNames(scene.settings.humanPlayerNames, scene.settings.humanPlayers);
  scene.ui.playerNameHeader.setVisible(scene.settings.humanPlayers > 0);
  scene.ui.playerNameSelectors.forEach((selector, index) => {
    const visible = index < scene.settings.humanPlayers;
    selector.label.setVisible(visible);
    selector.valueBox.setVisible(visible);
    selector.valueText.setVisible(visible);
    selector.editButton.setVisible(visible);
    selector.editText.setVisible(visible);
    if (visible) {
      selector.valueText.setText(scene.settings.humanPlayerNames[index]);
    }
  });
}