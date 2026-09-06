const fs = require('fs');
const html = fs.readFileSync('admin/index.html', 'utf8');
const lines = html.split('\n');

console.log('Total lines:', lines.length);

// Find all elements with id containing 'modal'
lines.forEach((line, idx) => {
    if (/id=["'][^"']*modal[^"']*["']/i.test(line)) {
        console.log(`Line ${idx + 1}: ${line.trim().slice(0, 100)}`);
    }
});
