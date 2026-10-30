"use client";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { Cabin, Leg, SeatMapData } from "@/lib/types";

interface Props {
  leg: Leg;
  cabin: Cabin;
  travellers: string[];
  /** Seat per traveller on this leg. */
  value: (string | null)[];
  /** Seats already chosen by this booking on this leg, to exclude from "occupied". */
  onChange: (traveller: number, seat: string | null) => void;
}

const SEAT = { economy: 30, business: 38, first: 44 };

function Legend({ color, label, outlined }: { color: string; label: string; outlined?: boolean }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
      <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: outlined ? "transparent" : color, border: 2, borderColor: color }} />
      <Typography variant="caption">{label}</Typography>
    </Stack>
  );
}

export function SeatMap({ leg, cabin, travellers, value, onChange }: Props) {
  const { data, error, isLoading } = useSWR<SeatMapData>(`/flights/${encodeURIComponent(leg.key)}/seats?cabin=${cabin}`, fetcher, { revalidateOnFocus: false });
  const [active, setActive] = useState(() => Math.max(0, value.findIndex((s) => !s)));

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (isLoading || !data) return <Skeleton variant="rounded" height={360} />;

  const occupied = new Set(data.occupied);
  const legroom = new Set(data.extraLegroom);
  const owner = new Map(value.map((s, i) => [s, i] as const).filter(([s]) => s));
  const size = SEAT[cabin];
  const rows = Array.from({ length: data.layout.rows[1] - data.layout.rows[0] + 1 }, (_, i) => data.layout.rows[0] + i);

  const pick = (seat: string) => {
    const mine = owner.get(seat);
    if (mine !== undefined) {
      onChange(mine, null);
      setActive(mine);
      return;
    }
    onChange(active, seat);
    // Move on to the next traveller who still needs a seat.
    const next = value.findIndex((s, i) => i !== active && !s);
    if (next >= 0) setActive(next);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        {travellers.map((t, i) => (
          <Chip
            key={i}
            label={`${t}${value[i] ? ` · ${value[i]}` : ""}`}
            color={i === active ? "primary" : "default"}
            variant={i === active ? "filled" : "outlined"}
            onClick={() => setActive(i)}
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Legend color="var(--mui-palette-primary-main)" label="Available" outlined />
        <Legend color="var(--mui-palette-secondary-main)" label="Your seat" />
        <Legend color="var(--mui-palette-action-disabled)" label="Taken" />
        {legroom.size > 0 && <Legend color="var(--mui-palette-success-main)" label="Extra legroom" outlined />}
      </Stack>
      <Paper variant="outlined" sx={{ overflow: "auto", maxHeight: 520, py: 3, px: { xs: 1, sm: 3 }, bgcolor: "background.default", borderRadius: "120px 120px 24px 24px" }}>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: "center", mb: 2 }}>
          Front of aircraft · {data.aircraft.name}{leg.registration ? ` · ${leg.registration}` : ""}
        </Typography>
        <Box sx={{ width: "fit-content", mx: "auto" }}>
          <Box sx={{ display: "flex", gap: 1, mb: 1, pl: 4 }}>
            {data.layout.blocks.map((b, bi) => (
              <Box key={bi} sx={{ display: "flex", gap: 0.5, mr: bi < data.layout.blocks.length - 1 ? 2 : 0 }}>
                {b.map((l) => (
                  <Typography key={l} variant="caption" sx={{ width: size, textAlign: "center", fontWeight: 700, color: "text.secondary" }}>{l}</Typography>
                ))}
              </Box>
            ))}
          </Box>
          {rows.map((r) => (
            <Box key={r} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography variant="caption" sx={{ width: 24, textAlign: "right", color: "text.secondary" }}>{r}</Typography>
              {data.layout.blocks.map((b, bi) => (
                <Box key={bi} sx={{ display: "flex", gap: 0.5, mr: bi < data.layout.blocks.length - 1 ? 2 : 0 }}>
                  {b.map((l) => {
                    const id = `${r}${l}`;
                    const mine = owner.get(id);
                    const taken = occupied.has(id) && mine === undefined;
                    const extra = legroom.has(id);
                    return (
                      <Tooltip key={id} title={taken ? `${id} · taken` : mine !== undefined ? `${id} · ${travellers[mine]}` : `${id}${extra ? " · extra legroom" : ""}`}>
                        <span>
                          <ButtonBase
                            disabled={taken}
                            onClick={() => pick(id)}
                            aria-label={`Seat ${id}${taken ? " taken" : ""}`}
                            aria-pressed={mine !== undefined}
                            sx={{
                              width: size,
                              height: size,
                              borderRadius: "8px 8px 4px 4px",
                              fontSize: 11,
                              fontWeight: 700,
                              border: 2,
                              borderColor: taken ? "transparent" : mine !== undefined ? "secondary.main" : extra ? "success.main" : "primary.main",
                              bgcolor: taken ? "action.disabledBackground" : mine !== undefined ? "secondary.main" : "background.paper",
                              color: mine !== undefined ? "secondary.contrastText" : "primary.main",
                              "&:hover": { bgcolor: taken ? undefined : mine !== undefined ? "secondary.dark" : "action.hover" },
                            }}
                          >
                            {mine !== undefined ? travellers[mine].slice(0, 1) : ""}
                          </ButtonBase>
                        </span>
                      </Tooltip>
                    );
                  })}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
