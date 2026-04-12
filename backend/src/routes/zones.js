const express = require('express');
const axios = require('axios');
const pool = require('../db/pool');
const { ok, fail } = require('../services/response');

const router = express.Router();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mockLiveContext(zone, activeStrikes) {
  const slot = Math.floor(Date.now() / 30000);
  const seed = Number(zone.lat) * 100 + Number(zone.lng) * 100;
  const weatherTypes = ['Clear', 'Clouds', 'Haze', 'Light Rain'];
  const weatherIndex = Math.abs(Math.floor((slot + Math.round(seed)) % weatherTypes.length));

  const tempC = Number((27 + (Math.sin(slot / 3) * 1.8) + (seed % 3) * 0.4).toFixed(1));
  const aqi = clamp(Math.round(82 + Math.sin(slot / 2) * 12 + activeStrikes * 6), 45, 190);
  const roadLoadIndex = clamp(Math.round(38 + Math.sin(slot / 2.4) * 8 + Math.cos(slot / 3.7) * 5), 20, 72);

  return {
    weather: {
      condition: weatherTypes[weatherIndex],
      temp_c: tempC,
      aqi,
    },
    traffic: {
      enabled: false,
      status: 'disabled',
      message: 'Currently inside building',
      road_load_index: roadLoadIndex,
      updated_at: new Date().toISOString(),
      latitude: Number(zone.lat),
      longitude: Number(zone.lng),
    },
  };
}

async function getLiveWeather(zone, activeStrikes) {
  const key = process.env.OWM_API_KEY;
  if (!key) {
    return mockLiveContext(zone, activeStrikes);
  }

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${zone.lat}&lon=${zone.lng}&appid=${key}`;
    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${zone.lat}&lon=${zone.lng}&appid=${key}`;

    const [weatherRes, aqiRes] = await Promise.all([
      axios.get(weatherUrl, { timeout: 5000 }),
      axios.get(aqiUrl, { timeout: 5000 }),
    ]);

    const tempKelvin = Number(weatherRes?.data?.main?.temp || 0);
    const aqiScale = Number(aqiRes?.data?.list?.[0]?.main?.aqi || 0);
    const tempC = Number((tempKelvin - 273.15).toFixed(1));
    const aqiApprox = clamp(aqiScale * 50, 1, 250);
    const slot = Math.floor(Date.now() / 30000);
    const roadLoadIndex = clamp(Math.round(40 + Math.sin(slot / 2.2) * 9 + activeStrikes * 2), 20, 85);

    return {
      weather: {
        condition: weatherRes?.data?.weather?.[0]?.main || 'Unknown',
        temp_c: tempC,
        aqi: aqiApprox,
      },
      traffic: {
        enabled: false,
        status: 'disabled',
        message: 'Currently inside building',
        road_load_index: roadLoadIndex,
        updated_at: new Date().toISOString(),
        latitude: Number(zone.lat),
        longitude: Number(zone.lng),
      },
    };
  } catch (_e) {
    return mockLiveContext(zone, activeStrikes);
  }
}

router.get('/', async (_req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM zones ORDER BY zone_name ASC');
    return ok(res, rows.rows);
  } catch (error) {
    return fail(res, error, 500);
  }
});

router.get('/:zone_id/live-context', async (req, res) => {
  try {
    const { zone_id } = req.params;
    const zoneRes = await pool.query('SELECT * FROM zones WHERE zone_id = $1 LIMIT 1', [zone_id]);
    if (!zoneRes.rowCount) {
      return fail(res, new Error('Zone not found'), 404);
    }

    const zone = zoneRes.rows[0];
    const disruptionRes = await pool.query(
      `SELECT disruption_type
       FROM disruptions
       WHERE zone_id = $1 AND status = 'active'
       ORDER BY started_at DESC`,
      [zone_id]
    );

    const activeStrikes = disruptionRes.rowCount;
    const live = await getLiveWeather(zone, activeStrikes);

    return ok(res, {
      zone_id: zone.zone_id,
      zone_name: zone.zone_name,
      latitude: Number(zone.lat),
      longitude: Number(zone.lng),
      active_strikes: activeStrikes,
      active_strike_types: disruptionRes.rows.map((row) => row.disruption_type),
      ...live,
    });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
