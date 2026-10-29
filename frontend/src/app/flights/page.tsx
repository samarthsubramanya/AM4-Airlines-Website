import type { Metadata } from "next";
import { Suspense } from "react";
import { FlightResults } from "./FlightResults";

export const metadata: Metadata = { title: "Select flights" };

export default function FlightsPage() {
  return (
    <Suspense>
      <FlightResults />
    </Suspense>
  );
}
