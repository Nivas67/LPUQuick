const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Try reading original uploaded media or current logo.png
const uploadedOriginal = 'C:/Users/Digvi/.gemini/antigravity-ide/brain/22ba0cf4-4348-4938-a961-ab3e697ab63b/.user_uploaded/media_1787954500497.png';
const inputPath = fs.existsSync(uploadedOriginal) ? uploadedOriginal : 'public/logo.png';

console.log('Reading from:', inputPath);

fs.createReadStream(inputPath)
    .pipe(new PNG({ filterType: 4 }))
    .on('parsed', function() {
        const width = this.width;
        const height = this.height;
        const cx = width / 2;
        const cy = height / 2;
        
        // Find the outer white circular boundary
        // Radius of the circular badge
        const r = Math.min(width, height) / 2 - 2;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (width * y + x) << 2;
                const rVal = this.data[idx];
                const gVal = this.data[idx + 1];
                const bVal = this.data[idx + 2];
                const aVal = this.data[idx + 3];

                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // 1. Outside the circular badge -> 100% transparent
                if (dist >= r) {
                    this.data[idx + 3] = 0;
                    continue;
                } else if (dist >= r - 2) {
                    // Smooth 2px anti-aliased edge
                    const alphaRatio = (r - dist) / 2;
                    this.data[idx + 3] = Math.round(aVal * alphaRatio);
                }

                // If original image, convert orange to emerald green
                if (rVal > 140 && gVal > 40 && gVal < 210 && bVal < 95 && rVal > gVal * 1.15) {
                    const intensity = rVal / 255;
                    const greenRatio = gVal / rVal;
                    const newR = Math.round(intensity * (20 + (greenRatio * 30)));
                    const newG = Math.min(255, Math.round(intensity * (195 + (greenRatio * 40))));
                    const newB = Math.round(intensity * (135 + (greenRatio * 20)));

                    this.data[idx] = newR;
                    this.data[idx + 1] = newG;
                    this.data[idx + 2] = newB;
                }
            }
        }

        const outBuffer = PNG.sync.write(this);
        
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
            console.log('Written:', targetPath);
        });

        console.log('Successfully cleaned all outer edges and created smooth transparent circular logo!');
    });
