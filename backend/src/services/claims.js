const pool = require('../db/pool');
const { initiateUpiPayout } = require('./razorpay');
const { sendPushNotification } = require('./notifications');

async function createClaim({ worker, policy, disruption, payoutPercentage }) {
  const hoursDisrupted = 2.5;
  const hourlyRate = Number(worker.avg_weekly_earnings) / 7 / 8;
  const rawPayout = hourlyRate * hoursDisrupted * (payoutPercentage / 100);
  const finalPayout = Math.min(rawPayout, Number(policy.adjusted_coverage_cap));
  const rounded = Math.round(finalPayout);

  const claimInsert = await pool.query(
    `INSERT INTO claims (worker_id, policy_id, disruption_id, payout_amount, hours_disrupted, status)
     VALUES ($1, $2, $3, $4, $5, 'processing')
     RETURNING *`,
    [worker.worker_id, policy.policy_id, disruption.disruption_id, rounded, hoursDisrupted]
  );

  const claim = claimInsert.rows[0];
  const payout = await initiateUpiPayout(worker, claim);

  await sendPushNotification(
    worker.expo_push_token,
    'Zone disruption detected',
    `Rs ${rounded} will be sent to your UPI. No action needed.`,
    { claim_id: claim.claim_id, disruption_type: disruption.disruption_type }
  );

  return { claim, payout };
}

module.exports = { createClaim };
