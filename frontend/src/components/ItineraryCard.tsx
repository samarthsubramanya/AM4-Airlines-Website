"use client";
import AirlineSeatReclineExtra from "@mui/icons-material/AirlineSeatReclineExtra";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FlightIcon from "@mui/icons-material/Flight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { AIRCRAFT_NAME, CABIN_LABEL, dayOffset, formatDate, formatDuration, formatMoney, formatTime } from "@/lib/format";
import type { Airport, Cabin, Itinerary, Leg } from "@/lib/types";

function TimeBlock({ utc, airport, align = "left", plusDays = 0 }: { utc: number; airport?: Airport; align?: "left" | "right"; plusDays?: number }) {
  if (!airport) return null;
  return (
    <Box sx={{ textAlign: align, minWidth: 72 }}>
      <Typography variant="h5" component="div" sx={{ lineHeight: 1.1 }}>
        {formatTime(utc, airport.tz)}
        {plusDays > 0 && (
          <Typography component="sup" variant="caption" color="error" sx={{ fontWeight: 700, ml: 0.25 }}>+{plusDays}</Typography>
        )}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{airport.code}</Typography>
      <Typography variant="caption" color="text.secondary">{airport.city}</Typography>
    </Box>
  );
}

export function LegDetail({ leg, byCode }: { leg: Leg; byCode: Record<string, Airport> }) {
  const from = byCode[leg.from];
  const to = byCode[leg.to];
  if (!from || !to) return null;
  return (
    <Box sx={{ display: "flex", gap: 2, py: 1.5 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 0.75 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", border: 2, borderColor: "primary.main" }} />
        <Box sx={{ flex: 1, width: 2, bgcolor: "divider", my: 0.5 }} />
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.main" }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2"><strong>{formatTime(leg.depUtc, from.tz)}</strong> · {formatDate(leg.depUtc, from.tz)} · {from.city} ({from.code}) — {from.name}</Typography>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ my: 1 }}>
          {leg.flightNo.replace("IN", "IN ")} · {AIRCRAFT_NAME[leg.aircraft]} · {formatDuration(leg.durationMin)} · {leg.km.toLocaleString("en-IN")} km
        </Typography>
        <Typography variant="body2"><strong>{formatTime(leg.arrUtc, to.tz)}</strong> · {formatDate(leg.arrUtc, to.tz)} · {to.city} ({to.code}) — {to.name}</Typography>
      </Box>
    </Box>
  );
}

export function Layover({ prev, next, byCode }: { prev: Leg; next: Leg; byCode: Record<string, Airport> }) {
  const min = Math.round((next.depUtc - prev.arrUtc) / 60000);
  return (
    <Chip
      size="small"
      variant="outlined"
      color={min > 360 ? "warning" : "default"}
      label={`${formatDuration(min)} connection in ${byCode[prev.to]?.city ?? prev.to}`}
      sx={{ ml: 3.5 }}
    />
  );
}

interface Props {
  it: Itinerary;
  byCode: Record<string, Airport>;
  cabin: Cabin;
  pax: number;
  onSelect: (cabin: Cabin) => void;
  selected?: boolean;
  /** Only offer this cabin (e.g. the return flight must match the outbound cabin). */
  onlyCabin?: Cabin;
}

export function ItineraryCard({ it, byCode, cabin, pax, onSelect, selected, onlyCabin }: Props) {
  const [open, setOpen] = useState(false);
  const first = it.legs[0];
  const last = it.legs.at(-1)!;
  const from = byCode[first.from];
  const to = byCode[last.to];
  const plus = from && to ? dayOffset(first.depUtc, from.tz, last.arrUtc, to.tz) : 0;
  const cabins = (["economy", "business", "first"] as Cabin[]).filter((c) => it.cabins[c] && (!onlyCabin || c === onlyCabin));

  return (
    <Card sx={{ borderColor: selected ? "primary.main" : undefined, borderWidth: selected ? 2 : 1, transition: "box-shadow .2s", "&:hover": { boxShadow: 4 } }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
            <Chip size="small" color={it.stops ? "default" : "success"} label={it.stops ? `${it.stops} stop${it.stops > 1 ? "s" : ""}` : "Nonstop"} />
            <Chip size="small" variant="outlined" label={it.legs.map((l) => l.flightNo.replace("IN", "IN ")).join(" + ")} />
            {it.legs.some((l) => l.aircraft === "A388") && <Chip size="small" color="secondary" variant="outlined" label="A380" />}
          </Stack>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TimeBlock utc={first.depUtc} airport={from} />
            <Box sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">{formatDuration(it.durationMin)}</Typography>
              <Box sx={{ position: "relative", height: 2, bgcolor: "divider", my: 1 }}>
                {it.legs.slice(1).map((l, i) => (
                  <Box key={l.key} sx={{ position: "absolute", top: -4, left: `${((i + 1) / it.legs.length) * 100}%`, width: 10, height: 10, borderRadius: "50%", bgcolor: "background.paper", border: 2, borderColor: "text.secondary", transform: "translateX(-50%)" }} />
                ))}
                <FlightIcon sx={{ position: "absolute", right: -6, top: -10, fontSize: 20, transform: "rotate(90deg)", color: "primary.main" }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {it.stops ? it.legs.slice(0, -1).map((l) => l.to).join(", ") : "Direct"}
              </Typography>
            </Box>
            <TimeBlock utc={last.arrUtc} airport={to} align="right" plusDays={plus} />
          </Box>
          <Button size="small" onClick={() => setOpen(!open)} endIcon={<ExpandMore sx={{ transform: open ? "rotate(180deg)" : "none", transition: ".2s" }} />} sx={{ mt: 1.5, ml: -1 }}>
            Flight details
          </Button>
          <Collapse in={open}>
            <Box sx={{ mt: 1 }}>
              {it.legs.map((l, i) => (
                <Box key={l.key}>
                  {i > 0 && <Layover prev={it.legs[i - 1]} next={l} byCode={byCode} />}
                  <LegDetail leg={l} byCode={byCode} />
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
        <Divider sx={{ display: { md: "none" } }} />
        <Stack direction={{ xs: "row", md: "column" }} spacing={1} sx={{ p: 2, minWidth: { md: 220 }, justifyContent: "center" }}>
          {cabins.map((c) => {
            const offer = it.cabins[c]!;
            const isMain = c === cabin;
            return (
              <Button
                key={c}
                variant={isMain ? "contained" : "outlined"}
                color={isMain ? "primary" : "inherit"}
                disabled={!offer.available}
                onClick={() => onSelect(c)}
                sx={{ flex: 1, flexDirection: "column", alignItems: { xs: "center", md: "flex-start" }, borderRadius: "16px", py: 1, px: 2, borderColor: "divider" }}
              >
                <Typography variant="caption" sx={{ opacity: 0.85 }}>{CABIN_LABEL[c]}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: isMain ? "1.15rem" : "0.95rem" }}>
                  {offer.available ? formatMoney(offer.price.total) : "Sold out"}
                </Typography>
                {offer.available && offer.seatsLeft <= 9 && (
                  <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: isMain ? "inherit" : "error.main" }}>
                    <AirlineSeatReclineExtra sx={{ fontSize: 14 }} /> {offer.seatsLeft} left
                  </Typography>
                )}
              </Button>
            );
          })}
          {pax > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", display: { xs: "none", md: "block" } }}>
              Total for {pax} travellers
            </Typography>
          )}
        </Stack>
      </Box>
    </Card>
  );
}
