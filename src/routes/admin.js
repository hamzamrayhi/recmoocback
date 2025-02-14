const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/db');

// Function to log admin actions
function logAdminAction(adminId, username, coursename, reviewid, timestamp, action) {
    const logQuery = 'INSERT INTO admin_logs (adminid, username, coursename, reviewid, timestamp, action) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(logQuery, [adminId, username, coursename, reviewid, timestamp, action], (err) => {
        if (err) {
            console.error('Error logging admin action:', err);
            // Handle error
        }
        console.log('Admin action logged successfully');
    });
}
router.get('/admin/:adminid', (req, res) => {
    // Extract admin ID from request parameters
    const adminId = req.params.adminid;

    // Query the database to retrieve admin data by ID
    // Assuming `db` represents your database connection
    db.query('SELECT * FROM admin WHERE id = ?', [adminId], (err, results) => {
        if (err) {
            console.error('Error fetching admin data:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        // Check if admin data was found
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Admin data found, send it back in the response
        const adminData = results[0]; // Assuming only one admin is found
        res.json({ success: true, admin: adminData });
    });
});

router.post('/users/:adminid', (req, res) => {
    const newUser = req.body;
    const adminid = req.params.adminid;

    // Check if user with the same email already exists
    const userExistQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(userExistQuery, [newUser.email], (err, existingUser) => {
        if (err) {
            console.error('Error checking existing user:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Hash the password before inserting
        bcrypt.hash(newUser.password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }

            // Replace plain password with hashed password
            newUser.password = hashedPassword;

            const sql = 'INSERT INTO users SET ?';
            db.query(sql, newUser, (err, result) => {
                if (err) {
                    console.error('Error adding user:', err);
                    return res.status(500).json({ success: false, message: 'Internal server error' });
                }

                const userid = result.insertId; 

                const action = 'Added the user';
                const username = `${newUser.name} (ID: ${userid})`;
                const coursename = ""; 
                const timestamp = new Date().toISOString();
                const review = 0;
                logAdminAction(adminid, username, coursename, review, timestamp, action);

                res.json({ success: true, message: 'User added successfully', id: userid }); 
            });
        });
    });
});

router.put('/admin/:adminid', (req, res) => {
    const adminId = req.params.adminid; // Corrected to req.params.adminid
    const newData = req.body;

    // Check if the password field exists and is not empty
    if (newData.password !== undefined && newData.password !== null && newData.password !== '') {
        // Hash the password
        bcrypt.hash(newData.password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
            // Replace the plain password with the hashed one
            newData.password = hashedPassword;
            // Update admin data including password
            updateAdminData(adminId, newData, res);
        });
    } else {
        // If password is empty, remove it from newData
        delete newData.password;
        // Update admin data excluding password
        updateAdminData(adminId, newData, res);
    }
});

function updateAdminData(adminId, newData, res) {
    // Log the received data for debugging
    console.log('Received data for admin update:', newData);
    console.log('Admin ID:', adminId); // Ensure adminId is not undefined

    // Construct the SQL query
    const sql = `UPDATE admin SET ? WHERE id = ?`;
    console.log('SQL Query:', sql);

    // Execute the SQL query with appropriate parameters
    db.query(sql, [newData, adminId], (err, result) => {
        if (err) {
            console.error('Error updating admin:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        // Log successful admin update
        console.log('Admin updated successfully:', adminId);

        // Send response
        res.json({ message: 'Admin updated successfully' });
    });
}




// API endpoint to fetch all reviews
router.get('/reviews', (req, res) => {
    const sql = 'SELECT id, userid, review, courseid, rating, timestamp FROM reviews';
    db.query(sql, (err, results) => {
      if (err) {
        throw err;
      }
      res.json(results);
    });
  });
// Route to delete a review by ID
router.delete('/reviews/:id/:adminid', async (req, res) => {
    const reviewId = req.params.id;
    const adminid = req.params.adminid;

    try {
        const deleteReviewQuery = 'DELETE FROM reviews WHERE id = ?';
        await db.query(deleteReviewQuery, [reviewId]);
         // Log admin action
         const action = 'deleted a review';
         const username = "";// No need for username since it's a review deletion
         const coursename = ""; // No need for coursename since it's a review deletion
         const timestamp = new Date().toISOString(); // Get current timestamp
         logAdminAction(adminid, username, coursename, reviewId, timestamp, action);
         return res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }

});
router.get('/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
      if (err) {
        throw err;
      }
      res.json(results); // Return all users
    });
  });
// Count total number of reviews
router.get('/reviewscount', (req, res) => {
    const sql = 'SELECT COUNT(*) AS totalReviews FROM reviews';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching review count:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json(result[0]);
    });
});

// Count total number of users
router.get('/userscount', (req, res) => {
    const sql = 'SELECT COUNT(*) AS totalUsers FROM users';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching user count:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json(result[0]);
    });
});
// Add this route to your existing Express.js router setup

