const express = require('express');
const pool = require('../db/pool');
const { ok, fail } = require('../services/response');

const router = express.Router();

router.get('/:worker_id', async (req, res) => {
  try {
    const { worker_id } = req.params;
    const claims = await pool.query(
      `SELECT c.claim_id, c.payout_amount, c.hours_disrupted, c.status, c.razorpay_payout_id,
              c.created_at, c.paid_at,
              d.disruption_type,
              d.started_at AS disruption_started_at,
              d.signal_a_type, d.signal_a_value,
              d.signal_b_type, d.signal_b_value,
              d.payout_percentage
       FROM claims c
       JOIN disruptions d ON d.disruption_id = c.disruption_id
       WHERE c.worker_id = $1
       ORDER BY c.created_at DESC`,
      [worker_id]
    );

    return ok(res, claims.rows);
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
