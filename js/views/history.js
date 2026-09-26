import { t } from '../i18n.js';
import { getState } from '../state.js';
import { escapeHtml, openModal, showDialog, showToast } from '../ui.js';
import { renderChart } from '../chart.js';
import { renderScoreboard, applyRounds } from './scoreboard.js';

function renderHistoryList() {
  const state = getState();
  const list = document.getElementById('history-list');
  list.innerHTML = '';

  if (state.rounds.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>${t('history.empty')}</p>
    </div>`;
    return;
  }

  [...state.rounds].reverse().forEach((round, idx) => {
    const roundNum = state.rounds.length - idx;
    const div = document.createElement('div');
    div.className = 'history-item stagger-in';
    div.style.animationDelay = `${idx * 40}ms`;

    const badges = round.changes
      .map((c) => {
        const player = state.players.find((p) => p.id === c.playerId);
        const pName = player ? escapeHtml(Array.from(player.name).slice(0, 4).join('')) : '???';
        const color = player ? player.color : '#666';
        const cls = c.points > 0 ? 'badge-pos' : c.points < 0 ? 'badge-neg' : '';
        return `<div class="score-badge ${cls}">
          <span class="badge-dot" style="background:${color}"></span>
          ${pName} ${c.points > 0 ? '+' : ''}${c.points}
        </div>`;
      })
      .join('');

    div.innerHTML = `
      <div class="history-round-num">${t('history.round')} ${roundNum}</div>
      <div class="history-badges">${badges}</div>
      <button class="delete-round-btn" data-action="delete-round" data-round-id="${round.id}"
              aria-label="${t('a11y.deleteRound', { n: roundNum })}">&times;</button>
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

  applyRounds(getState().rounds.filter((r) => r.id !== roundId));
  renderHistoryList();
  renderScoreboard();
  showToast(t('toast.roundDeleted'));
}

export function renderOpenChart() {
  const { players, rounds } = getState();
  const canvas = document.getElementById('score-chart');
  if (canvas) renderChart(canvas, players, rounds, { noDataText: t('chart.noData') });
}

export const actions = {
  'open-history': () => {
    renderHistoryList();
    openModal('modal-history');
  },
  'delete-round': (target) => deleteRound(Number(target.dataset.roundId)),
  'open-chart': () => {
    openModal('modal-chart');
    requestAnimationFrame(renderOpenChart);
  },
};
