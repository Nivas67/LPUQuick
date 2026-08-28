const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// POST /api/auth/signin
router.post('/signin', (req, res) => {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT id, name, email, phone, dob FROM users WHERE email = ? OR phone = ?').get(email, email);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simplified auth for demo (no bcrypt)
    res.json({ success: true, user });
});

// POST /api/auth/signup
router.post('/signup', (req, res) => {
    const { name, email, phone, password, dob } = req.body;
    const db = req.app.locals.db;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        return res.status(409).json({ error: 'Account already exists' });
    }

    const id = `user_${uuidv4().slice(0, 8)}`;
    db.prepare('INSERT INTO users (id, name, email, phone, password_hash, dob) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, name, email, phone || '', `hash_${password}`, dob || '');

    res.json({ success: true, user: { id, name, email, phone, dob } });
});

module.exports = router;
