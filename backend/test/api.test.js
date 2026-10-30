import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { AIRCRAFT, cabinSeats } from '../src/data/fleet.js';
import { seedRoutes } from '../src/data/seed.js';
import { syntheticOccupied } from '../src/lib/schedule.js';
import { addDays } from '../src/lib/util.js';
import { createMemoryStore } from '../src/store/memory.js';

let server;
let base;
const today = new Date().toISOString().slice(0, 10);
const date = addDays(today, 21);

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text && res.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text };
}

/** First date in the next two weeks with an own-metal nonstop from → to. */
async function findNonstop(from, to) {
  for (let i = 14; i < 28; i++) {
    const d = addDays(today, i);
    const { body } = await api(`/flights/search?from=${from}&to=${to}&date=${d}`);
    const it = body.results.find((r) => r.stops === 0 && !r.codeshare);
    if (it) return it;
  }
  throw new Error(`no nonstop ${from}-${to}`);
}

function freeSeat(leg, cabin, skip = []) {
  const taken = new Set([...syntheticOccupied(leg, cabin), ...skip]);
  return cabinSeats(leg.aircraft, cabin).find((s) => !taken.has(s));
}

const payment = { cardNumber: '4242424242424242', expiry: '12/30', cvc: '123', holder: 'Asha Rao' };
const contact = { email: 'asha@example.com', phone: '+919876543210' };
const passenger = (s) => ({ type: 'adult', title: 'Ms', firstName: 'Asha', lastName: 'Rao', dob: '1994-05-01', seats: [[s]] });

