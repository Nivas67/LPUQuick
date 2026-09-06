const assert = require('assert');
const http = require('http');
const app = require('../app');
const bannersDb = require('../db/bannersDb');
const { generateAdminToken } = require('../middleware/adminAuth');

console.log('--- Running Advertisements & Promotional Banners Test Suite ---');

async function runTests() {
    // 1. Test database module directly
    console.log('\n[1] Testing bannersDb Direct Operations...');
    const adminData = await bannersDb.getAdminBanners();
    assert(Array.isArray(adminData.banners), 'getAdminBanners() should return banners array');
    assert(adminData.banners.length >= 4, 'Should contain at least the 4 seed banners');
    console.log(`✓ Initial banners loaded: ${adminData.banners.length} banners`);

    assert(typeof adminData.settings.autoplay_delay === 'number', 'autoplay_delay should be a number');
    assert(typeof adminData.settings.autoplay_enabled === 'boolean', 'autoplay_enabled should be a boolean');
    console.log(`✓ Initial banner settings: delay=${adminData.settings.autoplay_delay}ms, autoplay=${adminData.settings.autoplay_enabled}`);

    // Update settings test
    const updatedSettings = await bannersDb.updateSettings({
        autoplay_delay: 6000,
        autoplay_enabled: true
    });
    assert.strictEqual(updatedSettings.autoplay_delay, 6000, 'autoplay_delay should update to 6000ms');
    console.log('✓ bannersDb.updateSettings updated delay to 6000ms');

    // Create banner test
    const testBanner = await bannersDb.createBanner({
        title: 'Mid-Sem Exam Fuel Offer',
        subtitle: 'Get 20% off on all energy drinks and dark chocolates',
        badge: 'SPECIAL EXAM PERK',
        pill: 'STUDY SPECIAL',
        image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
        link_text: 'Grab Energy Drinks',
        link_url: '#/categories',
        gradient: 'emerald',
        is_full_poster: true,
        is_active: true
    });
    assert(testBanner.id, 'Created banner should have an id');
    assert.strictEqual(testBanner.title, 'Mid-Sem Exam Fuel Offer', 'Title should match');
    assert.strictEqual(testBanner.is_full_poster, true, 'is_full_poster should be true');
    console.log(`✓ bannersDb.createBanner created banner: id=${testBanner.id}`);

    // Update banner test
    const updatedBanner = await bannersDb.updateBanner(testBanner.id, {
        title: 'Updated Exam Fuel Offer',
        link_text: 'Shop Now'
    });
    assert.strictEqual(updatedBanner.title, 'Updated Exam Fuel Offer', 'Title should be updated');
    assert.strictEqual(updatedBanner.link_text, 'Shop Now', 'Link text should be updated');
    console.log('✓ bannersDb.updateBanner updated banner successfully');

    // Reorder test
    const reordered = await bannersDb.reorderBanners([testBanner.id, ...adminData.banners.map(b => b.id)]);
    assert.strictEqual(reordered[0].id, testBanner.id, 'Test banner should be first in order');
    console.log('✓ bannersDb.reorderBanners placed test banner at index 0');

    // Delete test banner
    const deleteResult = await bannersDb.deleteBanner(testBanner.id);
    assert.strictEqual(deleteResult.success, true, 'deleteBanner should return success true');
    const remainingAdminData = await bannersDb.getAdminBanners();
    assert(!remainingAdminData.banners.some(b => b.id === testBanner.id), 'Deleted banner should no longer exist in getAdminBanners');
    console.log('✓ bannersDb.deleteBanner removed test banner successfully');

    // Restore settings to 4500ms
    await bannersDb.updateSettings({ autoplay_delay: 4500, autoplay_enabled: true });

    // 2. Test HTTP API Endpoints
    console.log('\n[2] Testing HTTP Endpoints via Express App...');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const adminToken = generateAdminToken('user_admin_bh13', 'admin');

    // Helper for requests
    function makeRequest(path, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, baseUrl);
            const req = http.request(url, options, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                    } catch (e) {
                        resolve({ status: res.statusCode, data, headers: res.headers });
                    }
                });
            });
            req.on('error', reject);
            if (options.body) {
                req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
            }
            req.end();
        });
    }

    try {
        // GET /api/banners (Public storefront endpoint)
        const publicRes = await makeRequest('/api/banners');
        assert.strictEqual(publicRes.status, 200, 'Public GET /api/banners should return 200');
        assert.strictEqual(publicRes.data.success, true, 'Public response success should be true');
        assert(Array.isArray(publicRes.data.banners), 'Public response should include banners array');
        assert(publicRes.data.settings, 'Public response should include settings');
        console.log(`✓ GET /api/banners returned ${publicRes.data.banners.length} active banners and settings`);

        // GET /api/home (Storefront home bundle endpoint)
        const homeRes = await makeRequest('/api/home');
        assert.strictEqual(homeRes.status, 200, 'GET /api/home should return 200');
        assert(Array.isArray(homeRes.data.banners), 'Home payload should contain banners array');
        assert(homeRes.data.banner_settings, 'Home payload should contain banner_settings');
        console.log(`✓ GET /api/home bundle includes ${homeRes.data.banners.length} banners and rotation settings`);

        // PUT /api/banners/admin/settings (Admin delay update)
        const updateSettingsRes = await makeRequest('/api/banners/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: {
                autoplay_delay: 8000,
                autoplay_enabled: true
            }
        });
        assert.strictEqual(updateSettingsRes.status, 200, 'PUT settings should return 200');
        assert.strictEqual(updateSettingsRes.data.settings.autoplay_delay, 8000, 'Delay should be updated to 8000');
        console.log('✓ PUT /api/banners/admin/settings successfully set delay to 8000ms');

        // POST /api/banners/admin (Admin create poster)
        const createBannerRes = await makeRequest('/api/banners/admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: {
                title: 'Monsoon Chai & Pakora Combo',
                subtitle: 'Crispy delights delivered hot to your floor',
                badge: 'MONSOON SPECIAL',
                image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
                is_full_poster: true,
                is_active: true
            }
        });
        assert.strictEqual(createBannerRes.status, 200, 'POST /api/banners/admin should return 200');
        assert(createBannerRes.data.banner.id, 'New banner should have an id');
        const createdId = createBannerRes.data.banner.id;
        console.log(`✓ POST /api/banners/admin created poster id=${createdId}`);

        // DELETE /api/banners/admin/:id
        const deleteRes = await makeRequest(`/api/banners/admin/${encodeURIComponent(createdId)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        assert.strictEqual(deleteRes.status, 200, 'DELETE should return 200');
        console.log(`✓ DELETE /api/banners/admin/${createdId} deleted banner successfully`);

        // Reset settings back to 4500ms
        await makeRequest('/api/banners/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: { autoplay_delay: 4500, autoplay_enabled: true }
        });

        console.log('\n✅ ALL ADVERTISEMENTS & BANNER CAROUSEL TESTS PASSED SUCCESSFULLY!\n');
    } finally {
        server.close();
    }
}

runTests().catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
});
