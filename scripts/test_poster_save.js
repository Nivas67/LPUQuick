// Test Poster Save & Advertisement Management
const assert = require('assert');
const { generateAdminToken } = require('../server/middleware/adminAuth');

async function testPosterSave() {
    console.log('🧪 Testing Poster Save pipeline...');

    const token = generateAdminToken('user_admin_bh13', 'owner');
    const testPayload = {
        title: 'CAMPUS Fast Track Repair',
        pill: 'CAMPUS Fast Track Repa',
        badge: '⚡ 10-MIN Pickup',
        subtitle: 'Instant hostel room pickup & repair',
        link_text: 'Shop Now',
        link_url: 'https://wa.me/9181064229',
        gradient: 'emerald',
        display_order: 5,
        is_active: true
    };

    const res = await fetch('http://localhost:3000/api/admin/advertisements', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(testPayload)
    });

    assert.strictEqual(res.status, 200, 'POST /api/admin/advertisements returns 200');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'data.success is true');
    assert.ok(Array.isArray(data.posters), 'data.posters is an array');

    const saved = data.posters.find(p => p.link_url === testPayload.link_url);
    assert.ok(saved, 'Saved poster found in list');
    assert.strictEqual(saved.link_text, 'Shop Now', 'link_text saved correctly');
    assert.strictEqual(saved.badge, '⚡ 10-MIN Pickup', 'badge saved correctly');

    console.log('✅ Poster save verified successfully with ID:', saved.id);
}

testPosterSave().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
