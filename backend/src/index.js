import { randomBytes } from 'node:crypto';
import { createApp } from './app.js';
import { createStore } from './store/index.js';

const env = process.env;
let secret = env.AUTH_JWT_SECRET;
if (!secret) {
  if (env.NODE_ENV === 'production') throw new Error('AUTH_JWT_SECRET must be set in production');
  secret = randomBytes(32).toString('hex');
  console.warn('AUTH_JWT_SECRET not set — using a random secret; sign-ins reset on restart.');
}

const store = await createStore(env);
const app = createApp(store, {
  secret,
  demoAuth: env.DEMO_AUTH !== 'false',
  corsOrigins: (env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
});

const port = Number(env.PORT) || 4000;
app.listen(port, () => console.log(`Indian.com API on :${port} (store: ${store.kind})`));
