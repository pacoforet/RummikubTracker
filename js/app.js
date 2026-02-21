import { t, setLanguage, getLanguage, onLanguageChange } from './i18n.js';
import {
  getState,
  setState,
  loadState,
  PLAYER_COLORS,
  calculateStandardRound,
  calculateSimpleRound,
  calculateTileTotal,
  calculateTileCount,
  recalculateScores,
  findWinner,
  getPlayerStats,
  getSortedPlayers,
  getArchive,
  archiveCurrentGame,
  deleteArchiveEntry,
  getLastGameConfig,
} from './state.js';
import {
  showDialog,
  showAlert,
  showToast,
  openModal,
  closeModal,
  initUI,
  escapeHtml,
  debounce,
} from './ui.js';
import { renderChart } from './chart.js';

// --- App State (UI-only, not persisted) ---
let currentWinnerId = null;
let tileSelections = {};
let useManualInput = {};

// --- Init ---

function init() {
  const state = loadState();
  setLanguage(state.settings.language);
  applyTheme(state.settings.theme);
  initUI();
  registerEvents();
  onLanguageChange(() => renderCurrentView());

  if (state.gameActive) {
    showView('view-scoreboard');
    renderScoreboard();
  } else {
    showView('view-setup');
    renderSetup();
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// --- Theme ---

function applyTheme(theme) {
  const html = document.documentElement;
  html.dataset.theme = theme;

  let effective = theme;
  if (theme === 'auto') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const color = effective === 'dark' ? '#121212' : '#ffffff';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

// --- View Management ---

function showView(viewId) {
  document.querySelectorAll('.view').forEach((el) => el.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');

  const historyBtn = document.getElementById('history-btn');
  const chartBtn = document.getElementById('chart-btn');
  const archiveBtn = document.getElementById('archive-btn');
  const settingsBtn = document.getElementById('settings-btn');

  if (viewId === 'view-setup') {
    historyBtn?.classList.add('hidden');
    chartBtn?.classList.add('hidden');
    archiveBtn?.classList.remove('hidden');
    settingsBtn?.classList.remove('hidden');
  } else {
    historyBtn?.classList.remove('hidden');
    chartBtn?.classList.remove('hidden');
    archiveBtn?.classList.add('hidden');
    settingsBtn?.classList.add('hidden');
  }
}

function renderCurrentView() {
  const state = getState();
  if (state.gameActive) {
    renderScoreboard();
  } else {
    renderSetup();
  }
  updateHeaderTitle();
}

function updateHeaderTitle() {
  const state = getState();
  const el = document.getElementById('header-title');
  if (state.gameActive && state.settings.targetScore) {
    el.textContent = `${t('scoreboard.targetPrefix')} ${state.settings.targetScore}`;
  } else {
    el.textContent = t('app.title');
  }
}

// --- Setup View ---

function renderSetup() {
  const state = getState();
  updateHeaderTitle();

  // Target score
  const targetInput = document.getElementById('target-score');
  targetInput.value = state.settings.targetScore || '';
  targetInput.placeholder = t('setup.targetPlaceholder');

  // Labels
  setText('label-target', t('setup.targetScore'));
  setText('label-scoring-rule', t('setup.scoringRule'));
  setText('label-players', t('setup.players'));
  setText('rule-desc',
    state.settings.rule === 'standard' ? t('setup.standardDesc') : t('setup.simpleDesc')
  );

  // Segmented controls
  document.querySelectorAll('.segment[data-group="rule"]').forEach((el) => {
    el.classList.toggle('active', el.dataset.value === state.settings.rule);
    el.textContent = t(`setup.${el.dataset.value}`);
  });

  // Player count
  document.getElementById('player-count').textContent = `${state.players.length}/6`;

  // Player list
  const list = document.getElementById('player-setup-list');
  list.innerHTML = '';

  state.players.forEach((p, index) => {
    const div = document.createElement('div');
    div.className = 'player-setup-row';
    div.innerHTML = `
      <span class="player-color-dot" style="background:${p.color}"></span>
      <input type="text" value="${escapeHtml(p.name)}"
             data-action="update-player-name" data-index="${index}"
             aria-label="${t('setup.players')} ${index + 1}">
      ${state.players.length > 2
        ? `<button class="remove-player" data-action="remove-player" data-index="${index}"
                   aria-label="Remove player">&times;</button>`
        : ''}
    `;
    list.appendChild(div);
  });

  // Add button visibility
  const addBtn = document.getElementById('add-player-btn');
  addBtn.textContent = t('setup.addPlayer');
  addBtn.style.display = state.players.length >= 6 ? 'none' : '';

  // Start button
  setText('start-game-btn', t('setup.startGame'));

  // Quick start
  const quickBtn = document.getElementById('quick-start-btn');
  const lastConfig = getLastGameConfig();
  if (lastConfig) {
    quickBtn.style.display = '';
    quickBtn.textContent = t('setup.quickStart');
  } else {
    quickBtn.style.display = 'none';
  }
}

// --- Scoreboard View ---

function renderScoreboard() {
  const state = getState();
  updateHeaderTitle();

  // Stats
  setText('round-display', String(state.rounds.length + 1));
  setText('goal-display', state.settings.targetScore || t('scoreboard.noTarget'));
  setText('round-label', t('scoreboard.round'));
  setText('goal-label', t('scoreboard.target'));
  setText('undo-btn', t('scoreboard.undo'));
  setText('end-btn', t('scoreboard.end'));
  setText('record-round-btn', t('scoreboard.recordRound'));

  // Sort toggle
  const sortBtn = document.getElementById('sort-btn');
  if (sortBtn) {
    sortBtn.textContent = t('scoreboard.sortByScore');
    sortBtn.classList.toggle('active', state.settings.sortByScore);
  }

  // Leaderboard
  const grid = document.getElementById('leaderboard');
  grid.innerHTML = '';

  const sorted = getSortedPlayers(
    state.players,
    state.rounds,
    state.settings.sortByScore,
    state.settings.scoreDirection
  );

  // Determine positions by score rank
  const scoresSorted = [...state.players]
    .sort((a, b) =>
      state.settings.scoreDirection === 'lowest' ? a.score - b.score : b.score - a.score
    )
    .map((p) => p.score);

  // Set grid class based on player count
  grid.className = 'leaderboard-grid';
  if (sorted.length === 3 || sorted.length >= 5) grid.classList.add('grid-3');

  sorted.forEach((p) => {
    const position =
      state.rounds.length > 0 ? scoresSorted.indexOf(p.score) + 1 : 0;
    const isLeader = position === 1 && state.rounds.length > 0 && p.score !== 0;
    const stats = getPlayerStats(p, state.rounds);
    const posLabel =
      position > 0 ? t('scoreboard.position')[position - 1] || `${position}` : '';

    const card = document.createElement('div');
    card.className = `score-card${isLeader ? ' leader' : ''}`;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `${p.name}: ${p.score} ${t('roundEntry.pts')}`);

    card.innerHTML = `
      ${position > 0
        ? `<span class="position-badge pos-${Math.min(position, 4)}">${posLabel}</span>`
        : ''}
      <div class="player-avatar${isLeader ? ' leader' : ''}" style="background:${p.color}">
        ${escapeHtml(p.name).charAt(0).toUpperCase()}
      </div>
      <div class="player-name">${escapeHtml(p.name)}</div>
      <div class="player-score ${p.score < 0 ? 'negative' : ''}" data-player-id="${p.id}">
        ${p.score}
      </div>
      ${state.rounds.length > 0
        ? `<div class="player-mini-stats">
            <span title="${t('stats.roundsWon')}">${stats.roundsWon}W</span>
            <span title="${t('stats.avgPerRound')}">${stats.avgPerRound > 0 ? '+' : ''}${stats.avgPerRound}/r</span>
          </div>`
        : ''}
    `;
    grid.appendChild(card);
  });
}

// --- Round Entry ---

function openRoundEntry() {
  currentWinnerId = null;
  tileSelections = {};
  useManualInput = {};

  const state = getState();
  setText('round-modal-title', t('roundEntry.title'));
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
  list.innerHTML = '';

  state.players.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'round-entry-row';

    if (state.settings.rule === 'standard') {
      const isWinner = currentWinnerId === p.id;
      const manual = useManualInput[p.id];

      let projectedHtml = '';
      if (!isWinner) {
        let val = 0;
        if (manual) {
          const existing = document.getElementById(`input-${p.id}`);
          val = existing ? parseInt(existing.value, 10) || 0 : 0;
        } else {
          val = calculateTileTotal(tileSelections[p.id] || {});
        }
        const projected = p.score - Math.abs(val);
        projectedHtml = `<span class="projected-score">${t('roundEntry.projected')}: ${projected}</span>`;
      } else {
        let winnerGets = 0;
        state.players.forEach((op) => {
          if (op.id !== p.id) {
            if (useManualInput[op.id]) {
              const existing = document.getElementById(`input-${op.id}`);
              winnerGets += Math.abs(parseInt(existing?.value, 10) || 0);
            } else {
              winnerGets += calculateTileTotal(tileSelections[op.id] || {});
            }
          }
        });
        const projected = p.score + winnerGets;
        projectedHtml = `<span class="projected-score">${t('roundEntry.projected')}: ${projected}</span>`;
      }

      div.innerHTML = `
        <div class="round-entry-player">
          <span class="player-label">
            <span class="player-color-dot" style="background:${p.color}"></span>
            ${escapeHtml(p.name)}
            ${projectedHtml}
          </span>
          <button class="winner-toggle ${isWinner ? 'selected' : ''}"
                  data-action="toggle-winner" data-player-id="${p.id}"
                  aria-pressed="${isWinner}">
            ${isWinner ? t('roundEntry.winner') : t('roundEntry.choose')}
          </button>
        </div>
        ${!isWinner ? (manual ? renderManualInput(p.id) : renderTileGrid(p.id)) : ''}
      `;
    } else {
      const existing = document.getElementById(`input-${p.id}`);
      const currentVal = existing ? existing.value : '';
      const numVal = parseInt(currentVal, 10) || 0;
      const projected = p.score + numVal;

      div.innerHTML = `
        <div class="round-entry-player">
          <span class="player-label">
            <span class="player-color-dot" style="background:${p.color}"></span>
            ${escapeHtml(p.name)}
            <span class="projected-score">${t('roundEntry.projected')}: ${projected}</span>
          </span>
        </div>
        <input type="number" id="input-${p.id}" class="score-input"
               placeholder="+/-" pattern="[0-9-]*" value="${currentVal}"
               data-action="simple-score-input" data-player-id="${p.id}"
               aria-label="${t('roundEntry.points')} ${escapeHtml(p.name)}">
      `;
    }

    list.appendChild(div);
  });

  setText('save-round-btn', t('roundEntry.save'));
}

function renderManualInput(playerId) {
  return `
    <div class="manual-input-row">
      <input type="number" id="input-${playerId}" class="score-input"
             placeholder="${t('roundEntry.points')}" pattern="\\d*"
             aria-label="${t('roundEntry.points')}">
      <button class="btn-text" data-action="toggle-input-mode" data-player-id="${playerId}">
        ${t('roundEntry.useTiles')}
      </button>
    </div>
  `;
}

function renderTileGrid(playerId) {
  if (!tileSelections[playerId]) tileSelections[playerId] = {};
  const sel = tileSelections[playerId];

  let tilesHtml = '';
  for (let v = 1; v <= 13; v++) {
    const count = sel[v] || 0;
    tilesHtml += `
      <button class="tile${count > 0 ? ' tile-active' : ''}"
              data-action="tap-tile" data-player-id="${playerId}" data-value="${v}"
              aria-label="Tile ${v}, count: ${count}">
        ${v}
        <span class="tile-badge" style="display:${count > 0 ? 'flex' : 'none'}">${count}</span>
      </button>
    `;
  }
  // Joker (value 30)
  const jokerCount = sel[30] || 0;
  tilesHtml += `
    <button class="tile tile-joker${jokerCount > 0 ? ' tile-active' : ''}"
            data-action="tap-tile" data-player-id="${playerId}" data-value="30"
            aria-label="Joker, count: ${jokerCount}">
      J
      <span class="tile-badge" style="display:${jokerCount > 0 ? 'flex' : 'none'}">${jokerCount}</span>
    </button>
  `;

  const total = calculateTileTotal(sel);
  const count = calculateTileCount(sel);

  return `
    <div class="tile-picker">
      <div class="tile-picker-header">
        <span class="tile-total-display">
          <span>${count}</span> ${t('roundEntry.tiles')} =
          <strong>${total}</strong> ${t('roundEntry.pts')}
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

function tapTile(playerId, value) {
  if (!tileSelections[playerId]) tileSelections[playerId] = {};
  tileSelections[playerId][value] = (tileSelections[playerId][value] || 0) + 1;
  renderRoundInputs();
}

function removeTile(playerId, value) {
  if (!tileSelections[playerId]) return;
  if ((tileSelections[playerId][value] || 0) > 0) {
    tileSelections[playerId][value]--;
    renderRoundInputs();
  }
}

async function submitRound() {
  const state = getState();
  let changes;

  if (state.settings.rule === 'standard') {
    if (!currentWinnerId) {
      await showAlert(t('dialog.selectWinner'));
      return;
    }

    const manualInputs = {};
    state.players.forEach((p) => {
      if (p.id !== currentWinnerId && useManualInput[p.id]) {
        const el = document.getElementById(`input-${p.id}`);
        if (el) manualInputs[p.id] = el.value;
      }
    });

    changes = calculateStandardRound(
      state.players, currentWinnerId, tileSelections, manualInputs
    );
  } else {
    const inputs = {};
    state.players.forEach((p) => {
      const el = document.getElementById(`input-${p.id}`);
      if (el) inputs[p.id] = el.value;
    });
    changes = calculateSimpleRound(state.players, inputs);
  }

  // Apply changes
  const players = state.players.map((p) => {
    const change = changes.find((c) => c.playerId === p.id);
    return { ...p, score: p.score + (change ? change.points : 0) };
  });

  const rounds = [...state.rounds, { id: Date.now(), changes }];

  setState((s) => ({ ...s, players, rounds }));

  closeModal('modal-round');
  renderScoreboard();
  showToast(t('toast.roundSaved'), 'success');

  // Animate score deltas
  animateScoreDeltas(changes);

  // Check for winner
  const winner = findWinner(players, state.settings);
  if (winner) {
    setTimeout(
      () => showWinnerCelebration(winner, players, rounds, state.settings),
      600
    );
  }
}

function animateScoreDeltas(changes) {
  changes.forEach((c) => {
    const scoreEl = document.querySelector(`.player-score[data-player-id="${c.playerId}"]`);
    if (!scoreEl) return;

    const delta = document.createElement('span');
    delta.className = `score-delta ${c.points >= 0 ? 'delta-pos' : 'delta-neg'}`;
    delta.textContent = `${c.points >= 0 ? '+' : ''}${c.points}`;
    scoreEl.style.position = 'relative';
    scoreEl.appendChild(delta);

    setTimeout(() => delta.remove(), 1500);
  });
}

// --- Winner Celebration ---

function showWinnerCelebration(winner, players, rounds, settings) {
  setText('winner-title-text', t('winner.title'));
  document.getElementById('winner-name').textContent = escapeHtml(winner.name);
  document.getElementById('winner-score').textContent = winner.score;
  setText('final-scores-heading', t('winner.finalScores'));

  const scoresList = document.getElementById('final-scores-list');
  scoresList.innerHTML = '';
  [...players]
    .sort((a, b) =>
      settings.scoreDirection === 'lowest' ? a.score - b.score : b.score - a.score
    )
    .forEach((p) => {
      const div = document.createElement('div');
      div.className = 'final-score-row';
      div.innerHTML = `
        <span><span class="player-color-dot" style="background:${p.color}"></span>${escapeHtml(p.name)}</span>
        <span class="final-score-value">${p.score}</span>
      `;
      scoresList.appendChild(div);
    });

  // Summary stats
  const summaryEl = document.getElementById('game-summary-stats');
  if (summaryEl) {
    const bestRound = { player: null, points: -Infinity };
    const roundWins = {};
    players.forEach((p) => (roundWins[p.id] = 0));

    rounds.forEach((r) => {
      r.changes.forEach((c) => {
        if (c.points > bestRound.points) {
          bestRound.points = c.points;
          bestRound.player = players.find((p) => p.id === c.playerId);
        }
      });
      const maxPts = Math.max(...r.changes.map((c) => c.points));
      const roundWinner = r.changes.find((c) => c.points === maxPts && c.points > 0);
      if (roundWinner && roundWins[roundWinner.playerId] !== undefined) {
        roundWins[roundWinner.playerId]++;
      }
    });

    const mostWinsEntry = Object.entries(roundWins).sort((a, b) => b[1] - a[1])[0];
    const mostWinsPlayer = players.find(
      (p) => p.id === parseInt(mostWinsEntry?.[0], 10)
    );

    summaryEl.innerHTML = `
      <div class="summary-stat">
        <span class="summary-label">${t('summary.totalRounds')}</span>
        <span class="summary-value">${rounds.length}</span>
      </div>
      ${bestRound.player
        ? `<div class="summary-stat">
            <span class="summary-label">${t('summary.bestRound')}</span>
            <span class="summary-value">${escapeHtml(bestRound.player.name)} (+${bestRound.points})</span>
          </div>`
        : ''}
      ${mostWinsPlayer
        ? `<div class="summary-stat">
            <span class="summary-label">${t('summary.mostWins')}</span>
            <span class="summary-value">${escapeHtml(mostWinsPlayer.name)} (${mostWinsEntry[1]})</span>
          </div>`
        : ''}
    `;
  }

  setText('winner-new-game-btn', t('winner.newGame'));
  setText('winner-keep-playing-btn', t('winner.keepPlaying'));
  setText('share-results-btn', t('summary.share'));

  openModal('modal-winner');
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

// --- History ---

function openHistory() {
  renderHistoryList();
  openModal('modal-history');
}

function renderHistoryList() {
  const state = getState();
  const list = document.getElementById('history-list');
  list.innerHTML = '';

  setText('history-modal-title', t('history.title'));

  if (state.rounds.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>${t('history.empty')}</p>
    </div>`;
    return;
  }

  [...state.rounds].reverse().forEach((round, idx) => {
    const actualRoundNum = state.rounds.length - idx;
    const div = document.createElement('div');
    div.className = 'history-item stagger-in';
    div.style.animationDelay = `${idx * 40}ms`;

    let badges = '';
    round.changes.forEach((c) => {
      const player = state.players.find((p) => p.id === c.playerId);
      const pName = player ? escapeHtml(player.name.substring(0, 4)) : '???';
      const color = player ? player.color : '#666';
      const cls = c.points > 0 ? 'badge-pos' : c.points < 0 ? 'badge-neg' : '';
      badges += `<div class="score-badge ${cls}">
        <span class="badge-dot" style="background:${color}"></span>
        ${pName} ${c.points > 0 ? '+' : ''}${c.points}
      </div>`;
    });

    div.innerHTML = `
      <div class="history-round-num">${t('history.round')} ${actualRoundNum}</div>
      <div class="history-badges">${badges}</div>
      <button class="delete-round-btn" data-action="delete-round" data-round-id="${round.id}"
              aria-label="Delete round ${actualRoundNum}">&times;</button>
    `;
    list.appendChild(div);
  });
}

