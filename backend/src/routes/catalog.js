import { Router } from 'express';
import { AIRPORTS } from '../data/airports.js';
import { CABIN_INFO, fleetSummary } from '../data/fleet.js';
import { networkLinks } from '../data/network.js';
import { TIERS } from '../lib/loyalty.js';

export function catalogRoutes() {
  const r = Router();
  const cache = (res) => res.set('Cache-Control', 'public, max-age=3600');
  r.get('/airports', (_req, res) => cache(res).json(AIRPORTS));
  r.get('/network', (_req, res) => cache(res).json({ airports: AIRPORTS, links: networkLinks() }));
  r.get('/fleet', (_req, res) => cache(res).json({ aircraft: fleetSummary(), cabins: CABIN_INFO }));
  r.get('/loyalty/tiers', (_req, res) => cache(res).json(TIERS));
  return r;
}
