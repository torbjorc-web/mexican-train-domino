import { UI_COLORS } from '../config/gameConfig.js';
import { getTrainColorStyle } from '../config/trainColors.js?v=2';

function resolveTrainColorKey(scene, train, index) {
  if (train.colorKey) {
    return train.colorKey;
  }
  if (scene.state.players[index]?.colorKey) {
    return scene.state.players[index].colorKey;
  }
  if (train.isMexican) {
    return 'mexican';
  }
  if (index < scene.settings.humanPlayers && scene.settings.humanTrainColors?.[index]) {
    return scene.settings.humanTrainColors[index];
  }
  const fallbackIndex = Math.max(0, index - scene.settings.humanPlayers);
  return ['crimson', 'gold', 'teal', 'navy', 'plum', 'olive'][fallbackIndex] || 'crimson';
}

function createTrainStationCard(scene, train, index) {
  const trainColor = getTrainColorStyle(resolveTrainColorKey(scene, train, index));
  const card = scene.add.container(0, 0);
  const body = scene.add.rectangle(0, 0, 198, 56, trainColor.fill)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const innerPanel = scene.add.rectangle(18, 0, 142, 32, UI_COLORS.playable)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const accentBar = scene.add.rectangle(-86, 0, 12, 42, trainColor.stroke)
    .setStrokeStyle(1, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const locomotive = scene.add.rectangle(-18, -10, 66, 16, trainColor.fill)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const cab = scene.add.rectangle(28, -20, 20, 16, trainColor.fill)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const wheelLeft = scene.add.circle(-36, 23, 5, trainColor.stroke).setOrigin(0.5, 0.5);
  const wheelRight = scene.add.circle(4, 23, 5, trainColor.stroke).setOrigin(0.5, 0.5);
  const smokeStack = scene.add.rectangle(42, -26, 8, 12, trainColor.stroke)
    .setStrokeStyle(1, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const labelText = train.isMexican
    ? 'Mexican'
    : (scene.state.players[train.ownerIndex]?.name || `P${index + 1}`);
  const label = scene.add.text(34, 14, labelText, {
    fontFamily: 'Georgia',
    fontSize: '13px',
    color: '#ffffff',
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5);
  const colorLabel = scene.add.text(34, -8, trainColor.label, {
    fontFamily: 'Georgia',
    fontSize: '10px',
    color: '#ffffff',
  }).setOrigin(0.5, 0.5);
  const statusLabel = scene.add.text(34, 28, train.isMexican ? 'Public line' : (train.open ? 'Open train' : 'Closed train'), {
    fontFamily: 'Georgia',
    fontSize: '9px',
    color: '#ffffff',
  }).setOrigin(0.5, 0.5);
  card.add([body, innerPanel, accentBar, locomotive, cab, smokeStack, wheelLeft, wheelRight, label, colorLabel, statusLabel]);
  return card;
}

export function renderTrainStation(scene) {
  scene.ui.trainStationGroup.clear(true, true);
  const stationX = 1150;
  const stationY = 330;
  const stationPanel = scene.add.rectangle(stationX, stationY, 250, 530, UI_COLORS.panel).setStrokeStyle(2, UI_COLORS.boardLine, 0.55);
  const stationTitle = scene.add.text(stationX, stationY - 242, 'Train Station', {
    fontFamily: 'Georgia',
    fontSize: '20px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5);
  const stationHint = scene.add.text(stationX, stationY - 214, 'Each train keeps a unique color.', {
    fontFamily: 'Georgia',
    fontSize: '13px',
    color: UI_COLORS.ink,
    align: 'center',
  }).setOrigin(0.5, 0.5);

  const cards = scene.state.trains.map((train, index) => ({ train, index }));
  const cardSpacingY = 78;
  const startY = stationY - 152 - ((cards.length - 1) * cardSpacingY) / 2;

  cards.forEach(({ train, index }, cardIndex) => {
    const card = createTrainStationCard(scene, train, index);
    card.setPosition(stationX, startY + (cardIndex * cardSpacingY));
    scene.ui.trainStationGroup.add(card);
  });

  scene.ui.trainStationGroup.addMultiple([stationPanel, stationTitle, stationHint]);
}