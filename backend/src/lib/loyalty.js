// Mayur Miles — the Indian.com frequent flyer programme.
const EARN_RATE = { economy: 1, business: 2, first: 3 };
const KM_TO_MILES = 0.621371;

export const TIERS = [
  { id: 'blue', name: 'Mayur Blue', minMiles: 0, perks: ['Earn 1–3 miles per mile flown', 'Member-only fares'] },
  { id: 'silver', name: 'Mayur Silver', minMiles: 25000, perks: ['Priority check-in', '+10 kg baggage', '25% bonus miles'] },
  { id: 'gold', name: 'Mayur Gold', minMiles: 60000, perks: ['Lounge access worldwide', 'Priority boarding', '50% bonus miles'] },
  { id: 'royal', name: 'Royal Peacock', minMiles: 120000, perks: ['First Class lounges', 'Guaranteed seat on full flights', '100% bonus miles'] },
];

export function milesForLegs(legs, cabin, passengers = 1) {
  const flown = legs.reduce((s, l) => s + l.km * KM_TO_MILES, 0);
  return Math.round(flown * EARN_RATE[cabin]) * passengers;
}

export function tierFor(miles) {
  let current = TIERS[0];
  for (const t of TIERS) if (miles >= t.minMiles) current = t;
  const next = TIERS[TIERS.indexOf(current) + 1] || null;
  return { current, next, toNext: next ? next.minMiles - miles : 0 };
}
