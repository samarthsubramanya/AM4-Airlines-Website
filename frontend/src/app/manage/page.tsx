import type { Metadata } from "next";
import { Suspense } from "react";
import { ManageBooking } from "./ManageBooking";

export const metadata: Metadata = { title: "Manage booking" };

export default function ManagePage() {
  return (
    <Suspense>
      <ManageBooking />
    </Suspense>
  );
}
