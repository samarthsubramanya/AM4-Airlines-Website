import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { cabinSeats } from '../data/fleet.js';
import { milesForLegs } from '../lib/loyalty.js';
import { newPnr, newTicketNumber } from '../lib/pnr.js';
import { priceItinerary } from '../lib/pricing.js';
import { resolveItinerary, syntheticOccupied } from '../lib/schedule.js';
import { SeatTakenError } from '../store/errors.js';

const name = z.string().trim().min(1).max(40).regex(/^[\p{L}' .-]+$/u, 'Use letters only');
const seatId = z.string().regex(/^\d{1,2}[A-K]$/);

const passengerSchema = z.object({
  type: z.enum(['adult', 'child']),
  title: z.enum(['Mr', 'Ms', 'Mrs', 'Mx', 'Dr', 'Mstr', 'Miss']).optional(),
  firstName: name,
  lastName: name,
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // One seat per leg of each journey, or null to have one assigned at check-in.
  seats: z.array(z.array(seatId.nullable())).default([]),
});

const bookingSchema = z.object({
  journeys: z.array(z.object({ itineraryId: z.string().max(200) })).min(1).max(2),
  cabin: z.enum(['economy', 'business', 'first']),
  passengers: z.array(passengerSchema).min(1).max(9),
  contact: z.object({ email: z.string().email().max(120), phone: z.string().trim().min(6).max(20) }),
  payment: z.object({
    cardNumber: z.string().regex(/^\d{13,19}$/),
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
    cvc: z.string().regex(/^\d{3,4}$/),
    holder: z.string().trim().min(2).max(60),
  }),
});

function luhn(num) {
  let sum = 0;
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i]);
    if (i % 2) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function cardBrand(num) {
  if (/^4/.test(num)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'Mastercard';
  if (/^3[47]/.test(num)) return 'Amex';
  if (/^(60|65|81|82|508)/.test(num)) return 'RuPay';
  return 'Card';
}

function cardExpired(expiry) {
  const [mm, yy] = expiry.split('/').map(Number);
  const now = new Date();
  return 2000 + yy < now.getUTCFullYear() || (2000 + yy === now.getUTCFullYear() && mm < now.getUTCMonth() + 1);
}

/** Public view: hide the user id; everything else is fine to show to the PNR holder. */
const publicBooking = ({ userId, ...b }) => b;

const lastNameMatches = (booking, lastName) =>
  booking.passengers.some((p) => p.lastName.toLowerCase() === String(lastName || '').trim().toLowerCase());

export function bookingRoutes(store, network) {
  const r = Router();
  const createLimiter = rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
  const lookupLimiter = rateLimit({ windowMs: 15 * 60000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false });

  r.post('/', createLimiter, async (req, res, next) => {
    try {
      const parsed = bookingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Please check your details', details: parsed.error.issues });
      const { journeys, cabin, passengers, contact, payment } = parsed.data;

      if (!luhn(payment.cardNumber)) return res.status(402).json({ error: 'Card number is invalid' });
      if (cardExpired(payment.expiry)) return res.status(402).json({ error: 'Card has expired' });
      // Demo decline card so the failure path can be shown.
      if (payment.cardNumber === '4000000000000002') return res.status(402).json({ error: 'Your card was declined' });

      const net = await network.get();
      const resolved = journeys.map((j) => resolveItinerary(net, j.itineraryId));
      if (resolved.some((legs) => !legs)) return res.status(400).json({ error: 'That flight is no longer available' });
      if (resolved[0][0].depUtc < Date.now() + 60 * 60000) return res.status(400).json({ error: 'This flight has closed for booking' });
      if (resolved[1] && resolved[1][0].depUtc < resolved[0].at(-1).arrUtc + 2 * 3600000) {
        return res.status(400).json({ error: 'Return flight must depart after you arrive' });
      }
      const adults = passengers.filter((p) => p.type === 'adult').length;
      const children = passengers.length - adults;
      if (!adults) return res.status(400).json({ error: 'At least one adult must travel' });

      // Seats: validate each requested seat exists, isn't shown as occupied, and isn't picked twice.
      const claims = [];
      for (const [j, legs] of resolved.entries()) {
        for (const [l, leg] of legs.entries()) {
          const valid = new Set(cabinSeats(leg.aircraft, cabin));
          if (!valid.size) return res.status(400).json({ error: `No ${cabin} cabin on ${leg.flightNo}` });
          const blocked = new Set(syntheticOccupied(leg, cabin));
          const chosen = new Set();
          for (const p of passengers) {
            const seat = p.seats?.[j]?.[l];
            if (!seat) continue;
            if (!valid.has(seat) || blocked.has(seat) || chosen.has(seat)) {
              return res.status(409).json({ error: `Seat ${seat} on ${leg.flightNo} is not available` });
            }
            chosen.add(seat);
            claims.push({ key: leg.key, seat, cabin });
          }
        }
      }

      const fares = resolved.map((legs) => priceItinerary(legs, cabin, { adults, children }));
      const sum = (k) => fares.reduce((s, f) => s + f[k], 0);
      const allLegs = resolved.flat();
      const booking = {
        pnr: newPnr(),
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        userId: req.user?.id || null,
        cabin,
        journeys: resolved.map((legs) => ({ legs })),
        passengers: passengers.map((p) => ({ ...p, ticketNumber: newTicketNumber() })),
        contact,
        fare: { currency: fares[0].currency, base: sum('base'), taxes: sum('taxes'), total: sum('total') },
        payment: { brand: cardBrand(payment.cardNumber), last4: payment.cardNumber.slice(-4), holder: payment.holder },
        milesEarned: req.user ? milesForLegs(allLegs, cabin, passengers.length) : 0,
      };

      for (let attempt = 0; ; attempt++) {
        try {
          await store.createBooking(booking, claims);
          break;
        } catch (err) {
          if (err.message === 'PNR collision' && attempt < 3) booking.pnr = newPnr();
          else throw err;
        }
      }
      res.status(201).json(publicBooking(booking));
    } catch (err) {
      if (err instanceof SeatTakenError) return res.status(409).json({ error: err.message });
      next(err);
    }
  });

  r.get('/:pnr', lookupLimiter, async (req, res, next) => {
    try {
      const booking = await store.getBooking(req.params.pnr.toUpperCase());
      const owner = booking && req.user && booking.userId === req.user.id;
      if (!booking || (!owner && !lastNameMatches(booking, req.query.lastName))) {
        return res.status(404).json({ error: 'No booking found with that reference and last name' });
      }
      res.json(publicBooking(booking));
    } catch (err) {
      next(err);
    }
  });

  r.post('/:pnr/cancel', lookupLimiter, async (req, res, next) => {
    try {
      const pnr = req.params.pnr.toUpperCase();
      const booking = await store.getBooking(pnr);
      const owner = booking && req.user && booking.userId === req.user.id;
      if (!booking || (!owner && !lastNameMatches(booking, req.body?.lastName))) {
        return res.status(404).json({ error: 'No booking found with that reference and last name' });
      }
      if (booking.status === 'CANCELLED') return res.status(409).json({ error: 'Booking is already cancelled' });
      if (booking.journeys[0].legs[0].depUtc < Date.now()) return res.status(409).json({ error: 'This trip has already started' });
      res.json(publicBooking(await store.cancelBooking(pnr)));
    } catch (err) {
      next(err);
    }
  });

  return r;
}
