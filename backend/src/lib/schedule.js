import { AIRCRAFT, cabinCapacity, cabinSeats, isCargo } from '../data/fleet.js';
import { flightDigits, operatorFor, partnerFor } from '../data/airlines.js';
import { regionOf } from '../data/airports.js';
import { addDays, distanceKm, hash, localDate, rand, zonedToUtc } from './util.js';
import { priceItinerary } from './pricing.js';

const TAXI_MIN = 30;
const TURNAROUND_MIN = 75;
const MIN_CONNECTION_MIN = 70;
const MAX_CONNECTION_MIN = 16 * 60;
const MAX_LEGS = 3;
const PARTNER_MAX_KM = 15500;

export function blockMinutes(km, aircraft) {
  const speed = AIRCRAFT[aircraft].cruiseKmh * 0.92;
  return Math.round(((km / speed) * 60 + TAXI_MIN) / 5) * 5;
}

const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

/**
 * Turn stored routes into a bookable network. Each route is flown by one aircraft as a
 * round trip: outbound from `from`, then back from `to` after a turnaround. How often it
 * runs depends on how many rotations that aircraft fits in a week (AM4-style).
 */
export function buildNetwork(routes, airports) {
  const byIcao = new Map(airports.map((a) => [a.icao, a]));
  const byCode = new Map(airports.map((a) => [a.code, a]));
  const services = [];
  const problems = [];

  for (const r of routes) {
    const A = byIcao.get(r.from);
    const B = byIcao.get(r.to);
    if (!A || !B || !AIRCRAFT[r.aircraft]) {
      problems.push({ id: r.id, reason: !AIRCRAFT[r.aircraft] ? 'unknown aircraft' : 'unknown airport' });
      continue;
    }
    const km = distanceKm(A, B);
    const block = blockMinutes(km, r.aircraft);
    const cycle = 2 * block + 2 * TURNAROUND_MIN;
    const perWeek = Math.max(1, Math.min(14, Math.floor((7 * 1440) / cycle)));
    const twiceDaily = perWeek >= 14;
    const latestFirst = twiceDaily ? 1440 - cycle : 1380;
    const dep = 300 + (hash(`${r.id}:dep`) % Math.max(60, latestFirst - 300));
    const slots = (twiceDaily ? [dep, dep + cycle] : [dep]).map((m) => Math.round(m / 5) * 5 % 1440);
    const offset = hash(`${r.id}:days`) % 7;
    const days = perWeek >= 7 ? [0, 1, 2, 3, 4, 5, 6] : Array.from({ length: perWeek }, (_, i) => (offset + Math.floor((i * 7) / perWeek)) % 7);
    const operator = operatorFor(A, B);
    const base = {
      routeId: r.id, km, block, aircraft: r.aircraft, registration: r.registration, operator,
      flightNo: `${operator} ${flightDigits(r.flightNumber)}`, cargo: isCargo(r.aircraft), slots, days: [...new Set(days)].sort(),
      weeklyFlights: twiceDaily ? 14 : Math.min(7, perWeek),
    };
    services.push({ ...base, id: `${r.id}.o`, dir: 'o', from: A.code, to: B.code });
    services.push({ ...base, id: `${r.id}.r`, dir: 'r', from: B.code, to: A.code });
  }

  const from = new Map();
  const into = new Map();
  for (const s of services) {
    if (s.cargo) continue;
    (from.get(s.from) || from.set(s.from, []).get(s.from)).push(s);
    (into.get(s.to) || into.set(s.to, []).get(s.to)).push(s);
  }
  return { airports, byIcao, byCode, services, serviceById: new Map(services.map((s) => [s.id, s])), from, into, problems };
}

function legFrom(s, key, date, depUtc) {
  return {
    key, flightNo: s.flightNo, operator: s.operator, partner: false, routeId: s.routeId,
    date, from: s.from, to: s.to, depUtc, arrUtc: depUtc + s.block * 60000, durationMin: s.block,
    km: s.km, aircraft: s.aircraft, aircraftName: AIRCRAFT[s.aircraft].name, registration: s.registration,
  };
}

