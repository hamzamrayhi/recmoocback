const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const multer = require("multer");
const multerStorage = require("../middleware/multerstorage");
const upload = multer({ storage: multerStorage });

const db = require('../db/db'); // Assuming db connection is required

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ridealong1.mailer@gmail.com', // Your Gmail email address
        pass: 'nmea bbjr qubc evko'
    }
});

// Route to handle user registration
router.post('/register', (req, res) => {
    upload.single("user_picture")(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                message: "Image upload failed",
                error: err.message,
            });
        }
        if (!req.file) {
            return res.status(400).json({
                message: "Ajouter une image",
                error: "Please upload an image",
            });
        }
        
        const user_picture = req.file.path;
        const {
            name,
            email,
            password,
            age,
            location,
            educational_qualification,
            field_of_study,
            areas_of_interest,
            career_goals,
            accessibility_features,
            preferred_languages,
            preferred_learning_style,
            course_format
        } = req.body;

        // Check if the email already exists in the users table
        const checkEmailQuery = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
        db.query(checkEmailQuery, [email], (err, result) => {
            if (err) {
                console.error('Error checking email in users table:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const emailExistsInUsers = result[0].count > 0;

            if (emailExistsInUsers) {
                // Email already exists in users table, return error response
                return res.status(400).json({ error: 'Email already exists' });
            }

            // Check if the email exists in the admin table
            const checkEmailInAdminQuery = 'SELECT COUNT(*) AS count FROM admin WHERE email = ?';
            db.query(checkEmailInAdminQuery, [email], (err, result) => {
                if (err) {
                    console.error('Error checking email in admin table:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const emailExistsInAdmin = result[0].count > 0;

                if (emailExistsInAdmin) {
                    // Email already exists in admin table, return error response
                    return res.status(400).json({ error: 'Email already exists in admin table' });
                }

                // Email does not exist in either users or admin table, proceed with registration
                function generateTokenWithExpiration() {
                    const token = uuidv4();
                    const expiresIn = 30 * 60 * 1000; // Token expires in 30 minutes
                    const expirationDate = new Date(Date.now() + expiresIn);
                    return { token, expirationDate };
                }

                // Usage
                const { token, expirationDate } = generateTokenWithExpiration();

                // Hashing the password
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    const sql = `
                        INSERT INTO users (name, email, password, age, location, user_picture, educational_qualification, field_of_study, areas_of_interest, career_goals, accessibility_features, preferred_languages, preferred_learning_style, course_format, verification_token, token_expiration, email_verified,reset_pass_token)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,NULL)
                    `;

                    const values = [
                        name,
                        email,
                        hashedPassword, // Use hashed password instead of plain text
                        age,
                        location,
                        user_picture || '', // Default empty string if not provided
                        educational_qualification || '',
                        field_of_study || '',
                        areas_of_interest || '',
                        career_goals || '',
                        accessibility_features || '',
                        preferred_languages || '',
                        preferred_learning_style || '',
                        course_format || '',
                        token,
                        expirationDate,
                        false
                    ];

                    db.query(sql, values, (err, result) => {
                        if (err) {
                            console.error('Error registering user:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        console.log('User registered successfully');

                        // Send verification email
                        sendVerificationEmail(email, token);

                        res.status(200).json({ message: 'User registered successfully' });
                    });
                });
            });
        });
    });
});

// Function to send verification email
function sendVerificationEmail(email, token) {
    const mailOptions = {
        from: 'ridealong1.mailer@gmail.com',
        to: email,
        subject: 'Email Verification',
        html: `<p>Please Click on the following link to activate your account <a href="http://localhost:5000/api/verify?token=${token}">Account Activation Link</a></p>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

module.exports = router;
