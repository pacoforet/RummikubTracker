import { t } from '../i18n.js';
import {
  getState,
  setState,
  calculateStandardRound,
  calculateSimpleRound,
  calculateTileTotal,
  calculateTileCount,
  findWinner,
} from '../state.js';
import { escapeHtml, setText, openModal, closeModal, showAlert, showToast } from '../ui.js';
import { renderScoreboard, animateScoreDeltas } from './scoreboard.js';
import { showWinnerCelebration } from './winner.js';

const JOKER_VALUE = 30;
const LONG_PRESS_MS = 500;

// Everything typed or tapped in the round modal lives here, so re-rendering
// the modal never loses input.
let draft = newDraft();

function newDraft() {
  return {
    winnerId: null,
    tiles: {}, // playerId -> { tileValue: count }
    manual: {}, // playerId -> true when using numeric input (standard rule)
    values: {}, // playerId -> raw string typed in a numeric input
  };
}

/** Round changes for the current draft, also used for live projections. */
function getDraftChanges() {
  const state = getState();
  if (state.settings.rule === 'standard') {
    const manualInputs = {};
    state.players.forEach((p) => {
      if (p.id !== draft.winnerId && draft.manual[p.id])
        manualInputs[p.id] = draft.values[p.id] ?? '';
    });
    return calculateStandardRound(state.players, draft.winnerId, draft.tiles, manualInputs);
  }
  return calculateSimpleRound(state.players, draft.values);
}

function projectedScore(player, changes) {
  const change = changes.find((c) => c.playerId === player.id);
  return player.score + (change ? change.points : 0);
}

function openRoundEntry() {
  draft = newDraft();
  const state = getState();
  setText(
    'round-instruction',
    state.settings.rule === 'standard'
      ? t('roundEntry.instructionStandard')
      : t('roundEntry.instructionSimple')
  );
  renderRoundInputs();
  openModal('modal-round');
}

function renderRoundInputs() {
  const state = getState();
  const list = document.getElementById('round-entry-list');
  const changes = getDraftChanges();
  list.innerHTML = '';

  state.players.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'round-entry-row';
    const label = `
      <span class="player-label">
        <span class="player-color-dot" style="background:${p.color}"></span>
        ${escapeHtml(p.name)}
        <span class="projected-score" data-player-id="${p.id}">${t('roundEntry.projected')}: ${projectedScore(p, changes)}</span>
      </span>`;

    if (state.settings.rule === 'standard') {
      const isWinner = draft.winnerId === p.id;
      div.innerHTML = `
        <div class="round-entry-player">
          ${label}
          <button class="winner-toggle ${isWinner ? 'selected' : ''}"
                  data-action="toggle-winner" data-player-id="${p.id}"
                  aria-pressed="${isWinner}">
            ${isWinner ? t('roundEntry.winner') : t('roundEntry.choose')}
          </button>
        </div>
        ${isWinner ? '' : draft.manual[p.id] ? renderManualInput(p) : renderTileGrid(p.id)}
      `;
    } else {
      div.innerHTML = `
        <div class="round-entry-player">${label}</div>
        <input type="number" class="score-input" placeholder="+/-" step="1"
               value="${escapeHtml(draft.values[p.id] ?? '')}"
               data-action="round-value" data-player-id="${p.id}"
               aria-label="${escapeHtml(t('a11y.points', { name: p.name }))}">
      `;
    }

    list.appendChild(div);
  });
}

/** Refreshes only the projection labels, so inputs keep focus while typing. */
function updateProjections() {
  const changes = getDraftChanges();
  getState().players.forEach((p) => {
    const el = document.querySelector(`.projected-score[data-player-id="${p.id}"]`);
    if (el) el.textContent = `${t('roundEntry.projected')}: ${projectedScore(p, changes)}`;
  });
}

function renderManualInput(player) {
  return `
    <div class="manual-input-row">
      <input type="number" class="score-input" min="0" step="1" inputmode="numeric"
             placeholder="${t('roundEntry.points')}"
             value="${escapeHtml(draft.values[player.id] ?? '')}"
             data-action="round-value" data-player-id="${player.id}"
             aria-label="${escapeHtml(t('a11y.points', { name: player.name }))}">
      <button class="btn-text" data-action="toggle-input-mode" data-player-id="${player.id}">
        ${t('roundEntry.useTiles')}
      </button>
    </div>
  `;
}

function renderTile(playerId, value, count) {
  const isJoker = value === JOKER_VALUE;
  const aria = isJoker ? t('a11y.joker', { n: count }) : t('a11y.tile', { v: value, n: count });
  return `
    <button class="tile${isJoker ? ' tile-joker' : ''}${count > 0 ? ' tile-active' : ''}"
            data-action="tap-tile" data-player-id="${playerId}" data-value="${value}"
            aria-label="${aria}">
      ${isJoker ? 'J' : value}
      <span class="tile-badge" style="display:${count > 0 ? 'flex' : 'none'}">${count}</span>
    </button>
  `;
}

