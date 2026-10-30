import { Router } from 'express';
import { AIRLINES, ALLIANCE } from '../data/airlines.js';
import { CABIN_INFO, aircraftSummary } from '../data/fleet.js';
import { TIERS } from '../lib/loyalty.js';
import { networkLinks } from '../lib/schedule.js';

export function catalogRoutes(network) {
  const r = Router();
  const cache = (res, s = 300) => res.set('Cache-Control', `public, max-age=${s}`);

  r.get('/airports', async (_req, res, next) => {
    try {
      const net = await network.get();
      cache(res).json(net.airports.map(({ custom, ...a }) => a));
    } catch (err) {
      next(err);
    }
  });

  r.get('/network', async (_req, res, next) => {
    try {
      const net = await network.get();
      const links = networkLinks(net);
      const served = new Set(links.flatMap((l) => [l.from, l.to]));
      cache(res).json({ airports: net.airports.filter((a) => served.has(a.code)), links, airlines: AIRLINES });
    } catch (err) {
      next(err);
    }
  });

  r.get('/fleet', async (_req, res, next) => {
    try {
      const links = networkLinks(await network.get());
      const regs = {};
      for (const l of links) (regs[l.aircraft] ||= new Set()).add(l.registration);
      const aircraft = aircraftSummary()
        .filter((a) => regs[a.code])
        .map((a) => ({ ...a, count: regs[a.code].size, routes: links.filter((l) => l.aircraft === a.code).length }));
      cache(res).json({ aircraft, cabins: CABIN_INFO });
    } catch (err) {
      next(err);
    }
  });

  r.get('/airlines', (_req, res) => cache(res, 3600).json({ airlines: AIRLINES, alliance: ALLIANCE }));
  r.get('/loyalty/tiers', (_req, res) => cache(res, 3600).json(TIERS));
  return r;
}
