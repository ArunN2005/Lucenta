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
  const client = await pool.connect();
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

    await client.query('BEGIN');

    // Reuse worker record for repeated onboarding attempts on the same phone.
    const existingWorkerRes = await client.query('SELECT * FROM workers WHERE phone = $1 LIMIT 1', [phone]);
    let worker;
    if (existingWorkerRes.rowCount) {
      const updatedWorkerRes = await client.query(
        `UPDATE workers
         SET name = $1, upi_id = $2, zone_id = $3
         WHERE worker_id = $4
         RETURNING *`,
        [name, upi_id, zone_id, existingWorkerRes.rows[0].worker_id]
      );
      worker = updatedWorkerRes.rows[0];
    } else {
      const workerRes = await client.query(
        `INSERT INTO workers (name, phone, upi_id, zone_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, phone, upi_id, zone_id]
      );
      worker = workerRes.rows[0];
    }

    const risk = await fetchRiskProfile(zone, worker);
    const multiplier = Number(risk.multiplier || 1);

    const cfg = tierConfig[tier];
    const adjustedCap = Math.round(cfg.base_coverage_cap * multiplier);
    const { weekStart, weekEnd } = getCurrentWeekBounds(new Date());
    const wsString = toDateOnly(weekStart);
    const weString = toDateOnly(weekEnd);

    await client.query(
      `UPDATE policies
       SET status = 'expired'
       WHERE worker_id = $1 AND status = 'active'`,
      [worker.worker_id]
    );

    const policyRes = await client.query(
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
        wsString,
        weString,
      ]
    );

    await client.query('COMMIT');

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
    try {
      await client.query('ROLLBACK');
    } catch (_rollbackError) {
      // no-op
    }
    return fail(res, error, 500);
  } finally {
    client.release();
  }
});

module.exports = router;
