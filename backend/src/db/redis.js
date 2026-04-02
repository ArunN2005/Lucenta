const Redis = require('ioredis');

const configuredUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisUrl = configuredUrl.replace('redis://localhost:', 'redis://127.0.0.1:');

let lastErrorLogAt = 0;

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy: (attempt) => {
    if (attempt > 10) {
      return null;
    }
    return Math.min(300 * attempt, 2000);
  },
});

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  const now = Date.now();
  if (now - lastErrorLogAt > 15000) {
    lastErrorLogAt = now;
    console.error('Redis unavailable:', err.message);
  }
});

module.exports = redis;
