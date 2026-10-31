/**
 * Base URL of the Express API. NEXT_PUBLIC_ values are inlined when `next build` runs,
 * so changing it on Vercel/Netlify only takes effect after a redeploy.
 * Tolerates common paste mistakes: missing https://, trailing slash, trailing /api.
 */
function apiBase(raw: string | undefined) {
  let url = (raw || "").trim();
  if (!url) return "http://localhost:4000";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, "").replace(/\/api$/i, "");
}

export const API_URL = apiBase(process.env.NEXT_PUBLIC_API_URL);

const TOKEN_KEY = "indiancom.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked (private mode) — the session just won't persist.
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Free hosting tiers (e.g. Render) sleep when idle; let the UI explain a slow first request.
const SLOW_MS = 4000;
let pendingSlow = 0;
type SlowListener = (slow: boolean) => void;
const slowListeners = new Set<SlowListener>();
export function onSlowRequests(fn: SlowListener) {
  slowListeners.add(fn);
  return () => {
    slowListeners.delete(fn);
  };
}
const emitSlow = () => slowListeners.forEach((fn) => fn(pendingSlow > 0));

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const token = getToken();
  let markedSlow = false;
  const timer = setTimeout(() => {
    markedSlow = true;
    pendingSlow++;
    emitSlow();
  }, SLOW_MS);
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      ...rest,
      headers: {
        ...(json !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, body.error || `Request failed (${res.status})`);
    return body as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, "Can't reach Indian.com right now. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
    if (markedSlow) {
      pendingSlow--;
      emitSlow();
    }
  }
}

export const fetcher = <T,>(path: string) => api<T>(path);
