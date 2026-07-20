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
  const body = scene.add.rectangle(0, 0, 176, 76, trainColor.fill)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const innerPanel = scene.add.rectangle(0, 2, 132, 44, UI_COLORS.playable)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const accentBar = scene.add.rectangle(-74, 0, 12, 56, trainColor.stroke)
    .setStrokeStyle(1, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const locomotive = scene.add.rectangle(-16, -14, 70, 20, trainColor.fill)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const cab = scene.add.rectangle(32, -24, 24, 20, trainColor.fill)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const wheelLeft = scene.add.circle(-34, 31, 6, trainColor.stroke).setOrigin(0.5, 0.5);
  const wheelRight = scene.add.circle(6, 31, 6, trainColor.stroke).setOrigin(0.5, 0.5);
  const smokeStack = scene.add.rectangle(48, -32, 10, 16, trainColor.stroke)
    .setStrokeStyle(1, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const labelText = train.isMexican
    ? 'Mexican'
    : (scene.state.players[train.ownerIndex]?.name || `P${index + 1}`);
  const label = scene.add.text(12, 18, labelText, {
    fontFamily: 'Georgia',
    fontSize: '14px',
    color: '#ffffff',
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5);
  const colorLabel = scene.add.text(12, -10, trainColor.label, {
    fontFamily: 'Georgia',
    fontSize: '11px',
    color: '#ffffff',
  }).setOrigin(0.5, 0.5);
  const statusLabel = scene.add.text(12, 40, train.isMexican ? 'Public line' : (train.open ? 'Open train' : 'Closed train'), {
    fontFamily: 'Georgia',
    fontSize: '10px',
    color: '#ffffff',
  }).setOrigin(0.5, 0.5);
  card.add([body, innerPanel, accentBar, locomotive, cab, smokeStack, wheelLeft, wheelRight, label, colorLabel, statusLabel]);
  return card;
}

export function renderTrainStation(scene) {
  scene.ui.trainStationGroup.clear(true, true);
  const stationX = 1050;
  const stationY = 360;
  const stationPanel = scene.add.rectangle(stationX, stationY, 410, 392, UI_COLORS.panel).setStrokeStyle(2, UI_COLORS.boardLine, 0.55);
  const stationTitle = scene.add.text(stationX, stationY - 166, 'Train Station', {
    fontFamily: 'Georgia',
    fontSize: '20px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5);
  const stationHint = scene.add.text(stationX, stationY - 140, 'Each train keeps a unique color.', {
    fontFamily: 'Georgia',
    fontSize: '13px',
    color: UI_COLORS.ink,
    align: 'center',
  }).setOrigin(0.5, 0.5);

  const cards = scene.state.trains.map((train, index) => ({ train, index }));
  const columns = 2;
  const cardSpacingX = 188;
  const cardSpacingY = 122;
  const startX = stationX - ((columns - 1) * cardSpacingX) / 2;
  const startY = stationY - 82 - ((Math.ceil(cards.length / columns) - 1) * cardSpacingY) / 2;

  cards.forEach(({ train, index }, cardIndex) => {
    const column = cardIndex % columns;
    const row = Math.floor(cardIndex / columns);
    const card = createTrainStationCard(scene, train, index);
    card.setPosition(startX + (column * cardSpacingX), startY + (row * cardSpacingY));
    scene.ui.trainStationGroup.add(card);
  });

  scene.ui.trainStationGroup.addMultiple([stationPanel, stationTitle, stationHint]);
}