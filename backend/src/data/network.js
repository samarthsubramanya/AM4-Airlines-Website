import { AIRPORT_BY_CODE } from './airports.js';
import { distanceKm, hash } from '../lib/util.js';

// Undirected route list. Every route is flown in both directions.
const HUB_LINKS = [
  // Bengaluru to every secondary hub
  ['BLR', 'DEL'], ['BLR', 'DXB'], ['BLR', 'SIN'], ['BLR', 'HKG'], ['BLR', 'SYD'],
  ['BLR', 'AKL'], ['BLR', 'FCO'], ['BLR', 'SFO'],
  // Hub-to-hub mesh
  ['DEL', 'DXB'], ['DEL', 'SIN'], ['DEL', 'HKG'], ['DEL', 'FCO'], ['DEL', 'SFO'],
  ['DXB', 'FCO'], ['DXB', 'SIN'], ['DXB', 'HKG'], ['DXB', 'SYD'],
  ['SIN', 'HKG'], ['SIN', 'SYD'], ['SIN', 'AKL'], ['SIN', 'FCO'],
  ['HKG', 'SFO'], ['HKG', 'SYD'], ['HKG', 'AKL'],
  ['SYD', 'AKL'], ['SYD', 'SFO'], ['AKL', 'SFO'], ['FCO', 'SFO'],
];

// Spoke airports and the hubs that serve them.
const SPOKES = {
  BOM: ['BLR', 'DEL', 'DXB', 'SIN'], MAA: ['BLR', 'DEL', 'SIN'], HYD: ['BLR', 'DEL', 'DXB'],
  CCU: ['BLR', 'DEL', 'SIN'], COK: ['BLR', 'DEL', 'DXB'], GOI: ['BLR', 'DEL'], AMD: ['BLR', 'DEL', 'DXB'],
  PNQ: ['BLR', 'DEL'], JAI: ['BLR', 'DEL'], TRV: ['BLR', 'DXB'], LKO: ['BLR', 'DEL'], IXL: ['DEL'],
  CMB: ['BLR', 'SIN'], MLE: ['BLR', 'DXB'], KTM: ['DEL', 'BLR'],
  BKK: ['BLR', 'DEL', 'SIN', 'HKG'], KUL: ['BLR', 'SIN'], CGK: ['SIN'], DPS: ['SIN', 'SYD', 'BLR'],
  MNL: ['SIN', 'HKG'], SGN: ['SIN', 'HKG'],
  NRT: ['BLR', 'HKG', 'SIN', 'SFO'], ICN: ['HKG', 'SFO'], TPE: ['HKG'], PVG: ['HKG'],
  MCT: ['DXB', 'BLR'], JED: ['DXB', 'BLR'], CAI: ['DXB', 'FCO'], NBO: ['DXB', 'BLR'], JNB: ['DXB', 'SYD'], MRU: ['BLR', 'DXB'],
  LHR: ['BLR', 'DEL', 'DXB', 'FCO'], CDG: ['BLR', 'FCO', 'DXB'], FRA: ['BLR', 'FCO', 'DEL'], AMS: ['FCO', 'DXB'],
  MAD: ['FCO'], BCN: ['FCO'], ATH: ['FCO', 'DXB'], ZRH: ['FCO'], VCE: ['FCO'], IST: ['FCO', 'DXB'],
  MEL: ['SYD', 'AKL', 'SIN', 'BLR'], BNE: ['SYD', 'AKL'], PER: ['SYD', 'SIN', 'BLR'], ADL: ['SYD'], CNS: ['SYD'],
  CHC: ['AKL', 'SYD'], ZQN: ['AKL', 'SYD'], WLG: ['AKL', 'SYD'], NAN: ['AKL', 'SYD'], PPT: ['AKL'],
  LAX: ['SFO', 'SYD', 'AKL'], SEA: ['SFO'], JFK: ['SFO', 'BLR', 'DEL', 'FCO'], ORD: ['SFO', 'DEL'], DFW: ['SFO'],
  BOS: ['SFO', 'FCO'], HNL: ['SFO', 'AKL'], YVR: ['SFO', 'HKG'], YYZ: ['SFO', 'DEL'], MEX: ['SFO'], SCL: ['AKL', 'SYD'],
};