/** Outbound instance(s) of route service `s` (dir "o") on its origin-local `date`. */
function outboundOn(net, s, date) {
  if (!s.days.includes(weekday(date))) return [];
  const tz = net.byCode.get(s.from).tz;
  return s.slots.map((min, i) => legFrom(s, `${s.routeId}.o${i}_${date}`, date, zonedToUtc(date, min, tz)));
}

/** Return instance flown after outbound slot `i` of `outDate`. */
function returnAfter(net, s, outDate, i) {
  const out = net.serviceById.get(`${s.routeId}.o`);
  const [o] = outboundOn(net, out, outDate).filter((_, j) => j === i);
  if (!o) return null;
  const depUtc = o.arrUtc + TURNAROUND_MIN * 60000;
  return legFrom(s, `${s.routeId}.r${i}_${outDate}`, localDate(depUtc, net.byCode.get(s.from).tz), depUtc);
}

/** All instances of service `s` departing on origin-local `date`. */
export function departuresOn(net, s, date) {
  if (s.dir === 'o') return outboundOn(net, s, date);
  const tz = net.byCode.get(s.from).tz;
  const out = [];
  for (const d of [addDays(date, -2), addDays(date, -1), date]) {
    s.slots.forEach((_, i) => {
      const leg = returnAfter(net, s, d, i);
      if (leg && localDate(leg.depUtc, tz) === date) out.push(leg);
    });
  }
  return out;
}

// ---- Alliance partner flights (generated for any pair, daily) ----

function partnerAircraft(km) {
  if (km <= 3500) return 'A320';
  if (km <= 12000) return 'A338';
  return 'A359U';
}

function partnerLeg(net, fromCode, toCode, date, slot) {
  const A = net.byCode.get(fromCode);
  const B = net.byCode.get(toCode);
  if (!A || !B) return null;
  const km = distanceKm(A, B);
  if (km > PARTNER_MAX_KM || slot >= (km < 4000 ? 2 : 1)) return null;
  const operator = partnerFor(regionOf(A), regionOf(B));
  const aircraft = partnerAircraft(km);
  const pair = `${fromCode}-${toCode}`;
  const minutes = (Math.round((330 + (hash(`${pair}:p`) % 780)) / 5) * 5 + slot * 420) % 1440;
  const depUtc = zonedToUtc(date, minutes, A.tz);
  const block = blockMinutes(km, aircraft);
  return {
    key: `P.${pair}.${slot}_${date}`, flightNo: `${operator} ${100 + (hash(pair) % 8900) * 2 + slot}`, operator, partner: true, routeId: null,
    date, from: fromCode, to: toCode, depUtc, arrUtc: depUtc + block * 60000, durationMin: block,
    km, aircraft, aircraftName: AIRCRAFT[aircraft].name, registration: null,
  };
}

const partnerDepartures = (net, a, b, date) => [0, 1].map((s) => partnerLeg(net, a, b, date, s)).filter(Boolean);

/** Earliest instance among `candidates(date)` leaving within the connection window after `afterUtc`. */
function nextConnection(afterUtc, tz, candidates) {
  let best = null;
  const day = localDate(afterUtc, tz);
  for (const d of [day, addDays(day, 1)]) {
    for (const f of candidates(d)) {
      const gap = (f.depUtc - afterUtc) / 60000;
      if (gap >= MIN_CONNECTION_MIN && gap <= MAX_CONNECTION_MIN && (!best || f.depUtc < best.depUtc)) best = f;
    }
  }
  return best;
}

/** Resolve a leg key (own route or partner) back into a flight. */
export function resolveLeg(net, key) {
  let m = /^P\.([A-Z0-9]{3})-([A-Z0-9]{3})\.(\d)_(\d{4}-\d{2}-\d{2})$/.exec(key);
  if (m) return partnerLeg(net, m[1], m[2], m[4], Number(m[3]));
  m = /^([A-Za-z0-9-]+)\.([or])(\d)_(\d{4}-\d{2}-\d{2})$/.exec(key);
  if (!m) return null;
  const s = net.serviceById.get(`${m[1]}.${m[2]}`);
  if (!s || s.cargo) return null;
  const leg = m[2] === 'o' ? outboundOn(net, s, m[4])[Number(m[3])] : returnAfter(net, s, m[4], Number(m[3]));
  return leg && leg.key === key ? leg : null;
}

