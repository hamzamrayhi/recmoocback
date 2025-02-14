const express = require('express');
const router = express.Router();
const db = require('../db/db');
const multer = require('multer');
const multerStorage = require('../middleware/multerstorage');
const bcrypt = require('bcryptjs'); // Using bcryptjs for password hashing

// Initialize Multer middleware with storage configuration
const upload = multer({ storage: multerStorage });

router.put('/users/:id/settings', upload.single('user_picture'), async (req, res) => {
    const userId = req.params.id;

    // Destructure req.body and exclude 'password', 'repeatPassword', and 'role'
    let { password, repeatPassword, role, ...newSettings } = req.body;

    // Check if a file is uploaded
    if (req.file) {
        // If file is uploaded, update user_picture in newSettings
        newSettings.user_picture = req.file.path;
        console.log('Uploaded image path:', newSettings.user_picture);
    } else {
        console.log('No image uploaded');
    }

    // Hash the password if it's present in the request body
    if (password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10); // Hashing password
            newSettings.password = hashedPassword;
        } catch (error) {
            console.error('Error hashing password:', error);
            return res.status(500).json({ error: 'Error hashing password' });
        }
    }

    // Update user settings in the database
    console.log('Updating user settings in the database...');
    db.query(
        'UPDATE users SET ? WHERE id = ?',
        [newSettings, userId],
        (error, results) => {
            if (error) {
                console.error('Error updating user settings: ', error);
                res.status(500).json({ error: 'Error updating user settings' });
            } else {
                console.log('User settings updated successfully in the database');
                // Fetch the updated user data from the database
                db.query(
                    'SELECT name, email, age, location, user_picture, educational_qualification, field_of_study, areas_of_interest, career_goals, accessibility_features, preferred_languages, preferred_learning_style, course_format FROM users WHERE id = ?',
                    userId,
                    (err, user) => {
                        if (err) {
                            console.error('Error fetching updated user data:', err);
                            res.status(500).json({ error: 'Error fetching updated user data' });
                        } else {
                            console.log('Fetched updated user data:', user[0]);
                            const updatedUser = user[0]; // Assuming user[0] contains the updated user data
                            if (!updatedUser) {
                                console.error('No user data found for id:', userId);
                                return res.status(404).json({ error: 'No user data found' });
                            }
                            // Add userId as id property inside updatedUser
                            updatedUser.id = userId;
                            console.log('Updated User:', updatedUser);
                            res.status(200).json({ message: 'User settings updated successfully', updatedUser });
                        }
                    }
                );
            }
        }
    );
});

module.exports = router;
