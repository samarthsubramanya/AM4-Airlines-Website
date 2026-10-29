import type { Metadata } from "next";
import { MilesDashboard } from "./MilesDashboard";

export const metadata: Metadata = { title: "Mayur Miles" };

export default function MilesPage() {
  return <MilesDashboard />;
}
