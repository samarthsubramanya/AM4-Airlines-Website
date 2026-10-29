import { MongoClient } from 'mongodb';
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
  await Promise.all([
    bookings.createIndex({ pnr: 1 }, { unique: true }),
    bookings.createIndex({ userId: 1, createdAt: -1 }),
    seats.createIndex({ key: 1, seat: 1 }, { unique: true }),
    seats.createIndex({ pnr: 1 }),
  ]);

  const strip = (doc) => {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return rest;
  };

  return {
    kind: 'mongo',

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
