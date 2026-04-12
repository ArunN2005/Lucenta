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
  // Hackathon Demo enhancement:
  // Instead of failing and immediately marking as paid, we will intentionally fork
  // the promise here without awaiting so that the trigger engine can finish and the row is 
  // returned to the app as 'processing'. Then it resolves a few seconds later.
  
  setTimeout(async () => {
    try {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys missing. Falling back to simulation.');
      }
      throw new Error('Using simulated payouts for hackathon demo reliability.');
    } catch (_e) {
      const payoutId = `pay_test_${Date.now()}`;
      await pool.query(
        `UPDATE claims
         SET status = 'paid', paid_at = NOW(), razorpay_payout_id = $1
         WHERE claim_id = $2`,
        [payoutId, claim.claim_id]
      );
    }
  }, 4000); // 4 seconds delay to let user see "Processing"

  return { success: true, status: 'processing_async' };
}

module.exports = { initiateUpiPayout, razorpay };
