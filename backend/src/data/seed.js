import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { aircraftCode } from './fleet.js';

const CSV_PATH = fileURLToPath(new URL('../../data/active_routes.csv', import.meta.url));

/** Minimal CSV parser (handles quoted fields). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

/**
 * Convert an AM4 "active routes" export into route records.
 * Columns: Source Airport, Destination Airport, Route/Flight Number, Aircraft Type, Aircraft Registration Number
 * Returns { routes, errors } — rows with unknown aircraft types are reported, not dropped silently.
 */
export function routesFromCsv(text) {
  const [header, ...rows] = parseCsv(text);
  const idx = (re) => header.findIndex((h) => re.test(h));
  const col = {
    from: idx(/source/i), to: idx(/destination/i), flight: idx(/flight|route/i), type: idx(/type/i), reg: idx(/registration/i),
  };
  if (Object.values(col).some((i) => i < 0)) throw new Error('CSV must have Source, Destination, Flight Number, Aircraft Type and Registration columns');
  const routes = [];
  const errors = [];
  rows.forEach((r, i) => {
    const aircraft = aircraftCode(r[col.type]);
    const route = {
      from: r[col.from].trim().toUpperCase(),
      to: r[col.to].trim().toUpperCase(),
      flightNumber: r[col.flight].trim(),
      aircraft,
      registration: r[col.reg].trim(),
    };
    if (!aircraft) errors.push(`Row ${i + 2}: unknown aircraft type "${r[col.type]}"`);
    else routes.push(route);
  });
  return { routes, errors };
}

export function seedRoutes() {
  const { routes } = routesFromCsv(readFileSync(CSV_PATH, 'utf8'));
  return routes.map((r, i) => ({ id: `R${String(i + 1).padStart(3, '0')}`, ...r }));
}
