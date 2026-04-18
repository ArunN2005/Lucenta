const express = require('express');
const pool = require('../db/pool');
const { ok, fail } = require('../services/response');
const { logWorkerActivity } = require('../services/fraud');

const router = express.Router();

router.get('/:worker_id', async (req, res) => {
  try {
    const { worker_id } = req.params;
    const query = await pool.query(
      `SELECT w.*, z.zone_name, z.pin_code, z.zone_type, z.dark_store_tier,
              p.policy_id, p.tier, p.weekly_premium, p.base_coverage_cap, p.adjusted_coverage_cap,
              p.risk_multiplier, p.week_start, p.week_end, p.status AS policy_status,
              COALESCE((
                SELECT SUM(c.payout_amount)
                FROM claims c
                WHERE c.worker_id = w.worker_id
                  AND c.status = 'paid'
                  AND c.paid_at >= DATE_TRUNC('week', NOW())
              ), 0) AS earnings_protected_this_week,
              COALESCE((
                SELECT SUM(c.payout_amount)
                FROM claims c
                WHERE c.worker_id = w.worker_id
                  AND c.status = 'paid'
              ), 0) AS earnings_protected_lifetime
       FROM workers w
       LEFT JOIN zones z ON z.zone_id = w.zone_id
       LEFT JOIN policies p ON p.worker_id = w.worker_id AND p.status = 'active'
       WHERE w.worker_id = $1
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [worker_id]
    );

    if (!query.rowCount) {
      return fail(res, new Error('Worker not found'), 404);
    }

    return ok(res, query.rows[0]);
  } catch (error) {
    return fail(res, error, 500);
  }
});

router.post('/activity', async (req, res) => {
  try {
    const {
      worker_id,
      zone_id,
      expo_push_token,
      latitude,
      longitude,
      accuracy_meters,
      speed_kmh,
      is_mock_location,
    } = req.body;

    if (!worker_id || !zone_id) {
      return fail(res, new Error('worker_id and zone_id are required'), 400);
    }

    await pool.query(
      `INSERT INTO worker_activity (worker_id, zone_id, last_active_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (worker_id)
       DO UPDATE SET zone_id = EXCLUDED.zone_id, last_active_at = NOW()`,
      [worker_id, zone_id]
    );

    if (expo_push_token) {
      await pool.query(
        `UPDATE workers SET expo_push_token = $1 WHERE worker_id = $2`,
        [expo_push_token, worker_id]
      );
    }

    await logWorkerActivity({
      worker_id,
      zone_id,
      latitude,
      longitude,
      accuracy_meters,
      speed_kmh,
      is_mock_location,
    });

    return ok(res, { worker_id, updated: true });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
