const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const zones = {};

function ensureZone(zoneId) {
  if (!zones[zoneId]) {
    zones[zoneId] = {
      order_volume_normal: 100,
      order_volume_current: 100,
      active_riders_normal: 50,
      active_riders_current: 50,
      heartbeat_status: 'up',
      last_heartbeat: Date.now(),
      available_orders: 15,
    };
  }
  return zones[zoneId];
}

app.get('/zone/:zone_id/order-volume', (req, res) => {
  const zone = ensureZone(req.params.zone_id);
  const volumeDropPercentage = ((zone.order_volume_normal - zone.order_volume_current) / zone.order_volume_normal) * 100;

  res.json({
    volume_current: zone.order_volume_current,
    volume_normal: zone.order_volume_normal,
    volume_drop_percentage: Number(volumeDropPercentage.toFixed(2)),
  });
});

app.get('/zone/:zone_id/active-riders', (req, res) => {
  const zone = ensureZone(req.params.zone_id);
  const drop = ((zone.active_riders_normal - zone.active_riders_current) / zone.active_riders_normal) * 100;

  res.json({
    riders_current: zone.active_riders_current,
    riders_normal: zone.active_riders_normal,
    drop_percentage: Number(drop.toFixed(2)),
  });
});

app.get('/zone/:zone_id/heartbeat', (req, res) => {
  const zone = ensureZone(req.params.zone_id);
  const minutes = (Date.now() - zone.last_heartbeat) / 60000;

  res.json({
    heartbeat_status: zone.heartbeat_status,
    last_heartbeat: zone.last_heartbeat,
    minutes_since_heartbeat: Number(minutes.toFixed(2)),
  });
});

app.get('/zone/:zone_id/available-orders', (req, res) => {
  const zone = ensureZone(req.params.zone_id);
  res.json({ available_orders: zone.available_orders });
});

app.post('/demo/trigger-rain/:zone_id', (req, res) => {
  const zone = ensureZone(req.params.zone_id);
  zone.order_volume_current = 20;
  res.json({ message: 'Rain scenario triggered for zone' });
});

app.post('/demo/trigger-heat/:zone_id', (req, res) => {
  const zone = ensureZone(req.params.zone_id);
  zone.active_riders_current = 20;
  res.json({ message: 'Heat scenario triggered for zone' });
});

app.post('/demo/trigger-outage/:zone_id', (req, res) => {
  const zone = ensureZone(req.params.zone_id);
  zone.heartbeat_status = 'down';
  zone.available_orders = 0;
  zone.last_heartbeat = Date.now() - 30 * 60 * 1000;
  res.json({ message: 'Platform outage triggered for zone' });
});

app.post('/demo/reset/:zone_id', (req, res) => {
  zones[req.params.zone_id] = {
    order_volume_normal: 100,
    order_volume_current: 100,
    active_riders_normal: 50,
    active_riders_current: 50,
    heartbeat_status: 'up',
    last_heartbeat: Date.now(),
    available_orders: 15,
  };
  res.json({ message: 'Zone reset to normal' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Mock platform API running on port ${PORT}`);
});
