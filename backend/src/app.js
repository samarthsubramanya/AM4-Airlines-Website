import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth.js';
import { accountRoutes } from './routes/account.js';
import { bookingRoutes } from './routes/bookings.js';
import { catalogRoutes } from './routes/catalog.js';
import { flightRoutes } from './routes/flights.js';

export function createApp(store, { secret, demoAuth = true, corsOrigins = [] }) {
  const app = express();
  app.set('trust proxy', 1); // Render sits behind a proxy
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins.length ? corsOrigins : true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(authMiddleware(secret));

  app.get('/api/health', (_req, res) => res.json({ ok: true, store: store.kind }));
  app.use('/api', catalogRoutes());
  app.use('/api', accountRoutes(store, { secret, demoAuth }));
  app.use('/api/flights', flightRoutes(store));
  app.use('/api/bookings', bookingRoutes(store));

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });
  return app;
}
