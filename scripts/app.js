/* App-wide bootstrap: service worker, navigation state, and a shared autosave
 * controller. Loaded after utils.js and storage.js on every page. */

/* ---------- Service worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });

    // When a new worker takes control, reload once so the user always runs the
    // latest assets without a hard refresh.
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}

/* ---------- Active navigation link ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const here = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.appbar-nav a').forEach((link) => {
    if (link.getAttribute('href') === here) link.classList.add('is-active');
  });
});

/* ---------- Autosave controller ----------
 * Centralises save behaviour for the editor pages:
 *   - markDirty(): debounced background save + "unsaved" status
 *   - save(announce): immediate save, optional toast
 *   - flushes automatically when the page is hidden or unloaded
 */
function createAutosave({ getData, statusEl }) {
  let lastSnapshot = null;

  const setStatus = (state, text) => {
    if (!statusEl) return;
    statusEl.dataset.state = state;
    statusEl.textContent = text;
  };

  const save = (announce = false) => {
    const data = getData();
    const snapshot = JSON.stringify(data);

    // Nothing changed and this isn't an explicit request — skip the write.
    if (snapshot === lastSnapshot && !announce) return true;

    setStatus('saving', 'Saving…');
    const ok = storage.saveProgram(data);
    if (ok) {
      lastSnapshot = snapshot;
      setStatus('saved', 'Saved');
      if (announce) showToast('Program saved', 'success');
    } else {
      setStatus('error', 'Save failed');
      if (announce) showToast('Could not save program', 'error');
    }
    return ok;
  };

  const scheduleSave = debounce(() => save(false), 800);

  const markDirty = () => {
    setStatus('dirty', 'Unsaved changes');
    scheduleSave();
  };

  // Treat the freshly-loaded state as "saved" so we don't nag on open.
  const markClean = () => {
    lastSnapshot = JSON.stringify(getData());
    setStatus('saved', 'Saved');
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save(false);
  });
  window.addEventListener('pagehide', () => save(false));

  return { save, scheduleSave, markDirty, markClean, setStatus };
}
