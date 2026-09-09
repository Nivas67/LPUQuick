#!/usr/bin/env node
/**
 * LPUQuick Standalone Full System Backup CLI
 * Exports 100% of the system: All 8 PostgreSQL database tables, all uploaded images,
 * and all server configuration files into a self-contained, timestamped ZIP archive.
 *
 * Usage:
 *   node scripts/backup_system.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const backupService = require('../server/services/backupService');

async function runBackup() {
    console.log('============================================================');
    console.log('📦 LPUQuick 0-100 Full System Backup CLI');
    console.log('============================================================');
    const startTime = Date.now();

    const outputDir = path.join(__dirname, '../server/data/backups');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `LPUQuick_Full_Backup_${timestamp}.zip`;
    const outputPath = path.join(outputDir, zipFilename);

    const zip = new JSZip();

    // 1. Export Database Tables
    console.log('\n[1/4] 🗄️  Exporting Supabase PostgreSQL tables...');
    const { tablesData, counts } = await backupService.exportAllDatabaseTables();
    const dbFolder = zip.folder('database');
    for (const [tableName, rows] of Object.entries(tablesData)) {
        dbFolder.file(`${tableName}.json`, JSON.stringify(rows, null, 2));
        console.log(`   ✓ ${tableName}: ${rows.length} rows`);
    }

    // 2. Export Server Configurations
    console.log('\n[2/4] ⚙️  Exporting server configurations (server/data/)...');
    const configs = backupService.exportAllConfigs();
    const configFolder = zip.folder('config');
    for (const [cfgKey, cfgData] of Object.entries(configs)) {
        if (cfgData !== null) {
            configFolder.file(`${cfgKey}.json`, JSON.stringify(cfgData, null, 2));
            console.log(`   ✓ ${cfgKey}.json`);
        }
    }

    // 3. Export Uploaded Images & Storage Assets
    console.log('\n[3/4] 🖼️  Exporting image assets (public/uploads/)...');
    const images = backupService.listUploadImages();
    const uploadsFolder = zip.folder('uploads');
    const uploadsDir = path.join(__dirname, '../public/uploads');

    let totalImageBytes = 0;
    for (const img of images) {
        const filePath = path.join(uploadsDir, img.filename);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const buffer = fs.readFileSync(filePath);
            uploadsFolder.file(img.filename, buffer);
            totalImageBytes += buffer.length;
        }
    }
    console.log(`   ✓ Packaged ${images.length} images (${(totalImageBytes / (1024 * 1024)).toFixed(2)} MB)`);

    // 4. Generate Manifest
    console.log('\n[4/4] 📋 Creating backup manifest...');
    const manifest = {
        app: 'LPUQuick',
        version: '1.0.0',
        created_at: new Date().toISOString(),
        tables: counts,
        configs: Object.keys(configs),
        uploads: {
            count: images.length,
            size_bytes: totalImageBytes,
            size_mb: Number((totalImageBytes / (1024 * 1024)).toFixed(2))
        }
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // 5. Generate and write ZIP archive
    console.log('\n🗜️  Compressing and writing archive to disk...');
    const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    });

    fs.writeFileSync(outputPath, zipBuffer);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n============================================================');
    console.log('🎉 100% COMPLETE BACKUP SUCCESSFUL!');
    console.log(`📁 File:    ${outputPath}`);
    console.log(`📊 Size:    ${(zipBuffer.length / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`⏱️  Time:    ${elapsed} seconds`);
    console.log('============================================================\n');
}

runBackup().catch(err => {
    console.error('\n❌ Backup failed with error:', err);
    process.exit(1);
});
