const Razorpay = require('razorpay');
const pool = require('../db/pool');

const razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

function chooseProvider(claimId) {
  const configured = String(process.env.PAYOUT_PROVIDER || 'auto').toLowerCase();
  if (configured && configured !== 'auto') {
    return configured;
  }

  const id = String(claimId || '').replace(/-/g, '');
  const seed = parseInt(id.slice(0, 8), 16);
  const providers = ['razorpay_test', 'stripe_sandbox', 'upi_simulator'];
  return providers[Math.abs(seed || Date.now()) % providers.length];
}

function simulateGatewayReference(provider) {
  const ts = Date.now();
  if (provider === 'stripe_sandbox') {
    return `stp_test_${ts}`;
  }
  if (provider === 'upi_simulator') {
    return `upi_sim_${ts}`;
  }
  return `razor_test_${ts}`;
}

async function initiateUpiPayout(worker, claim) {
  const provider = chooseProvider(claim.claim_id);

  // We intentionally settle asynchronously to show a visible processing window in the demo UX.
  setTimeout(async () => {
    try {
      if (provider === 'razorpay_test' && razorpay) {
        // Real Razorpay test mode can be wired here if needed.
      }

      const reference = simulateGatewayReference(provider);
      const payoutId = `${provider}:${reference}`;
      await pool.query(
        `UPDATE claims
         SET status = 'paid', paid_at = NOW(), razorpay_payout_id = $1
         WHERE claim_id = $2 AND status = 'processing'`,
        [payoutId, claim.claim_id]
      );
    } catch (_e) {
      // For demo reliability we do not fail hard on simulated gateway exceptions.
    }
  }, 3500);

  return { success: true, status: 'processing_async', provider };
}

module.exports = { initiateUpiPayout, razorpay };
