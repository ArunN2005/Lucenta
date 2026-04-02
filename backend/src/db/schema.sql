CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS zones (
  zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name VARCHAR(100) NOT NULL,
  pin_code VARCHAR(10) NOT NULL,
  zone_type VARCHAR(50) NOT NULL,
  dark_store_tier VARCHAR(50) NOT NULL,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  disruption_count_12m INTEGER DEFAULT 0,
  disruption_count_24m INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workers (
  worker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  upi_id VARCHAR(100) NOT NULL,
  zone_id UUID REFERENCES zones(zone_id),
  tenure_weeks INTEGER DEFAULT 0,
  avg_weekly_earnings DECIMAL(10,2) DEFAULT 3200.00,
  income_variance DECIMAL(10,4) DEFAULT 0.20,
  expo_push_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
  policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(worker_id),
  tier VARCHAR(20) NOT NULL,
  weekly_premium DECIMAL(10,2) NOT NULL,
  base_coverage_cap DECIMAL(10,2) NOT NULL,
  adjusted_coverage_cap DECIMAL(10,2) NOT NULL,
  risk_multiplier DECIMAL(5,4) DEFAULT 1.0,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disruptions (
  disruption_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(zone_id),
  disruption_type VARCHAR(50) NOT NULL,
  signal_a_type VARCHAR(100) NOT NULL,
  signal_a_value DECIMAL(10,4) NOT NULL,
  signal_b_type VARCHAR(100) NOT NULL,
  signal_b_value DECIMAL(10,4) NOT NULL,
  payout_percentage INTEGER NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(worker_id),
  policy_id UUID REFERENCES policies(policy_id),
  disruption_id UUID REFERENCES disruptions(disruption_id),
  payout_amount DECIMAL(10,2) NOT NULL,
  hours_disrupted DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'processing',
  razorpay_payout_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS worker_activity (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID UNIQUE REFERENCES workers(worker_id),
  zone_id UUID REFERENCES zones(zone_id),
  last_active_at TIMESTAMP DEFAULT NOW(),
  was_active_30min_before_disruption BOOLEAN DEFAULT FALSE
);

INSERT INTO zones (zone_name, pin_code, zone_type, dark_store_tier, lat, lng, disruption_count_12m, disruption_count_24m) VALUES
('HSR Layout', '560102', 'residential_dense', 'zepto_gold', 12.9116, 77.6389, 8, 14),
('Koramangala', '560034', 'mixed', 'zepto_standard', 12.9352, 77.6245, 6, 11),
('Indiranagar', '560038', 'commercial', 'blinkit_express', 12.9784, 77.6408, 5, 9),
('Whitefield', '560066', 'mixed', 'zepto_standard', 12.9698, 77.7499, 3, 6),
('Bellandur', '560103', 'residential_dense', 'zepto_gold', 12.9257, 77.6762, 7, 13)
ON CONFLICT DO NOTHING;
