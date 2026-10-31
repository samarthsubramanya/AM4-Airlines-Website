import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth.js';
import { createNetworkProvider } from './lib/network.js';
import { accountRoutes } from './routes/account.js';
import { adminRoutes } from './routes/admin.js';
import { bookingRoutes } from './routes/bookings.js';
import { catalogRoutes } from './routes/catalog.js';
import { flightRoutes } from './routes/flights.js';

/**
 * Turn CORS_ORIGINS entries into matchers. Browsers send origins without a trailing slash
 * or path, so those are stripped; "*" matches one host label, e.g. for Vercel previews:
 * https://my-app-*.vercel.app
 */
export function originMatchers(list) {
  return list.map((entry) => {
    const clean = entry.trim().replace(/\/+$/, '').toLowerCase();
    if (!clean.includes('*')) return clean;
    const re = clean.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+');
    return new RegExp(`^${re}$`);
  });
}

export function createApp(store, { secret, demoAuth = true, corsOrigins = [], adminPassword = '', adminEmails = [] }) {
  const app = express();
  const network = createNetworkProvider(store);
  app.set('trust proxy', 1); // Render sits behind a proxy
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins.length ? originMatchers(corsOrigins) : true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
  );
  app.use(express.json({ limit: '3mb' }));
  app.use(authMiddleware(secret, { adminEmails }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, store: store.kind }));
  app.use('/api', catalogRoutes(network));
  app.use('/api', accountRoutes(store, { secret, demoAuth, adminLogin: !!adminPassword }));
  app.use('/api/flights', flightRoutes(store, network));
  app.use('/api/bookings', bookingRoutes(store, network));
  app.use('/api/admin', adminRoutes(store, network, { secret, adminPassword }));

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });
  return app;
}
