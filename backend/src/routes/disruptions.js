const express = require('express');
const pool = require('../db/pool');
const { ok, fail } = require('../services/response');

const router = express.Router();

router.get('/active', async (_req, res) => {
  try {
    const rows = await pool.query(
      `SELECT d.*, z.zone_name, z.pin_code
       FROM disruptions d
       JOIN zones z ON z.zone_id = d.zone_id
       WHERE d.status = 'active'
       ORDER BY d.started_at DESC`
    );

    return ok(res, rows.rows);
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
