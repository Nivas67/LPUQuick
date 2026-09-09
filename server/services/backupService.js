const fs = require('fs');
const path = require('path');
const { getSupabaseClient } = require('../supabase');

const DATA_DIR = path.join(__dirname, '../data');
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

// Tables in topological dependency order (Parent -> Child) for clean inserts
const TABLES_DEPENDENCY_ORDER = [
    'users',
    'products',
    'app_availability',
    'blacklisted_users',
    'orders',
    'order_items',
    'cart_items',
    'audit_logs'
];

// Tables in reverse order (Child -> Parent) for safe deletion without FK violations
const TABLES_REVERSE_ORDER = [
    'order_items',
    'cart_items',
    'orders',
    'blacklisted_users',
    'audit_logs',
    'products',
    'users',
    'app_availability'
];

// Configuration files managed in server/data/
const CONFIG_FILES = [
    { key: 'banners', file: 'banners.json' },
    { key: 'delivery_settings', file: 'delivery_settings.json' },
    { key: 'rider_availability', file: 'rider_availability.json' },
    { key: 'push_subscriptions', file: 'push_subscriptions.json' }
];

/**
 * Execute an asynchronous operation with exponential backoff retries.
 * Guards against transient Supabase/HTTP connection timeouts.
 */
async function fetchWithRetry(fn, maxRetries = 4, initialDelayMs = 400) {
    let delay = initialDelayMs;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === maxRetries) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

/**
 * Fetch all rows from a Supabase table with pagination (1,000 rows per batch) and retries.
 */
async function fetchAllTableRows(supabase, tableName) {
    const pageSize = 1000;
    let allRows = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
        const to = from + pageSize - 1;
        const result = await fetchWithRetry(async () => {
            const res = await supabase
                .from(tableName)
                .select('*')
                .range(from, to);
            if (res.error) throw new Error(`[${tableName}] query error: ${res.error.message}`);
            return res.data || [];
        });

        allRows = allRows.concat(result);
        if (result.length < pageSize) {
            hasMore = false;
        } else {
            from += pageSize;
        }
    }

    return allRows;
}

