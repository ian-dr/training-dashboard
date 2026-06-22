# Training Dashboard

A small, offline-capable Progressive Web App for planning strength and weekly
training programs. Built with plain HTML, CSS and JavaScript — no build step.

## Features

- **Two program types**
  - *Strength* — days, exercises, sets/reps/load/tempo, supersets (groups), and
    drag-to-reorder.
  - *Weekly* — a full week of sessions with start times, training models,
    comments and automatic minute/hour totals.
- **Reliable autosave** — changes save automatically (debounced) and again when
  the page is hidden or closed, with a live "Saved / Saving / Unsaved" indicator.
- **History** — search, filter and sort every saved program; duplicate or delete.
- **Backup** — export all programs to a JSON file and re-import it later.
- **Export & print** — save a program as a PNG image or print it.
- **Works offline** — a service worker caches the app shell and all assets
  (including the image-export library, which is vendored locally).

All data is stored locally in your browser's `localStorage`; nothing is sent
anywhere.

## Running locally

The app is fully static. Serve the folder over HTTP (a service worker won't run
from `file://`):

```bash
# Python 3
python -m http.server 8000

# or Node
npx serve .
```

Then open http://localhost:8000.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Dashboard: create programs, recent list, summary stats |
| `history.html` | Browse, search, back up and manage programs |
| `strength-template.html` | Strength program editor |
| `weekly_training_program_template.html` | Weekly schedule editor |
| `styles/main.css` | Design system (single source of truth) |
| `scripts/utils.js` | Shared helpers (toasts, dialogs, formatting) |
| `scripts/storage.js` | `localStorage` persistence layer |
| `scripts/app.js` | Service-worker registration, nav state, autosave controller |
| `sw.js` | Service worker (offline + update strategy) |
| `vendor/html2canvas.min.js` | Local copy of the image-export library |

## Data & backups

Use **History → Export backup** to download a JSON snapshot of every program,
and **Import** to restore it. Keep a backup before clearing data or switching
browsers, since storage is per-browser.
