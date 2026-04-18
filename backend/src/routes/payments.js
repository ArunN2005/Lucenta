const express = require('express');
const { razorpay } = require('../services/razorpay');
const { ok, fail } = require('../services/response');

const router = express.Router();

router.post('/checkout-order', async (req, res) => {
  try {
    const amountRupees = Number(req.body?.amount_rupees || 0);
    const planTier = String(req.body?.plan_tier || 'plus');

    if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
      return fail(res, new Error('amount_rupees must be a positive number'), 400);
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !razorpay) {
      return fail(res, new Error('Razorpay test credentials are not configured on backend'), 500);
    }

    const amountPaise = Math.round(amountRupees * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `kavach_${Date.now()}`,
      notes: {
        product: 'weekly_coverage',
        tier: planTier,
      },
    });

    return ok(res, {
      key_id: process.env.RAZORPAY_KEY_ID,
      order_id: order.id,
      amount_paise: amountPaise,
      currency: 'INR',
      name: 'Kavach',
      description: `${planTier.toUpperCase()} weekly income coverage`,
    });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
