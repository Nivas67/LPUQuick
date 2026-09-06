const fs = require('fs');
const html = fs.readFileSync('admin/index.html', 'utf8');

const modals = [
    'modal-transfer-order',
    'modal-edit-order',
    'poster-modal'
];

modals.forEach(modalId => {
    const startIdx = html.indexOf(`id="${modalId}"`);
    if (startIdx === -1) {
        console.log(`Modal ${modalId} NOT FOUND`);
        return;
    }
    // Find next modal or end
    console.log(`\n=== Modal: ${modalId} ===`);
    const slice = html.slice(startIdx, startIdx + 3000);
    // Let's count <div> and </div>
    const tags = slice.match(/<\/?div\b[^>]*>/gi) || [];
    let count = 0;
    let closedAt = -1;
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].startsWith('</div')) {
            count--;
            if (count === 0) {
                closedAt = i;
                console.log(`Closed properly at tag index ${i}`);
                break;
            }
        } else {
            count++;
        }
    }
    if (count !== 0) {
        console.log(`UNCLOSED! Remaining open count: ${count}`);
    }
});
