import Box from "@mui/material/Box";

const FEATHERS = [-72, -48, -24, 0, 24, 48, 72];

/** Indian.com peacock mark: a fanned tail of seven feathers, each with a gold "eye". */
export function PeacockMark({ size = 40, title = "Indian.com" }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title}>
      <defs>
        <linearGradient id="pk-feather" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#1B7F5C" />
          <stop offset="1" stopColor="#088395" />
        </linearGradient>
        <linearGradient id="pk-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A4D68" />
          <stop offset="1" stopColor="#06283D" />
        </linearGradient>
      </defs>
      {FEATHERS.map((a) => (
        <g key={a} transform={`rotate(${a} 32 54)`}>
          <path d="M32 54 C 27 42, 25 28, 32 10 C 39 28, 37 42, 32 54 Z" fill="url(#pk-feather)" />
          <ellipse cx="32" cy="20" rx="4.2" ry="5.4" fill="#D4A72C" />
          <ellipse cx="32" cy="20.6" rx="2.4" ry="3.2" fill="#0A4D68" />
        </g>
      ))}
      {/* Body and neck */}
      <path
        d="M27 58 C 25 50, 28 44, 31 40 C 32.5 38, 32 34, 33.2 31.2 C 34.2 29, 37.6 29, 38.2 31.6 C 38.6 33.4, 37 34.4, 36.2 36.2 C 35 39, 36.6 44, 38 49 C 39 53, 38 56.5, 37 58 Z"
        fill="url(#pk-body)"
        stroke="#fff"
        strokeWidth="1"
      />
      <path d="M38.1 31.4 L 41.2 32.6 L 38 33.4 Z" fill="#D4A72C" />
      <circle cx="35.6" cy="31.6" r="0.9" fill="#fff" />
      {/* Crest */}
      <g stroke="#06283D" strokeWidth="0.7">
        <line x1="34.6" y1="29.6" x2="33.4" y2="26" />
        <line x1="35.6" y1="29.4" x2="35.6" y2="25.6" />
        <line x1="36.6" y1="29.6" x2="37.8" y2="26" />
      </g>
      <g fill="#D4A72C">
        <circle cx="33.4" cy="25.8" r="0.9" />
        <circle cx="35.6" cy="25.4" r="0.9" />
        <circle cx="37.8" cy="25.8" r="0.9" />
      </g>
    </svg>
  );
}

export function Logo({ size = 36, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <PeacockMark size={size} />
      <Box
        component="span"
        sx={{
          fontFamily: "var(--font-heading), sans-serif",
          fontWeight: 700,
          fontSize: size * 0.6,
          letterSpacing: "-0.02em",
          color: inverse ? "#fff" : "primary.main",
          lineHeight: 1,
        }}
      >
        Indian<Box component="span" sx={{ color: "secondary.main" }}>.com</Box>
      </Box>
    </Box>
  );
}
