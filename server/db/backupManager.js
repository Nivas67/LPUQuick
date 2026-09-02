const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const LOCAL_DB_PATH = process.env.LOCAL_DB_PATH || path.join(DATA_DIR, 'lpuquick_local.db');

/**
 * Local Database Backup & Snapshot Management Subsystem
 * Creates timestamped SQLite backups, pre-sync snapshots, and safe point-in-time recovery.
 */
class BackupManager {
    constructor() {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
    }

    /**
     * Formats current timestamp for filenames (YYYY-MM-DD_HHMMSS)
     */
    getTimestamp() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}_${hh}${min}${ss}`;
    }

    /**
     * Creates a full timestamped backup of the local SQLite database.
     *
     * @param {string} prefix - Optional prefix ('daily', 'manual', 'pre_migration')
     * @returns {string} Path to created backup file
     */
    createBackup(prefix = 'backup') {
        if (!fs.existsSync(LOCAL_DB_PATH)) {
            console.warn('[BackupManager] Local database file not yet created; skipping backup.');
            return null;
        }

        const timestamp = this.getTimestamp();
        const filename = `${prefix}_${timestamp}.db`;
        const targetPath = path.join(BACKUP_DIR, filename);

        try {
            // Copy main DB file
            fs.copyFileSync(LOCAL_DB_PATH, targetPath);

            // Also copy WAL files if present for transaction consistency
            const walPath = `${LOCAL_DB_PATH}-wal`;
            const shmPath = `${LOCAL_DB_PATH}-shm`;
            if (fs.existsSync(walPath)) fs.copyFileSync(walPath, `${targetPath}-wal`);
            if (fs.existsSync(shmPath)) fs.copyFileSync(shmPath, `${targetPath}-shm`);

            console.log(`[BackupManager] Successfully created backup: ${filename}`);
            this.pruneOldBackups();
            return {
                filename,
                path: targetPath,
                sizeBytes: fs.statSync(targetPath).size,
                createdAt: new Date().toISOString()
            };
        } catch (err) {
            console.error('[BackupManager Failed]:', err.message);
            throw err;
        }
    }

    /**
     * Creates a pre-sync safety snapshot before executing batch synchronization.
     */
    createPreSyncSnapshot() {
        return this.createBackup('snapshot_pre_sync');
    }

    /**
     * Lists all existing backups sorted newest first.
     */
    listBackups() {
        if (!fs.existsSync(BACKUP_DIR)) return [];

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.db') && !f.endsWith('-wal') && !f.endsWith('-shm'))
            .map(filename => {
                const filePath = path.join(BACKUP_DIR, filename);
                const stat = fs.statSync(filePath);
                return {
                    filename,
                    path: filePath,
                    sizeBytes: stat.size,
                    createdAt: stat.birthtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return files;
    }

    /**
     * Restores local database from a chosen backup file safely.
     */
    restoreBackup(backupFilename) {
        const sourcePath = path.join(BACKUP_DIR, backupFilename);
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Backup file not found: ${backupFilename}`);
        }

        // Create safety backup of current state before replacing
        this.createBackup('pre_restore_safety');

        fs.copyFileSync(sourcePath, LOCAL_DB_PATH);
        const sourceWal = `${sourcePath}-wal`;
        const targetWal = `${LOCAL_DB_PATH}-wal`;
        if (fs.existsSync(sourceWal)) {
            fs.copyFileSync(sourceWal, targetWal);
        } else if (fs.existsSync(targetWal)) {
            try { fs.unlinkSync(targetWal); } catch (e) {}
        }

        console.log(`[BackupManager] Database successfully restored from: ${backupFilename}`);
        return true;
    }

    /**
     * Retention policy: keeps at least the last 15 backups, pruning older files.
     * Never deletes all backups.
     */
    pruneOldBackups(keepCount = 15) {
        try {
            const backups = this.listBackups();
            if (backups.length > keepCount) {
                const toRemove = backups.slice(keepCount);
                toRemove.forEach(b => {
                    try {
                        fs.unlinkSync(b.path);
                        if (fs.existsSync(`${b.path}-wal`)) fs.unlinkSync(`${b.path}-wal`);
                        if (fs.existsSync(`${b.path}-shm`)) fs.unlinkSync(`${b.path}-shm`);
                        console.log(`[BackupManager] Pruned expired backup: ${b.filename}`);
                    } catch (e) {}
                });
            }
        } catch (e) {}
    }
}

module.exports = new BackupManager();
