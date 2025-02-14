const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Route to handle form submission for contacting us
router.post("/contactus", (req, res) => {
  const { subject, about, text, username, email } = req.body;

  const query = `
        INSERT INTO contactus (subject, about, text, username, email) 
        VALUES (?, ?, ?, ?, ?)
    `;

  db.query(query, [subject, about, text, username, email], (error, results) => {
    if (error) {
      console.error("Error inserting data into contactus table:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Data inserted into contactus table successfully");
      res.json({ message: "Your message has been submitted successfully!" });
    }
  });
});

// Fetch messages with optional filtering by admin ID or unhandled status
router.get("/contactus", (req, res) => {
  const { adminId, unhandled } = req.query;
  let query;
  let queryParams = [];

  console.log(`Received request with adminId: ${adminId} and unhandled: ${unhandled}`);

  if (adminId) {
    // Fetch only messages handled by the specified admin
    query = `
        SELECT DISTINCT
        c.id,
        c.subject,
        c.about,
        c.text,
        c.username,
        c.email,
        c.created_at,
        c.solved,
        u.user_picture
    FROM
        contactus c
    JOIN
        users u ON c.username = u.name
    JOIN
        replies r ON r.message_id = c.id
    WHERE
        r.admin_id = ?
        AND c.solved = 0
    `;
    queryParams.push(adminId);
    console.log(`Fetching messages responded to by adminId: ${adminId}`);
  } else if (unhandled === "true") {
    // Fetch only messages that have no replies
    query = `
            SELECT c.id, c.subject, c.about, c.text, c.username, c.email, c.created_at, c.solved, u.user_picture
            FROM contactus c
            JOIN users u ON c.username = u.name
            LEFT JOIN replies r ON r.message_id = c.id
            WHERE r.message_id IS NULL
            AND c.solved = 0
    `;
    console.log("Fetching unhandled messages");
  } else {
    // Fetch all messages
    query = `
            SELECT c.id, c.subject, c.about, c.text, c.username, c.email, c.created_at, c.solved, u.user_picture
            FROM contactus c
            JOIN users u ON c.username = u.name
            WHERE c.solved = 0
    `;
    console.log("Fetching all messages");
  }

  db.query(query, queryParams, (error, results) => {
    if (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.length > 0) {
        console.log(`Found ${results.length} messages`);
      } else {
        console.log(`No messages found`);
      }
      res.json(results);
    }
  });
});

// Route to delete a message
router.delete("/contactus/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM contactus WHERE id = ?`;

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error deleting data from contactus table:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log(`Message with id ${id} deleted successfully`);
      res.json({ message: "Message deleted successfully" });
    }
  });
});

// Route to update the solved status of a message
router.put("/contactus/:id/solved", (req, res) => {
  const { id } = req.params;
  const { solved } = req.body;

  const query = `
        UPDATE contactus SET solved = ? WHERE id = ?
    `;

  db.query(query, [solved, id], (error, results) => {
    if (error) {
      console.error("Error updating data in contactus table:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log(
        `Message with id ${id} marked as ${solved ? "solved" : "unsolved"}`
      );
      res.json({
        message: `Message with id ${id} marked as ${
          solved ? "solved" : "unsolved"
        }`,
      });
    }
  });
});

// Route to handle responses (replies) to contact us messages
router.post("/contactus/:id/response", (req, res) => {
  const { adminId, replyText, userId } = req.body;
  const { id } = req.params;

  if (!adminId && !userId) {
    return res
      .status(400)
      .json({ error: "Either adminId or userId must be provided" });
  }

  // Determine whether the reply is from an admin or a user
  const isAdminReply = adminId !== null;
  const isUserReply = userId !== null;

  // Set admin_id or user_id based on the sender type
  const adminIdToUse = isAdminReply ? adminId : null;
  const userIdToUse = isUserReply ? userId : null;

  insertReply(id, adminIdToUse, userIdToUse, replyText, res);
});

function insertReply(messageId, adminId, userId, replyText, res) {
  const insertReplyQuery = `
        INSERT INTO replies (message_id, admin_id, user_id, reply_text)
        VALUES (?, ?, ?, ?)
    `;

  db.query(
    insertReplyQuery,
    [messageId, adminId, userId, replyText],
    (error, results) => {
      if (error) {
        console.error("Error inserting reply:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log("Reply inserted successfully");
        res.json({ message: "Reply sent successfully!" });
      }
    }
  );
}

router.get("/user/:userId/issues", (req, res) => {
  const userId = req.params.userId;

  const query = `
        SELECT c.id, c.subject, c.about, c.text, c.username, c.email, c.created_at, c.solved 
        FROM contactus c
        WHERE c.username = (SELECT name FROM users WHERE id = ?)
        AND c.solved = 0
    `;

  db.query(query, [userId], (error, results) => {
    if (error) {
      console.error("Error fetching user issues:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

router.get("/contactus/:id/replies", (req, res) => {
  const { id } = req.params;

  const query = `
        SELECT r.id, r.reply_text, r.created_at, r.admin_id, a.name as admin_name, u.name as user_name
        FROM replies r
        LEFT JOIN admin a ON r.admin_id = a.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.message_id = ?
        ORDER BY r.created_at ASC
    `;

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Add a sender_type field to each reply object based on admin_id
      results.forEach((reply) => {
        reply.sender_type = reply.admin_id !== null ? "admin" : "user";
      });

      res.json(results);
    }
  });
});

module.exports = router;
