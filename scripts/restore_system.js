#!/usr/bin/env node
/**
 * LPUQuick Standalone Full System Disaster Recovery / Restore CLI
 * Restores 100% of the system from a valid LPUQuick ZIP backup archive:
 * All database tables in topological dependency order, all server configs,
 * and all image assets to public/uploads/ and Supabase Storage.
 *
 * Usage:
 *   node scripts/restore_system.js <path-to-backup.zip> [--clean | --merge]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const backupService = require('../server/services/backupService');
const cache = require('../server/cache');

async function runRestore() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('❌ Error: Path to backup .zip file required.');
        console.log('Usage: node scripts/restore_system.js <backup.zip> [--clean | --merge]');
        process.exit(1);
    }

    const zipFilePath = path.resolve(args[0]);
    if (!fs.existsSync(zipFilePath)) {
        console.error(`❌ Error: Backup file not found at: ${zipFilePath}`);
        process.exit(1);
    }

    const mode = args.includes('--merge') ? 'merge' : 'clean';

    console.log('============================================================');
    console.log(`♻️  LPUQuick 0-100 System Disaster Recovery & Restore CLI [Mode: ${mode.toUpperCase()}]`);
    console.log('============================================================');
    console.log(`📁 Source Archive: ${zipFilePath}`);
    const startTime = Date.now();

    // 1. Read and unpack ZIP
    console.log('\n[1/5] 📦 Unpacking backup archive...');
    const zipData = fs.readFileSync(zipFilePath);
    const zip = await JSZip.loadAsync(zipData);

    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
        throw new Error('Invalid backup archive: missing manifest.json');
    }
    const manifest = JSON.parse(await manifestFile.async('string'));
    console.log(`   ✓ Validated manifest (App: ${manifest.app}, Created: ${manifest.created_at})`);

    // 2. Extract Database Tables
    console.log('\n[2/5] 🗄️  Extracting and restoring database tables...');
    const tablesData = {};
    for (const table of backupService.TABLES_DEPENDENCY_ORDER) {
        const file = zip.file(`database/${table}.json`);
        if (file) {
            tablesData[table] = JSON.parse(await file.async('string'));
            console.log(`   ✓ Found ${table}: ${tablesData[table].length} rows in archive`);
        } else {
            tablesData[table] = [];
        }
    }

    const dbResult = await backupService.restoreDatabaseTables(tablesData, { mode });
    console.log('   ✓ Database tables restored:');
    for (const [t, count] of Object.entries(dbResult.inserted)) {
        console.log(`     • ${t}: ${count} rows inserted/upserted`);
    }

    // 3. Extract Server Configurations
    console.log('\n[3/5] ⚙️  Restoring server configurations...');
    const configsData = {};
    const configFolder = zip.folder('config');
    if (configFolder) {
        for (const relativePath of Object.keys(zip.files)) {
            if (relativePath.startsWith('config/') && relativePath.endsWith('.json')) {
                const key = path.basename(relativePath, '.json');
                configsData[key] = JSON.parse(await zip.file(relativePath).async('string'));
                console.log(`   ✓ Restoring config: ${key}.json`);
            }
        }
    }
    backupService.restoreConfigs(configsData);

    // 4. Extract Images & Storage Assets
    console.log('\n[4/5] 🖼️  Restoring image assets...');
    const imageFiles = [];
    for (const relativePath of Object.keys(zip.files)) {
        if (relativePath.startsWith('uploads/') && !relativePath.endsWith('/')) {
            const filename = path.basename(relativePath);
            const buffer = await zip.file(relativePath).async('nodebuffer');
            imageFiles.push({ filename, data: buffer });
        }
    }

    const imgResult = await backupService.restoreImageBatch(imageFiles);
    console.log(`   ✓ Restored ${imgResult.saved} image files to public/uploads/`);
    if (imgResult.errors.length > 0) {
        console.warn(`   ⚠️ ${imgResult.errors.length} image warnings:`, imgResult.errors.slice(0, 3));
    }

    // 5. Invalidate Caches & Verify Integrity
    console.log('\n[5/5] 🔍 Verifying system integrity...');
    cache.invalidateAll();
    const verification = await backupService.verifyIntegrity(manifest);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n============================================================');
    if (verification.verified) {
        console.log('🎉 100% RESTORE SUCCESSFUL & VERIFIED!');
    } else {
        console.log('⚠️  RESTORE COMPLETED WITH DISCREPANCIES:');
        verification.discrepancies.forEach(d => console.log(`   • ${d}`));
    }
    console.log(`⏱️  Elapsed Time: ${elapsed} seconds`);
    console.log('============================================================\n');
}

runRestore().catch(err => {
    console.error('\n❌ Restore failed with error:', err);
    process.exit(1);
});
