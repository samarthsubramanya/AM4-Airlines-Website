"use client";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CABIN_LABEL, formatDate, formatMoney, formatTime } from "@/lib/format";
import { useAirports } from "@/lib/hooks";
import type { Trip } from "@/lib/trip";

export function tripTotals(trip: Trip) {
  const prices = trip.journeys.map((j) => j.cabins[trip.cabin]!.price);
  return {
    base: prices.reduce((s, p) => s + p.base, 0),
    taxes: prices.reduce((s, p) => s + p.taxes, 0),
    total: prices.reduce((s, p) => s + p.total, 0),
  };
}

export function TripSummary({ trip }: { trip: Trip }) {
  const { byCode } = useAirports();
  const totals = tripTotals(trip);
  const { adults, children } = trip.query;
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Your trip</Typography>
        <Stack spacing={2} divider={<Divider flexItem />}>
          {trip.journeys.map((j, i) => {
            const a = byCode[j.legs[0].from];
            const b = byCode[j.legs.at(-1)!.to];
            return (
              <Box key={j.id}>
                <Typography variant="overline" color="text.secondary">{i === 0 ? "Departing" : "Returning"}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{a?.city} → {b?.city}</Typography>
                {a && b && (
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(j.depUtc, a.tz)} · {formatTime(j.depUtc, a.tz)} – {formatTime(j.arrUtc, b.tz)}
                    {" · "}{j.stops ? `${j.stops} stop${j.stops > 1 ? "s" : ""}` : "Nonstop"}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={0.75}>
          <Row label={`${CABIN_LABEL[trip.cabin]} · ${adults} adult${adults > 1 ? "s" : ""}${children ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}`} value={formatMoney(totals.base)} />
          <Row label="Taxes & fees" value={formatMoney(totals.taxes)} />
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Row label={<strong>Total</strong>} value={<Typography variant="h6" component="span" color="primary">{formatMoney(totals.total)}</Typography>} />
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
      <Typography variant="body2" color="text.secondary" component="span">{label}</Typography>
      <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}
