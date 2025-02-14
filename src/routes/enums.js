const express = require('express');
const mysql = require('mysql');
const router = express.Router();

const db = require('../db/db');

router.get('/enums', (req, res) => {
    const sql = `
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users'
        AND DATA_TYPE = 'enum'
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching enum columns:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        const enumColumns = result.map(row => ({
            name: row.COLUMN_NAME,
            values: row.COLUMN_TYPE.match(/'([^']+)'/g).map(value => value.replace(/'/g, ''))
        }));

        res.json(enumColumns);
    });
});

module.exports = router;
