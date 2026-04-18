const express = require('express');
const pool = require('../db/pool');
const { ok, fail } = require('../services/response');

const router = express.Router();

router.get('/insights', async (_req, res) => {
  try {
    const [overviewRes, disruptionMixRes, zoneForecastRes] = await Promise.all([
      pool.query(
        `WITH premium AS (
           SELECT COALESCE(SUM(weekly_premium), 0) AS premium_collected
           FROM policies
           WHERE status = 'active'
         ),
         payout AS (
           SELECT COALESCE(SUM(payout_amount), 0) AS payout_disbursed
           FROM claims
           WHERE status = 'paid'
             AND paid_at >= DATE_TRUNC('week', NOW())
         ),
         claims_week AS (
           SELECT COUNT(*)::int AS claims_count
           FROM claims
           WHERE created_at >= DATE_TRUNC('week', NOW())
         ),
         fraud AS (
           SELECT COUNT(*)::int AS flagged_claims,
                  COALESCE(SUM(c.payout_amount), 0) AS blocked_amount
           FROM fraud_events fe
           LEFT JOIN claims c ON c.claim_id = fe.claim_id
           WHERE fe.created_at >= DATE_TRUNC('week', NOW())
             AND fe.fraud_status IN ('blocked', 'review')
         )
         SELECT
           premium.premium_collected,
           payout.payout_disbursed,
           claims_week.claims_count,
           fraud.flagged_claims,
           fraud.blocked_amount,
           CASE
             WHEN premium.premium_collected = 0 THEN 0
             ELSE ROUND((payout.payout_disbursed / premium.premium_collected) * 100, 2)
           END AS loss_ratio_percent
         FROM premium, payout, claims_week, fraud`
      ),
      pool.query(
        `SELECT disruption_type,
                COUNT(*)::int AS count
         FROM disruptions
         WHERE started_at >= NOW() - INTERVAL '28 days'
         GROUP BY disruption_type
         ORDER BY count DESC`
      ),
      pool.query(
        `WITH zone_stats AS (
           SELECT z.zone_id,
                  z.zone_name,
                  COALESCE(SUM(CASE WHEN d.started_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END), 0) AS cnt_7,
                  COALESCE(SUM(CASE WHEN d.started_at >= NOW() - INTERVAL '14 days' THEN 1 ELSE 0 END), 0) AS cnt_14,
                  COALESCE(SUM(CASE WHEN d.started_at >= NOW() - INTERVAL '28 days' THEN 1 ELSE 0 END), 0) AS cnt_28,
                  COALESCE(AVG(z.disruption_count_12m), 0) AS historical_12m
           FROM zones z
           LEFT JOIN disruptions d ON d.zone_id = z.zone_id
           GROUP BY z.zone_id, z.zone_name
         ),
         payout_base AS (
           SELECT COALESCE(AVG(c.payout_amount), 0) AS avg_payout
           FROM claims c
           WHERE c.status = 'paid'
             AND c.created_at >= NOW() - INTERVAL '28 days'
         )
         SELECT zone_id,
                zone_name,
                cnt_7,
                cnt_14,
                cnt_28,
                ROUND((cnt_7 * 0.45 + (cnt_14 / 2.0) * 0.30 + (cnt_28 / 4.0) * 0.20 + (historical_12m / 12.0) * 0.05)::numeric, 2) AS predicted_claims_next_week,
                ROUND((
                  (cnt_7 * 0.45 + (cnt_14 / 2.0) * 0.30 + (cnt_28 / 4.0) * 0.20 + (historical_12m / 12.0) * 0.05)
                  * (SELECT avg_payout FROM payout_base)
                )::numeric, 2) AS predicted_payout_next_week
         FROM zone_stats
         ORDER BY predicted_claims_next_week DESC, zone_name ASC`
      ),
    ]);

    const overview = overviewRes.rows[0] || {};
    return ok(res, {
      overview: {
        premium_collected: Number(overview.premium_collected || 0),
        payout_disbursed: Number(overview.payout_disbursed || 0),
        loss_ratio_percent: Number(overview.loss_ratio_percent || 0),
        claims_count: Number(overview.claims_count || 0),
        flagged_claims: Number(overview.flagged_claims || 0),
        blocked_amount: Number(overview.blocked_amount || 0),
      },
      disruption_mix_last_28d: disruptionMixRes.rows.map((row) => ({
        disruption_type: row.disruption_type,
        count: Number(row.count || 0),
      })),
      next_week_forecast: zoneForecastRes.rows.map((row) => ({
        zone_id: row.zone_id,
        zone_name: row.zone_name,
        claims_last_7d: Number(row.cnt_7 || 0),
        claims_last_14d: Number(row.cnt_14 || 0),
        claims_last_28d: Number(row.cnt_28 || 0),
        predicted_claims_next_week: Number(row.predicted_claims_next_week || 0),
        predicted_payout_next_week: Number(row.predicted_payout_next_week || 0),
      })),
    });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
