/* Shared utility helpers (no external dependencies). */

/** Generate a RFC4122 v4 UUID, preferring the native crypto implementation. */
function generateUUID() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Format a date as YYYY-MM-DD (local). */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Format a date as a readable string, e.g. "Jan 15, 2025". */
function formatDateReadable(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Escape a string for safe insertion as text inside HTML. */
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/** Read a query-string parameter. */
function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

/** Debounce a function by `wait` ms. */
function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** Trigger a client-side download of a text payload. */
function downloadFile(content, filename, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Grow a textarea to fit its content. */
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

/** Wire auto-resize on every textarea in (or matching) a root element. */
function initAutoResizeTextareas(root = document) {
  root.querySelectorAll('textarea').forEach((ta) => {
    ta.addEventListener('input', () => autoResizeTextarea(ta));
    autoResizeTextarea(ta);
  });
}

/* ---------- Toasts ---------- */

function getToastHost() {
  let host = document.querySelector('.toast-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  return host;
}

/** Show a transient notification. type: 'success' | 'error' | 'info'. */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  getToastHost().appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ---------- Confirm dialog ---------- */

/** Promise-based confirmation modal. Resolves to true/false. */
function showConfirm(message, { confirmLabel = 'Confirm', danger = true } = {}) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true">
        <h3>Please confirm</h3>
        <p></p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-act="cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok"></button>
        </div>
      </div>`;
    modal.querySelector('p').textContent = message;
    modal.querySelector('[data-act="ok"]').textContent = confirmLabel;
    document.body.appendChild(modal);

    const close = (result) => {
      modal.remove();
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close(false);
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'ok') close(true);
      if (act === 'cancel') close(false);
    });
    document.addEventListener('keydown', onKey);
    modal.querySelector('[data-act="ok"]').focus();
  });
}
