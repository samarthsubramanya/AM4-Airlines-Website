"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Cabin, Itinerary, PassengerInput, SearchQuery } from "./types";

/** The trip being booked. Persisted to sessionStorage so a refresh doesn't lose it. */
export interface Trip {
  query: SearchQuery;
  cabin: Cabin;
  journeys: Itinerary[]; // [outbound] or [outbound, return]
  passengers?: PassengerInput[];
  contact?: { email: string; phone: string };
}

const KEY = "indiancom.trip";

interface TripState {
  trip: Trip | null;
  ready: boolean;
  setTrip: (t: Trip | null) => void;
  update: (patch: Partial<Trip>) => void;
}

const TripContext = createContext<TripState | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trip, setTripState] = useState<Trip | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      // Restoring persisted state must happen after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setTripState(JSON.parse(raw));
    } catch {
      // ignore unreadable storage
    }
    setReady(true);
  }, []);

  const setTrip = useCallback((t: Trip | null) => {
    setTripState(t);
    try {
      if (t) sessionStorage.setItem(KEY, JSON.stringify(t));
      else sessionStorage.removeItem(KEY);
    } catch {
      // storage unavailable
    }
  }, []);

  const update = useCallback(
    (patch: Partial<Trip>) =>
      setTripState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        try {
          sessionStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // storage unavailable
        }
        return next;
      }),
    [],
  );

  const value = useMemo(() => ({ trip, ready, setTrip, update }), [trip, ready, setTrip, update]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside <TripProvider>");
  return ctx;
}
