import type { Metadata } from "next";
import { NetworkExplorer } from "./NetworkExplorer";

export const metadata: Metadata = { title: "Route map & destinations" };

export default function NetworkPage() {
  return <NetworkExplorer />;
}
