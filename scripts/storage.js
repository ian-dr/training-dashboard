/* Persistence layer for training programs (localStorage).
 *
 * Programs are stored as a single JSON array under STORAGE_KEY. Every read is
 * defensive: a corrupt or missing payload yields an empty list rather than a
 * thrown error, so the UI always has something to render.
 */

const storage = {
  STORAGE_KEY: 'training_programs',
  VERSION: 2,

  /** @returns {Array} all stored programs (never throws). */
  getAllPrograms() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Could not read programs from storage:', err);
      return [];
    }
  },

  /** Persist the full list. @returns {boolean} success. */
  _writeAll(programs) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(programs));
      return true;
    } catch (err) {
      console.error('Could not write programs to storage:', err);
      if (err && err.name === 'QuotaExceededError') {
        showToast('Storage is full — export and remove old programs.', 'error', 5000);
      }
      return false;
    }
  },

  /** @returns {Object|null} a single program by id. */
  getProgram(id) {
    return this.getAllPrograms().find((p) => p.id === id) || null;
  },

  /**
   * Create or update a program. The incoming object is merged over any
   * existing record so partial saves never drop sibling fields.
   * @returns {boolean} success.
   */
  saveProgram(program) {
    if (!program || !program.id) {
      console.error('saveProgram called without an id');
      return false;
    }
    const programs = this.getAllPrograms();
    const index = programs.findIndex((p) => p.id === program.id);
    const now = Date.now();

    if (index === -1) {
      programs.push({ ...program, created: now, lastModified: now });
    } else {
      programs[index] = {
        ...programs[index],
        ...program,
        created: programs[index].created || now,
        lastModified: now,
      };
    }
    return this._writeAll(programs);
  },

  /** @returns {boolean} success. */
  deleteProgram(id) {
    const programs = this.getAllPrograms().filter((p) => p.id !== id);
    return this._writeAll(programs);
  },

  /** @returns {boolean} success. */
  clearAllPrograms() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (err) {
      console.error('Could not clear storage:', err);
      return false;
    }
  },

  /** Deep-copy a program under a new id and "(Copy)" name. @returns {Object|null}. */
  duplicateProgram(id) {
    const original = this.getProgram(id);
    if (!original) return null;

    const copy = JSON.parse(JSON.stringify(original));
    copy.id = generateUUID();
    copy.name = `${original.name || 'Untitled'} (Copy)`;
    delete copy.created;
    delete copy.lastModified;

    return this.saveProgram(copy) ? this.getProgram(copy.id) : null;
  },

  /** @returns {string} a portable JSON backup of all programs. */
  exportAll() {
    return JSON.stringify(
      { version: this.VERSION, exportDate: Date.now(), programs: this.getAllPrograms() },
      null,
      2,
    );
  },

  /**
   * Import a backup produced by exportAll().
   * @param {string} json
   * @param {boolean} merge keep existing programs (true) or replace them (false).
   * @returns {{success:boolean, message:string, count?:number}}
   */
  importPrograms(json, merge = true) {
    let payload;
    try {
      payload = JSON.parse(json);
    } catch {
      return { success: false, message: 'That file is not valid JSON.' };
    }
    if (!payload || !Array.isArray(payload.programs)) {
      return { success: false, message: 'Unrecognised backup format.' };
    }

    const programs = merge ? this.getAllPrograms() : [];
    const known = new Set(programs.map((p) => p.id));
    let added = 0;

    payload.programs.forEach((p) => {
      if (p && p.id && !known.has(p.id)) {
        programs.push(p);
        known.add(p.id);
        added += 1;
      }
    });

    if (!this._writeAll(programs)) {
      return { success: false, message: 'Could not save imported programs.' };
    }
    return { success: true, message: `Imported ${added} program${added === 1 ? '' : 's'}.`, count: added };
  },

  /** Aggregate counts used by the dashboard and history pages. */
  getStats() {
    const programs = this.getAllPrograms();
    const stats = { totalPrograms: programs.length, byType: {}, totalWeeks: 0, totalHours: 0 };

    programs.forEach((p) => {
      const type = p.type || 'general';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      if (p.weekNumber) stats.totalWeeks += 1;
      if (p.totalHours) stats.totalHours += parseFloat(p.totalHours) || 0;
    });
    return stats;
  },
};