/** Seats taken by "other passengers": deterministic per flight, so cabins never look empty. */
export function syntheticOccupied(flight, cabin) {
  const range = { economy: [0.35, 0.45], business: [0.25, 0.4], first: [0.1, 0.4] }[cabin];
  const load = range[0] + rand(`${flight.key}:${cabin}:load`) * range[1];
  return cabinSeats(flight.aircraft, cabin).filter((s) => rand(`${flight.key}:${s}`) < load);
}

export function seatsLeft(flight, cabin, bookedCount = 0) {
  return Math.max(0, cabinCapacity(flight.aircraft, cabin) - syntheticOccupied(flight, cabin).length - bookedCount);
}

export function validateConnections(legs) {
  for (let i = 1; i < legs.length; i++) {
    const gap = (legs[i].depUtc - legs[i - 1].arrUtc) / 60000;
    if (legs[i].from !== legs[i - 1].to || gap < MIN_CONNECTION_MIN || gap > MAX_CONNECTION_MIN) return false;
  }
  return true;
}

export function resolveItinerary(net, id) {
  const legs = String(id).split('|').map((k) => resolveLeg(net, k));
  if (!legs.length || legs.length > MAX_LEGS || legs.some((l) => !l) || !validateConnections(legs)) return null;
  return legs;
}

/** Airports that can reach `dest` within n legs on our own network: reach[n]. */
function reachSets(net, dest) {
  const reach = [new Set([dest])];
  for (let n = 1; n < MAX_LEGS; n++) {
    const next = new Set(reach[n - 1]);
    for (const code of reach[n - 1]) for (const s of net.into.get(code) || []) next.add(s.from);
    reach.push(next);
  }
  return reach;
}

function ownItineraries(net, fromCode, toCode, date) {
  const A = net.byCode.get(fromCode);
  const B = net.byCode.get(toCode);
  const budget = distanceKm(A, B) * 1.7 + 2500;
  const reach = reachSets(net, toCode);
  const out = [];
  const extend = (legs, km) => {
    const last = legs.at(-1);
    if (last.to === toCode) return out.push(legs);
    const remaining = MAX_LEGS - legs.length;
    if (!remaining) return;
    for (const s of net.from.get(last.to) || []) {
      if (legs.some((l) => l.from === s.to) || km + s.km > budget || !reach[remaining - 1].has(s.to)) continue;
      const next = nextConnection(last.arrUtc, net.byCode.get(s.from).tz, (d) => departuresOn(net, s, d));
      if (next) extend([...legs, next], km + s.km);
    }
  };
  for (const s of net.from.get(fromCode) || []) {
    if (s.km > budget || !reach[MAX_LEGS - 1].has(s.to)) continue;
    for (const leg of departuresOn(net, s, date)) extend([leg], s.km);
  }
  return out;
}