async function deleteRound(roundId) {
  const confirmed = await showDialog({
    title: t('dialog.deleteRoundTitle'),
    message: t('dialog.deleteRoundMsg'),
    danger: true,
  });
  if (!confirmed) return;

  const state = getState();
  const rounds = state.rounds.filter((r) => r.id !== roundId);
  const players = recalculateScores(
    state.players.map((p) => ({ ...p })),
    rounds
  );

  setState((s) => ({ ...s, players, rounds }));
  renderHistoryList();
  renderScoreboard();
  showToast(t('toast.roundDeleted'));
}

// --- Undo ---

async function undoLastRound() {
  const state = getState();
  if (state.rounds.length === 0) {
    await showAlert(t('dialog.noRoundsUndo'));
    return;
  }

  const confirmed = await showDialog({
    title: t('dialog.undoTitle'),
    message: t('dialog.undoMsg'),
  });
  if (!confirmed) return;

  const rounds = state.rounds.slice(0, -1);
  const players = recalculateScores(
    state.players.map((p) => ({ ...p })),
    rounds
  );

  setState((s) => ({ ...s, players, rounds }));
  renderScoreboard();
  showToast(t('toast.roundUndone'));
}

// --- Chart ---

function openChart() {
  const state = getState();
  setText('chart-modal-title', t('chart.title'));
  openModal('modal-chart');

  requestAnimationFrame(() => {
    const canvas = document.getElementById('score-chart');
    if (canvas) renderChart(canvas, state.players, state.rounds);
  });
}