before(async () => {
  const app = createApp(createMemoryStore(), { secret: 'test-secret', demoAuth: true, adminPassword: 'pw' });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

describe('network from the AM4 export', () => {
  test('every CSV row maps to a known aircraft and airport', async () => {
    const routes = seedRoutes();
    assert.equal(routes.length, 176);
    const { body } = await api('/network');
    assert.equal(body.links.length, 176);
    const codes = new Set(body.airports.map((a) => a.icao));
    for (const r of routes) assert.ok(codes.has(r.from) && codes.has(r.to), `${r.from}-${r.to}`);
  });

  test('India routes are Indian.com, others Indus Air; freighters are cargo', async () => {
    const { body } = await api('/network');
    const byCode = Object.fromEntries(body.airports.map((a) => [a.code, a]));
    for (const l of body.links) {
      const india = byCode[l.from].country === 'India' || byCode[l.to].country === 'India';
      assert.equal(l.operator, india ? 'IN' : 'IS');
      assert.equal(l.cargo, ['B748F', 'A35F'].includes(l.aircraft));
    }
  });
});

describe('search', () => {
  test('finds our own Delhi → Tokyo Haneda nonstop', async () => {
    const it = await findNonstop('DEL', 'HND');
    assert.match(it.legs[0].flightNo, /^IN \d+$/);
    assert.ok(it.legs[0].registration);
  });

  test('any pair gets results through alliance partners', async () => {
    for (const [a, b] of [['LHR', 'JFK'], ['GOX', 'EZE'], ['ZQN', 'KEF']]) {
      const { body } = await api(`/flights/search?from=${a}&to=${b}&date=${date}`);
      assert.ok(body.results.length > 0, `${a}-${b}`);
      assert.ok(body.results.every((r) => r.legs.every((l, i) => i === 0 || l.depUtc - r.legs[i - 1].arrUtc >= 70 * 60000)));
    }
  });

  test('freighters never carry passengers', async () => {
    // VOBL-YSSY is a 747-8F in the export.
    const { body } = await api(`/flights/search?from=BLR&to=SYD&date=${date}`);
    assert.ok(body.results.every((r) => r.legs.every((l) => !AIRCRAFT[l.aircraft].category.includes('Freighter'))));
  });

  test('rejects bad input', async () => {
    assert.equal((await api(`/flights/search?from=BLR&to=BLR&date=${date}`)).status, 400);
    assert.equal((await api(`/flights/search?from=XXX&to=BLR&date=${date}`)).status, 400);
  });
});

describe('booking lifecycle', () => {
  let it;
  let seat;
  let token;
  let pnr;

  before(async () => {
    it = await findNonstop('DEL', 'HND');
    seat = freeSeat(it.legs[0], 'business');
    token = (await api('/auth/demo-login', { method: 'POST', body: { email: 'asha@example.com', name: 'Asha Rao' } })).body.token;
  });

  test('creates a booking with a seat and earns miles when signed in', async () => {
    const { status, body } = await api('/bookings', {
      method: 'POST',
      token,
      body: { journeys: [{ itineraryId: it.id }], cabin: 'business', passengers: [passenger(seat)], contact, payment },
    });
    assert.equal(status, 201, JSON.stringify(body));
    assert.match(body.pnr, /^[A-Z2-9]{6}$/);
    assert.ok(body.milesEarned > 0);
    assert.equal(body.userId, undefined);
    pnr = body.pnr;
  });

  test('the same seat cannot be sold twice', async () => {
    const { status } = await api('/bookings', {
      method: 'POST',
      body: { journeys: [{ itineraryId: it.id }], cabin: 'business', passengers: [passenger(seat)], contact, payment },
    });
    assert.equal(status, 409);
  });

  test('seat map shows the aircraft layout and the sold seat', async () => {
    const { body } = await api(`/flights/${it.legs[0].key}/seats?cabin=business`);
    assert.ok(body.occupied.includes(seat));
    assert.equal(body.aircraft.code, it.legs[0].aircraft);
  });

  test('codeshare itineraries can be booked too', async () => {
    const { body } = await api(`/flights/search?from=LHR&to=JFK&date=${date}`);
    const cs = body.results[0];
    const res = await api('/bookings', {
      method: 'POST',
      body: { journeys: [{ itineraryId: cs.id }], cabin: 'economy', passengers: [passenger(null)], contact, payment },
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.journeys[0].legs[0].partner, true);
  });

  test('declines invalid cards', async () => {
    const res = await api('/bookings', {
      method: 'POST',
      body: { journeys: [{ itineraryId: it.id }], cabin: 'economy', passengers: [passenger(null)], contact, payment: { ...payment, cardNumber: '4242424242424241' } },
    });
    assert.equal(res.status, 402);
  });

  test('lookup requires the right last name', async () => {
    assert.equal((await api(`/bookings/${pnr}?lastName=Smith`)).status, 404);
    assert.equal((await api(`/bookings/${pnr}?lastName=rao`)).status, 200);
  });

  test('account shows the booking and pending miles', async () => {
    const { status, body } = await api('/me', { token });
    assert.equal(status, 200);
    assert.equal(body.bookings.length, 1);
    assert.ok(body.loyalty.pending > 0);
    assert.equal((await api('/me')).status, 401);
  });

  test('cancelling frees the seat', async () => {
    const { status, body } = await api(`/bookings/${pnr}/cancel`, { method: 'POST', body: { lastName: 'Rao' } });
    assert.equal(status, 200);
    assert.equal(body.status, 'CANCELLED');
    const seats = await api(`/flights/${it.legs[0].key}/seats?cabin=business`);
    assert.ok(!seats.body.occupied.includes(seat));
  });
});

describe('admin', () => {
  let admin;
  let user;

  before(async () => {
    admin = (await api('/admin/login', { method: 'POST', body: { password: 'pw' } })).body.token;
    user = (await api('/auth/demo-login', { method: 'POST', body: { email: 'admin@indian.com', name: 'Sneaky' } })).body.token;
  });

  test('requires the admin password', async () => {
    assert.equal((await api('/admin/login', { method: 'POST', body: { password: 'nope' } })).status, 401);
    assert.equal((await api('/admin/routes')).status, 401);
    assert.equal((await api('/admin/routes', { token: user })).status, 403);
  });

  test('add, edit and delete a route; search reflects it immediately', async () => {
    const created = await api('/admin/routes', {
      method: 'POST',
      token: admin,
      body: { from: 'VOBL', to: 'VIDP', flightNumber: '#IN-0001', aircraft: 'A320-200', registration: 'VT-NEW' },
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.aircraft, 'A320');

    // A320 BLR-DEL fits many rotations a day, so it runs daily.
    const s1 = await api(`/flights/search?from=BLR&to=DEL&date=${date}`);
    assert.ok(s1.body.results.some((r) => !r.codeshare && r.legs[0].registration === 'VT-NEW'));

    const edited = await api(`/admin/routes/${created.body.id}`, {
      method: 'PUT',
      token: admin,
      body: { from: 'VOBL', to: 'VIDP', flightNumber: '#IN-0001', aircraft: 'B748F', registration: 'VT-NEW' },
    });
    assert.equal(edited.status, 200);
    const s2 = await api(`/flights/search?from=BLR&to=DEL&date=${date}`);
    assert.ok(!s2.body.results.some((r) => r.legs[0].registration === 'VT-NEW'), 'freighter no longer bookable');

    assert.equal((await api(`/admin/routes/${created.body.id}`, { method: 'DELETE', token: admin })).status, 204);
    assert.equal((await api(`/admin/routes/${created.body.id}`, { method: 'DELETE', token: admin })).status, 404);
  });

  test('validates routes', async () => {
    const bad = (body) => api('/admin/routes', { method: 'POST', token: admin, body });
    assert.equal((await bad({ from: 'VOBL', to: 'ZZZZ', flightNumber: '1', aircraft: 'A320', registration: 'x' })).status, 400);
    assert.equal((await bad({ from: 'VOBL', to: 'VIDP', flightNumber: '1', aircraft: 'Concorde', registration: 'x' })).status, 400);
  });

  test('custom airports can be added and then used', async () => {
    const ap = await api('/admin/airports', {
      method: 'POST',
      token: admin,
      body: { icao: 'VOMY', code: 'MYQ', name: 'Mysuru Airport', city: 'Mysuru', country: 'India', lat: 12.23, lon: 76.656, tz: 'Asia/Kolkata' },
    });
    assert.equal(ap.status, 201, JSON.stringify(ap.body));
    const rt = await api('/admin/routes', { method: 'POST', token: admin, body: { from: 'VOMY', to: 'VOBL', flightNumber: '#IN-900', aircraft: 'A320', registration: 'VT-MYQ' } });
    assert.equal(rt.status, 201);
    assert.equal((await api('/admin/airports/VOMY', { method: 'DELETE', token: admin })).status, 409);
  });

  test('CSV export and re-import round-trips', async () => {
    const csv = (await api('/admin/routes/export.csv', { token: admin })).body;
    assert.match(csv, /^Source Airport,/);
    const res = await api('/admin/routes/import', { method: 'POST', token: admin, body: { csv, mode: 'replace' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.imported, csv.trim().split('\n').length - 1);
  });
});
