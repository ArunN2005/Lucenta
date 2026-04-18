require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
require('./db/redis');
const { scheduleTriggerEngine } = require('./cron/triggerEngine');

const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/worker');
const policyRoutes = require('./routes/policy');
const claimsRoutes = require('./routes/claims');
const disruptionsRoutes = require('./routes/disruptions');
const zonesRoutes = require('./routes/zones');
const demoRoutes = require('./routes/demo');
const adminRoutes = require('./routes/admin');
const paymentsRoutes = require('./routes/payments');
const { ensureFraudTables } = require('./services/fraud');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ success: true, data: { status: 'ok' }, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/disruptions', disruptionsRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Kavach backend running on port ${port}`);
  ensureFraudTables().catch((e) => console.error('Fraud table bootstrap error:', e.message));
  scheduleTriggerEngine();
});
