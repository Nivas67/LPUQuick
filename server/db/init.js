const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'lpuquick.db');

function initDB() {
    const db = new DatabaseSync(DB_PATH);

    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);

    // Check if data already seeded
    const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
    if (!count || count.c === 0) {
        const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
        db.exec(seed);
        console.log('[DB] Database seeded with initial data.');
    } else {
        console.log('[DB] Database already contains data, skipping seed.');
    }

    console.log(`[DB] Connected to SQLite at ${DB_PATH}`);
    return db;
}

module.exports = { initDB, DB_PATH };
