const axios = require('axios');
const cron = require('node-cron');
const pool = require('../db/pool');
const redis = require('../db/redis');
const { createClaim } = require('../services/claims');

async function fetchWeather(zone) {
  const key = process.env.OWM_API_KEY;
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${zone.lat}&lon=${zone.lng}&appid=${key}`;
  const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${zone.lat}&lon=${zone.lng}&appid=${key}`;

  const [weatherRes, aqiRes] = await Promise.all([
    axios.get(weatherUrl, { timeout: 6000 }),
    axios.get(aqiUrl, { timeout: 6000 }),
  ]);

  return { weather: weatherRes.data, aqi: aqiRes.data };
}

async function getActiveDisruption(zoneId, disruptionType) {
  const existing = await pool.query(
    `SELECT * FROM disruptions
     WHERE zone_id = $1
       AND disruption_type = $2
       AND status = 'active'
       AND started_at >= NOW() - INTERVAL '2 hours'
     LIMIT 1`,
    [zoneId, disruptionType]
  );
  return existing.rowCount ? existing.rows[0] : null;
}

async function createDisruption(zoneId, disruptionType, signalAType, signalAValue, signalBType, signalBValue, payoutPercentage) {
  const insert = await pool.query(
    `INSERT INTO disruptions
     (zone_id, disruption_type, signal_a_type, signal_a_value, signal_b_type, signal_b_value, payout_percentage)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [zoneId, disruptionType, signalAType, signalAValue, signalBType, signalBValue, payoutPercentage]
  );
  return insert.rows[0];
}

async function eligibleWorkers(zoneId) {
  const q = await pool.query(
    `SELECT w.*, p.policy_id, p.adjusted_coverage_cap, wa.last_active_at
     FROM workers w
     JOIN policies p ON p.worker_id = w.worker_id
     JOIN worker_activity wa ON wa.worker_id = w.worker_id
     WHERE w.zone_id = $1
       AND p.status = 'active'
       AND CURRENT_DATE BETWEEN p.week_start AND p.week_end
       AND wa.last_active_at >= NOW() - INTERVAL '30 minutes'`,
    [zoneId]
  );

  if (q.rowCount > 0 || process.env.DEMO_MODE !== 'true') {
    return q.rows;
  }

  // Demo fallback: include workers with active policy even if heartbeat row is missing.
  const fallback = await pool.query(
    `SELECT w.*, p.policy_id, p.adjusted_coverage_cap
     FROM workers w
     JOIN policies p ON p.worker_id = w.worker_id
     WHERE w.zone_id = $1
       AND p.status = 'active'
       AND CURRENT_DATE BETWEEN p.week_start AND p.week_end`,
    [zoneId]
  );
  return fallback.rows;
}

async function createClaimsForDisruption(disruption, workers, payoutPercentage) {
  let claims = 0;

  for (const worker of workers) {
    const alreadyExists = await pool.query(
      `SELECT claim_id FROM claims
       WHERE worker_id = $1 AND disruption_id = $2
       LIMIT 1`,
      [worker.worker_id, disruption.disruption_id]
    );

    if (alreadyExists.rowCount) {
      continue;
    }

    const policy = { policy_id: worker.policy_id, adjusted_coverage_cap: worker.adjusted_coverage_cap };
    await createClaim({
      worker,
      policy,
      disruption,
      payoutPercentage,
    });
    claims += 1;
  }

  return claims;
}

async function processTrigger(zone, cfg) {
  const workers = await eligibleWorkers(zone.zone_id);
  if (!workers.length) {
    return {
      type: cfg.type,
      created: false,
      reason: 'no_eligible_workers',
      claims: 0,
    };
  }

  const duplicate = await getActiveDisruption(zone.zone_id, cfg.type);
  if (duplicate) {
    const claims = await createClaimsForDisruption(duplicate, workers, cfg.payout);
    return {
      type: cfg.type,
      created: claims > 0,
      reason: claims > 0 ? 'backfilled_existing_disruption' : 'duplicate_recent',
      claims,
    };
  }

  const disruption = await createDisruption(
    zone.zone_id,
    cfg.type,
    cfg.signalAType,
    cfg.signalAValue,
    cfg.signalBType,
    cfg.signalBValue,
    cfg.payout
  );

  const claims = await createClaimsForDisruption(disruption, workers, cfg.payout);

  return { type: cfg.type, created: true, claims };
}

async function checkZoneTriggers(zone) {
  const mockBase = process.env.MOCK_PLATFORM_API_URL;
  const result = [];

  let weatherData = null;
  try {
    weatherData = await fetchWeather(zone);
  } catch (_e) {
    weatherData = { weather: {}, aqi: {} };
  }

  const demoOverride = process.env.DEMO_MODE === 'true';

  const weather = weatherData.weather || {};
  const aqi = weatherData.aqi || {};

  const rain1h = Number(weather?.rain?.['1h'] || 0);
  const weatherCode = Number(weather?.weather?.[0]?.id || 0);

  const orderVol = (await axios.get(`${mockBase}/zone/${zone.zone_id}/order-volume`)).data;
  const heavyRainSignalA = rain1h > 50 || (weatherCode >= 502 && weatherCode <= 504) || demoOverride;
  const heavyRainSignalB = Number(orderVol.volume_drop_percentage || 0) > 70;

  if (heavyRainSignalA && heavyRainSignalB) {
    result.push(
      await processTrigger(zone, {
        type: 'heavy_rain',
        signalAType: 'weather_rainfall_or_storm_code',
        signalAValue: Math.max(rain1h, weatherCode),
        signalBType: 'order_volume_drop_percentage',
        signalBValue: Number(orderVol.volume_drop_percentage || 0),
        payout: 100,
      })
    );
  }

  const tempKelvin = Number(weather?.main?.temp || 0);
  const aqiValue = Number(aqi?.list?.[0]?.main?.aqi || 0);
  const activeRiders = (await axios.get(`${mockBase}/zone/${zone.zone_id}/active-riders`)).data;
  const heatSignalA = tempKelvin > 315.15 || aqiValue >= 4 || demoOverride;
  const heatSignalB = Number(activeRiders.drop_percentage || 0) > 50;

  if (heatSignalA && heatSignalB) {
    result.push(
      await processTrigger(zone, {
        type: 'extreme_heat',
        signalAType: 'temperature_or_aqi',
        signalAValue: Math.max(tempKelvin, aqiValue),
        signalBType: 'active_rider_drop_percentage',
        signalBValue: Number(activeRiders.drop_percentage || 0),
        payout: 50,
      })
    );
  }

  const heartbeat = (await axios.get(`${mockBase}/zone/${zone.zone_id}/heartbeat`)).data;
  const orders = (await axios.get(`${mockBase}/zone/${zone.zone_id}/available-orders`)).data;
  const minutesSinceHeartbeat = Number(heartbeat.minutes_since_heartbeat || 0);

  const outageSignalA = minutesSinceHeartbeat > 20 || heartbeat.heartbeat_status === 'down';
  const outageSignalB = Number(orders.available_orders || 0) === 0;

  if (outageSignalA && outageSignalB) {
    result.push(
      await processTrigger(zone, {
        type: 'platform_outage',
        signalAType: 'minutes_since_platform_heartbeat',
        signalAValue: minutesSinceHeartbeat,
        signalBType: 'available_orders',
        signalBValue: Number(orders.available_orders || 0),
        payout: 70,
      })
    );
  }

  return result;
}

async function runTriggerEngine() {
  const zones = await pool.query('SELECT * FROM zones ORDER BY zone_name');
  const summary = [];

  for (const zone of zones.rows) {
    try {
      const zoneSummary = await checkZoneTriggers(zone);
      summary.push({ zone_id: zone.zone_id, zone_name: zone.zone_name, checks: zoneSummary });
    } catch (err) {
      summary.push({ zone_id: zone.zone_id, zone_name: zone.zone_name, error: err.message });
    }
  }

  try {
    await redis.set('kavach:last_trigger_run', String(Date.now()));
  } catch (_err) {
    // Redis is optional for trigger-status timing; do not fail the main engine run.
  }
  return summary;
}

function scheduleTriggerEngine() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runTriggerEngine();
    } catch (e) {
      console.error('Trigger engine error:', e.message);
    }
  });
}

module.exports = { runTriggerEngine, scheduleTriggerEngine };
