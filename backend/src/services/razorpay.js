const Razorpay = require('razorpay');
const pool = require('../db/pool');

const razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initiateUpiPayout(worker, claim) {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys missing. Falling back to simulation.');
    }

    throw new Error('Using simulated payouts for hackathon demo reliability.');
  } catch (_e) {
    await sleep(2000);
    const payoutId = `pay_test_${Date.now()}`;

    await pool.query(
      `UPDATE claims
       SET status = 'paid', paid_at = NOW(), razorpay_payout_id = $1
       WHERE claim_id = $2`,
      [payoutId, claim.claim_id]
    );

    return { success: true, payout_id: payoutId };
  }
}

module.exports = { initiateUpiPayout, razorpay };