// --- Archive ---

function openArchive() {
  renderArchiveList();
  openModal('modal-archive');
}

function renderArchiveList() {
  const archive = getArchive();
  const list = document.getElementById('archive-list');
  list.innerHTML = '';

  setText('archive-modal-title', t('archive.title'));

  if (archive.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🗃️</div>
      <p>${t('archive.empty')}</p>
    </div>`;
    return;
  }

  archive.forEach((game) => {
    const div = document.createElement('div');
    div.className = 'archive-item';

    const date = new Date(game.date);
    const dateStr = date.toLocaleDateString(
      getLanguage() === 'es' ? 'es-ES' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric' }
    );

    const winnerPlayer = [...game.players].sort((a, b) => b.score - a.score)[0];
    const playerNames = game.players.map((p) => escapeHtml(p.name)).join(', ');

    div.innerHTML = `
      <div class="archive-info">
        <div class="archive-date">${dateStr}</div>
        <div class="archive-players">${playerNames}</div>
        <div class="archive-meta">
          ${game.rounds.length} ${t('archive.rounds')}
          · 🏆 ${escapeHtml(winnerPlayer?.name || '?')} (${winnerPlayer?.score || 0})
        </div>
      </div>
      <button class="delete-round-btn" data-action="delete-archive"
              data-archive-id="${game.id}"
              aria-label="${t('archive.delete')}">&times;</button>
    `;
    list.appendChild(div);
  });
}

async function handleDeleteArchive(archiveId) {
  const confirmed = await showDialog({
    title: t('dialog.deleteArchiveTitle'),
    message: t('dialog.deleteArchiveMsg'),
    danger: true,
  });
  if (!confirmed) return;
  deleteArchiveEntry(archiveId);
  renderArchiveList();
}

// --- Settings ---

function openSettings() {
  const state = getState();

  setText('settings-modal-title', t('settings.title'));
  setText('label-theme', t('settings.theme'));
  setText('label-language', t('settings.language'));

  document.querySelectorAll('.segment[data-group="theme"]').forEach((el) => {
    el.classList.toggle('active', el.dataset.value === state.settings.theme);
    el.textContent = t(`settings.${el.dataset.value}`);
  });

  document.querySelectorAll('.segment[data-group="language"]').forEach((el) => {
    el.classList.toggle('active', el.dataset.value === state.settings.language);
  });

  openModal('modal-settings');
}

// --- Share ---

async function shareResults() {
  const state = getState();
  const sorted = [...state.players].sort((a, b) =>
    state.settings.scoreDirection === 'lowest' ? a.score - b.score : b.score - a.score
  );

  let text = `🎲 Rummikub - ${t('summary.title')}\n`;
  text += `${t('summary.totalRounds')}: ${state.rounds.length}\n\n`;

  sorted.forEach((p, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    text += `${medal} ${p.name}: ${p.score}\n`;
  });

  if (navigator.share) {
    try {
      await navigator.share({ text });
      showToast(t('toast.shared'), 'success');
    } catch { /* cancelled */ }
  } else {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('toast.copied'), 'success');
    } catch { /* fallback */ }
  }
}

// --- Game Actions ---

function addPlayer() {
  const state = getState();
  if (state.players.length >= 6) return;

  const newId = Date.now();
  const idx = state.players.length;
  const name = getLanguage() === 'es' ? `Jugador ${idx + 1}` : `Player ${idx + 1}`;

  setState((s) => ({
    ...s,
    players: [
      ...s.players,
      { id: newId, name, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], score: 0 },
    ],
  }));
  renderSetup();
}

function removePlayer(index) {
  const state = getState();
  if (state.players.length <= 2) return;
  setState((s) => ({
    ...s,
    players: s.players.filter((_, i) => i !== index),
  }));
  renderSetup();
}

const debouncedSave = debounce((index, value) => {
  const state = getState();
  const players = state.players.map((p, i) =>
    i === index ? { ...p, name: value } : p
  );
  setState((s) => ({ ...s, players }));
}, 300);

function startGame() {
  const targetInput = document.getElementById('target-score');
  const targetVal = targetInput ? parseInt(targetInput.value, 10) : null;

  setState((s) => ({
    ...s,
    settings: { ...s.settings, targetScore: targetVal || null },
    gameActive: true,
    rounds: [],
    players: s.players.map((p) => ({ ...p, score: 0 })),
  }));

  showView('view-scoreboard');
  renderScoreboard();
}

function quickStart() {
  const config = getLastGameConfig();
  if (!config) return;

  setState((s) => ({
    ...s,
    players: config.players,
    settings: { ...s.settings, ...config.settings },
    gameActive: true,
    rounds: [],
  }));

  showView('view-scoreboard');
  renderScoreboard();
}

async function confirmEndGame() {
  const confirmed = await showDialog({
    title: t('dialog.endGameTitle'),
    message: t('dialog.endGameMsg'),
    danger: true,
  });
  if (!confirmed) return;

  const state = getState();
  if (state.rounds.length > 0) {
    archiveCurrentGame();
    showToast(t('toast.gameArchived'));
  }

  setState((s) => ({
    ...s,
    gameActive: false,
    players: s.players.map((p) => ({ ...p, score: 0 })),
    rounds: [],
  }));

  showView('view-setup');
  renderSetup();
}

function newGameFromWinner() {
  closeModal('modal-winner');
  const state = getState();
  if (state.rounds.length > 0) archiveCurrentGame();

  setState((s) => ({
    ...s,
    gameActive: false,
    players: s.players.map((p) => ({ ...p, score: 0 })),
    rounds: [],
  }));

  showView('view-setup');
  renderSetup();
}

// --- Event Delegation ---

let longPressTimer = null;

function registerEvents() {
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('contextmenu', handleContextMenu);

  // Long press for tile removal on mobile
  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('pointercancel', handlePointerUp);
}

function handleClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const playerId = target.dataset.playerId
    ? parseInt(target.dataset.playerId, 10)
    : null;
  const index =
    target.dataset.index !== undefined ? parseInt(target.dataset.index, 10) : null;

  switch (action) {
    // Setup
    case 'add-player':
      addPlayer();
      break;
    case 'remove-player':
      removePlayer(index);
      break;
    case 'set-rule': {
      const rule = target.dataset.value;
      setState((s) => ({ ...s, settings: { ...s.settings, rule } }));
      renderSetup();
      break;
    }
    case 'start-game':
      startGame();
      break;
    case 'quick-start':
      quickStart();
      break;

    // Scoreboard
    case 'open-round-entry':
      openRoundEntry();
      break;
    case 'undo-last-round':
      undoLastRound();
      break;
    case 'end-game':
      confirmEndGame();
      break;
    case 'toggle-sort':
      setState((s) => ({
        ...s,
        settings: { ...s.settings, sortByScore: !s.settings.sortByScore },
      }));
      renderScoreboard();
      break;

    // Round Entry
    case 'toggle-winner':
      currentWinnerId = currentWinnerId === playerId ? null : playerId;
      renderRoundInputs();
      break;
    case 'tap-tile': {
      const value = parseInt(target.dataset.value, 10);
      tapTile(playerId, value);
      break;
    }
    case 'clear-tiles':
      tileSelections[playerId] = {};
      renderRoundInputs();
      break;
    case 'toggle-input-mode':
      useManualInput[playerId] = !useManualInput[playerId];
      renderRoundInputs();
      break;
    case 'submit-round':
      submitRound();
      break;
    case 'close-round':
      closeModal('modal-round');
      break;

    // History
    case 'open-history':
      openHistory();
      break;
    case 'close-history':
      closeModal('modal-history');
      break;
    case 'delete-round': {
      const roundId = parseInt(target.dataset.roundId, 10);
      deleteRound(roundId);
      break;
    }

    // Winner
    case 'new-game-winner':
      newGameFromWinner();
      break;
    case 'keep-playing':
      closeModal('modal-winner');
      break;
    case 'share-results':
      shareResults();
      break;

    // Chart
    case 'open-chart':
      openChart();
      break;
    case 'close-chart':
      closeModal('modal-chart');
      break;

    // Archive
    case 'open-archive':
      openArchive();
      break;
    case 'close-archive':
      closeModal('modal-archive');
      break;
    case 'delete-archive': {
      const archiveId = parseInt(target.dataset.archiveId, 10);
      handleDeleteArchive(archiveId);
      break;
    }

    // Settings
    case 'open-settings':
      openSettings();
      break;
    case 'close-settings':
      closeModal('modal-settings');
      break;
    case 'set-theme': {
      const theme = target.dataset.value;
      applyTheme(theme);
      setState((s) => ({ ...s, settings: { ...s.settings, theme } }));
      document.querySelectorAll('.segment[data-group="theme"]').forEach((el) => {
        el.classList.toggle('active', el.dataset.value === theme);
      });
      break;
    }
    case 'set-language': {
      const lang = target.dataset.value;
      setLanguage(lang);
      setState((s) => ({ ...s, settings: { ...s.settings, language: lang } }));
      document.querySelectorAll('.segment[data-group="language"]').forEach((el) => {
        el.classList.toggle('active', el.dataset.value === lang);
      });
      break;
    }
  }
}

function handleInput(e) {
  const target = e.target;
  if (target.dataset.action === 'update-player-name') {
    const index = parseInt(target.dataset.index, 10);
    debouncedSave(index, target.value);
  }
}

function handleContextMenu(e) {
  const tile = e.target.closest('[data-action="tap-tile"]');
  if (tile) {
    e.preventDefault();
    const playerId = parseInt(tile.dataset.playerId, 10);
    const value = parseInt(tile.dataset.value, 10);
    removeTile(playerId, value);
  }
}

function handlePointerDown(e) {
  const tile = e.target.closest('[data-action="tap-tile"]');
  if (!tile) return;

  longPressTimer = setTimeout(() => {
    const playerId = parseInt(tile.dataset.playerId, 10);
    const value = parseInt(tile.dataset.value, 10);
    removeTile(playerId, value);
    longPressTimer = null;
  }, 500);
}

function handlePointerUp() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

// --- Helpers ---

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// --- Start ---
init();
