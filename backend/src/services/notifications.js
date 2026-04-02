const axios = require('axios');

async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken) {
    return { success: false, skipped: true };
  }

  const response = await axios.post(
    'https://exp.host/--/api/v2/push/send',
    {
      to: expoPushToken,
      title,
      body,
      data,
      sound: 'default',
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    }
  );

  return { success: true, response: response.data };
}

module.exports = { sendPushNotification };
