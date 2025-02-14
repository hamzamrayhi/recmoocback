const express = require('express');
const router = express.Router();
const db = require('../db/db');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ridealong1.mailer@gmail.com', // Your Gmail email address
        pass: 'nmea bbjr qubc evko'        
    }
});

router.post('/createstudyschedule', (req, res) => {
    const { starting_time, ending_time, userid, mooc_name } = req.body;

    // Convert starting_time and ending_time to Date objects
    const startTime = new Date(starting_time);
    const endTime = new Date(ending_time);
    const now = new Date();

    // Check if starting_time is before ending_time
    if (startTime >= endTime) {
        return res.status(400).json({ error: 'Starting time must be before ending time' });
    }

    // Check if starting_time is in the past (before today's date)
    if (startTime < now) {
        return res.status(400).json({ error: 'Starting time must be in the future' });
    }

    // First, find the course ID from the courses table using the mooc_name
    const courseQuery = `SELECT id FROM course WHERE mooc_name = ? LIMIT 1;`;

    db.query(courseQuery, [mooc_name], (courseError, courseResults) => {
        if (courseError) {
            console.error('Error finding course:', courseError);
            return res.status(500).json({ error: 'Error finding course' });
        }

        if (courseResults.length === 0) {
            console.error('Course not found for mooc_name:', mooc_name);
            return res.status(404).json({ error: 'Course not found' });
        }

        const courseId = courseResults[0].id;

        console.log('Course ID found:', courseId);

        // Check if the schedule already exists for the user and course
        const checkExistingScheduleQuery = `
            SELECT * 
            FROM user_study_schedule 
            WHERE userid = ? AND courseid = ?;
        `;

        db.query(checkExistingScheduleQuery, [userid, courseId], (checkError, checkResults) => {
            if (checkError) {
                console.error('Error checking existing schedule:', checkError);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (checkResults.length > 0) {
                // Schedule already exists for this user and course
                console.error('Schedule already exists for this user and course');
                return res.status(400).json({ error: 'Schedule already exists for this user and course' });
            }

            // Now, use the courseId to create the study schedule
            const insertQuery = `
                INSERT INTO user_study_schedule (starting_time, ending_time, userid, courseid)
                VALUES (?, ?, ?, ?);
            `;

            const values = [starting_time, ending_time, userid, courseId];

            db.query(insertQuery, values, (insertError, insertResult) => {
                if (insertError) {
                    console.error('Error creating study schedule:', insertError);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                console.log('Study schedule inserted successfully:', insertResult);

                // Retrieve the inserted schedule to send back in response
                const getInsertedScheduleQuery = `
                    SELECT uss.*, c.mooc_name
                    FROM user_study_schedule uss
                    INNER JOIN course c ON uss.courseid = c.id
                    WHERE uss.id = ?;
                `;

                db.query(getInsertedScheduleQuery, [insertResult.insertId], (fetchError, fetchResults) => {
                    if (fetchError) {
                        console.error('Error fetching newly created schedule:', fetchError);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }

                    // Ensure a schedule was found
                    if (!fetchResults || fetchResults.length === 0) {
                        console.error('Failed to retrieve newly created schedule');
                        return res.status(404).json({ error: 'Failed to retrieve newly created schedule' });
                    }

                    // Return the newly created schedule
                    const createdSchedule = fetchResults[0];
                    res.status(201).json(createdSchedule);
                });
            });
        });
    });
});

// Route to display study schedules for a specific user (userid)
router.get('/studyschedules/:userId', (req, res) => {
    const { userId } = req.params;

    // Ensure userId is provided
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    // Query to get study schedules for the user with mooc_name
    const sql = `
        SELECT uss.*, c.mooc_name
        FROM user_study_schedule uss
        INNER JOIN course c ON uss.courseid = c.id
        WHERE uss.userid = ?
    `;

    // Execute the query using db.query with callback
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching study schedules:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Check if schedules are found
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'No study schedules found for this user' });
        }

        // Send the list of study schedules with mooc_name included
        res.json(results);
    });
});


