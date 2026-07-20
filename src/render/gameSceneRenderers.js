import {
  DIFFICULTY_SETTINGS,
  DOUBLE_RULE_SETTINGS,
  TOTAL_ROUNDS,
  UI_COLORS,
} from '../config/gameConfig.js';
import { createDominoSprite } from './createDominoSprite.js';
import { getTrainAnchors, isDouble, pipSum } from '../utils/dominoes.js';

export function renderBoard(scene) {
  scene.ui.boardGroup.clear(true, true);
  const center = { x: 760, y: 305 };
  const anchors = getTrainAnchors(scene.settings.totalPlayers);
  const mexicanAnchor = { x: 760, y: 515, align: 'center' };
  const trainAnchors = [...anchors, mexicanAnchor];

  const centerRing = scene.add.circle(center.x, center.y, 76, 0xf6ecdc).setStrokeStyle(3, UI_COLORS.accent, 0.4);
  const engineTile = createDominoSprite(scene, { a: scene.state.engineValue, b: scene.state.engineValue }, center.x, center.y, {
    vertical: true,
    faceUp: true,
  });
  scene.ui.boardGroup.addMultiple([centerRing, engineTile]);

  trainAnchors.forEach((anchor, trainIndex) => {
    const train = scene.state.trains[trainIndex];
    const dx = anchor.x - center.x;
    const dy = anchor.y - center.y;
    const distance = Math.sqrt((dx * dx) + (dy * dy));
    const ux = dx / distance;
    const uy = dy / distance;
    const selectedTile = scene.getSelectedTile();
    const enabled = scene.canHumanAct() && selectedTile && scene.canPlayOnTrain(scene.state.currentPlayer, trainIndex, selectedTile);
    const lineColor = enabled ? UI_COLORS.selected : (train.open || train.isMexican ? UI_COLORS.open : UI_COLORS.closed);
    const rail = scene.add.line(0, 0, center.x, center.y, anchor.x, anchor.y, lineColor, 0.42).setLineWidth(5, 5);
    const endpoint = scene.add.circle(anchor.x, anchor.y, 28, enabled ? 0xfff5db : 0xffffff).setStrokeStyle(3, lineColor, 1);
    endpoint.setInteractive({ useHandCursor: true });
    endpoint.on('pointerup', () => scene.onTrainButton(trainIndex));
    const zone = scene.add.zone(anchor.x - 50, anchor.y - 34, 100, 68).setOrigin(0, 0).setRectangleDropZone(100, 68);
    zone.setData('trainIndex', trainIndex);

    const labelLines = [train.name, `End ${train.endpoint} | ${train.isMexican ? 'public' : (train.open ? 'open' : 'closed')}`];
    if (scene.state.openingPhase && !train.isMexican && !scene.state.players[train.ownerIndex].hasStartedTrain) {
      labelLines.push('not started');
    }
    if (scene.state.pendingDouble && scene.state.pendingDouble.trainIndex === trainIndex) {
      labelLines.push('cover required');
    }
    const labelX = anchor.align === 'left' ? anchor.x - 85 : (anchor.align === 'right' ? anchor.x + 85 : anchor.x);
    const label = scene.add.text(labelX, anchor.y - 10, labelLines.join('\n'), {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: UI_COLORS.ink,
      align: anchor.align === 'left' ? 'right' : (anchor.align === 'right' ? 'left' : 'center'),
    }).setOrigin(anchor.align === 'left' ? 1 : (anchor.align === 'right' ? 0 : 0.5), 0.5);

    scene.ui.boardGroup.addMultiple([rail, endpoint, zone, label]);

    const visibleTiles = train.tiles.slice(-4);
    const startDistance = Math.max(110, distance - ((visibleTiles.length - 1) * 72) - 48);
    visibleTiles.forEach((tile, tileIndex) => {
      const offset = startDistance + (tileIndex * 72);
      const tileSprite = createDominoSprite(scene, tile, center.x + (ux * offset), center.y + (uy * offset), {
        vertical: Math.abs(uy) > Math.abs(ux) || isDouble(tile),
        faceUp: true,
        highlight: scene.state.pendingDouble && scene.state.pendingDouble.trainIndex === trainIndex && tileIndex === visibleTiles.length - 1 && isDouble(tile),
      });
      scene.ui.boardGroup.add(tileSprite);
    });
  });
}

export function renderHand(scene) {
  scene.ui.handGroup.clear(true, true);
  if (scene.state.roundOver) {
    scene.ui.handTitle.setText('Round complete');
    scene.ui.handHint.setText('Use Next to continue, or return to the title screen after the match.');
    return;
  }
  if (!scene.currentPlayer.isHuman) {
    scene.ui.handTitle.setText('Bot turn');
    scene.ui.handHint.setText(`${scene.currentPlayer.name} is evaluating moves at ${DIFFICULTY_SETTINGS[scene.settings.difficulty].label.toLowerCase()} difficulty.`);
    return;
  }
  if (scene.state.humanRevealPending) {
    scene.ui.handTitle.setText('Hand hidden');
    scene.ui.handHint.setText('Reveal the hand when the next player is ready.');
    return;
  }

  scene.ui.handTitle.setText(`${scene.currentPlayer.name} Hand`);
  scene.ui.handHint.setText('Drag a domino onto a train endpoint, or click a domino and then click an endpoint.');
  const hand = [...scene.currentPlayer.hand].sort((left, right) => pipSum(right) - pipSum(left) || right.a - left.a);
  hand.forEach((tile, index) => {
    const column = index % 8;
    const row = Math.floor(index / 8);
    const x = 392 + (column * 102);
    const y = 654 + (row * 64);
    const playable = scene.getPlayableTargets(scene.state.currentPlayer, tile).length > 0;
    const selected = tile.id === scene.selectedTileId;
    const domino = createDominoSprite(scene, tile, x, y, {
      vertical: false,
      faceUp: true,
      highlight: selected || playable,
      tileId: tile.id,
      interactive: true,
    });
    domino.list[1].setFillStyle(selected ? UI_COLORS.selected : (playable ? UI_COLORS.playable : UI_COLORS.muted), 1);
    scene.input.setDraggable(domino, true);
    domino.on('pointerup', () => {
      if (!scene.canHumanAct() || scene.draggingTileId === tile.id) {
        return;
      }
      scene.selectedTileId = scene.selectedTileId === tile.id ? null : tile.id;
      scene.render();
    });
    scene.ui.handGroup.add(domino);
  });
}

