import { UI_COLORS } from '../config/gameConfig.js';
import { getTrainColorStyle } from '../config/trainColors.js';

function createTrainStationCard(scene, train, index) {
  const trainColor = getTrainColorStyle(train.colorKey);
  const card = scene.add.container(0, 0);
  const body = scene.add.rectangle(0, 0, 148, 62, UI_COLORS.playable)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const accentBar = scene.add.rectangle(-64, 0, 10, 48, trainColor.fill)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const locomotive = scene.add.rectangle(-18, -8, 62, 18, trainColor.fill)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const cab = scene.add.rectangle(24, -18, 22, 18, trainColor.fill)
    .setStrokeStyle(2, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const wheelLeft = scene.add.circle(-28, 23, 5, trainColor.stroke).setOrigin(0.5, 0.5);
  const wheelRight = scene.add.circle(10, 23, 5, trainColor.stroke).setOrigin(0.5, 0.5);
  const smokeStack = scene.add.rectangle(42, -26, 8, 14, trainColor.stroke)
    .setStrokeStyle(1, trainColor.stroke, 1)
    .setOrigin(0.5, 0.5);
  const labelText = train.isMexican
    ? 'Mexican'
    : (scene.state.players[train.ownerIndex]?.name || `P${index + 1}`);
  const label = scene.add.text(12, 16, labelText, {
    fontFamily: 'Georgia',
    fontSize: '14px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5);
  const colorLabel = scene.add.text(12, -8, trainColor.label, {
    fontFamily: 'Georgia',
    fontSize: '11px',
    color: UI_COLORS.ink,
  }).setOrigin(0.5, 0.5);
  const statusLabel = scene.add.text(12, 34, train.isMexican ? 'Public line' : (train.open ? 'Open train' : 'Closed train'), {
    fontFamily: 'Georgia',
    fontSize: '10px',
    color: UI_COLORS.ink,
  }).setOrigin(0.5, 0.5);
  card.add([body, accentBar, locomotive, cab, smokeStack, wheelLeft, wheelRight, label, colorLabel, statusLabel]);
  return card;
}

export function renderTrainStation(scene) {
  scene.ui.trainStationGroup.clear(true, true);
  const stationX = 1025;
  const stationY = 300;
  const stationPanel = scene.add.rectangle(stationX, stationY, 442, 508, UI_COLORS.panel).setStrokeStyle(2, UI_COLORS.boardLine, 0.55);
  const stationTitle = scene.add.text(stationX, stationY - 226, 'Train Station', {
    fontFamily: 'Georgia',
    fontSize: '20px',
    color: UI_COLORS.ink,
    fontStyle: 'bold',
  }).setOrigin(0.5, 0.5);
  const stationHint = scene.add.text(stationX, stationY - 200, 'Each train keeps a unique color.', {
    fontFamily: 'Georgia',
    fontSize: '13px',
    color: UI_COLORS.ink,
    align: 'center',
  }).setOrigin(0.5, 0.5);

  const cards = scene.state.trains.map((train, index) => ({ train, index }));
  const columns = 2;
  const cardSpacingX = 176;
  const cardSpacingY = 92;
  const startX = stationX - ((columns - 1) * cardSpacingX) / 2;
  const startY = stationY - 110 - ((Math.ceil(cards.length / columns) - 1) * cardSpacingY) / 2;

  cards.forEach(({ train, index }, cardIndex) => {
    const column = cardIndex % columns;
    const row = Math.floor(cardIndex / columns);
    const card = createTrainStationCard(scene, train, index);
    card.setPosition(startX + (column * cardSpacingX), startY + (row * cardSpacingY));
    scene.ui.trainStationGroup.add(card);
  });

  scene.ui.trainStationGroup.addMultiple([stationPanel, stationTitle, stationHint]);
}