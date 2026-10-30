// Operating brands. Routes touching India are sold as Indian.com; everything else
// flies as the global subsidiary Indus Air. Alliance partners fill network gaps.
export const AIRLINES = {
  IN: { code: 'IN', name: 'Indian.com', kind: 'own', color: '#0A4D68', accent: '#D4A72C', tagline: 'The peacock airline of India' },
  IS: { code: 'IS', name: 'Indus Air', kind: 'own', color: '#2E2A6B', accent: '#E8A33D', tagline: 'An Indian.com company, flying the world' },
  QS: { code: 'QS', name: 'Quantas', kind: 'partner', color: '#B4362B', accent: '#F2C14E', tagline: 'Australia World partner', region: 'oceania' },
  GR: { code: 'GR', name: 'GRR', kind: 'partner', color: '#1F6F4A', accent: '#A8D5BA', tagline: 'Australia World partner', region: 'atlantic' },
  RB: { code: 'RB', name: 'Ruby Air', kind: 'partner', color: '#9B111E', accent: '#F5B7B1', tagline: 'Australia World partner', region: 'asia' },
};

export const ALLIANCE = { name: 'Australia World', members: ['IN', 'IS', 'QS', 'GR', 'RB'] };

/** Indian.com for any route that starts or ends in India; Indus Air otherwise. */
export const operatorFor = (fromAirport, toAirport) =>
  fromAirport.country === 'India' || toAirport.country === 'India' ? 'IN' : 'IS';

/** Partner chosen for a fallback flight, by the regions it touches. */
export function partnerFor(regionA, regionB) {
  const regions = [regionA, regionB];
  if (regions.includes('oceania')) return 'QS';
  if (regions.every((r) => r === 'asia' || r === 'africa')) return 'RB';
  if (regions.includes('europe') || regions.includes('americas')) return 'GR';
  return 'RB';
}

/** "#IN-0093" -> "93" */
export const flightDigits = (raw) => String(raw).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
