const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Add a new profile
router.post('/profiles', (req, res) => {
    const { userID, name, fontSize, fontStyle, contrast } = req.body;
      // Validate profile name
      if (!name || name.trim() === "") {
        return res.status(400).json({ success: false, message: 'Profile name cannot be empty' });
    }

    const profileQuery = 'INSERT INTO toolbar_profiles (userID, profile_name, fontSize, fontStyle) VALUES (?, ?, ?, ?)';
    db.query(profileQuery, [userID, name, fontSize, fontStyle, contrast], (err, result) => {
        if (err) {
            console.error('Error adding profile:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        console.log('Profile added successfully');
        res.status(201).json({ success: true, message: 'Profile added successfully', profileID: result.insertId });
    });
});

// Fetch profiles for a certain user
router.get('/profiles/:userID', (req, res) => {
    const userID = req.params.userID;
    const profilesQuery = 'SELECT * FROM toolbar_profiles WHERE userID = ?';
    db.query(profilesQuery, [userID], (err, results) => {
        if (err) {
            console.error('Error fetching profiles:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json({ success: true, profiles: results });
    });
});

// Delete a profile
router.delete('/profiles/:profileID', (req, res) => {
    const profileID = req.params.profileID;
    const deleteQuery = 'DELETE FROM toolbar_profiles WHERE id = ?';
    db.query(deleteQuery, [profileID], (err, result) => {
        if (err) {
            console.error('Error deleting profile:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        console.log('Profile deleted successfully');
        res.json({ success: true, message: 'Profile deleted successfully' });
    });
});

module.exports = router;
