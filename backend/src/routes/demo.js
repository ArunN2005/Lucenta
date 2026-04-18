const express = require('express');
const axios = require('axios');
const pool = require('../db/pool');
const redis = require('../db/redis');
const { ok, fail } = require('../services/response');
const { runTriggerEngine } = require('../cron/triggerEngine');
const { logWorkerActivity } = require('../services/fraud');

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
    const { zone_id } = req.params;
    const out = await axios.post(`${mockBaseUrl}/demo/reset/${req.params.zone_id}`);
    await pool.query(
      `UPDATE disruptions
       SET status = 'resolved', ended_at = NOW()
       WHERE zone_id = $1 AND status = 'active'`,
      [req.params.zone_id]
    );

    // Reset anti-fraud telemetry for the zone so GPS spoof simulations do not persist.
    try {
      await pool.query(
        `DELETE FROM worker_activity_log wal
         USING workers w
         WHERE wal.worker_id = w.worker_id
           AND w.zone_id = $1`,
        [zone_id]
      );
    } catch (_err) {
      // If telemetry table does not exist in an older DB snapshot, ignore reset cleanup error.
    }

    return ok(res, out.data);
  } catch (error) {
    return fail(res, error, 500);
  }
});

router.post('/simulate-gps-spoof/:zone_id', async (req, res) => {
  try {
    const { zone_id } = req.params;
    const workerRes = await pool.query(
      `SELECT w.worker_id, w.zone_id
       FROM workers w
       JOIN policies p ON p.worker_id = w.worker_id
       WHERE w.zone_id = $1
         AND p.status = 'active'
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [zone_id]
    );

    if (!workerRes.rowCount) {
      return fail(res, new Error('No active worker found in this zone'), 404);
    }

    const worker = workerRes.rows[0];

    await logWorkerActivity({
      worker_id: worker.worker_id,
      zone_id: worker.zone_id,
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy_meters: 8,
      speed_kmh: 24,
      is_mock_location: false,
    });

    await logWorkerActivity({
      worker_id: worker.worker_id,
      zone_id: worker.zone_id,
      latitude: 13.0827,
      longitude: 80.2707,
      accuracy_meters: 2,
      speed_kmh: 145,
      is_mock_location: true,
    });

    return ok(res, {
      simulated: true,
      worker_id: worker.worker_id,
      message: 'GPS spoof telemetry inserted. Next claim in this zone should be fraud-blocked.',
    });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
