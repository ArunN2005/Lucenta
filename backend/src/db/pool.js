const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  ssl: process.env.DATABASE_URL?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  const code = err?.code || 'unknown';
  if (code === '57P01') {
    console.error('Postgres connection dropped (server restart/shutdown). Waiting for reconnect...');
    return;
  }
  console.error('Postgres pool error:', err.message);
});

module.exports = pool;
