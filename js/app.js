import { t, setLanguage, onLanguageChange, translateDocument } from './i18n.js';
import { loadState } from './state.js';
import { initUI, closeModal, isModalOpen, showToast } from './ui.js';
import { applyTheme, watchSystemTheme } from './theme.js';
import { renderCurrentView } from './views/navigation.js';
import * as setup from './views/setup.js';
import * as scoreboard from './views/scoreboard.js';
import * as roundEntry from './views/roundEntry.js';
import * as winner from './views/winner.js';
import * as historyView from './views/history.js';
import * as archive from './views/archive.js';
import * as settings from './views/settings.js';

// Every `data-action` value maps to one handler, owned by the view module it belongs to
const actions = {
  ...setup.actions,
  ...scoreboard.actions,
  ...roundEntry.actions,
  ...winner.actions,
  ...historyView.actions,
  ...archive.actions,
  ...settings.actions,
  'close-modal': (target) => closeModal(target.dataset.modal),
};

const inputs = {
  ...setup.inputs,
  ...roundEntry.inputs,
};

function handleClick(e) {
  const target = e.target.closest('[data-action]');
  const handler = target && actions[target.dataset.action];
  if (handler) handler(target, e);
}

function handleInput(e) {
  const handler = inputs[e.target.dataset?.action];
  if (handler) handler(e.target, e);
}

function refreshChartIfOpen() {
  if (isModalOpen('modal-chart')) historyView.renderOpenChart();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Only reload on controller change when updating, not on the very first install
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  const offerUpdate = (worker) => {
    showToast(t('toast.updateAvailable'), 'info', {
      actionLabel: t('toast.reload'),
      onAction: () => worker.postMessage('SKIP_WAITING'),
      duration: 0,
    });
  };

  navigator.serviceWorker
    .register('./sw.js')
    .then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            offerUpdate(worker);
          }
        });
      });
    })
    .catch((e) => console.error('Service worker registration failed:', e));
}

function init() {
  const { state, recovered } = loadState();
  setLanguage(state.settings.language);
  applyTheme(state.settings.theme);
  translateDocument();
  initUI();

  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  roundEntry.registerRoundEntryEvents();

  onLanguageChange(() => {
    translateDocument();
    renderCurrentView();
    refreshChartIfOpen();
  });
  watchSystemTheme(refreshChartIfOpen);

  renderCurrentView();
  if (recovered) showToast(t('toast.dataRecovered'), 'info', { duration: 5000 });

  registerServiceWorker();
}

init();