export function renderScoreboard(scene) {
  const openingText = scene.state.openingPhase ? 'Opening phase active' : 'Regular play';
  const lines = [
    'Match Scoreboard',
    `Difficulty: ${DIFFICULTY_SETTINGS[scene.settings.difficulty].label}`,
    `Double: ${DOUBLE_RULE_SETTINGS[scene.settings.doubleRule].label}`,
    `Mode: ${scene.settings.humanPlayers} human / ${scene.settings.totalPlayers - scene.settings.humanPlayers} bot`,
    `State: ${openingText}`,
  ];
  scene.state.players.forEach((player, index) => {
    lines.push(`${player.name}: ${scene.match.scores[index]} total, ${scene.match.roundsWon[index]} rounds won`);
  });
  if (scene.state.lastRoundScores) {
    lines.push('Last Round:');
    scene.state.players.forEach((player, index) => {
      lines.push(`${player.name}: +${scene.state.lastRoundScores[index]}`);
    });
  }
  scene.ui.scoreboard.setText(lines.join('\n'));
}

export function renderPlayerSummary(scene) {
  const lines = ['Player Trains'];
  scene.state.players.forEach((player, index) => {
    const train = scene.state.trains[index];
    const shortName = player.name.replace('Player ', 'P').replace('Bot ', 'B');
    const openFlag = train.open ? 'O' : 'C';
    const startFlag = player.hasStartedTrain ? 'S' : 'N';
    lines.push(`${shortName}: hand ${player.hand.length}, end ${train.endpoint}, ${openFlag}, ${startFlag}`);
  });
  lines.push(`Mexican: end ${scene.state.trains[scene.getMexicanTrainIndex()].endpoint}`);
  lines.push(`Yard: ${scene.state.boneyard.length}`);
  scene.ui.playerSummary.setText(lines.join('\n'));
}

export function renderStatus(scene) {
  const pendingText = scene.state.pendingDouble ? ` Pending double on ${scene.state.trains[scene.state.pendingDouble.trainIndex].name}.` : '';
  const openingHint = scene.state.openingPhase ? ' During the opening phase, players may only work on their own trains.' : '';
  scene.ui.roundMeta.setText(`Round ${scene.match.roundIndex + 1} of ${TOTAL_ROUNDS} | Engine ${scene.state.engineValue}|${scene.state.engineValue}`);
  scene.ui.status.setText(`${scene.state.turnMessage}${pendingText}${openingHint}`);
  scene.ui.boardHint.setText(scene.state.openingPhase
    ? 'Each player must establish their personal train before shared and open-train play begins.'
    : 'The Mexican Train is always public. Open trains may be used by any player.');
  scene.ui.log.setText(scene.state.log.join('\n'));
  scene.ui.historyText.setText(scene.match.history.length > 0
    ? scene.match.history.map((entry) => `R${entry.round}: ${scene.state.players[entry.winnerIndex]?.name || `P${entry.winnerIndex + 1}`} ${entry.blocked ? 'blocked' : 'out'} + ${entry.scores.join('/')}`).join('\n')
    : 'No completed rounds yet.');

  scene.ui.drawButton.setFillStyle(scene.canHumanAct() ? UI_COLORS.accentAlt : UI_COLORS.disabled, 1);
  scene.ui.advanceButton.setFillStyle(scene.state.roundOver ? UI_COLORS.accent : UI_COLORS.disabled, 1);
  scene.ui.advanceLabel.setText(scene.match.completed ? 'Finish' : 'Next');
  scene.ui.sidebarToggleLabel.setText(scene.ui.sidebarExpanded ? 'Hide' : 'Show');

  scene.ui.scoreboard.setVisible(scene.ui.sidebarExpanded);
  scene.ui.playerSummary.setVisible(scene.ui.sidebarExpanded);
  scene.ui.log.setVisible(scene.ui.sidebarExpanded);
  scene.ui.historyPanel.setVisible(scene.ui.sidebarExpanded);
  scene.ui.historyText.setVisible(scene.ui.sidebarExpanded);

  const overlayVisible = scene.currentPlayer.isHuman && scene.state.humanRevealPending && !scene.state.roundOver;
  scene.ui.overlay.setVisible(overlayVisible);
  if (overlayVisible) {
    scene.ui.overlayTitle.setText(`${scene.currentPlayer.name}'s Turn`);
    scene.ui.overlayBody.setText('Hands are hidden between human players.\nReveal the hand when this player is ready.');
  }
}