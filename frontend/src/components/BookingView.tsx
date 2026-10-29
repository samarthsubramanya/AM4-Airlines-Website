"use client";
import Print from "@mui/icons-material/PrintOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { api } from "@/lib/api";
import { CABIN_LABEL, formatDuration, formatLongDate, formatMoney, formatNumber } from "@/lib/format";
import { useAirports } from "@/lib/hooks";
import type { Booking } from "@/lib/types";
import { BoardingPass } from "./BoardingPass";
import { Layover, LegDetail } from "./ItineraryCard";

export function BookingView({ booking, onChange }: { booking: Booking; onChange?: (b: Booking) => void }) {
  const { byCode } = useAirports();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cancelled = booking.status === "CANCELLED";
  const [now] = useState(() => Date.now());
  const started = booking.journeys[0].legs[0].depUtc < now;

  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      const updated = await api<Booking>(`/bookings/${booking.pnr}/cancel`, { method: "POST", json: { lastName: booking.passengers[0].lastName } });
      onChange?.(updated);
      setConfirm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Booking reference</Typography>
              <Typography variant="h4" sx={{ letterSpacing: "0.12em" }}>{booking.pnr}</Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Chip color={cancelled ? "error" : "success"} label={cancelled ? "Cancelled" : "Confirmed"} />
              <Chip variant="outlined" label={CABIN_LABEL[booking.cabin]} />
              <Button startIcon={<Print />} onClick={() => window.print()} className="no-print">Print</Button>
            </Stack>
          </Box>
          <Divider sx={{ my: 2 }} />
          {booking.journeys.map((j, ji) => {
            const first = j.legs[0];
            const a = byCode[first.from];
            const b = byCode[j.legs.at(-1)!.to];
            const duration = Math.round((j.legs.at(-1)!.arrUtc - first.depUtc) / 60000);
            return (
              <Box key={ji} sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {ji === 0 ? "Departing" : "Returning"} · {a?.city} → {b?.city}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {a && formatLongDate(first.depUtc, a.tz)} · {formatDuration(duration)}
                </Typography>
                {j.legs.map((l, i) => (
                  <Box key={l.key}>
                    {i > 0 && <Layover prev={j.legs[i - 1]} next={l} byCode={byCode} />}
                    <LegDetail leg={l} byCode={byCode} />
                  </Box>
                ))}
              </Box>
            );
          })}
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="overline" color="text.secondary">Travellers</Typography>
              {booking.passengers.map((p) => (
                <Typography key={p.ticketNumber} variant="body2">
                  {p.title} {p.firstName} {p.lastName} <Typography component="span" variant="caption" color="text.secondary">· e-ticket {p.ticketNumber}</Typography>
                </Typography>
              ))}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="overline" color="text.secondary">Payment</Typography>
              <Typography variant="body2">{formatMoney(booking.fare.total)} paid by {booking.payment.brand} •••• {booking.payment.last4}</Typography>
              <Typography variant="caption" color="text.secondary">
                Fare {formatMoney(booking.fare.base)} + taxes {formatMoney(booking.fare.taxes)}
              </Typography>
              {booking.milesEarned > 0 && (
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  {cancelled ? "Miles reversed" : `+${formatNumber(booking.milesEarned)} Mayur Miles`}
                </Typography>
              )}
            </Grid>
          </Grid>
          {!cancelled && !started && onChange && (
            <Box sx={{ mt: 3 }} className="no-print">
              <Button color="error" variant="outlined" onClick={() => setConfirm(true)}>Cancel booking</Button>
            </Box>
          )}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>

      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Boarding passes</Typography>
        <Stack spacing={2}>
          {booking.journeys.flatMap((j, ji) =>
            j.legs.flatMap((leg, li) =>
              booking.passengers.map((p) => (
                <BoardingPass key={`${leg.key}-${p.ticketNumber}`} booking={booking} passenger={p} leg={leg} seat={p.seats?.[ji]?.[li] ?? null} byCode={byCode} />
              )),
            ),
          )}
        </Stack>
      </Box>

      <Dialog open={confirm} onClose={() => !busy && setConfirm(false)}>
        <DialogTitle>Cancel booking {booking.pnr}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            All flights for all travellers will be cancelled and seats released. A refund of {formatMoney(booking.fare.total)} goes back to
            your {booking.payment.brand} card (demo, so nothing actually moves).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)} disabled={busy}>Keep booking</Button>
          <Button color="error" variant="contained" onClick={cancel} disabled={busy}>Cancel booking</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
