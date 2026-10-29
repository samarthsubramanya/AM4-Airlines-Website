// Fleet and cabin layouts. Each cabin lists seat rows and the seat letters in
// each block between aisles, e.g. [['A','C'],['D','F']] is a 2-2 layout.
export const CABINS = ['economy', 'business', 'first'];

export const CABIN_INFO = {
  economy: { code: 'Y', label: 'Economy', baggage: '30 kg', perks: ['Hot meal & drinks', 'Seat-back entertainment', 'USB-C charging'] },
  business: { code: 'J', label: 'Business', baggage: '2 × 32 kg', perks: ['Lie-flat Mayur Suite', 'Priority boarding & lounge', 'Chef-curated dining'] },
  first: { code: 'F', label: 'First', baggage: '3 × 32 kg', perks: ['Private Peacock Suite with door', 'Chauffeur & private lounge', 'Onboard shower (A380)'] },
};

export const FLEET = {
  A388: {
    code: 'A388',
    name: 'Airbus A380-800',
    nickname: 'Mayur Mahal',
    count: 6,
    rangeKm: 15200,
    cruiseKmh: 900,
    description: 'Our double-deck flagship flies the busiest trunk routes from Bengaluru, with First Class suites and an onboard lounge.',
    cabins: {
      first: { rows: [1, 3], blocks: [['A'], ['E', 'F'], ['K']] },
      business: { rows: [6, 21], blocks: [['A'], ['D', 'G'], ['K']] },
      economy: { rows: [30, 72], blocks: [['A', 'B', 'C'], ['D', 'E', 'F', 'G'], ['H', 'J', 'K']] },
    },
  },
  B77W: {
    code: 'B77W',
    name: 'Boeing 777-300ER',
    nickname: 'Neelkanth',
    count: 14,
    rangeKm: 13650,
    cruiseKmh: 892,
    description: 'High-capacity long-haul workhorse linking our hubs across Asia, Europe and the Middle East.',
    cabins: {
      first: { rows: [1, 2], blocks: [['A'], ['E', 'F'], ['K']] },
      business: { rows: [5, 14], blocks: [['A'], ['D', 'G'], ['K']] },
      economy: { rows: [30, 62], blocks: [['A', 'B', 'C'], ['D', 'E', 'F', 'G'], ['H', 'J', 'K']] },
    },
  },
  A359U: {
    code: 'A359U',
    name: 'Airbus A350-900ULR',
    nickname: 'Garuda',
    count: 8,
    rangeKm: 18000,
    cruiseKmh: 910,
    description: 'Ultra-long-range jets for our nonstop flights to San Francisco, New York and Auckland.',
    cabins: {
      business: { rows: [1, 12], blocks: [['A'], ['D', 'G'], ['K']] },
      economy: { rows: [20, 46], blocks: [['A', 'B', 'C'], ['D', 'E', 'F'], ['H', 'J', 'K']] },
    },
  },
  B789: {
    code: 'B789',
    name: 'Boeing 787-9 Dreamliner',
    nickname: 'Kalapi',
    count: 22,
    rangeKm: 14000,
    cruiseKmh: 903,
    description: 'Quiet, efficient medium and long-haul flights, with higher cabin humidity so you arrive refreshed.',
    cabins: {
      business: { rows: [1, 8], blocks: [['A'], ['D', 'G'], ['K']] },
      economy: { rows: [20, 46], blocks: [['A', 'B', 'C'], ['D', 'E', 'F'], ['H', 'J', 'K']] },
    },
  },
  A21N: {
    code: 'A21N',
    name: 'Airbus A321neo',
    nickname: 'Morni',
    count: 40,
    rangeKm: 3500,
    cruiseKmh: 830,
    description: 'Our regional fleet connecting India, the Gulf, Southeast Asia and Oceania with recliner Business seats.',
    cabins: {
      business: { rows: [1, 3], blocks: [['A', 'C'], ['D', 'F']] },
      economy: { rows: [10, 37], blocks: [['A', 'B', 'C'], ['D', 'E', 'F']] },
    },
  },
};

export function cabinSeats(aircraftCode, cabin) {
  const layout = FLEET[aircraftCode]?.cabins[cabin];
  if (!layout) return [];
  const seats = [];
  for (let row = layout.rows[0]; row <= layout.rows[1]; row++) {
    for (const block of layout.blocks) for (const letter of block) seats.push(`${row}${letter}`);
  }
  return seats;
}

export function cabinCapacity(aircraftCode, cabin) {
  const layout = FLEET[aircraftCode]?.cabins[cabin];
  if (!layout) return 0;
  const perRow = layout.blocks.reduce((n, b) => n + b.length, 0);
  return perRow * (layout.rows[1] - layout.rows[0] + 1);
}

export function fleetSummary() {
  return Object.values(FLEET).map((a) => ({
    ...a,
    seats: Object.fromEntries(Object.keys(a.cabins).map((c) => [c, cabinCapacity(a.code, c)])),
  }));
}
