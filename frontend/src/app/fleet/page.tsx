import type { Metadata } from "next";
import { FleetGallery } from "./FleetGallery";

export const metadata: Metadata = { title: "Our fleet" };

export default function FleetPage() {
  return <FleetGallery />;
}
