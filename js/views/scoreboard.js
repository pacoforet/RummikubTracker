import { t } from '../i18n.js';
import {
  getState,
  setState,
  recalculateScores,
  findWinner,
  getPlayerStats,
  getSortedPlayers,
  getPositions,
  archiveCurrentGame,
  ARCHIVE_LIMIT,
} from '../state.js';
import { escapeHtml, setText, initial, showDialog, showAlert, showToast } from '../ui.js';
import { updateHeaderTitle, goToSetup } from './navigation.js';

export function renderScoreboard() {
  const state = getState();
  updateHeaderTitle();

  setText('round-display', String(state.rounds.length + 1));
  setText('goal-display', state.settings.targetScore || t('scoreboard.noTarget'));

  const sortBtn = document.getElementById('sort-btn');
  sortBtn.classList.toggle('active', state.settings.sortByScore);
  sortBtn.setAttribute('aria-pressed', String(state.settings.sortByScore));

  const grid = document.getElementById('leaderboard');
  grid.innerHTML = '';

  const sorted = getSortedPlayers(state.players, state.rounds, state.settings.sortByScore);
  const positions = getPositions(state.players, state.rounds);

  grid.className = 'leaderboard-grid';
  if (sorted.length === 3 || sorted.length >= 5) grid.classList.add('grid-3');

  sorted.forEach((p) => {
    const position = positions[p.id];
    const isLeader = position === 1 && p.score !== 0;
    const stats = getPlayerStats(p, state.rounds);
    const posLabel = position > 0 ? t('scoreboard.position')[position - 1] || `${position}` : '';

    const card = document.createElement('div');
    card.className = `score-card${isLeader ? ' leader' : ''}`;
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `${p.name}: ${p.score} ${t('roundEntry.pts')}`);

    card.innerHTML = `
      ${
        position > 0
          ? `<span class="position-badge pos-${Math.min(position, 4)}">${posLabel}</span>`
          : ''
      }
      <div class="player-avatar${isLeader ? ' leader' : ''}" style="background:${p.color}">
        ${escapeHtml(initial(p.name))}
      </div>
      <div class="player-name">${escapeHtml(p.name)}</div>
      <div class="player-score ${p.score < 0 ? 'negative' : ''}" data-player-id="${p.id}">
        ${p.score}
      </div>
      ${
        state.rounds.length > 0
          ? `<div class="player-mini-stats">
            <span title="${t('stats.roundsWon')}">${stats.roundsWon}W</span>
            <span title="${t('stats.avgPerRound')}">${stats.avgPerRound > 0 ? '+' : ''}${stats.avgPerRound}/r</span>
          </div>`
          : ''
      }
    `;
    grid.appendChild(card);
  });
}

export function animateScoreDeltas(changes) {
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

/**
 * Replaces the round list, recomputing scores. If the target is no longer
 * reached, the winner can be celebrated again once it is.
 */
export function applyRounds(rounds) {
  const state = getState();
  const players = recalculateScores(
    state.players.map((p) => ({ ...p })),
    rounds
  );
  const stillWon = findWinner(players, state.settings);
  setState((s) => ({
    ...s,
    players,
    rounds,
    winnerAnnounced: stillWon ? s.winnerAnnounced : null,
  }));
}

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

  applyRounds(getState().rounds.slice(0, -1));
  renderScoreboard();
  showToast(t('toast.roundUndone'));
}

/** Archives the current game (if it has rounds) and returns to setup. */
export function finishGame() {
  const state = getState();
  if (state.rounds.length > 0) {
    const { trimmed } = archiveCurrentGame();
    showToast(t('toast.gameArchived'));
    if (trimmed)
      showToast(t('toast.archiveTrimmed', { n: ARCHIVE_LIMIT }), 'info', { duration: 4000 });
  }

  setState((s) => ({
    ...s,
    gameActive: false,
    winnerAnnounced: null,
    players: s.players.map((p) => ({ ...p, score: 0 })),
    rounds: [],
  }));
  goToSetup();
}

async function confirmEndGame() {
  const confirmed = await showDialog({
    title: t('dialog.endGameTitle'),
    message: t('dialog.endGameMsg'),
    danger: true,
  });
  if (confirmed) finishGame();
}

function toggleSort() {
  setState((s) => ({
    ...s,
    settings: { ...s.settings, sortByScore: !s.settings.sortByScore },
  }));
  renderScoreboard();
}

export const actions = {
  'undo-last-round': () => undoLastRound(),
  'end-game': () => confirmEndGame(),
  'toggle-sort': () => toggleSort(),
};
