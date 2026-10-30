import { seedRoutes } from '../data/seed.js';
import { SeatTakenError } from './errors.js';

// In-memory store, used when MONGODB_URI isn't set (local dev, tests, demos).
export function createMemoryStore({ routes: initialRoutes = seedRoutes() } = {}) {
  const bookings = new Map();
  const seats = new Map(); // "<flightKey>:<seat>" -> { pnr, cabin }
  let routes = initialRoutes.map((r) => ({ ...r }));
  const airports = new Map(); // custom airports added by admins, by ICAO

  return {
    kind: 'memory',

    async listRoutes() {
      return routes.map((r) => ({ ...r }));
    },
    async createRoute(route) {
      routes.push({ ...route });
      return { ...route };
    },
    async updateRoute(id, patch) {
      const r = routes.find((x) => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      return { ...r };
    },
    async deleteRoute(id) {
      const before = routes.length;
      routes = routes.filter((r) => r.id !== id);
      return routes.length < before;
    },
    async replaceRoutes(next) {
      routes = next.map((r) => ({ ...r }));
    },

    async listAirports() {
      return [...airports.values()].map((a) => ({ ...a }));
    },
    async upsertAirport(airport) {
      airports.set(airport.icao, { ...airport });
      return { ...airport };
    },
    async deleteAirport(icao) {
      return airports.delete(icao);
    },

    async createBooking(booking, seatClaims) {
      const taken = seatClaims.filter((c) => seats.has(`${c.key}:${c.seat}`)).map((c) => `${c.seat} on ${c.key}`);
      if (taken.length) throw new SeatTakenError(taken);
      if (bookings.has(booking.pnr)) throw new Error('PNR collision');
      for (const c of seatClaims) seats.set(`${c.key}:${c.seat}`, { pnr: booking.pnr, cabin: c.cabin });
      bookings.set(booking.pnr, structuredClone(booking));
      return booking;
    },

    async getBooking(pnr) {
      const b = bookings.get(pnr);
      return b ? structuredClone(b) : null;
    },

    async cancelBooking(pnr) {
      const b = bookings.get(pnr);
      if (!b) return null;
      b.status = 'CANCELLED';
      b.cancelledAt = new Date().toISOString();
      for (const [k, v] of seats) if (v.pnr === pnr) seats.delete(k);
      return structuredClone(b);
    },

    async listBookingsByUser(userId) {
      return [...bookings.values()]
        .filter((b) => b.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((b) => structuredClone(b));
    },

    async occupiedSeats(flightKey) {
      const out = [];
      for (const [k] of seats) if (k.startsWith(`${flightKey}:`)) out.push(k.slice(flightKey.length + 1));
      return out;
    },

    async bookedCounts(flightKeys) {
      const wanted = new Set(flightKeys);
      const counts = {};
      for (const [k, v] of seats) {
        const flightKey = k.slice(0, k.lastIndexOf(':'));
        if (wanted.has(flightKey)) counts[`${flightKey}:${v.cabin}`] = (counts[`${flightKey}:${v.cabin}`] || 0) + 1;
      }
      return counts;
    },
  };
}