router.put('/updatestudyschedule/:scheduleId', (req, res) => {
    const { scheduleId } = req.params;
    const { starting_time, ending_time, mooc_name } = req.body;

    // Convert starting_time and ending_time to Date objects
    const startTime = new Date(starting_time);
    const endTime = new Date(ending_time);
    const now = new Date();

    // Check if starting_time is before ending_time
    if (startTime >= endTime) {
        return res.status(400).json({ error: 'Starting time must be before ending time' });
    }

    // Check if starting_time is in the past (before today's date)
    if (startTime < now) {
        return res.status(400).json({ error: 'Starting time must be in the future' });
    }

    // First, find the course ID from the courses table using the mooc_name
    const courseQuery = `SELECT id FROM course WHERE mooc_name = ? LIMIT 1;`;

    db.query(courseQuery, [mooc_name], (err, results) => {
        if (err) {
            console.error('Error finding course:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const courseId = results[0].id;

        // Now, use the courseId to update the study schedule
        const updateQuery = `
            UPDATE user_study_schedule
            SET starting_time = ?, ending_time = ?, courseid = ?
            WHERE id = ?;
        `;
        const updateValues = [starting_time, ending_time, courseId, scheduleId];

        db.query(updateQuery, updateValues, (updateErr, updateResults) => {
            if (updateErr) {
                console.error('Error updating study schedule:', updateErr);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (updateResults.affectedRows === 0) {
                return res.status(404).json({ error: 'Study schedule not found' });
            }

            res.status(200).json({ message: 'Study schedule updated successfully' });
        });
    });
});


router.delete("/deletestudyschedule/:courseName", (req, res) => {
    const courseName = req.params.courseName;
  
    // First, fetch the courseid associated with the courseName
    const fetchCourseIdQuery = `
      SELECT id
      FROM course
      WHERE mooc_name = ?
    `;
  
    db.query(fetchCourseIdQuery, [courseName], (courseError, courseResults) => {
      if (courseError) {
        console.error("Error finding course:", courseError);
        return res.status(500).json({ error: "Internal Server Error" });
      }
  
      if (courseResults.length === 0) {
        return res.status(404).json({ error: "Course not found." });
      }
  
      const courseId = courseResults[0].id;
  
      // Now delete from user_study_schedule using courseId
      const deleteQuery = `
        DELETE FROM user_study_schedule
        WHERE courseid = ?
      `;
  
      db.query(deleteQuery, [courseId], (deleteError, deleteResult) => {
        if (deleteError) {
          console.error("Error deleting study schedule:", deleteError);
          return res.status(500).json({ error: "Internal Server Error" });
        }
  
        res.status(200).json({ message: "Study schedule deleted successfully." });
      });
    });
  });  
const sendNotificationEmail = (userEmail, courseName, startingTime, userId, callback) => {
    const mailOptions = {
        from: 'ridealong1.mailer@gmail.com',
        to: userEmail,
        subject: 'Upcoming Study Schedule',
        html: `<p>Hello,</p>
               <p>This is a reminder that you have a study session for the course "${courseName}" starting at ${startingTime}.</p>`
    };

    // Send email using transporter
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending notification email:', error);
            callback(error); // Pass the error to the callback
        } else {
            console.log('Notification email sent:', info.response);

            // Update the notification column in the database
            const updateQuery = `
                UPDATE user_study_schedule
                SET notification = 1
                WHERE userid = ? AND starting_time = ?
            `;
            
            // Execute the update query
            db.query(updateQuery, [userId, startingTime], (updateError, updateResult) => {
                if (updateError) {
                    console.error('Error updating notification status in the database:', updateError);
                    callback(updateError); // Pass the update error to the callback
                } else {
                    console.log('Notification status updated in the database.');
                    callback(null); // Pass null for the error to indicate success
                }
            });
        }
    });
};
const checkAndSendNotifications = () => {
    const now = new Date();
    const thirtyMinutesBefore = new Date(now.getTime() + (30 * 60 * 1000));

    const query = `
        SELECT uss.*, c.mooc_name AS course_name, u.email AS user_email
        FROM user_study_schedule uss
        JOIN course c ON uss.courseid = c.id
        JOIN users u ON uss.userid = u.id
        WHERE uss.starting_time > ? AND uss.starting_time <= ? AND uss.notification = 0
    `;

    db.query(query, [now, thirtyMinutesBefore], (error, queryResult) => {
        if (error) {
            console.error('Error checking and sending study schedules:', error);
            return;
        }

        if (Array.isArray(queryResult) && queryResult.length > 0) {
            queryResult.forEach(row => {
                const { user_email, course_name, starting_time, userid } = row;
                sendNotificationEmail(user_email, course_name, starting_time, userid, (emailError) => {
                    if (emailError) {
                        console.error('Error sending notification email:', emailError);
                    }
                });
            });
        } else {
            console.log('No upcoming study schedules within the next 30 minutes.');
        }
        deleteOldSchedules(now);

    });
};
const deleteOldSchedules = (currentTime) => {
    const deleteQuery = `
        DELETE FROM user_study_schedule
        WHERE ending_time <= ?
    `;

    db.query(deleteQuery, [currentTime], (error, result) => {
        if (error) {
            console.error('Error deleting old schedules:', error);
        } else {
            console.log('Old schedules deleted successfully.');
        }
    });
};




// Schedule the task to run every minute
cron.schedule('* * * * *', () => {
    console.log('Running study schedule check...');
    checkAndSendNotifications();
});

module.exports = router;