// Flagship routes that get the A380.
const A380_ROUTES = new Set(['BLR-DXB', 'BLR-SIN', 'BLR-LHR', 'BLR-SYD', 'DXB-SYD', 'SIN-SYD', 'DXB-LHR']);
// Dense hub pairs flown by the 777-300ER regardless of distance.
const B77W_ROUTES = new Set(['BLR-DEL', 'BLR-HKG', 'BLR-FCO', 'DEL-DXB', 'DEL-LHR', 'SIN-HKG', 'DXB-FCO', 'HKG-SYD', 'BLR-BOM']);

const pairKey = (a, b) => [a, b].sort().join('-');

function aircraftFor(a, b, km) {
  const k = pairKey(a, b);
  if (A380_ROUTES.has(k)) return 'A388';
  if (B77W_ROUTES.has(k)) return 'B77W';
  if (km <= 3200) return 'A21N';
  if (km <= 12500) return 'B789';
  return 'A359U';
}

function frequency(a, b, km) {
  const hubs = [a, b].filter((c) => AIRPORT_BY_CODE[c].hub).length;
  if (km > 11000) return 1;
  if (km < 2500 && (a === 'BLR' || b === 'BLR')) return 3;
  if (hubs === 2 || km < 2500) return 2;
  return 1;
}

function buildRoutes() {
  const pairs = new Map();
  const add = (a, b) => pairs.set(pairKey(a, b), [a, b]);
  for (const [a, b] of HUB_LINKS) add(a, b);
  for (const [spoke, hubs] of Object.entries(SPOKES)) for (const hub of hubs) add(hub, spoke);

  const routes = [];
  let flightNo = 101;
  const sorted = [...pairs.values()].sort((x, y) => {
    // BLR routes take the lowest flight numbers, then other hubs.
    const rank = ([a]) => (a === 'BLR' ? 0 : AIRPORT_BY_CODE[a].hub ? 1 : 2);
    return rank(x) - rank(y) || pairKey(...x).localeCompare(pairKey(...y));
  });
  for (const [a, b] of sorted) {
    const km = distanceKm(AIRPORT_BY_CODE[a], AIRPORT_BY_CODE[b]);
    const aircraft = aircraftFor(a, b, km);
    const freq = frequency(a, b, km);
    // Spread departures through the day; each frequency gets its own number pair.
    for (let i = 0; i < freq; i++) {
      const window = 1440 / freq;
      const jitter = hash(`${a}${b}${i}`) % Math.max(60, Math.floor(window - 240));
      const outDep = Math.round((360 + i * window + jitter) / 5) * 5 % 1440;
      const retDep = Math.round((420 + i * window + (hash(`${b}${a}${i}`) % Math.max(60, Math.floor(window - 240)))) / 5) * 5 % 1440;
      routes.push({ flightNo: `IN${flightNo}`, from: a, to: b, km, aircraft, depLocalMin: outDep });
      routes.push({ flightNo: `IN${flightNo + 1}`, from: b, to: a, km, aircraft, depLocalMin: retDep });
      flightNo += 2;
    }
  }
  return routes;
}

export const ROUTES = buildRoutes();
export const ROUTE_BY_FLIGHT = Object.fromEntries(ROUTES.map((r) => [r.flightNo, r]));

/** Routes grouped by origin airport. */
export const ROUTES_FROM = ROUTES.reduce((acc, r) => {
  (acc[r.from] ||= []).push(r);
  return acc;
}, {});

/** One entry per undirected airport pair, for the network map. */
export function networkLinks() {
  const seen = new Map();
  for (const r of ROUTES) {
    const k = pairKey(r.from, r.to);
    const link = seen.get(k) || { from: r.from, to: r.to, km: r.km, aircraft: r.aircraft, weeklyFlights: 0 };
    link.weeklyFlights += 7;
    seen.set(k, link);
  }
  return [...seen.values()];
}
