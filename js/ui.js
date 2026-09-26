import { t } from './i18n.js';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// --- Custom Dialog (replaces alert/confirm) ---

let dialogResolve = null;
let dialogReturnFocus = null;

function openDialog({ title, message, confirmText, confirmClass, showCancel, cancelText }) {
  // A new dialog replaces a pending one: settle the old promise as cancelled
  if (dialogResolve) dialogResolve(false);

  const el = document.getElementById('custom-dialog');
  el.querySelector('.dialog-title').textContent = title || '';
  el.querySelector('.dialog-message').textContent = message;

  const confirmBtn = el.querySelector('[data-action="dialog-confirm"]');
  const cancelBtn = el.querySelector('[data-action="dialog-cancel"]');

  confirmBtn.textContent = confirmText;
  confirmBtn.className = confirmClass;
  cancelBtn.textContent = cancelText || t('dialog.cancel');
  cancelBtn.classList.toggle('hidden', !showCancel);

  dialogReturnFocus = document.activeElement;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  confirmBtn.focus();
}

export function showDialog({ title, message, confirmText, cancelText, danger = false }) {
  return new Promise((resolve) => {
    openDialog({
      title,
      message,
      confirmText: confirmText || t('dialog.confirm'),
      confirmClass: danger ? 'btn btn-danger' : 'btn btn-primary',
      showCancel: true,
      cancelText,
    });
    dialogResolve = resolve;
  });
}

export function showAlert(message, title) {
  return new Promise((resolve) => {
    openDialog({
      title,
      message,
      confirmText: t('dialog.ok'),
      confirmClass: 'btn btn-primary',
      showCancel: false,
    });
    dialogResolve = resolve;
  });
}

export function resolveDialog(result) {
  const el = document.getElementById('custom-dialog');
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus();
  dialogReturnFocus = null;
  if (dialogResolve) {
    const resolve = dialogResolve;
    dialogResolve = null;
    resolve(result);
  }
}

// --- Toast Notifications ---

/**
 * @param {string} message
 * @param {'info'|'success'} [type]
 * @param {{ actionLabel?: string, onAction?: Function, duration?: number }} [options]
 *   duration 0 keeps the toast until its action is used.
 */
export function showToast(message, type = 'info', { actionLabel, onAction, duration = 2500 } = {}) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);

  const dismiss = () => {
    toast.classList.remove('visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  if (actionLabel && onAction) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => {
      dismiss();
      onAction();
    });
    toast.appendChild(btn);
  }

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  if (duration > 0) setTimeout(dismiss, duration);
}

// --- Modal Management ---

const modalStack = [];
const returnFocus = new Map();
// Number of popstate events caused by our own history.back() calls
let pendingPops = 0;

export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal || modal.classList.contains('open')) return;

  returnFocus.set(id, document.activeElement);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modalStack.push(id);

  requestAnimationFrame(() => {
    const focusable = modal.querySelector(FOCUSABLE);
    if (focusable) focusable.focus();
  });

  // History entry so the Android/browser back button closes the modal
  history.pushState({ modal: id }, '');
}

/**
 * @param {string} id
 * @param {{ fromHistory?: boolean }} [options] fromHistory is set when the
 *   close was triggered by the back button, so no history entry must be removed.
 */
export function closeModal(id, { fromHistory = false } = {}) {
  const modal = document.getElementById(id);
  if (!modal || !modal.classList.contains('open')) return;

  const finish = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    content?.classList.remove('closing');
  };

  const content = modal.querySelector('.modal-content');
  if (content) {
    content.classList.add('closing');
    content.addEventListener('animationend', finish, { once: true });
  } else {
    finish();
  }

  const idx = modalStack.indexOf(id);
  if (idx >= 0) modalStack.splice(idx, 1);

  const focusTarget = returnFocus.get(id);
  returnFocus.delete(id);
  if (focusTarget?.isConnected) focusTarget.focus();

  // Drop the history entry we pushed when opening, keeping back-button behaviour in sync
  if (!fromHistory && history.state?.modal === id) {
    pendingPops++;
    history.back();
  }
}

export function closeTopModal() {
  if (modalStack.length > 0) {
    closeModal(modalStack[modalStack.length - 1]);
    return true;
  }
  return false;
}

export function isModalOpen(id) {
  return id ? modalStack.includes(id) : modalStack.length > 0;
}

// --- Focus Trapping ---

function handleFocusTrap(e) {
  if (e.key !== 'Tab') return;
  const modal = e.currentTarget;
  // Query on every keypress: modal contents are re-rendered dynamically
  const focusable = [...modal.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// --- Segmented controls (ARIA radio groups) ---

/** Marks `value` as the selected option of a `data-group` segmented control. */
export function setSegmentValue(group, value) {
  document.querySelectorAll(`.segment[data-group="${group}"]`).forEach((el) => {
    const selected = el.dataset.value === value;
    el.classList.toggle('active', selected);
    el.setAttribute('aria-checked', String(selected));
    el.tabIndex = selected ? 0 : -1;
  });
}

function handleRadioKeys(e) {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  const current = e.target.closest('[role="radio"]');
  const group = current?.closest('[role="radiogroup"]');
  if (!group) return;

  const radios = [...group.querySelectorAll('[role="radio"]')];
  let idx = radios.indexOf(current);
  if (e.key === 'Home') idx = 0;
  else if (e.key === 'End') idx = radios.length - 1;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
    idx = (idx - 1 + radios.length) % radios.length;
  else idx = (idx + 1) % radios.length;

  e.preventDefault();
  radios[idx].focus();
  radios[idx].click();
}

// --- Init ---

export function initUI() {
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
  document.addEventListener('keydown', handleRadioKeys);

  window.addEventListener('popstate', () => {
    if (pendingPops > 0) {
      pendingPops--;
      return;
    }
    if (modalStack.length > 0) {
      closeModal(modalStack[modalStack.length - 1], { fromHistory: true });
    }
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    // Backdrop click closes modal
    modal.addEventListener('click', (e) => {
      if (e.target !== modal) return;
      if (modal.id === 'custom-dialog') resolveDialog(false);
      else closeModal(modal.id);
    });
    modal.addEventListener('keydown', handleFocusTrap);
  });

  document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'dialog-confirm') resolveDialog(true);
    else if (action === 'dialog-cancel') resolveDialog(false);
  });
}

// --- Utilities ---

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/** First visible character of a name (emoji-safe), for avatars. */
export function initial(name) {
  const first = Array.from(String(name).trim())[0];
  return first ? first.toUpperCase() : '?';
}
