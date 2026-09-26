import { getState } from '../state.js';
import { t } from '../i18n.js';
import { renderSetup } from './setup.js';
import { renderScoreboard } from './scoreboard.js';

function showView(viewId) {
  document
    .querySelectorAll('.view')
    .forEach((el) => el.classList.toggle('active', el.id === viewId));

  const inGame = viewId === 'view-scoreboard';
  document.getElementById('history-btn')?.classList.toggle('hidden', !inGame);
  document.getElementById('chart-btn')?.classList.toggle('hidden', !inGame);
  document.getElementById('archive-btn')?.classList.toggle('hidden', inGame);
  document.getElementById('settings-btn')?.classList.toggle('hidden', inGame);
}

export function updateHeaderTitle() {
  const state = getState();
  const el = document.getElementById('header-title');
  if (state.gameActive && state.settings.targetScore) {
    el.textContent = `${t('scoreboard.targetPrefix')} ${state.settings.targetScore}`;
  } else {
    el.textContent = t('app.title');
  }
}

export function goToSetup() {
  showView('view-setup');
  renderSetup();
}

export function goToScoreboard() {
  showView('view-scoreboard');
  renderScoreboard();
}

export function renderCurrentView() {
  if (getState().gameActive) goToScoreboard();
  else goToSetup();
}
