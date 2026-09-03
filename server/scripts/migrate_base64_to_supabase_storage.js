require('dotenv').config();
const { getSupabaseClient } = require('../supabase');

async function migrateBase64ToSupabaseStorage() {
    console.log('====================================================');
    console.log('🚀 SUPABASE STORAGE MIGRATION: BASE64 -> CDN URLS');
    console.log('====================================================');

    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('Supabase client unavailable!');
        process.exit(1);
    }

    // 1. Ensure 'products' bucket exists and is public
    try {
        console.log('1. Ensuring public "products" bucket exists in Supabase Storage...');
        await supabase.storage.createBucket('products', { public: true, fileSizeLimit: 5242880 });
    } catch (e) {
        // Bucket may already exist, which is normal
    }

    // 2. Fetch all products
    console.log('2. Fetching products from Supabase PostgreSQL...');
    const { data: products, error: pErr } = await supabase.from('products').select('id, name, image_url');
    if (pErr) {
        console.error('Failed to query products:', pErr.message);
        process.exit(1);
    }

    const base64Products = products.filter(p => p.image_url && p.image_url.startsWith('data:image/'));
    const totalOriginalBytes = base64Products.reduce((acc, p) => acc + p.image_url.length, 0);

    console.log(`Found ${products.length} total products.`);
    console.log(`Found ${base64Products.length} products with raw Base64 images (${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB total).`);

    if (base64Products.length === 0) {
        console.log('✓ All products already have clean CDN URLs! No migration needed.');
        process.exit(0);
    }

    console.log('\n3. Migrating base64 images to Supabase Storage...');
    let successCount = 0;
    let failCount = 0;
    let newBytesTotal = 0;

    for (let i = 0; i < base64Products.length; i++) {
        const prod = base64Products[i];
        const rawUrl = prod.image_url;

        try {
            const matches = rawUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                console.warn(`  [!] Skipping ${prod.id} (${prod.name}): invalid base64 format`);
                failCount++;
                continue;
            }

            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            let ext = 'jpg';
            if (mimeType.includes('png')) ext = 'png';
            else if (mimeType.includes('webp')) ext = 'webp';
            else if (mimeType.includes('gif')) ext = 'gif';
            else if (mimeType.includes('svg')) ext = 'svg';

            const cleanFileName = `prod_${prod.id}_${Date.now()}.${ext}`;

            // Upload buffer to Supabase Storage
            const { error: uploadErr } = await supabase.storage
                .from('products')
                .upload(cleanFileName, buffer, {
                    contentType: mimeType,
                    upsert: true
                });

            if (uploadErr) {
                console.error(`  [x] Upload failed for ${prod.name}:`, uploadErr.message);
                failCount++;
                continue;
            }

            // Retrieve the public CDN URL
            const { data: pubData } = supabase.storage.from('products').getPublicUrl(cleanFileName);
            const publicUrl = pubData?.publicUrl;

            if (!publicUrl) {
                console.error(`  [x] Could not get public URL for ${prod.name}`);
                failCount++;
                continue;
            }

            // Update PostgreSQL record
            const { error: updateErr } = await supabase
                .from('products')
                .update({ image_url: publicUrl })
                .eq('id', prod.id);

            if (updateErr) {
                console.error(`  [x] DB update failed for ${prod.name}:`, updateErr.message);
                failCount++;
                continue;
            }

            newBytesTotal += publicUrl.length;
            successCount++;
            console.log(`  [✓] (${i + 1}/${base64Products.length}) Migrated "${prod.name}" -> ${(rawUrl.length / 1024).toFixed(1)} KB -> ${publicUrl.length} bytes`);
        } catch (err) {
            console.error(`  [x] Exception on ${prod.name}:`, err.message);
            failCount++;
        }
    }

    console.log('\n====================================================');
    console.log('🎉 MIGRATION SUMMARY');
    console.log('====================================================');
    console.log(`Successfully migrated: ${successCount} products`);
    console.log(`Failed: ${failCount} products`);
    console.log(`Initial DB image size: ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`New DB image size:     ${(newBytesTotal / 1024).toFixed(2)} KB`);
    console.log(`Payload reduction:     ${(((totalOriginalBytes - newBytesTotal) / totalOriginalBytes) * 100).toFixed(2)}% SAVINGS`);

    // Invalidate caches
    try {
        const cache = require('../cache');
        cache.invalidateProducts();
    } catch (e) {}

    process.exit(failCount === 0 ? 0 : 1);
}

migrateBase64ToSupabaseStorage().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
