const axios = require('axios');
const { getIsoWeekNumber } = require('./dateUtils');

async function fetchRiskProfile(zone, worker = {}) {
  const payload = {
    zone_disruption_count_12m: zone.disruption_count_12m,
    zone_disruption_count_24m: zone.disruption_count_24m,
    zone_type: zone.zone_type,
    dark_store_tier: zone.dark_store_tier,
    seasonal_week_index: getIsoWeekNumber(new Date()),
    worker_income_variance: worker.income_variance ?? 0.2,
    worker_tenure_weeks: worker.tenure_weeks ?? 0,
    historical_claim_rate: worker.historical_claim_rate ?? 0.1,
  };

  const response = await axios.post(`${process.env.ML_SERVICE_URL}/risk/profile`, payload, {
    timeout: 6000,
  });
  return response.data;
}

module.exports = { fetchRiskProfile };
