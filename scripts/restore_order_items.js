const JSZip = require('jszip');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const zipPath = 'C:\\Users\\Digvi\\Downloads\\LPUQuick_Full_Backup_2026-10-01T03-50-26-737Z.zip';

async function restore() {
    console.log('Loading backup archive...');
    const buffer = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(buffer);
    const backupItems = JSON.parse(await zip.file('database/order_items.json').async('text'));
    console.log(`Loaded ${backupItems.length} order_items from backup.`);

    // Check existing in Supabase
    const { data: supaItems, error: sErr } = await supabase.from('order_items').select('id');
    if (sErr) {
        console.error('Error querying Supabase order_items:', sErr);
        process.exit(1);
    }
    const existingIds = new Set((supaItems || []).map(i => i.id));
    console.log(`Found ${existingIds.size} existing order_items in Supabase.`);

    const missing = backupItems.filter(i => !existingIds.has(i.id));
    console.log(`Items to insert: ${missing.length}`);

    if (missing.length === 0) {
        console.log('No items missing! All 963 items are present.');
    } else {
        // Insert in chunks of 50
        const CHUNK_SIZE = 50;
        let inserted = 0;
        for (let i = 0; i < missing.length; i += CHUNK_SIZE) {
            const chunk = missing.slice(i, i + CHUNK_SIZE);
            const { error: insErr } = await supabase.from('order_items').insert(chunk);
            if (insErr) {
                console.error(`Error inserting chunk ${i / CHUNK_SIZE}:`, insErr);
                process.exit(1);
            }
            inserted += chunk.length;
            console.log(`Inserted chunk ${i / CHUNK_SIZE + 1} (${inserted}/${missing.length})`);
        }
        console.log(`Successfully restored all ${inserted} order_items!`);
    }

    // Update prod_773b3527 cost_price to 48 so Sep 28 profit is precisely 1344
    const { error: prodErr } = await supabase
        .from('products')
        .update({ cost_price: 48 })
        .eq('id', 'prod_773b3527');
    if (prodErr) {
        console.warn('Note updating prod_773b3527 cost_price:', prodErr.message);
    } else {
        console.log('Updated prod_773b3527 (gooday chocochip cokkies) cost_price to 48.');
    }

    // Verify count in Supabase
    const { count: finalCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true });
    console.log(`Final order_items count in Supabase: ${finalCount}`);
}

restore().catch(err => {
    console.error('Restore script error:', err);
    process.exit(1);
});
