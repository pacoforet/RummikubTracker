import { t } from '../i18n.js';
import {
  getState,
  setState,
  PLAYER_COLORS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  getLastGameConfig,
  validateGameSetup,
} from '../state.js';
import { escapeHtml, setText, setSegmentValue, showAlert } from '../ui.js';
import { updateHeaderTitle, goToScoreboard } from './navigation.js';

export function renderSetup() {
  const state = getState();
  updateHeaderTitle();

  const targetInput = document.getElementById('target-score');
  targetInput.value = state.settings.targetScore || '';

  setText(
    'rule-desc',
    state.settings.rule === 'standard' ? t('setup.standardDesc') : t('setup.simpleDesc')
  );
  setSegmentValue('rule', state.settings.rule);

  document.getElementById('player-count').textContent = `${state.players.length}/${MAX_PLAYERS}`;

  const list = document.getElementById('player-setup-list');
  list.innerHTML = '';
  const canRemove = state.players.length > MIN_PLAYERS;

  state.players.forEach((p, index) => {
    const div = document.createElement('div');
    div.className = 'player-setup-row';
    div.innerHTML = `
      <span class="player-color-dot" style="background:${p.color}"></span>
      <input type="text" value="${escapeHtml(p.name)}" maxlength="20" autocomplete="off"
             data-action="update-player-name" data-player-id="${p.id}"
             aria-label="${escapeHtml(t('a11y.playerName', { n: index + 1 }))}">
      ${
        canRemove
          ? `<button class="remove-player" data-action="remove-player" data-player-id="${p.id}"
                   aria-label="${escapeHtml(t('a11y.removePlayer', { name: p.name }))}">&times;</button>`
          : ''
      }
    `;
    list.appendChild(div);
  });

  document
    .getElementById('add-player-btn')
    .classList.toggle('hidden', state.players.length >= MAX_PLAYERS);
  document.getElementById('quick-start-btn').classList.toggle('hidden', !getLastGameConfig());
}

function addPlayer() {
  const state = getState();
  if (state.players.length >= MAX_PLAYERS) return;

  const n = state.players.length + 1;
  // Pick a color no current player is using
  const used = new Set(state.players.map((p) => p.color));
  const color = PLAYER_COLORS.find((c) => !used.has(c)) || PLAYER_COLORS[n % PLAYER_COLORS.length];
  const newId = Math.max(0, ...state.players.map((p) => Number(p.id) || 0), Date.now()) + 1;

  setState((s) => ({
    ...s,
    players: [...s.players, { id: newId, name: t('setup.defaultPlayer', { n }), color, score: 0 }],
  }));
  renderSetup();
}

function removePlayer(playerId) {
  if (getState().players.length <= MIN_PLAYERS) return;
  setState((s) => ({ ...s, players: s.players.filter((p) => p.id !== playerId) }));
  renderSetup();
}

function updatePlayerName(playerId, name) {
  // Saved immediately (no re-render) and keyed by id, so edits never land on the wrong player
  setState((s) => ({
    ...s,
    players: s.players.map((p) => (p.id === playerId ? { ...p, name } : p)),
  }));
}

async function startGame() {
  const state = getState();
  const targetRaw = document.getElementById('target-score').value;
  const result = validateGameSetup(state.players, targetRaw);
  if (!result.ok) {
    await showAlert(t(result.error));
    return;
  }

  setState((s) => ({
    ...s,
    settings: { ...s.settings, targetScore: result.targetScore },
    gameActive: true,
    winnerAnnounced: null,
    rounds: [],
    players: result.players.map((p) => ({ ...p, score: 0 })),
  }));
  goToScoreboard();
}

function quickStart() {
  const config = getLastGameConfig();
  if (!config) return;

  setState((s) => ({
    ...s,
    players: config.players,
    settings: { ...s.settings, ...config.settings },
    gameActive: true,
    winnerAnnounced: null,
    rounds: [],
  }));
  goToScoreboard();
}

function setRule(rule) {
  // Keep a typed-but-unsaved target score when re-rendering
  const targetRaw = document.getElementById('target-score').value;
  setState((s) => ({ ...s, settings: { ...s.settings, rule } }));
  renderSetup();
  document.getElementById('target-score').value = targetRaw;
}

const playerIdOf = (target) => Number(target.dataset.playerId);

export const actions = {
  'add-player': () => addPlayer(),
  'remove-player': (target) => removePlayer(playerIdOf(target)),
  'set-rule': (target) => setRule(target.dataset.value),
  'start-game': () => startGame(),
  'quick-start': () => quickStart(),
};

export const inputs = {
  'update-player-name': (target) => updatePlayerName(playerIdOf(target), target.value),
};
