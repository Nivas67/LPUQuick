const fs = require('fs');
const { PNG } = require('pngjs');

const inputPath = 'C:/Users/Digvi/.gemini/antigravity-ide/brain/22ba0cf4-4348-4938-a961-ab3e697ab63b/.user_uploaded/media_1787954500497.png';

fs.createReadStream(inputPath)
    .pipe(new PNG({ filterType: 4 }))
    .on('parsed', function() {
        const width = this.width;
        const height = this.height;
        const cx = width / 2;
        const cy = height / 2;
        const r = width / 2;
        
        // Superellipse formula for squircle (n = 4 or 5)
        const n = 4.2;
        const maxDist = Math.pow(r - 12, n);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (width * y + x) << 2;
                const rVal = this.data[idx];
                const gVal = this.data[idx + 1];
                const bVal = this.data[idx + 2];
                const aVal = this.data[idx + 3];

                // 1. Transparent Corners outside the squircle
                const dx = Math.abs(x - cx);
                const dy = Math.abs(y - cy);
                const dist = Math.pow(dx, n) + Math.pow(dy, n);

                if (dist > maxDist) {
                    // Smooth antialiased transparent edge
                    const edgeDist = (dist - maxDist) / (Math.pow(r, n) - maxDist);
                    if (edgeDist > 0.08 || (rVal < 15 && gVal < 15 && bVal < 15)) {
                        this.data[idx + 3] = 0; // Completely transparent
                        continue;
                    }
                }

                // 2. Color Shift Orange to Emerald Green
                // Orange detection in RGB: high Red, moderate Green (R > 1.3 * G), low Blue (B < 100)
                if (rVal > 140 && gVal > 40 && gVal < 210 && bVal < 95 && rVal > gVal * 1.15) {
                    // Calculate relative orange luminance / intensity
                    const intensity = rVal / 255;
                    const greenRatio = gVal / rVal;

                    // Convert to Emerald Green (#10B981) to Mint (#34D399)
                    // Emerald: R: 16 (0.06), G: 185 (0.72), B: 129 (0.50)
                    // Bright highlights get minty, shadows get rich deep emerald
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
        fs.writeFileSync('public/logo.png', outBuffer);
        fs.writeFileSync('public/favicon.png', outBuffer);
        fs.writeFileSync('public/favicon.ico', outBuffer);
        console.log('Successfully processed logo with transparent edges and emerald hue!');
    });