/** Codeshare options on alliance partners, optionally feeding into our own flights at a hub. */
function partnerItineraries(net, fromCode, toCode, date) {
  const out = [];
  out.push(...partnerDepartures(net, fromCode, toCode, date).map((l) => [l]));
  const hubs = net.airports.filter((a) => a.hub && a.code !== fromCode && a.code !== toCode);
  const A = net.byCode.get(fromCode);
  const B = net.byCode.get(toCode);
  const direct = distanceKm(A, B);
  for (const h of hubs) {
    const viaKm = distanceKm(A, h) + distanceKm(h, B);
    if (viaKm > direct * 1.5 + 2500) continue;
    const ownOut = (net.from.get(fromCode) || []).filter((s) => s.to === h.code);
    const ownIn = (net.from.get(h.code) || []).filter((s) => s.to === toCode);
    // Partner to our hub, then our own flight onward.
    if (ownIn.length) {
      for (const p of partnerDepartures(net, fromCode, h.code, date)) {
        const next = nextConnection(p.arrUtc, h.tz, (d) => ownIn.flatMap((s) => departuresOn(net, s, d)));
        if (next) out.push([p, next]);
      }
    }
    // Our own flight to the hub, then a partner onward.
    if (ownOut.length) {
      for (const leg of ownOut.flatMap((s) => departuresOn(net, s, date))) {
        const next = nextConnection(leg.arrUtc, h.tz, (d) => partnerDepartures(net, h.code, toCode, d));
        if (next) out.push([leg, next]);
      }
    }
  }
  // Too far for any single partner flight: two partner legs via the best hub.
  if (!out.length) {
    const best = hubs
      .map((h) => ({ h, km: distanceKm(A, h) + distanceKm(h, B) }))
      .filter(({ h }) => distanceKm(A, h) <= PARTNER_MAX_KM && distanceKm(h, B) <= PARTNER_MAX_KM)
      .sort((x, y) => x.km - y.km)
      .slice(0, 3);
    for (const { h } of best) {
      for (const p of partnerDepartures(net, fromCode, h.code, date)) {
        const next = nextConnection(p.arrUtc, h.tz, (d) => partnerDepartures(net, h.code, toCode, d));
        if (next) out.push([p, next]);
      }
    }
  }
  return out;
}

function itineraryCabins(legs, pax, bookedCounts) {
  const out = {};
  for (const cabin of ['economy', 'business', 'first']) {
    // A cabin is sold only when every leg has it.
    if (legs.some((l) => !cabinCapacity(l.aircraft, cabin))) continue;
    const left = Math.min(...legs.map((l) => seatsLeft(l, cabin, bookedCounts[`${l.key}:${cabin}`] || 0)));
    out[cabin] = { seatsLeft: left, available: left >= pax.adults + pax.children, price: priceItinerary(legs, cabin, pax) };
  }
  return out;
}

/**
 * Search itineraries from `from` to `to` (IATA codes) leaving on origin-local `date`.
 * Our own network first; alliance partner options are added when we have no nonstop
 * or one-stop option that day, so every searchable pair gets results.
 */
export async function searchItineraries(net, { from, to, date, adults = 1, children = 0 }, bookedCountsFor) {
  const own = ownItineraries(net, from, to, date);
  const hasGoodOwn = own.some((legs) => legs.length <= 2);
  const all = hasGoodOwn ? own : [...own, ...partnerItineraries(net, from, to, date)];

  const cutoff = Date.now() + 60 * 60000;
  const seen = new Set();
  const live = all.filter((legs) => {
    const id = legs.map((l) => l.key).join('|');
    if (legs[0].depUtc <= cutoff || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const booked = await bookedCountsFor([...new Set(live.flatMap((legs) => legs.map((l) => l.key)))]);
  const pax = { adults, children };

  return live
    .map((legs) => ({
      id: legs.map((l) => l.key).join('|'),
      legs,
      stops: legs.length - 1,
      depUtc: legs[0].depUtc,
      arrUtc: legs.at(-1).arrUtc,
      durationMin: Math.round((legs.at(-1).arrUtc - legs[0].depUtc) / 60000),
      km: legs.reduce((s, l) => s + l.km, 0),
      operators: [...new Set(legs.map((l) => l.operator))],
      codeshare: legs.some((l) => l.partner),
      cabins: itineraryCabins(legs, pax, booked),
    }))
    .filter((it) => Object.keys(it.cabins).length)
    .sort((a, b) => a.codeshare - b.codeshare || a.stops - b.stops || a.durationMin - b.durationMin)
    .slice(0, 30);
}

/** One entry per route for the map and admin views. */
export function networkLinks(net) {
  return net.services
    .filter((s) => s.dir === 'o')
    .map((s) => ({
      routeId: s.routeId, from: s.from, to: s.to, km: s.km, aircraft: s.aircraft, registration: s.registration,
      flightNo: s.flightNo, operator: s.operator, cargo: s.cargo, weeklyFlights: s.weeklyFlights, blockMin: s.block,
    }));
}

