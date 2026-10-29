import { Router } from 'express';
import { z } from 'zod';
import { AIRPORT_BY_CODE } from '../data/airports.js';
import { FLEET, cabinSeats } from '../data/fleet.js';
import { getFlight, searchItineraries, syntheticOccupied } from '../lib/schedule.js';
import { DATE_RE } from '../lib/util.js';

const searchSchema = z.object({
  from: z.string().length(3).transform((s) => s.toUpperCase()),
  to: z.string().length(3).transform((s) => s.toUpperCase()),
  date: z.string().regex(DATE_RE),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  children: z.coerce.number().int().min(0).max(8).default(0),
});

export function flightRoutes(store) {
  const r = Router();

  r.get('/search', async (req, res, next) => {
    try {
      const q = searchSchema.safeParse(req.query);
      if (!q.success) return res.status(400).json({ error: 'Invalid search', details: q.error.issues });
      const { from, to } = q.data;
      if (!AIRPORT_BY_CODE[from] || !AIRPORT_BY_CODE[to]) return res.status(400).json({ error: 'Unknown airport' });
      if (from === to) return res.status(400).json({ error: 'Origin and destination must differ' });
      if (q.data.adults + q.data.children > 9) return res.status(400).json({ error: 'Maximum 9 passengers per booking' });
      const results = await searchItineraries(q.data, (keys) => store.bookedCounts(keys));
      res.json({ query: q.data, results });
    } catch (err) {
      next(err);
    }
  });

  r.get('/:flightNo/:date/seats', async (req, res, next) => {
    try {
      const { flightNo, date } = req.params;
      const cabin = String(req.query.cabin || 'economy');
      if (!DATE_RE.test(date)) return res.status(400).json({ error: 'Invalid date' });
      const flight = getFlight(flightNo.toUpperCase(), date);
      if (!flight) return res.status(404).json({ error: 'Flight not found' });
      const layout = FLEET[flight.aircraft].cabins[cabin];
      if (!layout) return res.status(400).json({ error: `No ${cabin} cabin on this aircraft` });
      const occupied = new Set([...syntheticOccupied(flight, cabin), ...(await store.occupiedSeats(flight.key))]);
      const seats = cabinSeats(flight.aircraft, cabin);
      res.json({
        flight,
        cabin,
        layout,
        occupied: seats.filter((s) => occupied.has(s)),
        // Exit rows: first row of economy gets extra legroom.
        extraLegroom: cabin === 'economy' ? seats.filter((s) => parseInt(s, 10) === layout.rows[0]) : [],
      });
    } catch (err) {
      next(err);
    }
  });

  return r;
}
