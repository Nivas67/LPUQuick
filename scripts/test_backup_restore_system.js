/**
 * Automated Verification Suite for LPUQuick 0-100 Backup & Disaster Recovery System
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const JSZip = require('jszip');
const backupService = require('../server/services/backupService');
const { generateAdminToken } = require('../server/middleware/adminAuth');
const app = require('../server/app');

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ Assertion Failed: ${message}`);
        throw new Error(message);
    }
    console.log(`  ✓ ${message}`);
}

async function runVerificationSuite() {
    console.log('============================================================');
    console.log('🧪 LPUQuick 0-100 Backup & Disaster Recovery Test Suite');
    console.log('============================================================');

    // -------------------------------------------------------------
    // TEST 1: Service Status & Live Catalog Metrics
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Testing backupService.getStatus()...');
    const status = await backupService.getStatus();
    assert(status.database_connected === true, 'Database is connected');
    assert(status.tables.users > 0, `Users table has records (${status.tables.users})`);
    assert(status.tables.products > 0, `Products table has records (${status.tables.products})`);
    assert(status.tables.orders > 0, `Orders table has records (${status.tables.orders})`);
    assert(status.tables.order_items > 0, `Order Items table has records (${status.tables.order_items})`);
    assert(status.tables.cart_items >= 0, `Cart Items table queried (${status.tables.cart_items})`);
    assert(status.tables.app_availability > 0, `App Availability table has records (${status.tables.app_availability})`);
    assert(status.tables.blacklisted_users > 0, `Blacklisted users table has records (${status.tables.blacklisted_users})`);
    assert(status.tables.audit_logs > 0, `Audit logs table has records (${status.tables.audit_logs})`);
    assert(status.uploads.count >= 60, `Uploads directory has >= 60 images (${status.uploads.count})`);
    assert(status.configs.banners === true, 'Banners configuration exists');
    assert(status.configs.delivery_settings === true, 'Delivery pricing configuration exists');

    // -------------------------------------------------------------
    // TEST 2: Service Data Extraction
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Testing complete database table & config extraction...');
    const { tablesData, counts } = await backupService.exportAllDatabaseTables();
    for (const table of backupService.TABLES_DEPENDENCY_ORDER) {
        assert(Array.isArray(tablesData[table]), `Table [${table}] exported as array`);
        assert(tablesData[table].length === counts[table], `Table [${table}] count matches row length (${counts[table]})`);
    }

    const configs = backupService.exportAllConfigs();
    assert(configs.banners && Array.isArray(configs.banners.banners), 'Banners exported with banners array');
    assert(configs.delivery_settings && configs.delivery_settings.rate_per_order !== undefined, 'Delivery settings exported with rate_per_order');

    const images = backupService.listUploadImages();
    assert(images.length >= 60, `Images cataloged: ${images.length}`);
    const sampleImg = images[0];
    assert(sampleImg.filename && sampleImg.size > 0 && sampleImg.url.startsWith('/uploads/'), 'Sample image has valid path, size, and URL');

    // -------------------------------------------------------------
    // TEST 3: ZIP Archive Integrity Verification
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Testing ZIP archive creation & structure...');
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({
        app: 'LPUQuick',
        version: '1.0.0',
        tables: counts,
        uploads: { count: images.length }
    }));
    const dbFolder = zip.folder('database');
    for (const [t, rows] of Object.entries(tablesData)) {
        dbFolder.file(`${t}.json`, JSON.stringify(rows));
    }
    const uploadsFolder = zip.folder('uploads');
    uploadsFolder.file('test_asset.jpg', Buffer.from('fake-jpeg-data'));

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    assert(zipBuffer.length > 1000, `ZIP buffer generated successfully (${zipBuffer.length} bytes)`);

    const loadedZip = await JSZip.loadAsync(zipBuffer);
    assert(loadedZip.file('manifest.json') !== null, 'manifest.json present in loaded ZIP');
    assert(loadedZip.file('database/products.json') !== null, 'database/products.json present in loaded ZIP');
    assert(loadedZip.file('uploads/test_asset.jpg') !== null, 'uploads/test_asset.jpg present in loaded ZIP');

    // -------------------------------------------------------------
    // TEST 4: Express API Security & Endpoints
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Testing Express API endpoints & security guards...');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/admin/backup`;

    try {
        // 4a: Unauthorized request (no token) must fail with 401
        const unauthRes = await fetch(`${baseUrl}/status`);
        assert(unauthRes.status === 401, 'Unauthorized request correctly rejected with 401');

        // 4b: Forbidden request (non-owner staff) must fail with 403
        const managerToken = generateAdminToken('mgr_001', 'inventory_manager');
        const forbidRes = await fetch(`${baseUrl}/status`, {
            headers: { 'Authorization': `Bearer ${managerToken}` }
        });
        assert(forbidRes.status === 403, 'Non-owner staff role correctly rejected with 403');

        // 4c: Authorized owner token gets status 200
        const ownerToken = generateAdminToken('user_admin_bh13', 'owner');
        const statusRes = await fetch(`${baseUrl}/status`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        assert(statusRes.status === 200, 'Owner authenticated successfully for /status');
        const statusData = await statusRes.json();
        assert(statusData.success === true, 'Status endpoint returned success: true');

        // 4d: Export-data endpoint
        const exportRes = await fetch(`${baseUrl}/export-data`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        assert(exportRes.status === 200, 'Export-data endpoint returned 200');
        const exportData = await exportRes.json();
        assert(exportData.manifest && exportData.database && exportData.configs, 'Export payload contains manifest, database, and configs');
        assert(exportData.manifest.tables.users > 0, 'Export manifest contains users count');

        // 4e: Image restoration batch endpoint
        const testImagePayload = {
            files: [
                {
                    filename: 'test_backup_ping.png',
                    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                }
            ]
        };
        const imgRestoreRes = await fetch(`${baseUrl}/restore-images`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify(testImagePayload)
        });
        assert(imgRestoreRes.status === 200, 'Restore-images endpoint returned 200');
        const imgRestoreData = await imgRestoreRes.json();
        assert(imgRestoreData.saved === 1, 'Restore-images successfully saved batch file');

        // Cleanup test image
        const testImgPath = path.join(__dirname, '../public/uploads/test_backup_ping.png');
        if (fs.existsSync(testImgPath)) fs.unlinkSync(testImgPath);

        // 4f: Integrity verification endpoint
        const verifyRes = await fetch(`${baseUrl}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({ manifest: exportData.manifest })
        });
        assert(verifyRes.status === 200, 'Verify endpoint returned 200');
        const verifyData = await verifyRes.json();
        assert(verifyData.report && typeof verifyData.report.verified === 'boolean', 'Verification report generated with boolean status');
    } finally {
        server.close();
    }

    console.log('\n============================================================');
    console.log('🎉 ALL BACKUP & DISASTER RECOVERY TESTS PASSED (100%)!');
    console.log('============================================================\n');
}

runVerificationSuite().catch(err => {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
});
