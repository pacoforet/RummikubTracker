import { t, getLanguage } from '../i18n.js';
import { getArchive, deleteArchiveEntry, sortPlayersByScore } from '../state.js';
import { escapeHtml, openModal, showDialog } from '../ui.js';

function renderArchiveList() {
  const archive = getArchive();
  const list = document.getElementById('archive-list');
  list.innerHTML = '';

  if (archive.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🗃️</div>
      <p>${t('archive.empty')}</p>
    </div>`;
    return;
  }

  const locale = getLanguage() === 'es' ? 'es-ES' : 'en-US';
  archive.forEach((game) => {
    const div = document.createElement('div');
    div.className = 'archive-item';

    const dateStr = new Date(game.date).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const winnerPlayer = sortPlayersByScore(game.players)[0];
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

export const actions = {
  'open-archive': () => {
    renderArchiveList();
    openModal('modal-archive');
  },
  'delete-archive': (target) => handleDeleteArchive(Number(target.dataset.archiveId)),
};
