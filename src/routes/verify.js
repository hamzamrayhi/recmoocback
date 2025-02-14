const express = require('express');
const router = express.Router();

const db = require('../db/db'); // Assuming db connection is required

// Route to handle email verification
router.get('/verify', (req, res) => {
    console.log('Received GET request for /verify');
    const { token } = req.query;

    if (!token) {
        console.error('Verification token is missing');
        return res.status(400).json({ error: 'Verification token is missing' });
    }

    // Check if the token exists in the database
    const sql = 'SELECT * FROM users WHERE verification_token = ?';
    db.query(sql, [token], (err, result) => {
        if (err) {
            console.error('Error verifying email:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length === 0) {
            console.error('Invalid verification token');
            return res.status(404).json({ error: 'Invalid verification token' });
        }

        // Check if the token has expired
        const expirationDate = result[0].expiration_date;
        if (expirationDate < new Date()) {
            console.error('Verification token has expired');
            return res.status(400).json({ error: 'Verification token has expired' });
        }

        // Update the user's email_verified status in the database
        const userId = result[0].id;
        console.log('User ID:', userId);
        const updateSql = 'UPDATE users SET email_verified = true WHERE id = ?';
        db.query(updateSql, [userId], (err, result) => {
            if (err) {
                console.error('Error updating email verification status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.redirect('http://localhost:3000/login');

        });
    });
});

module.exports = router;
