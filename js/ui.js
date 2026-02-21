import { t } from './i18n.js';

// --- Custom Dialog (replaces alert/confirm) ---

let dialogResolve = null;

export function showDialog({ title, message, confirmText, cancelText, danger = false }) {
  return new Promise((resolve) => {
    dialogResolve = resolve;
    const el = document.getElementById('custom-dialog');
    el.querySelector('.dialog-title').textContent = title;
    el.querySelector('.dialog-message').textContent = message;

    const confirmBtn = el.querySelector('[data-action="dialog-confirm"]');
    const cancelBtn = el.querySelector('[data-action="dialog-cancel"]');

    confirmBtn.textContent = confirmText || t('dialog.confirm');
    cancelBtn.textContent = cancelText || t('dialog.cancel');
    confirmBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';

    cancelBtn.style.display = '';
    el.classList.add('open');
    confirmBtn.focus();
  });
}

export function showAlert(message, title) {
  return new Promise((resolve) => {
    dialogResolve = resolve;
    const el = document.getElementById('custom-dialog');
    el.querySelector('.dialog-title').textContent = title || '';
    el.querySelector('.dialog-message').textContent = message;

    const confirmBtn = el.querySelector('[data-action="dialog-confirm"]');
    const cancelBtn = el.querySelector('[data-action="dialog-cancel"]');

    confirmBtn.textContent = t('dialog.ok');
    confirmBtn.className = 'btn btn-primary';
    cancelBtn.style.display = 'none';
    el.classList.add('open');
    confirmBtn.focus();
  });
}

export function resolveDialog(result) {
  const el = document.getElementById('custom-dialog');
  el.classList.remove('open');
  if (dialogResolve) {
    dialogResolve(result);
    dialogResolve = null;
  }
}

// --- Toast Notifications ---

const toastQueue = [];
let toastTimeout = null;

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 2500);
}

// --- Modal Management ---

const modalStack = [];

export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modalStack.push(id);

  // Focus first focusable element
  requestAnimationFrame(() => {
    const focusable = modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
  });

  // Push history state for back button handling
  history.pushState({ modal: id }, '');
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal || !modal.classList.contains('open')) return;

  const content = modal.querySelector('.modal-content');
  if (content) {
    content.classList.add('closing');
    content.addEventListener(
      'animationend',
      () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        content.classList.remove('closing');
      },
      { once: true }
    );
  } else {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  const idx = modalStack.indexOf(id);
  if (idx >= 0) modalStack.splice(idx, 1);
}

export function closeTopModal() {
  if (modalStack.length > 0) {
    closeModal(modalStack[modalStack.length - 1]);
    return true;
  }
  return false;
}

export function isModalOpen() {
  return modalStack.length > 0;
}

// --- Focus Trapping ---

export function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

// --- Init ---

export function initUI() {
  // Escape key closes top modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const dialogEl = document.getElementById('custom-dialog');
      if (dialogEl.classList.contains('open')) {
        resolveDialog(false);
        return;
      }
      closeTopModal();
    }
  });

  // Back button closes modal
  window.addEventListener('popstate', (e) => {
    if (modalStack.length > 0) {
      closeModal(modalStack[modalStack.length - 1]);
    }
  });

  // Backdrop click closes modal
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal.id === 'custom-dialog') {
          resolveDialog(false);
        } else {
          closeModal(modal.id);
        }
      }
    });
  });

  // Setup focus trapping on modals
  document.querySelectorAll('.modal').forEach(trapFocus);

  // Dialog button handlers
  document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'dialog-confirm') resolveDialog(true);
    else if (action === 'dialog-cancel') resolveDialog(false);
  });
}

// --- Utility: escapeHtml ---

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Utility: debounce ---

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
