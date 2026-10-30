// Aircraft types flown by Indian.com, Indus Air and alliance partners.
// Each cabin lists its seat rows and the seat letters in each block between aisles,
// e.g. [['A','C'],['D','F']] is a 2-2 layout. Freighters have no passenger cabins.
export const CABINS = ['economy', 'business', 'first'];

export const CABIN_INFO = {
  economy: { code: 'Y', label: 'Economy', baggage: '30 kg', perks: ['Hot meal & drinks', 'Seat-back entertainment', 'USB-C charging'] },
  business: { code: 'J', label: 'Business', baggage: '2 × 32 kg', perks: ['Lie-flat Mayur Suite on widebodies', 'Priority boarding & lounge', 'Chef-curated dining'] },
  first: { code: 'F', label: 'First / Private', baggage: '3 × 32 kg', perks: ['Private suite with door', 'Chauffeur & private lounge', 'VIP jets: the whole cabin is First'] },
};

const ECON_333 = [['A', 'B', 'C'], ['D', 'E', 'F'], ['H', 'J', 'K']];
const ECON_343 = [['A', 'B', 'C'], ['D', 'E', 'F', 'G'], ['H', 'J', 'K']];
const ECON_33 = [['A', 'B', 'C'], ['D', 'E', 'F']];
const ECON_242 = [['A', 'C'], ['D', 'E', 'F', 'G'], ['H', 'K']];
const BIZ_1221 = [['A'], ['D', 'G'], ['K']];
const FIRST_111 = [['A'], ['E'], ['K']];
const NARROW_22 = [['A', 'C'], ['D', 'F']];
const SUITE_11 = [['A'], ['D']];

