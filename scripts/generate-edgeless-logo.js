const fs = require('fs');
const { PNG } = require('pngjs');

const inputPath = 'C:/Users/Digvi/.gemini/antigravity-ide/brain/22ba0cf4-4348-4938-a961-ab3e697ab63b/.user_uploaded/media_1787954500497.png';

fs.createReadStream(inputPath)
    .pipe(new PNG({ filterType: 4 }))
    .on('parsed', function() {
        const srcWidth = this.width; // 1024
        const srcHeight = this.height; // 1024
        const cx = 512;
        const cy = 512;
        const radius = 473; // Exact outer boundary of the white circle badge

        // Create a tightly cropped square PNG of size 950 x 950
        const outSize = Math.round(radius * 2); // 946
        const cropped = new PNG({ width: outSize, height: outSize });

        const halfOut = outSize / 2;

        for (let y = 0; y < outSize; y++) {
            for (let x = 0; x < outSize; x++) {
                const srcX = Math.round(cx - halfOut + x);
                const srcY = Math.round(cy - halfOut + y);

                const outIdx = (outSize * y + x) << 2;
                const srcIdx = (srcWidth * srcY + srcX) << 2;

                const dx = x - halfOut;
                const dy = y - halfOut;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist >= halfOut) {
                    // Completely transparent outside the circle
                    cropped.data[outIdx] = 0;
                    cropped.data[outIdx + 1] = 0;
                    cropped.data[outIdx + 2] = 0;
                    cropped.data[outIdx + 3] = 0;
                    continue;
                }

                let rVal = this.data[srcIdx];
                let gVal = this.data[srcIdx + 1];
                let bVal = this.data[srcIdx + 2];
                let aVal = this.data[srcIdx + 3];

                // Convert Orange to Emerald Green
                if (rVal > 140 && gVal > 40 && gVal < 210 && bVal < 95 && rVal > gVal * 1.15) {
                    const intensity = rVal / 255;
                    const greenRatio = gVal / rVal;
                    rVal = Math.round(intensity * (20 + (greenRatio * 30)));
                    gVal = Math.min(255, Math.round(intensity * (195 + (greenRatio * 40))));
                    bVal = Math.round(intensity * (135 + (greenRatio * 20)));
                }

                // Smooth anti-aliased edge over the outer 2 pixels
                if (dist >= halfOut - 2) {
                    const edgeAlpha = (halfOut - dist) / 2;
                    aVal = Math.round(aVal * edgeAlpha);
                }

                cropped.data[outIdx] = rVal;
                cropped.data[outIdx + 1] = gVal;
                cropped.data[outIdx + 2] = bVal;
                cropped.data[outIdx + 3] = aVal;
            }
        }

        const outBuffer = PNG.sync.write(cropped);

        const targets = [
            'public/logo.png',
            'public/favicon.png',
            'public/favicon.ico',
            'client/logo.png',
            'client/favicon.png',
            'client/favicon.ico'
        ];

        targets.forEach(targetPath => {
            fs.writeFileSync(targetPath, outBuffer);
            console.log('Successfully written clean edgeless logo to:', targetPath);
        });
    });
