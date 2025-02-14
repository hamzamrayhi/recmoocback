const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const db = require('../db/db');

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    // Check if the user exists in the users table
    const selectUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(selectUserQuery, [email], (err, userResults) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        // Check if the user exists in the admins table
        const selectAdminQuery = 'SELECT * FROM admin WHERE email = ?';
        db.query(selectAdminQuery, [email], (err, adminResults) => {
            if (err) {
                console.error('Error fetching admin:', err);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }

            let user = null;
            if (userResults.length > 0) {
                user = userResults[0];
            }

            let admin = null;
            if (adminResults.length > 0) {
                admin = adminResults[0];
            }

            if (!user && !admin) {
                // Neither user nor admin found
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const target = user || admin;

            // Compare the provided password with the hashed password from the database
            bcrypt.compare(password, target.password, (bcryptErr, bcryptResult) => {
                if (bcryptErr) {
                    console.error('Error comparing passwords:', bcryptErr);
                    return res.status(500).json({ success: false, message: 'Internal server error' });
                }

                if (bcryptResult) {
                    const userData = { ...target }; // Spread the user or admin data to include all fields
                    delete userData.password; // Remove password field
                    // Remove other fields as needed
                    if (userData.hasOwnProperty('reset_pass_expiration')) delete userData.reset_pass_expiration;
                    if (userData.hasOwnProperty('reset_pass_token')) delete userData.reset_pass_token;
                    if (userData.hasOwnProperty('token_expiration')) delete userData.token_expiration;
                    if (userData.hasOwnProperty('verification_token')) delete userData.verification_token;
                    if (userData.hasOwnProperty('email_verified')) delete userData.email_verified;


                    const token = jwt.sign({ userId: target.id }, 'RecMooc4AllSecretKeyAhmedShady', { expiresIn: '1h' });

                    if (admin) {
                        return res.status(200).json({ success: true, message: 'Admin login successful', token, userData, isAdmin: true });
                    } else {
                        if (user.email_verified === 0) {
                            return res.status(401).json({ success: false, message: 'User account not verified' });
                        }
                        return res.status(200).json({ success: true, message: 'User login successful', token, userData, isAdmin: false });
                    }
                } else {
                    // Passwords do not match
                    return res.status(401).json({ success: false, message: 'Invalid email or password' });
                }
            });
        });
    });
});

module.exports = router;
