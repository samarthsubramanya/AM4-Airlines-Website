import { rand } from './util.js';

const CABIN_MULTIPLIER = { economy: 1, business: 3.4, first: 6.2 };
const CHILD_RATE = 0.75;
const TAX_RATE = 0.12;
const PER_LEG_FEE = 850; // airport & security fees, INR
const CONNECTION_DISCOUNT = 0.88;
export const CURRENCY = 'INR';

function advanceFactor(depUtc, now) {
  const days = (depUtc - now) / 86400000;
  if (days < 3) return 1.45;
  if (days < 7) return 1.25;
  if (days < 14) return 1.12;
  if (days < 45) return 1;
  return 0.92;
}

/** Base fare (before taxes) for one adult on one leg. */
export function legBaseFare(leg, cabin, now = Date.now()) {
  const distanceFare = 1900 + leg.km * 5.4;
  const demand = 0.85 + rand(`${leg.key}:demand`) * 0.4;
  const dow = new Date(leg.depUtc).getUTCDay();
  const weekend = dow === 5 || dow === 0 ? 1.1 : 1;
  const raw = distanceFare * CABIN_MULTIPLIER[cabin] * demand * weekend * advanceFactor(leg.depUtc, now);
  return Math.round(raw / 10) * 10 - 1;
}

/** Fare breakdown for an itinerary. Always computed server-side. */
export function priceItinerary(legs, cabin, { adults = 1, children = 0 } = {}, now = Date.now()) {
  const discount = legs.length > 1 ? CONNECTION_DISCOUNT : 1;
  const adultBase = Math.round(legs.reduce((s, l) => s + legBaseFare(l, cabin, now), 0) * discount);
  const adultTaxes = Math.round(adultBase * TAX_RATE + PER_LEG_FEE * legs.length);
  const childBase = Math.round(adultBase * CHILD_RATE);
  const childTaxes = Math.round(childBase * TAX_RATE + PER_LEG_FEE * legs.length);
  const base = adultBase * adults + childBase * children;
  const taxes = adultTaxes * adults + childTaxes * children;
  return {
    currency: CURRENCY,
    perAdult: adultBase + adultTaxes,
    perChild: childBase + childTaxes,
    base,
    taxes,
    total: base + taxes,
  };
}
