const express = require('express');
const pool = require('../db/pool');
const { ok, fail } = require('../services/response');
const { fetchRiskProfile } = require('../services/mlService');
const { getCurrentWeekBounds, toDateOnly } = require('../services/dateUtils');

const router = express.Router();

const tierConfig = {
  basic: { weekly_premium: 29, base_coverage_cap: 800 },
  plus: { weekly_premium: 49, base_coverage_cap: 1500 },
  max: { weekly_premium: 79, base_coverage_cap: 2500 },
};

router.post('/register', async (req, res) => {
  try {
    const { name, phone, upi_id, zone_id, tier } = req.body;

    if (!name || !phone || !upi_id || !zone_id || !tierConfig[tier]) {
      return fail(res, new Error('Missing or invalid registration fields'), 400);
    }

    const zoneRes = await pool.query('SELECT * FROM zones WHERE zone_id = $1', [zone_id]);
    if (!zoneRes.rowCount) {
      return fail(res, new Error('Zone not found'), 404);
    }
    const zone = zoneRes.rows[0];

    const workerRes = await pool.query(
      `INSERT INTO workers (name, phone, upi_id, zone_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, phone, upi_id, zone_id]
    );

    const worker = workerRes.rows[0];
    const risk = await fetchRiskProfile(zone, worker);
    const multiplier = Number(risk.multiplier || 1);

    const cfg = tierConfig[tier];
    const adjustedCap = Math.round(cfg.base_coverage_cap * multiplier);
    const { weekStart, weekEnd } = getCurrentWeekBounds(new Date());

    const policyRes = await pool.query(
      `INSERT INTO policies
       (worker_id, tier, weekly_premium, base_coverage_cap, adjusted_coverage_cap, risk_multiplier, week_start, week_end, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING *`,
      [
        worker.worker_id,
        tier,
        cfg.weekly_premium,
        cfg.base_coverage_cap,
        adjustedCap,
        multiplier,
        toDateOnly(weekStart),
        toDateOnly(weekEnd),
      ]
    );

    return ok(res, {
      worker_id: worker.worker_id,
      policy_id: policyRes.rows[0].policy_id,
      zone_id: zone.zone_id,
      tier,
      weekly_premium: cfg.weekly_premium,
      adjusted_coverage_cap: adjustedCap,
      risk_multiplier: multiplier,
      zone_name: zone.zone_name,
    });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
