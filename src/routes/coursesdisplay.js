// Import necessary modules
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/highest-rated-universities/:category", (req, res) => {
  // Extract the category parameter from the request
  const categoryParam = req.params.category;

  // Fetch the top 10 universities with the highest-rated courses in the specified category
  const query = `
        SELECT c.university_related, COUNT(*) as total_courses, AVG(r.rating) as average_rating
        FROM course c
        LEFT JOIN reviews r ON c.id = r.courseid
        WHERE c.mooc_category = ?
        GROUP BY c.university_related
        HAVING total_courses >= 5
        ORDER BY average_rating DESC
        LIMIT 10
    `;

  db.query(query, [categoryParam], (error, results) => {
    if (error) {
      console.error(
        "Error fetching highest-rated universities for the category:",
        error
      );
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.length === 0) {
        // No universities found for the specified category
        res
          .status(404)
          .json({
            message: "No universities found for the specified category",
          });
      } else {
        console.log(
          `Fetched top 10 highest-rated universities for the category '${categoryParam}':`,
          results
        );
        res.json(results);
      }
    }
  });
});

// Route to fetch the courses with the most number of reviews in a specific category
router.get("/most-reviewed-courses/:category", (req, res) => {
  // Extract the category parameter from the request
  const categoryParam = req.params.category;

  // Fetch the courses with the most number of reviews in the specified category
  const query = `
    SELECT c.*, COUNT(r.id) AS total_reviews, cat.category_image
    FROM course c
    LEFT JOIN reviews r ON c.id = r.courseid
    LEFT JOIN category cat ON c.mooc_category = cat.categoryname
    WHERE c.mooc_category = ?
    GROUP BY c.id, c.mooc_name
    ORDER BY total_reviews DESC
    LIMIT 10;    
    `;

  db.query(query, [categoryParam], (error, results) => {
    if (error) {
      console.error(
        "Error fetching most reviewed courses for the category:",
        error
      );
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.length === 0) {
        // No courses found for the specified category
        res
          .status(404)
          .json({ message: "No courses found for the specified category" });
      } else {
        console.log(
          `Fetched most reviewed courses for the category '${categoryParam}':`,
          results
        );
        res.json(results);
      }
    }
  });
});

router.get("/courses/:category", (req, res) => {
  const { category } = req.params;
  console.log("Requested category:", category);

  // Fetch courses data and corresponding category image URL from the database
  const query = `
      SELECT course.*, category_image
      FROM course
      JOIN category ON course.mooc_category = category.categoryname
      WHERE mooc_category = ?
      LIMIT 10;
    `;

  db.query(query, [category], (error, results) => {
    if (error) {
      console.error("Error fetching course data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Fetched course data:", results);
      res.json(results);
    }
  });
});
router.get("/highest-rated-courses/:category", (req, res) => {
  // Extract the category parameter from the request
  const categoryParam = req.params.category;

  // Fetch the courses with the highest average rating in the specified category
  const query = `
    SELECT c.*, AVG(r.rating) AS average_rating, cat.category_image
    FROM course c
    LEFT JOIN reviews r ON c.id = r.courseid
    LEFT JOIN category cat ON c.mooc_category = cat.categoryname
    WHERE c.mooc_category = ?
    GROUP BY c.id, c.mooc_name
    ORDER BY average_rating DESC
    LIMIT 10;
  `;

  db.query(query, [categoryParam], (error, results) => {
    if (error) {
      console.error(
        "Error fetching highest-rated courses for the category:",
        error
      );
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.length === 0) {
        // No courses found for the specified category
        res
          .status(404)
          .json({ message: "No courses found for the specified category" });
      } else {
        console.log(
          `Fetched highest-rated courses for the category '${categoryParam}':`,
          results
        );
        res.json(results);
      }
    }
  });
});



router.get("/coursedetails/:courseId", (req, res) => {
  const { courseId } = req.params;

  // Fetch course details along with category picture from the database based on the course ID
  const query = `
        SELECT c.*, cat.category_image 
        FROM course c
        INNER JOIN category cat ON c.mooc_category = cat.categoryname
        WHERE c.id = ?
    `;

  db.query(query, [courseId], (error, results) => {
    if (error) {
      console.error("Error fetching course details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.length === 0) {
        // No course found with the specified ID
        res.status(404).json({ message: "Course not found" });
      } else {
        console.log(`Fetched course details for ID '${courseId}':`, results[0]);
        res.json(results[0]);
      }
    }
  });
});

const fetchFilterOptions = (column) => {
  return new Promise((resolve, reject) => {
    let query;

    switch (column) {
      case 'mooc_price':
        query = `
          SELECT DISTINCT
            CASE
              WHEN mooc_price LIKE '%/month' THEN 'Monthly Subscription'
              WHEN mooc_price = 'Price not found' THEN 'Price not Found'
              WHEN CAST(REPLACE(mooc_price, ' EUR', '') AS DECIMAL(10, 2)) < 50.00 THEN 'Less than 50.00 EUR'
              WHEN CAST(REPLACE(mooc_price, ' EUR', '') AS DECIMAL(10, 2)) >= 50.00 THEN 'More than 50.00 EUR'
              ELSE 'Unknown'
            END AS mooc_price
          FROM course;
        `;
        break;

      case 'lengths':
        query = `
          SELECT DISTINCT
            CASE
              WHEN lengths = 'Self-Paced' THEN 'Self Paced'
              WHEN CAST(SUBSTRING_INDEX(lengths, '-', 1) AS UNSIGNED) < 5 THEN 'Less than 5 weeks'
              WHEN CAST(SUBSTRING_INDEX(lengths, '-', -1) AS UNSIGNED) >= 5 THEN 'More than 5 weeks'
              ELSE 'Unknown'
            END AS lengths
          FROM course;
        `;
        break;

      default:
        query = `SELECT DISTINCT ${column} FROM course;`;
        break;
    }

    db.query(query, (error, results) => {
      if (error) {
        console.error(`Error fetching ${column} options:`, error);
        resolve([]); // Resolve with an empty array if there's an error
      } else {
        const options = results.map(result => result[column]);
        resolve(options); // Resolve with the fetched options
      }
    });
  });
};

router.get("/filter-options", (req, res) => {
  const options = {};
  const columns = ['mooc_provider', 'estimated_efforts', 'course_levels', 'mooc_price', 'lengths', 'mooc_language', 'closed_caption'];

  Promise.all(columns.map(column => fetchFilterOptions(column)))
    .then(results => {
      columns.forEach((column, index) => {
        options[column] = results[index];
      });
      res.json(options); // Send the response with all filter options
    })
    .catch(error => {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});
router.get("/courses", (req, res) => {
  // Fetch all courses from the database
  const query = `
    SELECT * FROM course;
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Fetched all courses:", results);
      res.json(results);
    }
  });
});






module.exports = router;
