"use client";
import useSWR from "swr";
import { fetcher } from "./api";
import type { Aircraft, Airport, CabinInfo, NetworkLink, Tier } from "./types";

const STATIC = { revalidateOnFocus: false, revalidateIfStale: false, dedupingInterval: 3600_000 };

export function useAirports() {
  const { data, error, isLoading } = useSWR<Airport[]>("/airports", fetcher, STATIC);
  const byCode = Object.fromEntries((data || []).map((a) => [a.code, a])) as Record<string, Airport>;
  return { airports: data || [], byCode, error, isLoading };
}

export const useNetwork = () =>
  useSWR<{ airports: Airport[]; links: NetworkLink[] }>("/network", fetcher, STATIC);

export const useFleet = () =>
  useSWR<{ aircraft: Aircraft[]; cabins: Record<string, CabinInfo> }>("/fleet", fetcher, STATIC);

export const useTiers = () => useSWR<Tier[]>("/loyalty/tiers", fetcher, STATIC);
