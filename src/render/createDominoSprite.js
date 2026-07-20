import { PIP_LAYOUTS, UI_COLORS } from '../config/gameConfig.js';

function createPipGroup(scene, value, offsetX, offsetY, vertical) {
  const coords = PIP_LAYOUTS[value] || [];
  return coords.map(([dx, dy]) => scene.add.circle(
    offsetX + (vertical ? dy : dx),
    offsetY + (vertical ? dx : dy),
    3.5,
    0x1f2430,
  ));
}

export function createDominoSprite(scene, tile, x, y, options = {}) {
  const width = options.vertical ? 48 : 84;
  const height = options.vertical ? 84 : 48;
  const container = scene.add.container(x, y);
  const shadow = scene.add.rectangle(4, 4, width, height, UI_COLORS.shadow, 0.12).setOrigin(0.5, 0.5);
  const body = scene.add.rectangle(0, 0, width, height, options.faceUp === false ? UI_COLORS.dominoBack : 0xfffdf8)
    .setStrokeStyle(options.highlight ? 3 : 2, options.highlight ? UI_COLORS.selected : UI_COLORS.boardLine, 1)
    .setOrigin(0.5, 0.5);
  const divider = scene.add.line(
    0,
    0,
    options.vertical ? -18 : 0,
    options.vertical ? 0 : -18,
    options.vertical ? 18 : 0,
    options.vertical ? 0 : 18,
    UI_COLORS.boardLine,
    0.6,
  ).setLineWidth(2, 2);

  const faceItems = [shadow, body, divider];
  if (options.faceUp === false) {
    faceItems.push(scene.add.text(0, 0, '?', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5));
  } else {
    faceItems.push(...createPipGroup(scene, tile.a, options.vertical ? 0 : -18, options.vertical ? -22 : 0, options.vertical));
    faceItems.push(...createPipGroup(scene, tile.b, options.vertical ? 0 : 18, options.vertical ? 22 : 0, options.vertical));
  }

  container.add(faceItems);
  if (options.tileId !== undefined) {
    container.setData('tileId', options.tileId);
  }
  if (options.interactive) {
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
  }
  return container;
}