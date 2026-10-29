"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";
import type { User } from "./types";

/**
 * Authentication.
 *  - Catalyst mode (NEXT_PUBLIC_CATALYST_APP_URL set): users sign in with Zoho Catalyst
 *    Embedded Authentication; the `auth_bridge` Catalyst function exchanges the Catalyst
 *    session for an API token (see /catalyst/README.md).
 *  - Demo mode (default): name + email sign-in issued by the API, for portfolio demos.
 * Guests can always search, book and manage trips without signing in.
 */
export const CATALYST_APP_URL = (process.env.NEXT_PUBLIC_CATALYST_APP_URL || "").replace(/\/$/, "");
export const AUTH_MODE: "catalyst" | "demo" = CATALYST_APP_URL ? "catalyst" : "demo";

function decode(token: string): (User & { exp: number }) | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp * 1000 < Date.now()) return null;
    return { id: payload.sub, email: payload.email, name: payload.name, provider: payload.provider, exp: payload.exp };
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  ready: boolean;
  demoLogin: (name: string, email: string) => Promise<void>;
  completeCatalystLogin: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const u = token ? decode(token) : null;
    if (token && !u) setToken(null);
    // Reading localStorage must happen after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(u);
    setReady(true);
  }, []);

  const accept = useCallback((token: string) => {
    setToken(token);
    setUser(decode(token));
  }, []);

  const demoLogin = useCallback(
    async (name: string, email: string) => {
      const { token } = await api<{ token: string }>("/auth/demo-login", { method: "POST", json: { name, email } });
      accept(token);
    },
    [accept],
  );

  const completeCatalystLogin = useCallback(async () => {
    const res = await fetch(`${CATALYST_APP_URL}/server/auth_bridge/token`, { credentials: "include" });
    if (!res.ok) throw new Error("Couldn't complete Zoho sign-in. Please try again.");
    const { token } = await res.json();
    accept(token);
  }, [accept]);

  const signOut = useCallback(() => {
    const wasCatalyst = user?.provider === "catalyst";
    setToken(null);
    setUser(null);
    if (wasCatalyst) {
      const w = window as unknown as { catalyst?: { auth?: { signOut: (url: string) => void } } };
      w.catalyst?.auth?.signOut(window.location.origin);
    }
  }, [user]);

  const value = useMemo(
    () => ({ user, ready, demoLogin, completeCatalystLogin, signOut }),
    [user, ready, demoLogin, completeCatalystLogin, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
