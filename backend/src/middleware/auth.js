import jwt from 'jsonwebtoken';

// All signed-in users carry a short-lived HS256 JWT from one of two issuers:
//  - "indian.com-demo": the built-in demo login (POST /api/auth/demo-login)
//  - "indian.com-catalyst": the Zoho Catalyst auth bridge function (see /catalyst)
// Both sign with AUTH_JWT_SECRET, so the API verifies them the same way.
export const ISSUERS = { demo: 'indian.com-demo', catalyst: 'indian.com-catalyst' };

export function authMiddleware(secret) {
  return (req, _res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    req.user = null;
    if (token) {
      try {
        const claims = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: Object.values(ISSUERS) });
        req.user = { id: claims.sub, email: claims.email, name: claims.name, provider: claims.provider };
      } catch {
        // Invalid or expired tokens are treated as guests; protected routes reject them.
      }
    }
    next();
  };
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}

export function signDemoToken(secret, { email, name }) {
  return jwt.sign(
    { sub: `demo:${email.toLowerCase()}`, email: email.toLowerCase(), name, provider: 'demo' },
    secret,
    { algorithm: 'HS256', expiresIn: '7d', issuer: ISSUERS.demo },
  );
}
