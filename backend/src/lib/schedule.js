import { AIRPORT_BY_CODE, HUB_CODES } from '../data/airports.js';
import { FLEET, cabinCapacity, cabinSeats } from '../data/fleet.js';
import { ROUTES_FROM, ROUTE_BY_FLIGHT } from '../data/network.js';
import { addDays, distanceKm, localDate, rand, zonedToUtc } from './util.js';
import { priceItinerary } from './pricing.js';

const TAXI_MIN = 30;
const MIN_CONNECTION_MIN = 70;
const MAX_CONNECTION_MIN = 14 * 60;
const MAX_STOPS = 2;

export function blockMinutes(route) {
  const speed = FLEET[route.aircraft].cruiseKmh * 0.92;
  return Math.round(((route.km / speed) * 60 + TAXI_MIN) / 5) * 5;
}

/** A concrete flight on a given local departure date. */
export function flightInstance(route, date) {
  const from = AIRPORT_BY_CODE[route.from];
  const depUtc = zonedToUtc(date, route.depLocalMin, from.tz);
  const duration = blockMinutes(route);
  return {
    key: `${route.flightNo}_${date}`,
    flightNo: route.flightNo,
    date,
    from: route.from,
    to: route.to,
    depUtc,
    arrUtc: depUtc + duration * 60000,
    durationMin: duration,
    km: route.km,
    aircraft: route.aircraft,
  };
}

export function getFlight(flightNo, date) {
  const route = ROUTE_BY_FLIGHT[flightNo];
  return route ? flightInstance(route, date) : null;
}

/** Seats taken by "other passengers" — deterministic per flight, so the cabin never looks empty. */
export function syntheticOccupied(flight, cabin) {
  const range = { economy: [0.35, 0.45], business: [0.25, 0.4], first: [0.1, 0.4] }[cabin];
  const load = range[0] + rand(`${flight.key}:${cabin}:load`) * range[1];
  return cabinSeats(flight.aircraft, cabin).filter((s) => rand(`${flight.key}:${s}`) < load);
}

export function seatsLeft(flight, cabin, bookedCount = 0) {
  const cap = cabinCapacity(flight.aircraft, cabin);
  if (!cap) return 0;
  return Math.max(0, cap - syntheticOccupied(flight, cabin).length - bookedCount);
}

const isHub = (code) => HUB_CODES.includes(code);

/** Candidate airport paths (origin → hubs → destination), shortest first. */
export function candidatePaths(from, to) {
  const direct = distanceKm(AIRPORT_BY_CODE[from], AIRPORT_BY_CODE[to]);
  const limit = direct * 1.6 + 1500;
  const paths = [];
  const walk = (node, path, km) => {
    if (path.length - 1 > MAX_STOPS + 1) return;
    for (const r of ROUTES_FROM[node] || []) {
      if (path.includes(r.to) || km + r.km > limit) continue;
      if (r.to === to) paths.push({ codes: [...path, to], km: km + r.km });
      else if (isHub(r.to) && path.length <= MAX_STOPS) walk(r.to, [...path, r.to], km + r.km);
    }
  };
  walk(from, [from], 0);
  const unique = new Map(paths.map((p) => [p.codes.join('-'), p]));
  return [...unique.values()].sort((a, b) => a.codes.length - b.codes.length || a.km - b.km);
}

function routesBetween(a, b) {
  return (ROUTES_FROM[a] || []).filter((r) => r.to === b);
}

/** Earliest departure on any of `routes` that leaves within the connection window after `afterUtc`. */
function nextConnection(routes, afterUtc) {
  let best = null;
  for (const r of routes) {
    const tz = AIRPORT_BY_CODE[r.from].tz;
    const day = localDate(afterUtc, tz);
    for (const d of [addDays(day, -1), day, addDays(day, 1)]) {
      const f = flightInstance(r, d);
      const gap = (f.depUtc - afterUtc) / 60000;
      if (gap >= MIN_CONNECTION_MIN && gap <= MAX_CONNECTION_MIN && (!best || f.depUtc < best.depUtc)) best = f;
    }
  }
  return best;
}

/** Validate that legs chain correctly (same airports, legal connection times). */
export function validateConnections(legs) {
  for (let i = 1; i < legs.length; i++) {
    const gap = (legs[i].depUtc - legs[i - 1].arrUtc) / 60000;
    if (legs[i].from !== legs[i - 1].to || gap < MIN_CONNECTION_MIN || gap > MAX_CONNECTION_MIN) return false;
  }
  return true;
}

function itineraryCabins(legs, pax, bookedCounts) {
  const out = {};
  for (const cabin of ['economy', 'business', 'first']) {
    // A cabin is only sold when every leg has it.
    if (legs.some((l) => !cabinCapacity(l.aircraft, cabin))) continue;
    const left = Math.min(...legs.map((l) => seatsLeft(l, cabin, bookedCounts[`${l.key}:${cabin}`] || 0)));
    out[cabin] = { seatsLeft: left, available: left >= pax.adults + pax.children, price: priceItinerary(legs, cabin, pax) };
  }
  return out;
}

/**
 * Build itineraries from `from` to `to` departing on local date `date`.
 * `bookedCountsFor(keys)` returns { "<flightKey>:<cabin>": count } of seats sold through this site.
 */
export async function searchItineraries({ from, to, date, adults = 1, children = 0 }, bookedCountsFor) {
  const paths = candidatePaths(from, to);
  const fewestStops = paths.length ? paths[0].codes.length : 0;
  const itineraries = [];

  for (const path of paths) {
    // Only offer 2-stop trips when nothing better exists.
    if (path.codes.length > Math.max(fewestStops, 3)) continue;
    for (const first of routesBetween(path.codes[0], path.codes[1])) {
      const legs = [flightInstance(first, date)];
      let ok = true;
      for (let i = 1; i < path.codes.length - 1; i++) {
        const next = nextConnection(routesBetween(path.codes[i], path.codes[i + 1]), legs[i - 1].arrUtc);
        if (!next) { ok = false; break; }
        legs.push(next);
      }
      if (ok) itineraries.push(legs);
    }
  }

  // Don't sell flights that have already left (or leave within the hour).
  const cutoff = Date.now() + 60 * 60000;
  const live = itineraries.filter((legs) => legs[0].depUtc > cutoff);
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
      cabins: itineraryCabins(legs, pax, booked),
    }))
    .filter((it) => Object.keys(it.cabins).length)
    .sort((a, b) => a.stops - b.stops || a.durationMin - b.durationMin)
    .slice(0, 30);
}

/** Resolve an itinerary id ("IN101_2026-11-02|IN205_2026-11-02") back into flights. */
export function resolveItinerary(id) {
  const legs = String(id).split('|').map((k) => {
    const [flightNo, date] = k.split('_');
    return getFlight(flightNo, date);
  });
  if (!legs.length || legs.some((l) => !l) || !validateConnections(legs)) return null;
  return legs;
}
