const fs = require('fs');
let html = fs.readFileSync('admin/index.html', 'utf8');

// Check all modal elements
const modalRegex = /<div\s+id=["']([^"']*(?:modal)[^"']*)["'][^>]*>/gi;
let match;
const allModals = [];
while ((match = modalRegex.exec(html)) !== null) {
    allModals.push({ id: match[1], index: match.index });
}

console.log('Found modals:', allModals.map(m => m.id));

allModals.forEach(m => {
    let start = m.index;
    let end = html.indexOf('<!-- ===', start + 10);
    if (end === -1) end = html.indexOf('<script', start + 10);
    const chunk = html.substring(start, end);
    const opens = (chunk.match(/<div\b/gi) || []).length;
    const closes = (chunk.match(/<\/div>/gi) || []).length;
    console.log(`Modal: ${m.id} -> opens: ${opens}, closes: ${closes}, diff: ${opens - closes}`);
});
