const express = require('express');
const axios = require('axios');
const pool = require('../db/pool');
const redis = require('../db/redis');
const { ok, fail } = require('../services/response');
const { runTriggerEngine } = require('../cron/triggerEngine');

const router = express.Router();

const mockBaseUrl = process.env.MOCK_PLATFORM_API_URL || 'http://localhost:3001';

router.post('/force-trigger-check', async (_req, res) => {
  try {
    const summary = await runTriggerEngine();
    return ok(res, { ran: true, summary });
  } catch (error) {
    return fail(res, error, 500);
  }
});

router.get('/trigger-status', async (_req, res) => {
  try {
    let redisLastRun = null;
    try {
      redisLastRun = await redis.get('kavach:last_trigger_run');
    } catch (_err) {
      redisLastRun = null;
    }
    const lastRun = Number(redisLastRun || Date.now());
    const nextRunInSeconds = Math.max(0, 300 - Math.floor((Date.now() - lastRun) / 1000));
    return ok(res, { last_run: lastRun, next_run_in_seconds: nextRunInSeconds });
  } catch (error) {
    return fail(res, error, 500);
  }
});

router.post('/trigger-rain/:zone_id', async (req, res) => {
  try {
    const out = await axios.post(`${mockBaseUrl}/demo/trigger-rain/${req.params.zone_id}`);
    return ok(res, out.data);
  } catch (error) {
    return fail(res, error, 500);
  }
});

router.post('/trigger-heat/:zone_id', async (req, res) => {
  try {
    const out = await axios.post(`${mockBaseUrl}/demo/trigger-heat/${req.params.zone_id}`);
    return ok(res, out.data);
  } catch (error) {
    return fail(res, error, 500);
  }
});

router.post('/trigger-outage/:zone_id', async (req, res) => {
  try {
    const out = await axios.post(`${mockBaseUrl}/demo/trigger-outage/${req.params.zone_id}`);
    return ok(res, out.data);
  } catch (error) {
    return fail(res, error, 500);
  }
});

router.post('/reset/:zone_id', async (req, res) => {
  try {
    const out = await axios.post(`${mockBaseUrl}/demo/reset/${req.params.zone_id}`);
    await pool.query(
      `UPDATE disruptions
       SET status = 'resolved', ended_at = NOW()
       WHERE zone_id = $1 AND status = 'active'`,
      [req.params.zone_id]
    );
    return ok(res, out.data);
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
