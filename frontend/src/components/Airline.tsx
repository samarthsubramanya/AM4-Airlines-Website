import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import type { AirlineCode } from "@/lib/types";
import { PeacockMark } from "./Logo";

// Brand data mirrors backend/src/data/airlines.js (static so logos render without a fetch).
export const AIRLINE: Record<AirlineCode, { name: string; color: string; accent: string; partner: boolean }> = {
  IN: { name: "Indian.com", color: "#0A4D68", accent: "#D4A72C", partner: false },
  IS: { name: "Indus Air", color: "#2E2A6B", accent: "#E8A33D", partner: false },
  QS: { name: "Quantas", color: "#B4362B", accent: "#F2C14E", partner: true },
  GR: { name: "GRR", color: "#1F6F4A", accent: "#A8D5BA", partner: true },
  RB: { name: "Ruby Air", color: "#9B111E", accent: "#F5B7B1", partner: true },
};

/** Indus Air: a single peacock feather rising over the Indus river. */
export function IndusMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Indus Air">
      <defs>
        <linearGradient id="indus-f" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2E2A6B" />
          <stop offset="1" stopColor="#5B57C9" />
        </linearGradient>
      </defs>
      <g transform="rotate(28 32 34)">
        <path d="M32 58 C 22 44, 20 24, 32 4 C 44 24, 42 44, 32 58 Z" fill="url(#indus-f)" />
        <path d="M32 58 L 32 12" stroke="#E8A33D" strokeWidth="1.2" />
        <ellipse cx="32" cy="18" rx="6.5" ry="8" fill="#E8A33D" />
        <ellipse cx="32" cy="19" rx="3.8" ry="4.8" fill="#1B7F5C" />
        <ellipse cx="32" cy="19.6" rx="1.9" ry="2.6" fill="#2E2A6B" />
      </g>
      <path d="M4 54 C 14 48, 22 60, 32 54 S 50 48, 60 54" fill="none" stroke="#E8A33D" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function PartnerMark({ code, size }: { code: AirlineCode; size: number }) {
  const a = AIRLINE[code];
  return (
    <Box
      aria-label={a.name}
      sx={{
        width: size, height: size, borderRadius: size / 4 + "px", bgcolor: a.color, color: a.accent, display: "grid", placeItems: "center",
        fontWeight: 800, fontSize: size * 0.38, letterSpacing: "-0.03em", flexShrink: 0,
      }}
    >
      {code}
    </Box>
  );
}

export function AirlineMark({ code, size = 28 }: { code: AirlineCode; size?: number }) {
  if (code === "IN") return <PeacockMark size={size} />;
  if (code === "IS") return <IndusMark size={size} />;
  return <PartnerMark code={code} size={size} />;
}

export function IndusLogo({ size = 36, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <IndusMark size={size} />
      <Box component="span" sx={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700, fontSize: size * 0.6, letterSpacing: "-0.02em", color: inverse ? "#fff" : "#2E2A6B", lineHeight: 1 }}>
        Indus<Box component="span" sx={{ color: "#E8A33D" }}> Air</Box>
      </Box>
    </Box>
  );
}

/** "Operated by …" chip. */
export function OperatorChip({ code, prefix = "" }: { code: AirlineCode; prefix?: string }) {
  const a = AIRLINE[code];
  return (
    <Tooltip title={a.partner ? `Codeshare with our Australia World partner ${a.name}` : code === "IS" ? "Indus Air is the global subsidiary of Indian.com" : "Indian.com"}>
      <Chip
        size="small"
        variant="outlined"
        avatar={<Box sx={{ display: "grid", placeItems: "center", bgcolor: "transparent !important" }}><AirlineMark code={code} size={18} /></Box>}
        label={`${prefix}${a.name}`}
        sx={{ borderColor: a.color, "& .MuiChip-avatar": { width: 18, height: 18, ml: "6px" } }}
      />
    </Tooltip>
  );
}
