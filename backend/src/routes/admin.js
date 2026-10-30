import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { AIRCRAFT, aircraftCode, aircraftSummary } from '../data/fleet.js';
import { routesFromCsv } from '../data/seed.js';
import { requireAdmin, signAdminToken } from '../middleware/auth.js';
import { networkLinks } from '../lib/schedule.js';

const icao = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4}$/, 'ICAO codes are 4 letters/digits');
const routeSchema = z.object({
  from: icao,
  to: icao,
  flightNumber: z.string().trim().min(1).max(20),
  aircraft: z.string().trim().transform((v, ctx) => {
    const code = AIRCRAFT[v] ? v : aircraftCode(v);
    if (!code) ctx.addIssue({ code: 'custom', message: `Unknown aircraft type "${v}"` });
    return code || v;
  }),
  registration: z.string().trim().min(1).max(40),
});
const airportSchema = z.object({
  icao,
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3}$/, 'IATA codes are 3 letters/digits'),
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().min(1).max(60),
  country: z.string().trim().min(2).max(60),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  tz: z.string().trim().refine((tz) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Unknown IANA time zone, e.g. Asia/Kolkata'),
});

const newRouteId = () => `R${randomBytes(4).toString('hex').toUpperCase()}`;
const digest = (s) => createHash('sha256').update(s).digest();
const csvCell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

export function adminRoutes(store, network, { secret, adminPassword }) {
  const r = Router();
  const loginLimiter = rateLimit({ windowMs: 15 * 60000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

  r.post('/login', loginLimiter, (req, res) => {
    if (!adminPassword) return res.status(404).json({ error: 'Admin password login is not configured' });
    const given = String(req.body?.password || '');
    if (!timingSafeEqual(digest(given), digest(adminPassword))) return res.status(401).json({ error: 'Wrong password' });
    res.json({ token: signAdminToken(secret) });
  });

  r.use(requireAdmin);

  const checkAirports = async (route) => {
    const net = await network.get();
    const missing = [route.from, route.to].filter((c) => !net.byIcao.has(c));
    if (missing.length) return `Unknown airport ${missing.join(', ')}. Add it under Airports first.`;
    if (route.from === route.to) return 'Origin and destination must differ';
    return null;
  };

  // Routes with computed details (operator, distance, frequency) for the dashboard.
  r.get('/routes', async (_req, res, next) => {
    try {
      const [routes, net] = await Promise.all([store.listRoutes(), network.get()]);
      const links = new Map(networkLinks(net).map((l) => [l.routeId, l]));
      const problems = new Map(net.problems.map((p) => [p.id, p.reason]));
      res.json({
        routes: routes.map((rt) => ({ ...rt, computed: links.get(rt.id) || null, problem: problems.get(rt.id) || null })),
        aircraft: aircraftSummary().map(({ code, name, category, cargo }) => ({ code, name, category, cargo })),
      });
    } catch (err) {
      next(err);
    }
  });

  r.post('/routes', async (req, res, next) => {
    try {
      const body = routeSchema.safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: body.error.issues[0].message });
      const problem = await checkAirports(body.data);
      if (problem) return res.status(400).json({ error: problem });
      const route = await store.createRoute({ id: newRouteId(), ...body.data });
      network.invalidate();
      res.status(201).json(route);
    } catch (err) {
      next(err);
    }
  });

  r.put('/routes/:id', async (req, res, next) => {
    try {
      const body = routeSchema.safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: body.error.issues[0].message });
      const problem = await checkAirports(body.data);
      if (problem) return res.status(400).json({ error: problem });
      const route = await store.updateRoute(req.params.id, body.data);
      if (!route) return res.status(404).json({ error: 'Route not found' });
      network.invalidate();
      res.json(route);
    } catch (err) {
      next(err);
    }
  });

  r.delete('/routes/:id', async (req, res, next) => {
    try {
      if (!(await store.deleteRoute(req.params.id))) return res.status(404).json({ error: 'Route not found' });
      network.invalidate();
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // Import an AM4 "active routes" CSV. mode=replace swaps the whole network; merge appends.
  r.post('/routes/import', async (req, res, next) => {
    try {
      const { csv, mode } = z.object({ csv: z.string().min(1).max(2_000_000), mode: z.enum(['replace', 'merge']) }).parse(req.body);
      const { routes, errors } = routesFromCsv(csv);
      const net = await network.get();
      const unknown = routes.filter((rt) => !net.byIcao.has(rt.from) || !net.byIcao.has(rt.to));
      for (const rt of unknown) errors.push(`${rt.flightNumber} ${rt.from}→${rt.to}: unknown airport, add it under Airports`);
      const valid = routes.filter((rt) => !unknown.includes(rt)).map((rt) => ({ id: newRouteId(), ...rt }));
      if (mode === 'replace') await store.replaceRoutes(valid);
      else for (const rt of valid) await store.createRoute(rt);
      network.invalidate();
      res.json({ imported: valid.length, skipped: errors.length, errors: errors.slice(0, 50) });
    } catch (err) {
      if (err instanceof z.ZodError || /CSV must have/.test(err.message)) return res.status(400).json({ error: err.message });
      next(err);
    }
  });

  r.get('/routes/export.csv', async (_req, res, next) => {
    try {
      const rows = (await store.listRoutes()).map((rt) =>
        [rt.from, rt.to, rt.flightNumber, AIRCRAFT[rt.aircraft]?.aliases[0] || rt.aircraft, rt.registration].map(csvCell).join(','),
      );
      res
        .type('text/csv')
        .set('Content-Disposition', 'attachment; filename="active_routes.csv"')
        .send(['Source Airport,Destination Airport,Route/Flight Number,Aircraft Type,Aircraft Registration Number', ...rows].join('\n'));
    } catch (err) {
      next(err);
    }
  });

  r.get('/airports', async (_req, res, next) => {
    try {
      const net = await network.get();
      res.json(net.airports);
    } catch (err) {
      next(err);
    }
  });

  r.post('/airports', async (req, res, next) => {
    try {
      const body = airportSchema.safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: body.error.issues[0].message });
      const net = await network.get();
      const clash = net.airports.find((a) => a.code === body.data.code && a.icao !== body.data.icao);
      if (clash) return res.status(409).json({ error: `IATA code ${body.data.code} is already used by ${clash.icao}` });
      const airport = await store.upsertAirport(body.data);
      network.invalidate();
      res.status(201).json(airport);
    } catch (err) {
      next(err);
    }
  });

  r.delete('/airports/:icao', async (req, res, next) => {
    try {
      const icaoCode = req.params.icao.toUpperCase();
      const inUse = (await store.listRoutes()).some((rt) => rt.from === icaoCode || rt.to === icaoCode);
      if (inUse) return res.status(409).json({ error: 'Airport is used by routes. Change or delete those routes first.' });
      if (!(await store.deleteAirport(icaoCode))) return res.status(404).json({ error: 'Only airports added by admins can be deleted' });
      network.invalidate();
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return r;
}