const backupService = {
    TABLES_DEPENDENCY_ORDER,
    TABLES_REVERSE_ORDER,

    /**
     * Get live overview metrics of database tables, uploads, and server configs.
     */
    async getStatus() {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client unavailable. Check environment credentials.');
        }

        const tableStats = {};
        for (const table of TABLES_DEPENDENCY_ORDER) {
            try {
                const res = await fetchWithRetry(async () => {
                    const r = await supabase.from(table).select('id', { count: 'exact' }).limit(1);
                    if (r.error) throw new Error(r.error.message);
                    return r;
                }, 4, 400);
                tableStats[table] = (res.count !== null && res.count !== undefined) ? res.count : 0;
            } catch (err) {
                tableStats[table] = 0;
            }
            await new Promise(r => setTimeout(r, 30));
        }

        // Uploads metrics
        const uploadFiles = this.listUploadImages();
        const uploadFilesCount = uploadFiles.length;
        const uploadFilesSizeBytes = uploadFiles.reduce((acc, f) => acc + (f.size || 0), 0);

        // Server configs status
        const configStats = {};
        for (const cfg of CONFIG_FILES) {
            const p = path.join(DATA_DIR, cfg.file);
            configStats[cfg.key] = fs.existsSync(p);
        }

        return {
            database_connected: true,
            tables: tableStats,
            uploads: {
                count: uploadFilesCount,
                size_bytes: uploadFilesSizeBytes,
                size_mb: Number((uploadFilesSizeBytes / (1024 * 1024)).toFixed(2))
            },
            configs: configStats,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Export all 8 database tables with complete rows and column values.
     */
    async exportAllDatabaseTables() {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Database client not connected.');

        const tablesData = {};
        const counts = {};

        for (const table of TABLES_DEPENDENCY_ORDER) {
            const rows = await fetchAllTableRows(supabase, table);
            tablesData[table] = rows;
            counts[table] = rows.length;
        }

        return { tablesData, counts };
    },

    /**
     * Export all configuration JSON files stored in server/data/.
     */
    exportAllConfigs() {
        const configs = {};
        for (const cfg of CONFIG_FILES) {
            const filePath = path.join(DATA_DIR, cfg.file);
            if (fs.existsSync(filePath)) {
                try {
                    configs[cfg.key] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                } catch (err) {
                    configs[cfg.key] = null;
                }
            } else {
                configs[cfg.key] = null;
            }
        }
        return configs;
    },

    /**
     * List all uploaded images with relative path, size, and public download URL.
     * Recursively traverses subdirectories (e.g. uploads/banners/) safely.
     */
    listUploadImages() {
        if (!fs.existsSync(UPLOADS_DIR)) {
            return [];
        }

        const results = [];
        function scanDir(currentDir, relativePrefix = '') {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith('.') || entry.name === 'Thumbs.db') continue;
                const fullPath = path.join(currentDir, entry.name);
                const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;

                if (entry.isDirectory()) {
                    scanDir(fullPath, relPath);
                } else if (entry.isFile()) {
                    let size = 0;
                    try {
                        size = fs.statSync(fullPath).size;
                    } catch (e) {}

                    const ext = path.extname(entry.name).toLowerCase().replace('.', '');
                    let mime = 'application/octet-stream';
                    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
                    else if (ext === 'png') mime = 'image/png';
                    else if (ext === 'webp') mime = 'image/webp';
                    else if (ext === 'svg') mime = 'image/svg+xml';
                    else if (ext === 'gif') mime = 'image/gif';

                    results.push({
                        filename: relPath,
                        size,
                        mime,
                        url: `/uploads/${relPath}`
                    });
                }
            }
        }

        scanDir(UPLOADS_DIR);
        return results;
    },

    /**
     * Restore all database tables with foreign-key safety.
     * 
     * @param {Object} tablesData - Object containing arrays of rows per table name.
     * @param {Object} options
     * @param {string} options.mode - 'clean' (wipe and mirror) or 'merge' (upsert only)
     * @param {string} options.preserveAdminId - Admin ID to preserve during clean wipe
     */
    async restoreDatabaseTables(tablesData, { mode = 'clean', preserveAdminId = null } = {}) {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Database client not connected.');

        const results = {
            mode,
            cleared: {},
            inserted: {},
            errors: []
        };

        // 1. If CLEAN mode, delete existing records in reverse dependency order
        if (mode === 'clean') {
            for (const table of TABLES_REVERSE_ORDER) {
                try {
                    await fetchWithRetry(async () => {
                        let query = supabase.from(table).delete();
                        if (table === 'users' && preserveAdminId) {
                            // Don't delete the acting administrator
                            query = query.neq('id', preserveAdminId);
                        } else if (table === 'app_availability') {
                            // Keep store_main container row, just reset fields
                            return;
                        } else {
                            // Target all rows
                            query = query.neq('id', '__never_match_placeholder_xyz__');
                        }
                        const { error } = await query;
                        if (error && !error.message.includes('0 rows')) {
                            throw new Error(`Failed to clean table ${table}: ${error.message}`);
                        }
                    });
                    results.cleared[table] = true;
                } catch (cleanErr) {
                    results.cleared[table] = false;
                    results.errors.push(`Clean error on [${table}]: ${cleanErr.message}`);
                }
            }
        }

        // 2. Insert records in strict forward dependency order in batches of 50
        const batchSize = 50;
        for (const table of TABLES_DEPENDENCY_ORDER) {
            const rows = tablesData[table] || [];
            if (!Array.isArray(rows) || rows.length === 0) {
                results.inserted[table] = 0;
                continue;
            }

            let insertedCount = 0;
            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                try {
                    await fetchWithRetry(async () => {
                        const { error } = await supabase
                            .from(table)
                            .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });
                        if (error) throw new Error(`[${table}] batch insert error: ${error.message}`);
                    });
                    insertedCount += batch.length;
                } catch (batchErr) {
                    results.errors.push(`Insert failed on [${table}] batch ${i}-${i + batch.length}: ${batchErr.message}`);
                }
            }
            results.inserted[table] = insertedCount;
        }

        return results;
    },

    /**
     * Restore server configuration files to server/data/.
     */
    restoreConfigs(configsData) {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        const restored = {};
        for (const cfg of CONFIG_FILES) {
            if (configsData && configsData[cfg.key] !== undefined && configsData[cfg.key] !== null) {
                try {
                    const targetFile = path.join(DATA_DIR, cfg.file);
                    fs.writeFileSync(targetFile, JSON.stringify(configsData[cfg.key], null, 2), 'utf8');
                    restored[cfg.key] = true;
                } catch (err) {
                    restored[cfg.key] = false;
                }
            }
        }
        return restored;
    },

    /**
     * Save a batch of uploaded images to public/uploads/ and optionally mirror to Supabase Storage.
     * 
     * @param {Array<{filename: string, data: string|Buffer}>} files
     */
    async restoreImageBatch(files) {
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }

        const supabase = getSupabaseClient();
        let savedCount = 0;
        const errors = [];

        for (const item of files) {
            const { filename, data } = item;
            if (!filename || !data) continue;

            // Sanitize filename to prevent directory traversal
            const cleanName = path.basename(filename);
            const targetPath = path.join(UPLOADS_DIR, cleanName);

            try {
                let buffer;
                if (Buffer.isBuffer(data)) {
                    buffer = data;
                } else if (typeof data === 'string') {
                    // Extract base64 payload if data-uri
                    const base64Clean = data.includes(';base64,') ? data.split(';base64,')[1] : data;
                    buffer = Buffer.from(base64Clean, 'base64');
                }

                if (buffer) {
                    fs.writeFileSync(targetPath, buffer);
                    savedCount++;

                    // Mirror to Supabase Storage bucket 'products' if connected
                    if (supabase && supabase.storage) {
                        try {
                            const ext = path.extname(cleanName).toLowerCase().replace('.', '');
                            let contentType = 'image/jpeg';
                            if (ext === 'png') contentType = 'image/png';
                            else if (ext === 'webp') contentType = 'image/webp';
                            else if (ext === 'svg') contentType = 'image/svg+xml';

                            await supabase.storage
                                .from('products')
                                .upload(cleanName, buffer, {
                                    contentType,
                                    upsert: true
                                });
                        } catch (storageErr) {
                            // Storage sync is non-blocking since Vercel CDN serves public/uploads/
                        }
                    }
                }
            } catch (err) {
                errors.push(`Failed to save image ${cleanName}: ${err.message}`);
            }
        }

        return { saved: savedCount, errors };
    },

    /**
     * Perform a post-restore verification check against an expected manifest.
     */
    async verifyIntegrity(manifest) {
        const current = await this.getStatus();
        const report = {
            verified: true,
            database: {
                passed: true,
                tables: {}
            },
            uploads: {
                passed: true,
                expected: manifest?.uploads?.count || 0,
                actual: current.uploads.count
            },
            discrepancies: []
        };

        // Compare table counts
        if (manifest && manifest.tables) {
            for (const [table, expectedCount] of Object.entries(manifest.tables)) {
                const actualCount = current.tables[table] !== undefined ? current.tables[table] : -1;
                const match = actualCount >= expectedCount; // can be >= if admin user was preserved
                report.database.tables[table] = {
                    expected: expectedCount,
                    actual: actualCount,
                    match
                };
                if (!match) {
                    report.database.passed = false;
                    report.verified = false;
                    report.discrepancies.push(`Table [${table}] expected ${expectedCount} rows, found ${actualCount}`);
                }
            }
        }

        // Compare upload counts
        if (manifest && manifest.uploads && manifest.uploads.count > 0) {
            if (current.uploads.count < manifest.uploads.count) {
                report.uploads.passed = false;
                report.verified = false;
                report.discrepancies.push(`Uploads expected ${manifest.uploads.count} files, found ${current.uploads.count}`);
            }
        }

        return report;
    }
};

module.exports = backupService;
