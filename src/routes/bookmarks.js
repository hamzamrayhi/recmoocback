const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Add a bookmark for a user and course
router.post('/bookmarks/:courseId', (req, res) => {
    const { userId } = req.query; // Retrieve userId from request query parameters
    const { courseId } = req.params;

    // Ensure userId is provided
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    db.query('SELECT id FROM user_bookmarks WHERE usersid = ? AND courseid = ?', [userId, courseId], (err, result) => {
        if (err) {
            console.error('Error checking bookmark:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length > 0) {
            return res.status(400).json({ error: 'Bookmark already exists' });
        }

       
        const sql = 'INSERT INTO user_bookmarks (usersid, courseid) VALUES (?, ?)';
        const values = [userId, courseId];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error adding bookmark:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ message: 'Bookmark added successfully' });
        });
    });
});


// Get bookmarked courses for a user
router.get('/bookmarked-courses/:userId', (req, res) => {
    const { userId } = req.params;

    // Ensure userId is provided
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    // Query to get bookmarked courses for the user
    const sql = `
    SELECT course.*, category.category_image
    FROM course
    INNER JOIN user_bookmarks ON course.id = user_bookmarks.courseid
    INNER JOIN category ON course.mooc_category = category.categoryname
    WHERE user_bookmarks.usersid = ?
    
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching bookmarked courses:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Send the list of bookmarked courses
        res.json(results);
    });
});
router.get('/bookmarked-courses/:userId/category/:categoryName', (req, res) => {
    const { userId, categoryName } = req.params;

    // Ensure userId and categoryName are provided
    if (!userId || !categoryName) {
        return res.status(400).json({ error: 'userId and categoryName are required' });
    }

    // Query to get bookmarked courses for the user within the specified category
    const sql = `
    SELECT course.*, category.category_image
    FROM course
    INNER JOIN user_bookmarks ON course.id = user_bookmarks.courseid
    INNER JOIN category ON course.mooc_category = category.categoryname
    WHERE user_bookmarks.usersid = ? AND course.mooc_category = ?
    `;

    db.query(sql, [userId, categoryName], (err, results) => {
        if (err) {
            console.error('Error fetching bookmarked courses:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Send the list of bookmarked courses for the user within the specified category
        res.json(results);
    });
});
// Remove a bookmark for a user and course
router.delete('/bookmarks/:courseId', (req, res) => {
    const { userId } = req.query;
    const { courseId } = req.params;

    // Ensure userId is provided
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    // Check if the bookmark exists
    db.query('DELETE FROM user_bookmarks WHERE usersid = ? AND courseid = ?', [userId, courseId], (err, result) => {
        if (err) {
            console.error('Error removing bookmark:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Bookmark not found' });
        }

        res.json({ message: 'Bookmark removed successfully' });
    });
});



module.exports = router;
