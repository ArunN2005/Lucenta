const pool = require('../db/pool');
const { initiateUpiPayout } = require('./razorpay');
const { sendPushNotification } = require('./notifications');
const { evaluateClaimFraud, recordFraudEvent } = require('./fraud');

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
  const fraud = await evaluateClaimFraud({ worker, disruption });
  await recordFraudEvent({
    claimId: claim.claim_id,
    workerId: worker.worker_id,
    disruptionId: disruption.disruption_id,
    score: fraud.score,
    status: fraud.status,
    flags: fraud.flags,
    notes: fraud.notes,
  });

  let payout = { success: false, status: 'not_started' };

  if (fraud.status === 'blocked') {
    await pool.query(`UPDATE claims SET status = 'fraud_blocked' WHERE claim_id = $1`, [claim.claim_id]);
    await sendPushNotification(
      worker.expo_push_token,
      'Claim flagged for fraud',
      `Your claim was blocked by anti-fraud checks. Support will review if needed.`,
      { claim_id: claim.claim_id, fraud_score: fraud.score }
    );
  } else if (fraud.status === 'review') {
    await pool.query(`UPDATE claims SET status = 'fraud_review' WHERE claim_id = $1`, [claim.claim_id]);
    await sendPushNotification(
      worker.expo_push_token,
      'Claim under review',
      `Anti-fraud checks requested a quick review before payout release.`,
      { claim_id: claim.claim_id, fraud_score: fraud.score }
    );
  } else {
    payout = await initiateUpiPayout(worker, claim);

    await sendPushNotification(
      worker.expo_push_token,
      'Zone disruption detected',
      `Rs ${rounded} will be sent to your UPI instantly via ${payout.provider || 'gateway'}.`,
      { claim_id: claim.claim_id, disruption_type: disruption.disruption_type, payout_provider: payout.provider }
    );
  }

  return { claim: { ...claim, fraud_score: fraud.score, fraud_status: fraud.status }, payout };
}

module.exports = { createClaim };
