const timeFormatters = new Map<string, Intl.DateTimeFormat>();

function fmt(tz: string, opts: Intl.DateTimeFormatOptions) {
  const key = tz + JSON.stringify(opts);
  let f = timeFormatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-IN", { timeZone: tz, ...opts });
    timeFormatters.set(key, f);
  }
  return f;
}

/** "14:35" in the airport's local time. */
export const formatTime = (utc: number, tz: string) =>
  fmt(tz, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(utc);

/** "Wed, 18 Nov" in the airport's local time. */
export const formatDate = (utc: number, tz: string) =>
  fmt(tz, { weekday: "short", day: "numeric", month: "short" }).format(utc);

export const formatLongDate = (utc: number, tz: string) =>
  fmt(tz, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(utc);

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatMoney = (n: number) => money.format(n);

export const formatNumber = (n: number) => new Intl.NumberFormat("en-IN").format(n);

/** Days between the local calendar dates of two instants (for "+1" arrival badges). */
export function dayOffset(depUtc: number, depTz: string, arrUtc: number, arrTz: string) {
  const d = (utc: number, tz: string) => {
    const s = fmt(tz, { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(utc);
    const p = Object.fromEntries(s.map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day);
  };
  return Math.round((d(arrUtc, arrTz) - d(depUtc, depTz)) / 86400000);
}

export const CABIN_LABEL = { economy: "Economy", business: "Business", first: "First" } as const;

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export function addDaysISO(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
