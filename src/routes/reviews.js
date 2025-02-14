const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.post('/:courseId/add-review', (req, res) => {
    const { courseId } = req.params;
    const { userid, review, rating } = req.body;
 // Check if review is empty
 if (!review || review.trim() === '') {
    return res.status(400).json({ error: 'Review cannot be empty' });
}

    const query = `
        INSERT INTO reviews (userid, review, courseid, rating) 
        VALUES (?, ?, ?, ?);
    `;

    db.query(query, [userid, review, courseId, rating], (error, results) => {
        if (error) {
            console.error('Error adding review:', error);
            res.status(500).json({ error: 'Failed to add review' });
        } else {
            console.log('Review added successfully');
            res.status(200).json({ message: 'Review added successfully' });
        }
    });
});


router.get('/:courseId/reviews', (req, res) => {
    const { courseId } = req.params;

    // Query to fetch all reviews for the specified course ID
    const reviewsQuery = `
        SELECT reviews.*, users.user_picture, users.name
        FROM reviews
        INNER JOIN users ON reviews.userid = users.id
        WHERE reviews.courseid = ?;
    `;

    db.query(reviewsQuery, [courseId], (error, reviewsResults) => {
        if (error) {
            console.error('Error fetching reviews:', error);
            res.status(500).json({ error: 'Failed to fetch reviews' });
        } else {
            console.log('Fetched reviews:', reviewsResults);
            
            // Calculate the average rating of the fetched reviews
            const totalReviews = reviewsResults.length;
            const totalRatings = reviewsResults.reduce((total, review) => total + review.rating, 0);
            const averageRating = totalRatings / totalReviews;

            console.log('Average rating:', averageRating);

            // Send the fetched reviews along with the average rating in the response
            res.status(200).json({ reviews: reviewsResults, averageRating });
        }
    });
});

router.get('/reviews/:category', (req, res) => {
    const { category } = req.params;
    const query = `
    SELECT reviews.*, course.mooc_name, users.name, users.user_picture
    FROM reviews
    INNER JOIN course ON reviews.courseid = course.id
    INNER JOIN users ON reviews.userid = users.id
    WHERE course.mooc_category = ?
  `;
  
    db.query(query, [category], (err, results) => {
      if (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
});

module.exports = router;
