import type { Metadata } from "next";
import { Checkout } from "./Checkout";

export const metadata: Metadata = { title: "Complete your booking" };

export default function BookPage() {
  return <Checkout />;
}