export const AIRCRAFT = {
  B3XM: {
    code: 'B3XM', name: 'Boeing 737 MAX 10', nickname: 'Morni', category: 'Narrowbody', rangeKm: 6100, cruiseKmh: 839,
    aliases: ['B737 MAX 10', '737 MAX 10'],
    description: 'Our single-aisle workhorse, with a recliner Business cabin up front.',
    cabins: { business: { rows: [1, 4], blocks: NARROW_22 }, economy: { rows: [7, 35], blocks: ECON_33 } },
  },
  A320: {
    code: 'A320', name: 'Airbus A320-200', nickname: 'Chandrika', category: 'Narrowbody', rangeKm: 6100, cruiseKmh: 828,
    aliases: ['A320-200', 'A320'],
    description: 'Regional jet for thinner routes.',
    cabins: { business: { rows: [1, 3], blocks: NARROW_22 }, economy: { rows: [6, 29], blocks: ECON_33 } },
  },
  A338: {
    code: 'A338', name: 'Airbus A330-800neo', nickname: 'Kalapi', category: 'Widebody', rangeKm: 15094, cruiseKmh: 871,
    aliases: ['A330-800neo', 'A330-800'],
    description: 'Long-range twin with a 2-4-2 Economy, so most travellers get an aisle or window.',
    cabins: { business: { rows: [1, 7], blocks: BIZ_1221 }, economy: { rows: [15, 43], blocks: ECON_242 } },
  },
  B788: {
    code: 'B788', name: 'Boeing 787-8 Dreamliner', nickname: 'Shikhi', category: 'Widebody', rangeKm: 13530, cruiseKmh: 903,
    aliases: ['B787-8', '787-8'],
    description: 'Quieter cabin with higher humidity, so you arrive fresher on long sectors.',
    cabins: { business: { rows: [1, 6], blocks: BIZ_1221 }, economy: { rows: [15, 38], blocks: ECON_333 } },
  },
  A35K: {
    code: 'A35K', name: 'Airbus A350-1000', nickname: 'Neelkanth', category: 'Widebody', rangeKm: 16100, cruiseKmh: 903,
    aliases: ['A350-1000'],
    description: 'Flagship twin with First suites, Business and a 3-3-3 Economy.',
    cabins: { first: { rows: [1, 2], blocks: FIRST_111 }, business: { rows: [5, 14], blocks: BIZ_1221 }, economy: { rows: [20, 52], blocks: ECON_333 } },
  },
  A35KU: {
    code: 'A35KU', name: 'Airbus A350-1000ULR', nickname: 'Garuda Prime', category: 'Ultra long range', rangeKm: 18000, cruiseKmh: 910,
    aliases: ['A350-1000ULR'],
    description: 'Premium-heavy ultra-long-range layout for 18-hour flights.',
    cabins: { business: { rows: [1, 10], blocks: BIZ_1221 }, economy: { rows: [20, 41], blocks: ECON_333 } },
  },
  A359U: {
    code: 'A359U', name: 'Airbus A350-900ULR', nickname: 'Garuda', category: 'Ultra long range', rangeKm: 18000, cruiseKmh: 910,
    aliases: ['A350-900ULR'],
    description: 'Built for the longest nonstops on the network.',
    cabins: { business: { rows: [1, 11], blocks: BIZ_1221 }, economy: { rows: [20, 36], blocks: ECON_333 } },
  },
  B778: {
    code: 'B778', name: 'Boeing 777-8X', nickname: 'Mayur Raj', category: 'Widebody', rangeKm: 16170, cruiseKmh: 905,
    aliases: ['B777-8X', '777-8X', 'B777-8'],
    description: 'Folding-wingtip giant with First, Business and a 3-4-3 Economy.',
    cabins: { first: { rows: [1, 2], blocks: FIRST_111 }, business: { rows: [5, 14], blocks: BIZ_1221 }, economy: { rows: [25, 58], blocks: ECON_343 } },
  },
  A388: {
    code: 'A388', name: 'Airbus A380-800', nickname: 'Mayur Mahal', category: 'Double-deck', rangeKm: 15200, cruiseKmh: 900,
    aliases: ['A380-800', 'A380'],
    description: 'Our double-deck flagship, with First suites, an onboard lounge and showers.',
    cabins: {
      first: { rows: [1, 3], blocks: [['A'], ['E', 'F'], ['K']] },
      business: { rows: [6, 21], blocks: BIZ_1221 },
      economy: { rows: [30, 72], blocks: ECON_343 },
    },
  },
  A320V: {
    code: 'A320V', name: 'Airbus ACJ320 (VIP)', nickname: 'Raj Hans', category: 'VIP', rangeKm: 11100, cruiseKmh: 828,
    aliases: ['A320-VIP'],
    description: 'Private-jet comfort for small groups, with a stateroom and lounge seating.',
    cabins: { first: { rows: [1, 3], blocks: SUITE_11 }, business: { rows: [5, 7], blocks: NARROW_22 } },
  },
  CL60: {
    code: 'CL60', name: 'Bombardier Challenger 605 (VIP)', nickname: 'Sarus', category: 'VIP', rangeKm: 7400, cruiseKmh: 850,
    aliases: ['Bombardier Challenger 605-VIP', 'Challenger 605'],
    description: 'Business jet charter: the whole cabin is yours.',
    cabins: { first: { rows: [1, 5], blocks: SUITE_11 } },
  },
  C750: {
    code: 'C750', name: 'Cessna Citation X (VIP)', nickname: 'Chakor', category: 'VIP', rangeKm: 6400, cruiseKmh: 950,
    aliases: ['Cessna Citation X- VIP', 'Cessna Citation X-VIP', 'Citation X'],
    description: 'One of the fastest civil jets flying, set up for executives.',
    cabins: { first: { rows: [1, 4], blocks: SUITE_11 } },
  },
  B748F: {
    code: 'B748F', name: 'Boeing 747-8F', nickname: 'Indus Cargo', category: 'Freighter', rangeKm: 8130, cruiseKmh: 908, cargoTonnes: 137.7,
    aliases: ['B747-8F', '747-8F'],
    description: 'Indus Cargo freighter. Carries cargo only, no passengers.',
    cabins: {},
  },
  A35F: {
    code: 'A35F', name: 'Airbus A350F', nickname: 'Indus Cargo', category: 'Freighter', rangeKm: 8700, cruiseKmh: 903, cargoTonnes: 109,
    aliases: ['A350F'],
    description: 'Indus Cargo next-generation freighter. Carries cargo only.',
    cabins: {},
  },
};

const ALIAS = new Map();
for (const a of Object.values(AIRCRAFT)) for (const n of [a.code, a.name, ...a.aliases]) ALIAS.set(n.toLowerCase().replace(/\s+/g, ''), a.code);

/** Map a free-text aircraft type (e.g. from the AM4 CSV export) to a catalog code. */
export function aircraftCode(text) {
  return ALIAS.get(String(text || '').toLowerCase().replace(/\s+/g, '')) || null;
}

export const isCargo = (code) => !Object.keys(AIRCRAFT[code]?.cabins || {}).length;

export function cabinSeats(code, cabin) {
  const layout = AIRCRAFT[code]?.cabins[cabin];
  if (!layout) return [];
  const seats = [];
  for (let row = layout.rows[0]; row <= layout.rows[1]; row++) {
    for (const block of layout.blocks) for (const letter of block) seats.push(`${row}${letter}`);
  }
  return seats;
}

export function cabinCapacity(code, cabin) {
  const layout = AIRCRAFT[code]?.cabins[cabin];
  if (!layout) return 0;
  return layout.blocks.reduce((n, b) => n + b.length, 0) * (layout.rows[1] - layout.rows[0] + 1);
}

export function aircraftSummary() {
  return Object.values(AIRCRAFT).map(({ aliases, ...a }) => ({
    ...a,
    cargo: isCargo(a.code),
    seats: Object.fromEntries(Object.keys(a.cabins).map((c) => [c, cabinCapacity(a.code, c)])),
  }));
}
