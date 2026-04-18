const pool = require('../db/pool');

let ensured = false;

async function ensureFraudTables() {
  if (ensured) {
    return;
  }

  await pool.query(
    `CREATE TABLE IF NOT EXISTS worker_activity_log (
       log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       worker_id UUID REFERENCES workers(worker_id),
       zone_id UUID REFERENCES zones(zone_id),
       latitude DECIMAL(10,6),
       longitude DECIMAL(10,6),
       accuracy_meters DECIMAL(10,2),
       speed_kmh DECIMAL(10,2),
       is_mock_location BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP DEFAULT NOW()
     )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS fraud_events (
       fraud_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       claim_id UUID REFERENCES claims(claim_id),
       worker_id UUID REFERENCES workers(worker_id),
       disruption_id UUID REFERENCES disruptions(disruption_id),
       fraud_score INTEGER NOT NULL,
       fraud_status VARCHAR(20) NOT NULL,
       flags JSONB NOT NULL,
       notes TEXT,
       created_at TIMESTAMP DEFAULT NOW()
     )`
  );

  ensured = true;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

async function detectGpsSpoofing(workerId, zoneId) {
  await ensureFraudTables();

  const logs = await pool.query(
    `SELECT zone_id, latitude, longitude, accuracy_meters, speed_kmh, is_mock_location, created_at
     FROM worker_activity_log
     WHERE worker_id = $1
       AND created_at >= NOW() - INTERVAL '4 hours'
     ORDER BY created_at DESC
     LIMIT 2`,
    [workerId]
  );

  if (logs.rowCount < 2) {
    return [];
  }

  const latest = logs.rows[0];
  const prev = logs.rows[1];
  const flags = [];

  if (latest.is_mock_location || prev.is_mock_location) {
    flags.push({
      code: 'gps_mock_location_flag',
      severity: 90,
      detail: 'Mock location provider detected in worker activity telemetry.',
    });
  }

  const hasCoords =
    latest.latitude !== null &&
    latest.longitude !== null &&
    prev.latitude !== null &&
    prev.longitude !== null;

  if (hasCoords) {
    const distKm = haversineKm(
      Number(prev.latitude),
      Number(prev.longitude),
      Number(latest.latitude),
      Number(latest.longitude)
    );
    const minutes =
      Math.abs(new Date(latest.created_at).getTime() - new Date(prev.created_at).getTime()) / 60000;

    if (minutes > 0 && distKm > 20 && minutes <= 15) {
      flags.push({
        code: 'gps_impossible_jump',
        severity: 85,
        detail: `Location jumped ${distKm.toFixed(1)} km in ${minutes.toFixed(1)} minutes.`,
      });
    }
  }

  const speedKmh = Number(latest.speed_kmh || 0);
  if (speedKmh > 90) {
    flags.push({
      code: 'gps_unrealistic_speed',
      severity: 65,
      detail: `Reported speed ${speedKmh.toFixed(1)} km/h exceeds delivery norms.`,
    });
  }

  if (latest.zone_id && zoneId && latest.zone_id !== zoneId) {
    flags.push({
      code: 'gps_zone_mismatch',
      severity: 40,
      detail: 'Latest worker telemetry zone mismatches claim zone.',
    });
  }

  return flags;
}

async function detectWeatherAnomaly(disruption) {
  if (!disruption || !['heavy_rain', 'extreme_heat'].includes(disruption.disruption_type)) {
    return [];
  }

  const stats = await pool.query(
    `SELECT COUNT(*)::int AS sample_count,
            COALESCE(AVG(signal_a_value), 0) AS avg_signal_a,
            COALESCE(STDDEV_POP(signal_a_value), 0) AS std_signal_a,
            COALESCE(AVG(signal_b_value), 0) AS avg_signal_b
     FROM disruptions
     WHERE zone_id = $1
       AND disruption_type = $2
       AND started_at < NOW() - INTERVAL '1 hour'
       AND started_at >= NOW() - INTERVAL '180 days'`,
    [disruption.zone_id, disruption.disruption_type]
  );

  const row = stats.rows[0] || {};
  const sampleCount = Number(row.sample_count || 0);
  const avgA = Number(row.avg_signal_a || 0);
  const stdA = Number(row.std_signal_a || 0);
  const avgB = Number(row.avg_signal_b || 0);

  const currentA = Number(disruption.signal_a_value || 0);
  const currentB = Number(disruption.signal_b_value || 0);
  const flags = [];

  if (sampleCount >= 3) {
    const zScore = (currentA - avgA) / Math.max(stdA, 1);
    if (zScore > 4 && currentB < Math.max(60, avgB * 0.7)) {
      flags.push({
        code: 'weather_pattern_anomaly',
        severity: 55,
        detail: `Signal A is ${zScore.toFixed(2)} sd above historical pattern while impact signal is weak.`,
      });
    }
  } else {
    const suspiciousFallback =
      (disruption.disruption_type === 'heavy_rain' && currentA > 300) ||
      (disruption.disruption_type === 'extreme_heat' && currentA > 335);

    if (suspiciousFallback) {
      flags.push({
        code: 'weather_outlier_no_history',
        severity: 45,
        detail: 'Signal A far exceeds realistic bounds with low historical baseline data.',
      });
    }
  }

  return flags;
}

async function evaluateClaimFraud({ worker, disruption }) {
  const flags = [];

  if (worker?.last_active_at) {
    const minutesSinceActivity =
      Math.abs(Date.now() - new Date(worker.last_active_at).getTime()) / 60000;
    if (minutesSinceActivity > 40) {
      flags.push({
        code: 'stale_worker_activity',
        severity: 20,
        detail: `Worker activity heartbeat stale by ${Math.round(minutesSinceActivity)} minutes.`,
      });
    }
  }

  const gpsFlags = await detectGpsSpoofing(worker.worker_id, disruption.zone_id);
  const weatherFlags = await detectWeatherAnomaly(disruption);

  flags.push(...gpsFlags, ...weatherFlags);

  const score = Math.max(
    0,
    Math.min(
      100,
      flags.reduce((sum, flag) => sum + Number(flag.severity || 0), 0)
    )
  );

  let status = 'clear';
  if (score >= 80) {
    status = 'blocked';
  } else if (score >= 45) {
    status = 'review';
  }

  return {
    score,
    status,
    flags,
    notes:
      status === 'clear'
        ? 'No material fraud signals detected.'
        : status === 'review'
          ? 'Claim requires manual validation before payout.'
          : 'Claim blocked due to high-confidence fraud indicators.',
  };
}

async function recordFraudEvent({ claimId, workerId, disruptionId, score, status, flags, notes }) {
  await ensureFraudTables();
  await pool.query(
    `INSERT INTO fraud_events
     (claim_id, worker_id, disruption_id, fraud_score, fraud_status, flags, notes)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [claimId, workerId, disruptionId, score, status, JSON.stringify(flags || []), notes || null]
  );
}

async function logWorkerActivity({ worker_id, zone_id, latitude, longitude, accuracy_meters, speed_kmh, is_mock_location }) {
  await ensureFraudTables();
  await pool.query(
    `INSERT INTO worker_activity_log
     (worker_id, zone_id, latitude, longitude, accuracy_meters, speed_kmh, is_mock_location)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      worker_id,
      zone_id,
      latitude ?? null,
      longitude ?? null,
      accuracy_meters ?? null,
      speed_kmh ?? null,
      Boolean(is_mock_location),
    ]
  );
}

module.exports = {
  evaluateClaimFraud,
  recordFraudEvent,
  logWorkerActivity,
  ensureFraudTables,
};
