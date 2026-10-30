import { MongoClient } from 'mongodb';
import { seedRoutes } from '../data/seed.js';
import { SeatTakenError } from './errors.js';

// MongoDB store (Atlas free tier works fine). Seats live in their own
// collection with a unique (key, seat) index, so two people can never
// be sold the same seat even under concurrent requests.
export async function createMongoStore(uri, dbName = 'indiancom') {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const bookings = db.collection('bookings');
  const seats = db.collection('seats');
  const routes = db.collection('routes');
  const airports = db.collection('airports');
  const meta = db.collection('meta');
  await Promise.all([
    routes.createIndex({ id: 1 }, { unique: true }),
    airports.createIndex({ icao: 1 }, { unique: true }),
    bookings.createIndex({ pnr: 1 }, { unique: true }),
    bookings.createIndex({ userId: 1, createdAt: -1 }),
    seats.createIndex({ key: 1, seat: 1 }, { unique: true }),
    seats.createIndex({ pnr: 1 }),
  ]);

  // First boot: load the routes from the AM4 export. Afterwards admins own the data,
  // so an intentionally empty network isn't re-seeded.
  const seeded = await meta.findOneAndUpdate({ _id: 'seed' }, { $setOnInsert: { at: new Date() } }, { upsert: true, returnDocument: 'before' });
  if (!seeded) await routes.insertMany(seedRoutes());

  const strip = (doc) => {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return rest;
  };

  return {
    kind: 'mongo',

    async listRoutes() {
      return (await routes.find({}).sort({ id: 1 }).toArray()).map(strip);
    },
    async createRoute(route) {
      await routes.insertOne({ ...route });
      return route;
    },
    async updateRoute(id, patch) {
      return strip(await routes.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: 'after' }));
    },
    async deleteRoute(id) {
      return (await routes.deleteOne({ id })).deletedCount > 0;
    },
    async replaceRoutes(next) {
      await routes.deleteMany({});
      if (next.length) await routes.insertMany(next.map((r) => ({ ...r })));
    },

    async listAirports() {
      return (await airports.find({}).toArray()).map(strip);
    },
    async upsertAirport(airport) {
      await airports.replaceOne({ icao: airport.icao }, { ...airport }, { upsert: true });
      return airport;
    },
    async deleteAirport(icao) {
      return (await airports.deleteOne({ icao })).deletedCount > 0;
    },

    async createBooking(booking, seatClaims) {
      if (seatClaims.length) {
        try {
          await seats.insertMany(seatClaims.map((c) => ({ ...c, pnr: booking.pnr })), { ordered: true });
        } catch (err) {
          await seats.deleteMany({ pnr: booking.pnr });
          if (err.code === 11000) {
            const dup = err.writeErrors?.map((e) => e.err?.op ?? e.getOperation?.()).filter(Boolean) || [];
            throw new SeatTakenError(dup.length ? dup.map((d) => `${d.seat} on ${d.key}`) : ['selected seat']);
          }
          throw err;
        }
      }
      try {
        await bookings.insertOne({ ...booking });
      } catch (err) {
        await seats.deleteMany({ pnr: booking.pnr });
        throw err;
      }
      return booking;
    },

    async getBooking(pnr) {
      return strip(await bookings.findOne({ pnr }));
    },

    async cancelBooking(pnr) {
      const res = await bookings.findOneAndUpdate(
        { pnr },
        { $set: { status: 'CANCELLED', cancelledAt: new Date().toISOString() } },
        { returnDocument: 'after' },
      );
      if (res) await seats.deleteMany({ pnr });
      return strip(res);
    },

    async listBookingsByUser(userId) {
      return (await bookings.find({ userId }).sort({ createdAt: -1 }).limit(100).toArray()).map(strip);
    },

    async occupiedSeats(flightKey) {
      return (await seats.find({ key: flightKey }, { projection: { seat: 1 } }).toArray()).map((s) => s.seat);
    },

    async bookedCounts(flightKeys) {
      if (!flightKeys.length) return {};
      const rows = await seats
        .aggregate([{ $match: { key: { $in: flightKeys } } }, { $group: { _id: { key: '$key', cabin: '$cabin' }, n: { $sum: 1 } } }])
        .toArray();
      return Object.fromEntries(rows.map((r) => [`${r._id.key}:${r._id.cabin}`, r.n]));
    },
  };
}
