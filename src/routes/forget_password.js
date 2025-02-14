const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const db = require('../db/db'); // Assuming db connection is required

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ridealong1.mailer@gmail.com', // Your Gmail email address
        pass: 'nmea bbjr qubc evko'
    }
});

// Route to handle forgot password requests
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    // Check if the email exists in the database
    const checkEmailQuery = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
    db.query(checkEmailQuery, [email], (err, result) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const emailExists = result[0].count > 0;

        if (!emailExists) {
            // Email doesn't exist, return error response
            return res.status(404).json({ error: 'Email not found' });
        }

        // Generate a reset token and update the database
        const { token, expirationDate } = generateTokenWithExpiration();

        const updateTokenQuery = 'UPDATE users SET reset_pass_token = ?, reset_pass_expiration = ? WHERE email = ?';
        db.query(updateTokenQuery, [token, expirationDate, email], (updateErr) => {
            if (updateErr) {
                console.error('Error updating reset token:', updateErr);
                return res.status(500).json({ error: 'Internal server error' });
            }

            // Send a reset email
            sendResetEmail(email, token);

            return res.status(200).json({ message: 'Reset email sent successfully' });
        });
    });
});

// Route to handle password update after confirmation
router.post('/reset-password-confirm', (req, res) => {
    console.log('Received request:', req.body);
    const { token, newPassword } = req.body;

    // Check if the token is valid and not expired
    const checkTokenQuery = 'SELECT * FROM users WHERE reset_pass_token = ? AND reset_pass_expiration > NOW()';
    db.query(checkTokenQuery, [token], (err, result) => {
        if (err) {
            console.error('Error checking reset token:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length === 0) {
            // Token is invalid or expired
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const userId = result[0].id;

        // Hash the new password
        bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error('Error hashing password:', hashErr);
                return res.status(500).json({ error: 'Internal server error' });
            }

            // Update the user's password and clear the reset token
            const updatePasswordQuery = 'UPDATE users SET password = ?, reset_pass_token = null, reset_pass_expiration = null WHERE id = ?';
            db.query(updatePasswordQuery, [hashedPassword, userId], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating password:', updateErr);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                return res.status(200).json({ message: 'Password reset successfully' });
            });
        });
    });
});

// Helper function to generate a random reset token
function generateTokenWithExpiration() {
    const token = uuidv4();
    const expiresIn = 30 * 60 * 1000; // Token expires in 30 minutes
    const expirationDate = new Date(Date.now() + expiresIn);
    return { token, expirationDate };
}

// Helper function to send a reset email
function sendResetEmail(email, token) {
    const mailOptions = {
        from: 'ridealong1.mailer@gmail.com',
        to: email,
        subject: 'Password Reset',
        html: `<p>Click the following link to reset your password: <a href="http://localhost:3000/resetpasswordpage/${token}">Reset Password Link</a></p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending reset email:', error);
        } else {
            console.log('Reset email sent:', info.response);
        }
    });
}

module.exports = router;
