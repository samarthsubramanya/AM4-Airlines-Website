'use strict';
// Zoho Catalyst Advanced I/O function: exchanges a signed-in Catalyst user's
// session for a short-lived JWT the Indian.com API (on Render) accepts.
//
//   GET /server/auth_bridge/token  ->  { token }
//
// The browser calls this with credentials, so Catalyst resolves the current
// user from its own session cookie; nothing about the user is trusted from the client.
const catalyst = require('zcatalyst-sdk-node');
const jwt = require('jsonwebtoken');

const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

function send(res, status, body, origin) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (origin && ALLOWED.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers.Vary = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') return send(res, 204, {}, origin);
  if (!req.url.startsWith('/token')) return send(res, 404, { error: 'Not found' }, origin);
  if (!process.env.AUTH_JWT_SECRET) return send(res, 500, { error: 'AUTH_JWT_SECRET is not configured' }, origin);

  try {
    const app = catalyst.initialize(req);
    const user = await app.userManagement().getCurrentUser();
    if (!user || !user.user_id) return send(res, 401, { error: 'Not signed in' }, origin);
    const token = jwt.sign(
      {
        sub: `catalyst:${user.user_id}`,
        email: user.email_id,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email_id,
        provider: 'catalyst',
      },
      process.env.AUTH_JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '12h', issuer: 'indian.com-catalyst' },
    );
    send(res, 200, { token }, origin);
  } catch (err) {
    console.error(err);
    send(res, 401, { error: 'Not signed in' }, origin);
  }
};
