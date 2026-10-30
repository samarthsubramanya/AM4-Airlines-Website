import { Router } from 'express';
import { z } from 'zod';
import { signDemoToken, requireUser } from '../middleware/auth.js';
import { tierFor } from '../lib/loyalty.js';

export function accountRoutes(store, { secret, demoAuth, adminLogin }) {
  const r = Router();

  r.get('/auth/config', (_req, res) => res.json({ demoAuth, adminLogin }));

  r.post('/auth/demo-login', (req, res) => {
    if (!demoAuth) return res.status(404).json({ error: 'Demo login is disabled' });
    const body = z.object({ email: z.string().email().max(120), name: z.string().trim().min(1).max(60) }).safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Enter your name and a valid email' });
    res.json({ token: signDemoToken(secret, body.data) });
  });

  r.get('/me', requireUser, async (req, res, next) => {
    try {
      const bookings = await store.listBookingsByUser(req.user.id);
      const now = Date.now();
      // Miles from cancelled bookings are reversed; trips still to come count as "pending".
      let miles = 0;
      let pending = 0;
      for (const b of bookings) {
        if (b.status === 'CANCELLED') continue;
        if (b.journeys.at(-1).legs.at(-1).arrUtc < now) miles += b.milesEarned;
        else pending += b.milesEarned;
      }
      const tier = tierFor(miles);
      res.json({
        user: req.user,
        loyalty: { memberId: `MM${String(parseInt(req.user.id.replace(/\W/g, ''), 36) % 1e9).padStart(9, '0')}`, miles, pending, ...tier },
        bookings: bookings.map(({ userId, ...b }) => b),
      });
    } catch (err) {
      next(err);
    }
  });

  return r;
}