// Fetch highest rated providers
router.get('/highestRatedProviders', (req, res) => {
    const sql = `
        SELECT 
            c.mooc_provider AS provider,
            AVG(r.rating) AS averageRating
        FROM 
            course c
        JOIN 
            reviews r ON c.id = r.courseid
        GROUP BY 
            c.mooc_provider
        ORDER BY 
            averageRating DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching highest-rated providers:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json({ success: true, data: results });
    });
});

router.get('/highestRatedCourses', (req, res) => {
    const sql = `
        SELECT 
            c.id AS courseId,
            c.mooc_name AS courseName,
            c.mooc_category AS category,
            AVG(r.rating) AS averageRating
        FROM 
            course c
        JOIN 
            reviews r ON c.id = r.courseid
        GROUP BY 
            c.mooc_category
        ORDER BY 
            averageRating DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching highest-rated courses:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json({ success: true, data: results });
    });
});
// Add this route to your existing Express.js router setup

router.get('/topAccessFeatures', (req, res) => {
    const sql = `
        SELECT accessibility_features AS feature, COUNT(*) AS count 
        FROM users 
        GROUP BY accessibility_features 
        ORDER BY count DESC 
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching top accessibility features:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        res.json({ success: true, data: results });
    });
});


// Count total number of courses
router.get('/coursescount', (req, res) => {
    const sql = 'SELECT COUNT(*) AS totalCourses FROM course';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching course count:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json(result[0]);
    });
});

  router.put('/users/:id/:adminid', (req, res) => {
    const userId = req.params.id;
    const adminid = req.params.adminid;
    const newData = req.body;
    console.log(newData.password);
    // Hash the password if it's provided
    if (newData.password) {
        bcrypt.hash(newData.password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
            // Replace the plain password with the hashed one
            newData.password = hashedPassword;
            updateUserData(userId, adminid, newData, res);
        });
    } else {
        // If password is not provided, update other fields directly
        updateUserData(userId, adminid, newData, res);
    }
});

function updateUserData(userId, adminid, newData, res) {
    const sql = 'UPDATE users SET ? WHERE id = ?';
    db.query(sql, [newData, userId], (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        // Log admin action
        const action = 'Updated user information';
        const effectedAdmin = ""; // Since this is a review deletion, no admin is affected
        const username = `${newData.name} (ID: ${userId})`; // No need for username since it's a review deletion
        const coursename = ""; // No need for coursename since it's a review deletion
        const timestamp = new Date().toISOString(); // Get current timestamp
        const review = 0;
        logAdminAction(adminid, effectedAdmin, username, coursename, review, timestamp, action);
        res.json({ message: 'User updated successfully' });
    });
}
  



  // Delete user
  router.delete('/users/:id/:adminid', (req, res) => {
    const userId = req.params.id;
    const adminid = req.params.adminid;
    
    // Retrieve the username of the user before deleting
    const getUsernameQuery = 'SELECT name FROM users WHERE id = ?';
    db.query(getUsernameQuery, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching username:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const user = rows[0].name;

        const sql = 'DELETE FROM users WHERE id = ?';
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.error('Error deleting user:', err);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
            
            // Log admin action
            const action = 'Deleted the user';
            const coursename = ""; // No need for coursename since it's a review deletion
            const timestamp = new Date().toISOString(); // Get current timestamp
            const username = `${user} (ID: ${userId})`; 
            const review = 0;
            logAdminAction(adminid, username, coursename, review, timestamp, action);
            
            res.json({ success: true, message: 'User deleted successfully', username: username });
        });
    });
});

router.post('/users/:adminid', (req, res) => {
    const newUser = req.body;
    const adminid = req.params.adminid;
    const { name, email, password, age, location } = newUser;
    if (!name || !email || !password || !age || !location) {
        return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    // Hash the password before inserting
    bcrypt.hash(newUser.password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        // Replace plain password with hashed password
        newUser.password = hashedPassword;

        const sql = 'INSERT INTO users SET ?';
        db.query(sql, newUser, (err, result) => {
            if (err) {
                console.error('Error adding user:', err);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }

            const userid = result.insertId; 

            const action = 'Added the user';
            const username = `${newUser.name} (ID: ${userid})`;
            const coursename = ""; 
            const timestamp = new Date().toISOString();
            const review = 0;
            logAdminAction(adminid, username, coursename, review, timestamp, action);

            res.json({ success: true, message: 'User added successfully', id: userid }); 
        });
    });
});





  //Courses
  router.get('/courses', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const sql = 'SELECT * FROM course LIMIT ?, ?';
  db.query(sql, [offset, limit], (err, results) => {
    if (err) {
      console.error('Error fetching course:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    res.json(results);
  });
});
// Get a course by ID
router.get('/courses/:id', (req, res) => {
    const courseId = req.params.id;
    const sql = 'SELECT * FROM course WHERE id = ?';
    db.query(sql, [courseId], (err, result) => {
        if (err) {
            console.error('Error fetching course by ID:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json(result[0]);
    });
});

// Update course
router.put('/courses/:id/:adminid', (req, res) => {
    const courseId = req.params.id;
    const newData = req.body;
    const adminid = req.params.adminid;
    const sql = 'UPDATE course SET ? WHERE id = ?';
    db.query(sql, [newData, courseId], (err, result) => {
        if (err) {
            console.error('Error updating course:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        const action = 'Updated the course information';
      const username = "";// No need for username since it's a review deletion
      const coursename = `${newData.mooc_name} (ID: ${courseId})`; // No need for coursename since it's a review deletion
      const timestamp = new Date().toISOString(); // Get current timestamp
      const review = 0;
      logAdminAction(adminid, username, coursename, review, timestamp, action);
        res.json({ success: true, message: 'Course updated successfully' });
    });
});

// Delete course
router.delete('/courses/:id/:adminid', (req, res) => {
    const courseId = req.params.id;
    const adminid = req.params.adminid;
    
    // First, retrieve the course name before deleting it
    const selectSql = 'SELECT mooc_name FROM course WHERE id = ?';
    db.query(selectSql, [courseId], (selectErr, selectResult) => {
        if (selectErr) {
            console.error('Error retrieving course:', selectErr);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        // Extract the course name from the select result
        const courseName = selectResult.length > 0 ? selectResult[0].mooc_name : '';

        // Now delete the course
        const deleteSql = 'DELETE FROM course WHERE id = ?';
        db.query(deleteSql, [courseId], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Error deleting course:', deleteErr);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            const action = 'Deleted the course';
            const username = ''; // No need for username since it's a review deletion
            const coursename = `${courseName} (ID: ${courseId})`; // Using retrieved course name
            const timestamp = new Date().toISOString(); // Get current timestamp
            const review = 0;
            logAdminAction(adminid, username, coursename, review, timestamp, action);
            res.json({ success: true, message: 'Course deleted successfully' });
        });
    });
});


// Create new course
router.post('/courses/:adminid', (req, res) => {
    const newCourse = req.body;
    const adminid = req.params.adminid;
    const sql = 'INSERT INTO course SET ?';
    db.query(sql, newCourse, (err, result) => {
        if (err) {
            console.error('Error creating course:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        const courseid = result.insertId; // Move this line inside the callback function

        const action = 'Added the course';
        const username = "";// No need for username since it's a review deletion
        const coursename = `${newCourse.mooc_name} (ID: ${courseid})`; // No need for coursename since it's a review deletion
        const timestamp = new Date().toISOString(); // Get current timestamp
        const review = 0;
        logAdminAction(adminid, username, coursename, review, timestamp, action);
        res.json({ success: true, message: 'Course created successfully', id: result.insertId });
    });
});
router.get('/coursesSearchbar', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if mooc_name query parameter is present
    const moocName = req.query.mooc_name ? `%${req.query.mooc_name.trim()}%` : null;
    console.log('moocName:', moocName); // Log moocName to check its value
    let sql = 'SELECT * FROM course';
    let queryParams = [];

    // If mooc_name parameter is present, add it to the query
    if (moocName) {
      sql += ' WHERE mooc_name LIKE ?';
      queryParams.push(moocName);
    }

    // Add limit and offset to the query
    sql += ' LIMIT ?, ?';
    queryParams.push(offset, limit);

    console.log('SQL Query:', sql); // Log the SQL query
    console.log('Query Parameters:', queryParams); // Log the query parameters
  
    // Execute the query
    db.query(sql, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching courses:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
      // Log the number of results
      console.log('Number of courses fetched:', results.length);
      // Send the results as JSON response
      res.json(results);
    });
});
router.get('/usersSearchbar', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not specified
    const offset = (page - 1) * limit;

    // Check if user_name query parameter is present
    const userName = req.query.user_name ? `%${req.query.user_name.trim()}%` : null;
    console.log('userName:', userName); // Log userName to check its value

    let sql = 'SELECT `id`, `name`, `email`, `age`, `location`, `user_picture`, `educational_qualification`, `field_of_study`, `areas_of_interest`, `career_goals`, `accessibility_features`, `preferred_languages`, `preferred_learning_style`, `course_format` FROM `users`'; // Modified SQL query
    let queryParams = [];

    // If user_name parameter is present, add it to the query
    if (userName) {
        sql += ' WHERE name LIKE ?'; // Assuming the name column stores the user names
        queryParams.push(userName);
    }

    // Add limit and offset to the query
    sql += ' ORDER BY name LIMIT ?, ?'; // Sorting by name for consistency
    queryParams.push(offset, limit);

    console.log('SQL Query:', sql); // Log the SQL query
    console.log('Query Parameters:', queryParams); // Log the query parameters

    // Execute the query
    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        // Log the number of results
        console.log('Number of users fetched:', results.length);
        // Send the results as JSON response
        res.json(results);
    });
});

router.get('/admin_logs', (req, res) => {
    const sql = 'SELECT a.id, a.name, l.coursename, l.reviewid, l.username, l.action, l.timestamp FROM admin_logs l JOIN admin a ON l.adminid = a.id ORDER BY l.timestamp DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching admin logs:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        
        res.json(results);
    });
});




module.exports = router;