function renderTileGrid(playerId) {
  const sel = draft.tiles[playerId] || {};

  let tilesHtml = '';
  for (let v = 1; v <= 13; v++) tilesHtml += renderTile(playerId, v, sel[v] || 0);
  tilesHtml += renderTile(playerId, JOKER_VALUE, sel[JOKER_VALUE] || 0);

  return `
    <div class="tile-picker">
      <div class="tile-picker-header">
        <span class="tile-total-display">
          <span>${calculateTileCount(sel)}</span> ${t('roundEntry.tiles')} =
          <strong>${calculateTileTotal(sel)}</strong> ${t('roundEntry.pts')}
        </span>
        <button class="btn-small" data-action="clear-tiles" data-player-id="${playerId}">
          ${t('roundEntry.clear')}
        </button>
      </div>
      <div class="tile-grid">${tilesHtml}</div>
      <button class="btn-text" data-action="toggle-input-mode" data-player-id="${playerId}">
        ${t('roundEntry.useNumeric')}
      </button>
    </div>
  `;
}

function addTile(playerId, value) {
  const sel = (draft.tiles[playerId] ||= {});
  sel[value] = (sel[value] || 0) + 1;
  renderRoundInputs();
}

function removeTile(playerId, value) {
  const sel = draft.tiles[playerId];
  if (sel && (sel[value] || 0) > 0) {
    sel[value]--;
    renderRoundInputs();
  }
}

async function submitRound() {
  const state = getState();

  if (state.settings.rule === 'standard' && draft.winnerId === null) {
    await showAlert(t('dialog.selectWinner'));
    return;
  }

  const changes = getDraftChanges();
  const players = state.players.map((p) => ({ ...p, score: projectedScore(p, changes) }));
  const rounds = [...state.rounds, { id: Date.now(), changes }];

  // Celebrate only once per win; "keep playing" must not re-trigger it every round
  const winner = findWinner(players, state.settings);
  const celebrate = winner && state.winnerAnnounced === null;

  setState((s) => ({
    ...s,
    players,
    rounds,
    winnerAnnounced: celebrate ? winner.id : s.winnerAnnounced,
  }));

  closeModal('modal-round');
  renderScoreboard();
  showToast(t('toast.roundSaved'), 'success');
  animateScoreDeltas(changes);

  if (celebrate) setTimeout(() => showWinnerCelebration(winner), 600);
}

// --- Long press / right click removes a tile ---

let longPressTimer = null;
let lastPointerType = 'mouse';
// Set after a touch long-press so the click that follows doesn't add the tile back
let suppressTileClick = false;

function tileFromEvent(e) {
  return e.target.closest?.('[data-action="tap-tile"]');
}

function cancelLongPress() {
  clearTimeout(longPressTimer);
  longPressTimer = null;
}

function handlePointerDown(e) {
  lastPointerType = e.pointerType || 'mouse';
  const tile = tileFromEvent(e);
  if (!tile) return;
  suppressTileClick = false;
  // Mouse users remove tiles with right click (contextmenu) instead
  if (lastPointerType === 'mouse') return;

  const playerId = Number(tile.dataset.playerId);
  const value = Number(tile.dataset.value);
  longPressTimer = setTimeout(() => {
    longPressTimer = null;
    suppressTileClick = true;
    removeTile(playerId, value);
    navigator.vibrate?.(20);
  }, LONG_PRESS_MS);
}

function handleContextMenu(e) {
  const tile = tileFromEvent(e);
  if (!tile) return;
  // Touch long-press also fires contextmenu: only the timer handles that case
  e.preventDefault();
  if (lastPointerType === 'mouse') {
    removeTile(Number(tile.dataset.playerId), Number(tile.dataset.value));
  }
}

export function registerRoundEntryEvents() {
  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('pointerup', cancelLongPress);
  document.addEventListener('pointercancel', cancelLongPress);
  document.addEventListener('contextmenu', handleContextMenu);
}

const playerIdOf = (target) => Number(target.dataset.playerId);

export const actions = {
  'open-round-entry': () => openRoundEntry(),
  'toggle-winner': (target) => {
    const id = playerIdOf(target);
    draft.winnerId = draft.winnerId === id ? null : id;
    renderRoundInputs();
  },
  'tap-tile': (target) => {
    if (suppressTileClick) {
      suppressTileClick = false;
      return;
    }
    addTile(playerIdOf(target), Number(target.dataset.value));
  },
  'clear-tiles': (target) => {
    draft.tiles[playerIdOf(target)] = {};
    renderRoundInputs();
  },
  'toggle-input-mode': (target) => {
    const id = playerIdOf(target);
    draft.manual[id] = !draft.manual[id];
    renderRoundInputs();
  },
  'submit-round': () => submitRound(),
};

export const inputs = {
  'round-value': (target) => {
    draft.values[playerIdOf(target)] = target.value;
    updateProjections();
  },
};
