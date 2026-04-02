const express = require('express');
const pool = require('../db/pool');
const { ok, fail } = require('../services/response');
const { fetchRiskProfile } = require('../services/mlService');
const { getNextWeekBounds, toDateOnly, daysRemaining } = require('../services/dateUtils');

const router = express.Router();

const tierConfig = {
  basic: { weekly_premium: 29, base_coverage_cap: 800 },
  plus: { weekly_premium: 49, base_coverage_cap: 1500 },
  max: { weekly_premium: 79, base_coverage_cap: 2500 },
};

router.get('/:worker_id', async (req, res) => {
  try {
    const { worker_id } = req.params;

    const policyRes = await pool.query(
      `SELECT p.*, z.zone_name
       FROM policies p
       JOIN workers w ON w.worker_id = p.worker_id
       JOIN zones z ON z.zone_id = w.zone_id
       WHERE p.worker_id = $1 AND p.status = 'active'
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [worker_id]
    );

    if (!policyRes.rowCount) {
      return fail(res, new Error('Active policy not found'), 404);
    }

    const policy = policyRes.rows[0];
    return ok(res, {
      ...policy,
      days_remaining: daysRemaining(policy.week_end),
    });
  } catch (error) {
    return fail(res, error, 500);
  }
});

router.post('/renew/:worker_id', async (req, res) => {
  try {
    const { worker_id } = req.params;

    const workerRes = await pool.query(
      `SELECT w.*, z.*
       FROM workers w
       JOIN zones z ON z.zone_id = w.zone_id
       WHERE w.worker_id = $1`,
      [worker_id]
    );
    if (!workerRes.rowCount) {
      return fail(res, new Error('Worker not found'), 404);
    }

    await pool.query(
      `UPDATE policies SET status = 'expired' WHERE worker_id = $1 AND status = 'active'`,
      [worker_id]
    );

    const worker = workerRes.rows[0];
    const tierRes = await pool.query(
      `SELECT tier FROM policies WHERE worker_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [worker_id]
    );
    const tier = tierRes.rowCount ? tierRes.rows[0].tier : 'plus';
    const cfg = tierConfig[tier] || tierConfig.plus;

    const risk = await fetchRiskProfile(worker, worker);
    const multiplier = Number(risk.multiplier || 1);
    const adjustedCap = Math.round(cfg.base_coverage_cap * multiplier);
    const { weekStart, weekEnd } = getNextWeekBounds(new Date());

    const policyInsert = await pool.query(
      `INSERT INTO policies
       (worker_id, tier, weekly_premium, base_coverage_cap, adjusted_coverage_cap, risk_multiplier, week_start, week_end, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING *`,
      [
        worker_id,
        tier,
        cfg.weekly_premium,
        cfg.base_coverage_cap,
        adjustedCap,
        multiplier,
        toDateOnly(weekStart),
        toDateOnly(weekEnd),
      ]
    );

    return ok(res, policyInsert.rows[0]);
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
