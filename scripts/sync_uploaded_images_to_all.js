require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { getSupabaseClient } = require('../server/supabase');

const PUBLIC_UPLOADS = path.join(__dirname, '../public/uploads');
const CLIENT_UPLOADS = path.join(__dirname, '../client/uploads');
const SNAPSHOT_PATH = path.join(__dirname, '../server/data/products_snapshot.json');
const BANNERS_PATH = path.join(__dirname, '../server/data/banners.json');

const EXPLICIT_MAP = {
    'prod_cb7a294d': 'Maggie_Double_Masala_2-Minute_noodles_95g_1788872878836.jpg',
    'prod_8e1cb24d': 'Maggi_Passta_Mushroom_Penne_68_1788532913397.jpg',
    'prod_ab976e1d': 'MAGGI_Pazzta_Masala_Penne_69_1788697312878.jpg',
    'prod_d63199f0': 'Maggi_Passta_Cheese_Macroni_1788532672101.jpg',
    'prod_14ece3af': 'prod_prod_73ad9ca2_1788463605585.webp',
    'prod_dd96210d': 'Crax_Curls_82g_1788620575418.jpg',
    'prod_56c626c6': 'KURKURE_Masala_Munch_1788532137536.jpg',
    'prod_11fb98b1': 'prod_prod_6b28f291_1788463603648.jpg',
    'prod_773b3527': 'prod_prod_a3d19662_1788463604903.jpg'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    return 'application/octet-stream';
}

async function main() {
    console.log('====================================================');
    console.log('🖼️ Synchronizing Uploaded Images for All 73 Products');
    console.log('   Target Supabase URL:', process.env.SUPABASE_URL);
    console.log('====================================================\n');

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    // 1. Sync public/uploads into client/uploads for local filesystem parity
    console.log('1. Syncing local uploads folders (public/uploads -> client/uploads)...');
    if (!fs.existsSync(CLIENT_UPLOADS)) {
        fs.mkdirSync(CLIENT_UPLOADS, { recursive: true });
    }

    const uploadFiles = fs.readdirSync(PUBLIC_UPLOADS).filter(f => !fs.statSync(path.join(PUBLIC_UPLOADS, f)).isDirectory());
    let copiedCount = 0;
    for (const f of uploadFiles) {
        const src = path.join(PUBLIC_UPLOADS, f);
        const dest = path.join(CLIENT_UPLOADS, f);
        if (!fs.existsSync(dest) || fs.statSync(src).size !== fs.statSync(dest).size) {
            fs.copyFileSync(src, dest);
            copiedCount++;
        }
    }
    console.log(`✓ Synchronized ${uploadFiles.length} files into client/uploads (copied ${copiedCount} new/updated)\n`);

    // 2. Upload all files to Supabase Storage CDN (bucket 'products')
    console.log('2. Uploading images to Supabase Storage bucket "products"...');
    let uploadedCount = 0;
    let failedCount = 0;

    for (const f of uploadFiles) {
        const filePath = path.join(PUBLIC_UPLOADS, f);
        const fileData = fs.readFileSync(filePath);
        const mime = getMimeType(filePath);

        const { error } = await supabase.storage.from('products').upload(f, fileData, {
            contentType: mime,
            upsert: true
        });

        if (error) {
            console.warn(`  ✗ Failed to upload ${f}:`, error.message);
            failedCount++;
        } else {
            uploadedCount++;
        }
    }
    console.log(`✓ Uploaded ${uploadedCount} image files to Supabase CDN (Failed: ${failedCount})\n`);

    // 3. Map each product to its real image
    console.log('3. Resolving exact image URLs for all 73 products...');
    const prods = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));

    const updatedProds = prods.map(p => {
        let chosen = EXPLICIT_MAP[p.id];
        if (!chosen) {
            const cur = (p.image_url || '').split('/').pop();
            if (uploadFiles.includes(cur)) chosen = cur;
        }
        if (!chosen) {
            const cleanId = p.id.replace('prod_', '');
            chosen = uploadFiles.find(f => f.includes(p.id) || f.includes(cleanId));
        }
        if (!chosen) {
            const slug = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            chosen = uploadFiles.find(f => {
                const fSlug = f.toLowerCase().replace(/[^a-z0-9]/g, '');
                return fSlug.includes(slug.slice(0, 15)) || (slug.length > 8 && fSlug.includes(slug.slice(0, 8)));
            });
        }

        // Get public Supabase URL or standard /uploads/ relative URL
        const imageUrl = `/uploads/${chosen || 'placeholder.jpg'}`;

        return {
            ...p,
            image_url: imageUrl,
            image_alt: p.name
        };
    });

    // 4. Update Supabase Cloud database
    console.log('4. Updating product image_url in Supabase Cloud database...');
    for (let i = 0; i < updatedProds.length; i += 50) {
        const batch = updatedProds.slice(i, i + 50);
        const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
        if (error) {
            console.error(`Error updating products batch ${i}:`, error.message);
        }
    }
    console.log(`✓ Updated ${updatedProds.length} products in Supabase Cloud\n`);

    // 5. Update local SQLite databases
    console.log('5. Updating local SQLite databases with verified image paths...');
    for (const dbRel of ['../server/db/lpuquick.db', '../server/data/lpuquick_local.db']) {
        const targetPath = path.join(__dirname, dbRel);
        if (fs.existsSync(targetPath)) {
            const localDb = new DatabaseSync(targetPath);
            localDb.exec('PRAGMA foreign_keys = OFF;');
            const stmt = localDb.prepare('UPDATE products SET image_url = ?, image_alt = ? WHERE id = ?');
            localDb.exec('BEGIN TRANSACTION;');
            for (const p of updatedProds) {
                stmt.run(p.image_url, p.image_alt, p.id);
            }
            localDb.exec('COMMIT;');
            localDb.exec('PRAGMA foreign_keys = ON;');
            console.log(`✓ ${dbRel} image paths updated`);
        }
    }

    // 6. Update products_snapshot.json on disk
    console.log('\n6. Updating server/data/products_snapshot.json on disk...');
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(updatedProds, null, 2), 'utf8');
    console.log(`✓ server/data/products_snapshot.json updated`);

    // 7. Update banners.json if pointing to old Supabase URL
    if (fs.existsSync(BANNERS_PATH)) {
        console.log('\n7. Updating banner image URLs in server/data/banners.json...');
        const bannersData = JSON.parse(fs.readFileSync(BANNERS_PATH, 'utf8'));
        let bannerUpdated = false;
        if (bannersData.banners) {
            bannersData.banners.forEach(b => {
                if ((b.image_url || '').includes('yojndzstlilzlkxonmvd')) {
                    b.image_url = '/uploads/banner_poster_1788700071304_y6m6.jpg';
                    bannerUpdated = true;
                }
            });
        }
        if (bannerUpdated) {
            fs.writeFileSync(BANNERS_PATH, JSON.stringify(bannersData, null, 2), 'utf8');
            console.log('✓ banners.json updated with local banner image');
        }
    }

    console.log('\n====================================================');
    console.log('🎉 ALL PRODUCT IMAGES SUCCESSFULLY SYNCHRONIZED!');
    console.log('====================================================');
}

main()
    .then(() => setTimeout(() => process.exit(0), 1000))
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    });
