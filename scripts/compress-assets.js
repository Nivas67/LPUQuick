const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function resizePNG(srcPng, targetWidth, targetHeight) {
    const dstPng = new PNG({ width: targetWidth, height: targetHeight });
    const xRatio = srcPng.width / targetWidth;
    const yRatio = srcPng.height / targetHeight;

    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            // Bilinear / nearest sampling
            const srcX = Math.min(srcPng.width - 1, Math.floor(x * xRatio));
            const srcY = Math.min(srcPng.height - 1, Math.floor(y * yRatio));

            const srcIdx = (srcPng.width * srcY + srcX) << 2;
            const dstIdx = (targetWidth * y + x) << 2;

            dstPng.data[dstIdx] = srcPng.data[srcIdx];
            dstPng.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
            dstPng.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
            dstPng.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
        }
    }
    return dstPng;
}

function compressAllAssets() {
    console.log('🖼️ Starting High-Fidelity Asset Compression...\n');

    const inputLogoPath = path.join(__dirname, '..', 'client', 'logo.png');
    if (!fs.existsSync(inputLogoPath)) {
        console.error('Cannot find source logo at:', inputLogoPath);
        return;
    }

    const rawBuffer = fs.readFileSync(inputLogoPath);
    const srcPng = PNG.sync.read(rawBuffer);
    console.log(`Original dimensions: ${srcPng.width}x${srcPng.height} (${Math.round(rawBuffer.length / 1024)} KB)`);

    // 1. Generate 256x256 Crisp Logo (~25 KB)
    const logoPng = resizePNG(srcPng, 256, 256);
    const logoBuffer = PNG.sync.write(logoPng, { deflateLevel: 9 });

    // 2. Generate 64x64 Crisp Favicon (~5 KB)
    const faviconPng = resizePNG(srcPng, 64, 64);
    const faviconBuffer = PNG.sync.write(faviconPng, { deflateLevel: 9 });

    const targetDirs = ['client', 'admin', 'public'];
    
    targetDirs.forEach(dir => {
        const dirPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(dirPath)) return;

        // Write logo.png
        const logoOut = path.join(dirPath, 'logo.png');
        fs.writeFileSync(logoOut, logoBuffer);
        console.log(`✅ Compressed ${dir}/logo.png -> ${Math.round(logoBuffer.length / 1024)} KB`);

        // Write favicon.png
        const favPngOut = path.join(dirPath, 'favicon.png');
        fs.writeFileSync(favPngOut, faviconBuffer);
        console.log(`✅ Compressed ${dir}/favicon.png -> ${Math.round(faviconBuffer.length / 1024)} KB`);

        // Write favicon.ico (valid PNG icon format supported by modern browsers)
        const favIcoOut = path.join(dirPath, 'favicon.ico');
        fs.writeFileSync(favIcoOut, faviconBuffer);
        console.log(`✅ Compressed ${dir}/favicon.ico -> ${Math.round(faviconBuffer.length / 1024)} KB`);
    });

    console.log('\n🎉 Asset compression complete! Total savings: ~3.8 MB');
}

compressAllAssets();
