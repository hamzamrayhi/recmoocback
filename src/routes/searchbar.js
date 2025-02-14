const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Endpoint to retrieve course suggestions
router.get('/searchbar/courses/suggestions', (req, res) => {
    // Get the search text and instructor name from the query parameters
    const searchText = req.query.searchText || '';
    const university_related = req.query.instructorName || '';

    let query = 'SELECT id, mooc_name,university_related FROM course';

    // Modify the query to filter by mooc_name or instructor_name
    if (searchText && university_related) {
        query += ` WHERE mooc_name LIKE '%${searchText}%' OR university_related LIKE '%${university_related}%'`;
    } else if (searchText) {
        query += ` WHERE mooc_name LIKE '%${searchText}%'`;
    } else if (university_related) {
        query += ` WHERE mooc_instructor LIKE '%${university_related}%'`;
    }

    // Execute the query
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error retrieving course suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            // Send the course suggestions as JSON response
            res.json({ suggestions: results });
        }
    });
});
router.get('/courses/details/:courseId', (req, res) => {
    const courseId = req.params.courseId;

    // Query to retrieve course details by courseId
    const query = `SELECT * FROM course WHERE id = ${courseId}`;

    // Execute the query
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error retrieving course details:', error);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            if (results.length === 0) {
                res.status(404).json({ error: 'Course not found' });
            } else {
                // Send the course details as JSON response
                res.json({ course: results[0] });
            }
        }
    });
});

module.exports = router;
