const https = require('https');
const http = require('http');
const { resolveIpLocation } = require('../utils/geo');

/**
 * Sends an HTTP/HTTPS POST request with JSON payload to a webhook URL
 */
const postJson = (urlStr, payload) => {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = JSON.stringify(payload);

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'EduNova-Security-Dispatcher/1.0',
        },
        timeout: 5000,
      };

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Webhook request timed out after 5000ms'));
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Dispatches an automated security alert to configured webhooks
 * @param {string} event - E.g. 'ACCOUNT_LOCKED', 'ROLE_PROMOTED', 'ACCOUNT_SUSPENDED', '2FA_DISABLED'
 * @param {string} severity - 'INFO' | 'WARNING' | 'CRITICAL'
 * @param {string} title - Short summary of security event
 * @param {object} details - Metadata details
 */
const dispatchSecurityAlert = async ({ event, severity = 'WARNING', title, details = {} }) => {
  const webhookUrl =
    process.env.SECURITY_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL;

  const timestamp = new Date().toISOString();
  const location = details.ipAddress ? resolveIpLocation(details.ipAddress) : null;

  const payload = {
    app: 'EduNova Learning Platform',
    environment: process.env.NODE_ENV || 'development',
    event,
    severity,
    title,
    location: location ? location.formatted : 'N/A',
    details,
    timestamp,
    // Slack/Discord compatible text fallback
    text: `[${severity}] ${title}\nEvent: ${event}\nTimestamp: ${timestamp}\nDetails: ${JSON.stringify(
      details
    )}`,
  };

  // Log locally regardless of webhook destination
  const emoji = severity === 'CRITICAL' ? '🚨' : severity === 'WARNING' ? '⚠️' : 'ℹ️';
  console.log(
    `\n${emoji} [SECURITY ALERT] ${title}\nEvent: ${event} | Severity: ${severity} | Time: ${timestamp}`
  );

  if (!webhookUrl) {
    return { dispatched: false, reason: 'NO_WEBHOOK_CONFIGURED' };
  }

  try {
    const res = await postJson(webhookUrl, payload);
    return { dispatched: true, statusCode: res.statusCode };
  } catch (err) {
    console.error('[Security Webhook Dispatch Failed]', err.message);
    return { dispatched: false, error: err.message };
  }
};

module.exports = {
  dispatchSecurityAlert,
};
