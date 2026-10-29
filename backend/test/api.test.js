import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { FLEET } from '../src/data/fleet.js';
import { ROUTES } from '../src/data/network.js';
import { syntheticOccupied, getFlight } from '../src/lib/schedule.js';
import { addDays } from '../src/lib/util.js';
import { createMemoryStore } from '../src/store/memory.js';

let server;
let base;
const date = addDays(new Date().toISOString().slice(0, 10), 21);

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

const payment = { cardNumber: '4242424242424242', expiry: '12/30', cvc: '123', holder: 'Asha Rao' };
const contact = { email: 'asha@example.com', phone: '+919876543210' };

function freeSeat(itineraryId, cabin, skip = []) {
  const [flightNo, d] = itineraryId.split('|')[0].split('_');
  const flight = getFlight(flightNo, d);
  const taken = new Set([...syntheticOccupied(flight, cabin), ...skip]);
  const { rows, blocks } = FLEET[flight.aircraft].cabins[cabin];
  for (let r = rows[0]; r <= rows[1]; r++) for (const b of blocks) for (const l of b) if (!taken.has(`${r}${l}`)) return `${r}${l}`;
}

before(async () => {
  const app = createApp(createMemoryStore(), { secret: 'test-secret', demoAuth: true });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

describe('network', () => {
  test('every route is within the aircraft range', () => {
    for (const r of ROUTES) assert.ok(r.km <= FLEET[r.aircraft].rangeKm, `${r.flightNo} ${r.from}-${r.to} ${r.km}km on ${r.aircraft}`);
  });

  test('flight numbers are unique', () => {
    assert.equal(new Set(ROUTES.map((r) => r.flightNo)).size, ROUTES.length);
  });
});

describe('search', () => {
  test('finds a nonstop Bengaluru → San Francisco flight', async () => {
    const { status, body } = await api(`/flights/search?from=BLR&to=SFO&date=${date}`);
    assert.equal(status, 200);
    assert.ok(body.results.some((r) => r.stops === 0));
  });

  test('connects via hubs when there is no direct flight', async () => {
    const { body } = await api(`/flights/search?from=GOI&to=ZQN&date=${date}`);
    assert.ok(body.results.length > 0);
    for (const r of body.results) {
      assert.ok(r.stops >= 1);
      for (let i = 1; i < r.legs.length; i++) assert.ok(r.legs[i].depUtc - r.legs[i - 1].arrUtc >= 70 * 60000);
    }
  });

  test('rejects bad input', async () => {
    assert.equal((await api(`/flights/search?from=BLR&to=BLR&date=${date}`)).status, 400);
    assert.equal((await api(`/flights/search?from=XXX&to=BLR&date=${date}`)).status, 400);
  });
});

describe('booking lifecycle', () => {
  let itineraryId;
  let seat;
  let token;
  let pnr;

  before(async () => {
    const { body } = await api(`/flights/search?from=BLR&to=DXB&date=${date}`);
    itineraryId = body.results.find((r) => r.stops === 0).id;
    seat = freeSeat(itineraryId, 'business');
    token = (await api('/auth/demo-login', { method: 'POST', body: { email: 'asha@example.com', name: 'Asha Rao' } })).body.token;
  });

  const passenger = (s) => ({ type: 'adult', title: 'Ms', firstName: 'Asha', lastName: 'Rao', dob: '1994-05-01', seats: [[s]] });

  test('creates a booking with a seat and earns miles when signed in', async () => {
    const { status, body } = await api('/bookings', {
      method: 'POST',
      token,
      body: { journeys: [{ itineraryId }], cabin: 'business', passengers: [passenger(seat)], contact, payment },
    });
    assert.equal(status, 201, JSON.stringify(body));
    assert.match(body.pnr, /^[A-Z2-9]{6}$/);
    assert.ok(body.milesEarned > 0);
    assert.equal(body.payment.last4, '4242');
    assert.equal(body.userId, undefined);
    pnr = body.pnr;
  });

  test('the same seat cannot be sold twice', async () => {
    const { status } = await api('/bookings', {
      method: 'POST',
      body: { journeys: [{ itineraryId }], cabin: 'business', passengers: [passenger(seat)], contact, payment },
    });
    assert.equal(status, 409);
  });

  test('seat map shows the sold seat as occupied', async () => {
    const [flightNo, d] = itineraryId.split('_');
    const { body } = await api(`/flights/${flightNo}/${d}/seats?cabin=business`);
    assert.ok(body.occupied.includes(seat));
  });

  test('declines invalid cards', async () => {
    const bad = { ...payment, cardNumber: '4242424242424241' };
    const res = await api('/bookings', {
      method: 'POST',
      body: { journeys: [{ itineraryId }], cabin: 'economy', passengers: [passenger(null)], contact, payment: bad },
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
    assert.equal(body.loyalty.current.id, 'blue');
    assert.equal((await api('/me')).status, 401);
  });

  test('cancelling frees the seat', async () => {
    const { status, body } = await api(`/bookings/${pnr}/cancel`, { method: 'POST', body: { lastName: 'Rao' } });
    assert.equal(status, 200);
    assert.equal(body.status, 'CANCELLED');
    const [flightNo, d] = itineraryId.split('_');
    const seats = await api(`/flights/${flightNo}/${d}/seats?cabin=business`);
    assert.ok(!seats.body.occupied.includes(seat));
    assert.equal((await api(`/bookings/${pnr}/cancel`, { method: 'POST', body: { lastName: 'Rao' } })).status, 409);
  });
});
