import type { Metadata } from "next";
import { Suspense } from "react";
import { Confirmation } from "./Confirmation";

export const metadata: Metadata = { title: "Your booking" };

export default function BookingPage() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  );
}
