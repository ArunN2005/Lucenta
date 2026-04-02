function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data, error: null });
}

function fail(res, error, status = 500) {
  return res.status(status).json({ success: false, data: null, error: error?.message || String(error) });
}

module.exports = { ok, fail };
