import { t } from '../i18n.js';
import { getState, sortPlayersByScore, getGameSummary } from '../state.js';
import { escapeHtml, setText, openModal, closeModal, showToast } from '../ui.js';
import { finishGame } from './scoreboard.js';

export function showWinnerCelebration(winner) {
  const { players, rounds } = getState();

  // textContent already escapes: don't run escapeHtml here
  setText('winner-name', winner.name);
  setText('winner-score', String(winner.score));

  const scoresList = document.getElementById('final-scores-list');
  scoresList.innerHTML = '';
  sortPlayersByScore(players).forEach((p) => {
    const div = document.createElement('div');
    div.className = 'final-score-row';
    div.innerHTML = `
      <span><span class="player-color-dot" style="background:${p.color}"></span>${escapeHtml(p.name)}</span>
      <span class="final-score-value">${p.score}</span>
    `;
    scoresList.appendChild(div);
  });

  const { totalRounds, bestRound, mostWins } = getGameSummary(players, rounds);
  document.getElementById('game-summary-stats').innerHTML = `
    <div class="summary-stat">
      <span class="summary-label">${t('summary.totalRounds')}</span>
      <span class="summary-value">${totalRounds}</span>
    </div>
    ${
      bestRound
        ? `<div class="summary-stat">
          <span class="summary-label">${t('summary.bestRound')}</span>
          <span class="summary-value">${escapeHtml(bestRound.player.name)} (+${bestRound.points})</span>
        </div>`
        : ''
    }
    ${
      mostWins
        ? `<div class="summary-stat">
          <span class="summary-label">${t('summary.mostWins')}</span>
          <span class="summary-value">${escapeHtml(mostWins.player.name)} (${mostWins.count})</span>
        </div>`
        : ''
    }
  `;

  openModal('modal-winner');
  navigator.vibrate?.([100, 50, 100]);
}

async function shareResults() {
  const state = getState();

  let text = `🎲 Rummikub - ${t('summary.title')}\n`;
  text += `${t('summary.totalRounds')}: ${state.rounds.length}\n\n`;
  sortPlayersByScore(state.players).forEach((p, i) => {
    const medal = ['🥇', '🥈', '🥉'][i] || '  ';
    text += `${medal} ${p.name}: ${p.score}\n`;
  });

  if (navigator.share) {
    try {
      await navigator.share({ text });
      showToast(t('toast.shared'), 'success');
    } catch {
      /* cancelled by the user */
    }
  } else {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('toast.copied'), 'success');
    } catch {
      /* clipboard unavailable */
    }
  }
}

export const actions = {
  'share-results': () => shareResults(),
  'keep-playing': () => closeModal('modal-winner'),
  'new-game-winner': () => {
    closeModal('modal-winner');
    finishGame();
  },
};
