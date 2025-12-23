// Storage Manager for Training Programs
// Uses localStorage for data persistence

const storage = {
    STORAGE_KEY: 'training_programs',
    VERSION: '1.0',

    /**
     * Get all programs from storage
     * @returns {Array} Array of program objects
     */
    getAllPrograms() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading programs:', error);
            return [];
        }
    },

    /**
     * Get a single program by ID
     * @param {string} id - Program ID
     * @returns {Object|null} Program object or null if not found
     */
    getProgram(id) {
        const programs = this.getAllPrograms();
        return programs.find(p => p.id === id) || null;
    },

    /**
     * Save a new program or update existing one
     * @param {Object} program - Program object
     * @returns {boolean} Success status
     */
    saveProgram(program) {
        try {
            const programs = this.getAllPrograms();
            const index = programs.findIndex(p => p.id === program.id);

            // Add metadata
            program.lastModified = Date.now();
            if (index === -1) {
                program.created = Date.now();
            }

            if (index === -1) {
                programs.push(program);
            } else {
                programs[index] = { ...programs[index], ...program };
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(programs));
            return true;
        } catch (error) {
            console.error('Error saving program:', error);
            return false;
        }
    },

    /**
     * Delete a program by ID
     * @param {string} id - Program ID
     * @returns {boolean} Success status
     */
    deleteProgram(id) {
        try {
            const programs = this.getAllPrograms();
            const filtered = programs.filter(p => p.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting program:', error);
            return false;
        }
    },

    /**
     * Delete all programs
     * @returns {boolean} Success status
     */
    clearAllPrograms() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing programs:', error);
            return false;
        }
    },

    /**
     * Export all programs as JSON
     * @returns {string} JSON string of all programs
     */
    exportAll() {
        const programs = this.getAllPrograms();
        return JSON.stringify({
            version: this.VERSION,
            exportDate: Date.now(),
            programs: programs
        }, null, 2);
    },

    /**
     * Import programs from JSON
     * @param {string} jsonString - JSON string to import
     * @param {boolean} merge - If true, merge with existing programs; if false, replace
     * @returns {Object} Result object with success status and message
     */
    importPrograms(jsonString, merge = true) {
        try {
            const imported = JSON.parse(jsonString);

            if (!imported.programs || !Array.isArray(imported.programs)) {
                return {
                    success: false,
                    message: 'Invalid import format'
                };
            }

            let programs = merge ? this.getAllPrograms() : [];

            // Add imported programs, avoiding duplicates
            imported.programs.forEach(program => {
                const exists = programs.find(p => p.id === program.id);
                if (!exists) {
                    programs.push(program);
                }
            });

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(programs));

            return {
                success: true,
                message: `Imported ${imported.programs.length} programs`,
                count: imported.programs.length
            };
        } catch (error) {
            console.error('Error importing programs:', error);
            return {
                success: false,
                message: 'Import failed: ' + error.message
            };
        }
    },

    /**
     * Search programs by name or type
     * @param {string} query - Search query
     * @returns {Array} Filtered programs
     */
    searchPrograms(query) {
        const programs = this.getAllPrograms();
        const lowerQuery = query.toLowerCase();

        return programs.filter(p => {
            const name = (p.name || '').toLowerCase();
            const type = (p.type || '').toLowerCase();
            const notes = (p.notes || '').toLowerCase();

            return name.includes(lowerQuery) ||
                   type.includes(lowerQuery) ||
                   notes.includes(lowerQuery);
        });
    },

    /**
     * Get programs by type
     * @param {string} type - Program type ('strength', 'general')
     * @returns {Array} Filtered programs
     */
    getProgramsByType(type) {
        const programs = this.getAllPrograms();
        return programs.filter(p => p.type === type);
    },

    /**
     * Get programs within date range
     * @param {Date} startDate
     * @param {Date} endDate
     * @returns {Array} Filtered programs
     */
    getProgramsByDateRange(startDate, endDate) {
        const programs = this.getAllPrograms();
        const start = startDate.getTime();
        const end = endDate.getTime();

        return programs.filter(p => {
            if (!p.startDate) return false;
            const programDate = new Date(p.startDate).getTime();
            return programDate >= start && programDate <= end;
        });
    },

    /**
     * Get storage statistics
     * @returns {Object} Storage stats
     */
    getStats() {
        const programs = this.getAllPrograms();

        const stats = {
            totalPrograms: programs.length,
            byType: {},
            totalWeeks: 0,
            totalHours: 0,
            storageUsed: 0
        };

        programs.forEach(p => {
            // Count by type
            const type = p.type || 'general';
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            // Sum hours
            if (p.totalHours) {
                stats.totalHours += parseFloat(p.totalHours);
            }

            // Count weeks
            if (p.weekNumber) {
                stats.totalWeeks++;
            }
        });

        // Calculate storage used (approximate)
        try {
            const dataStr = localStorage.getItem(this.STORAGE_KEY);
            stats.storageUsed = dataStr ? new Blob([dataStr]).size : 0;
            stats.storageUsedKB = (stats.storageUsed / 1024).toFixed(2);
        } catch (e) {
            stats.storageUsed = 0;
        }

        return stats;
    },

    /**
     * Duplicate a program
     * @param {string} id - ID of program to duplicate
     * @returns {Object|null} New program object or null
     */
    duplicateProgram(id) {
        const original = this.getProgram(id);
        if (!original) return null;

        const duplicate = { ...original };
        duplicate.id = generateUUID();
        duplicate.name = (original.name || 'Untitled') + ' (Copy)';
        delete duplicate.created;
        delete duplicate.lastModified;

        this.saveProgram(duplicate);
        return duplicate;
    }
};

// Auto-backup functionality
const autoBackup = {
    BACKUP_KEY: 'training_programs_backup',
    BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours

    /**
     * Create a backup if enough time has passed
     */
    maybeBackup() {
        try {
            const lastBackup = localStorage.getItem(this.BACKUP_KEY + '_time');
            const now = Date.now();

            if (!lastBackup || (now - parseInt(lastBackup)) > this.BACKUP_INTERVAL) {
                this.createBackup();
            }
        } catch (error) {
            console.error('Auto-backup check failed:', error);
        }
    },

    /**
     * Create a backup of all programs
     */
    createBackup() {
        try {
            const data = localStorage.getItem(storage.STORAGE_KEY);
            if (data) {
                localStorage.setItem(this.BACKUP_KEY, data);
                localStorage.setItem(this.BACKUP_KEY + '_time', Date.now().toString());
                console.log('Backup created successfully');
            }
        } catch (error) {
            console.error('Backup creation failed:', error);
        }
    },

    /**
     * Restore from backup
     * @returns {boolean} Success status
     */
    restoreBackup() {
        try {
            const backup = localStorage.getItem(this.BACKUP_KEY);
            if (backup) {
                localStorage.setItem(storage.STORAGE_KEY, backup);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Backup restore failed:', error);
            return false;
        }
    },

    /**
     * Get backup info
     * @returns {Object|null} Backup info or null
     */
    getBackupInfo() {
        try {
            const backupTime = localStorage.getItem(this.BACKUP_KEY + '_time');
            const backup = localStorage.getItem(this.BACKUP_KEY);

            if (!backup) return null;

            const data = JSON.parse(backup);

            return {
                timestamp: backupTime ? parseInt(backupTime) : null,
                date: backupTime ? new Date(parseInt(backupTime)) : null,
                programCount: data ? data.length : 0
            };
        } catch (error) {
            return null;
        }
    }
};

// Run auto-backup check on load
if (typeof window !== 'undefined') {
    autoBackup.maybeBackup();
}
