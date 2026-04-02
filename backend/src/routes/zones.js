const express = require('express');
const pool = require('../db/pool');
const { ok, fail } = require('../services/response');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM zones ORDER BY zone_name ASC');
    return ok(res, rows.rows);
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
