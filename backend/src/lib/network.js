import { BASE_AIRPORTS, HUBS } from '../data/airports.js';
import { buildNetwork } from './schedule.js';

const TTL_MS = 30_000;

/**
 * Keeps the built network in memory. Rebuilt after admin edits (invalidate) and at most
 * every 30 s otherwise, so several API instances sharing one database stay in sync.
 */
export function createNetworkProvider(store) {
  let cached = null;
  let builtAt = 0;
  let pending = null;

  async function build() {
    const [routes, custom] = await Promise.all([store.listRoutes(), store.listAirports()]);
    const byIcao = new Map(BASE_AIRPORTS.map((a) => [a.icao, a]));
    for (const a of custom) byIcao.set(a.icao, { ...a, ...(HUBS[a.icao] && { hub: HUBS[a.icao] }), custom: true });
    return buildNetwork(routes, [...byIcao.values()]);
  }

  return {
    async get() {
      if (cached && Date.now() - builtAt < TTL_MS) return cached;
      pending ||= build().then((net) => {
        cached = net;
        builtAt = Date.now();
        pending = null;
        return net;
      }, (err) => {
        pending = null;
        throw err;
      });
      return pending;
    },
    invalidate() {
      builtAt = 0;
    },
  };
}
