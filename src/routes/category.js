const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Route to get all category names
router.get('/categories', (req, res) => {
    const query = `SELECT categoryname FROM category;`;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching category names:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            const categoryNames = results.map((row) => row.categoryname);
            console.log('Fetched category names:', categoryNames);
            res.json(categoryNames);
        }
    });
});

router.get('/category/:categoryname/page/:pageNumber', (req, res) => {
    const categoryName = req.params.categoryname;
    const pageNumber = parseInt(req.params.pageNumber) || 1;
    const pageSize = 10;
    const offset = (pageNumber - 1) * pageSize;

    // Extract filtering parameters from req.query
    const {
        mooc_provider,
        estimated_efforts,
        course_levels,
        mooc_price,
        lengths,
        mooc_language,
        closed_caption
    } = req.query;

    // Construct the base SQL query
    let query = `
        SELECT c.*, cat.category_image, AVG(r.rating) AS average_rating
        FROM course c
        JOIN category cat ON c.mooc_category = cat.categoryname
        LEFT JOIN reviews r ON c.id = r.courseid
        WHERE c.mooc_category = ?
    `;

    const params = [categoryName];

    // Append filtering conditions based on the provided parameters
    if (mooc_provider) {
        const providers = mooc_provider.split(',');
        query += ` AND c.mooc_provider IN (${providers.map(() => '?').join(',')})`;
        params.push(...providers);
    }
    if (estimated_efforts) {
        const efforts = estimated_efforts.split(',');
        query += ` AND c.estimated_efforts IN (${efforts.map(() => '?').join(',')})`;
        params.push(...efforts);
    }
    if (course_levels) {
        const levels = course_levels.split(',');
        query += ` AND c.course_levels IN (${levels.map(() => '?').join(',')})`;
        params.push(...levels);
    }
    if (mooc_price) {
        const prices = mooc_price.split(',');
        const priceConditions = [];
        const subscriptionConditions = [];
        const combinedConditions = [];
    
        let isLessThan50 = false;
        let isMoreThan50 = false;
        let isMonthlySubscription = false;
    
        prices.forEach(price => {
            switch (price) {
                case 'Less than 50.00 EUR':
                    isLessThan50 = true;
                    break;
                case 'More than 50.00 EUR':
                    isMoreThan50 = true;
                    break;
                case 'Monthly Subscription':
                    isMonthlySubscription = true;
                    break;
                default:
                    break;
            }
        });
    
        if (isLessThan50 && isMonthlySubscription) {
            combinedConditions.push(`(CAST(REPLACE(SUBSTRING_INDEX(c.mooc_price, ' EUR', 1), '/month', '') AS DECIMAL(10, 2)) < 50.00 AND c.mooc_price LIKE '%/month')`);
        } else if (isMoreThan50 && isMonthlySubscription) {
            combinedConditions.push(`(CAST(REPLACE(SUBSTRING_INDEX(c.mooc_price, ' EUR', 1), '/month', '') AS DECIMAL(10, 2)) > 50.00 AND c.mooc_price LIKE '%/month')`);
        } else {
            if (isLessThan50) {
                priceConditions.push(`(CAST(REPLACE(c.mooc_price, ' EUR', '') AS DECIMAL(10, 2)) < 50.00 AND c.mooc_price NOT LIKE '%/month')`);
            }
            if (isMoreThan50) {
                priceConditions.push(`(CAST(REPLACE(c.mooc_price, ' EUR', '') AS DECIMAL(10, 2)) > 50.00 AND c.mooc_price NOT LIKE '%/month')`);
            }
            if (isMonthlySubscription) {
                subscriptionConditions.push(`(c.mooc_price LIKE '%/month')`);
            }
        }
    
        const allConditions = [...priceConditions, ...subscriptionConditions, ...combinedConditions];
        if (allConditions.length > 0) {
            query += ` AND (${allConditions.join(' OR ')})`;
        }
    }
    
    if (lengths) {
        const lengthsArray = lengths.split(',');
        const lengthConditions = lengthsArray.map(length => {
            switch (length) {
                case 'Less than 5 weeks':
                    return `CAST(SUBSTRING_INDEX(c.lengths, '-', 1) AS UNSIGNED) < 5`;
                case 'More than 5 weeks':
                    return `CAST(SUBSTRING_INDEX(c.lengths, '-', -1) AS UNSIGNED) > 5`;
                case 'Self Paced':
                    return `c.lengths = 'Self-Paced'`;
                default:
                    return null;
            }
        }).filter(Boolean);
        if (lengthConditions.length > 0) {
            query += ` AND (${lengthConditions.join(' OR ')})`;
        }
    }
    if (mooc_language) {
        const languages = mooc_language.split(',');
        query += ` AND c.mooc_language IN (${languages.map(() => '?').join(',')})`;
        params.push(...languages);
    }
    if (closed_caption) {
        query +=  `AND c.closed_caption = ?`;
        params.push(closed_caption);
    }

    // Add pagination and execute the SQL query
    query += ` GROUP BY c.id ORDER BY average_rating DESC LIMIT ?, ?;`;
    params.push(offset, pageSize);

    db.query(query, params, (error, results) => {
        if (error) {
            console.error('Error fetching courses:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log(`Fetched courses for category '${categoryName}', page ${pageNumber}`);
            console.log("Received query parameters:", req.query);
            res.json(results);
        }
    });
});

module.exports = router;
