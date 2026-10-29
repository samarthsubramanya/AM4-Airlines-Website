"use client";
import FlightIcon from "@mui/icons-material/Flight";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { QRCodeSVG } from "qrcode.react";
import { CABIN_LABEL, formatDate, formatTime } from "@/lib/format";
import type { Airport, Booking, Leg, Passenger } from "@/lib/types";
import { PeacockMark } from "./Logo";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

/** Boarding time is 45 minutes before departure (60 for the A380). */
const boardingUtc = (leg: Leg) => leg.depUtc - (leg.aircraft === "A388" ? 60 : 45) * 60000;

export function BoardingPass({ booking, passenger, leg, seat, byCode }: { booking: Booking; passenger: Passenger; leg: Leg; seat: string | null; byCode: Record<string, Airport> }) {
  const from = byCode[leg.from];
  const to = byCode[leg.to];
  const cancelled = booking.status === "CANCELLED";
  if (!from || !to) return null;
  const name = `${passenger.lastName.toUpperCase()}/${passenger.firstName.toUpperCase()} ${passenger.title?.toUpperCase() ?? ""}`.trim();
  // Simplified IATA BCBP-style payload.
  const qr = `M1${name.padEnd(20).slice(0, 20)}E${booking.pnr} ${leg.from}${leg.to}IN ${leg.flightNo.slice(2).padStart(4, "0")} ${leg.date} ${seat ?? "---"}`;

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        borderRadius: "24px",
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        opacity: cancelled ? 0.55 : 1,
        breakInside: "avoid",
      }}
    >
      <Box sx={{ flex: 1, p: 3, color: "#fff", background: "linear-gradient(135deg, #06283D, #0A4D68 60%, #088395)" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PeacockMark size={28} />
            <Typography sx={{ fontWeight: 700 }}>Indian.com</Typography>
          </Box>
          <Typography variant="overline" sx={{ color: "#D4A72C" }}>{cancelled ? "Cancelled" : `${CABIN_LABEL[booking.cabin]} · boarding pass`}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h3" component="div">{leg.from}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>{from.city}</Typography>
          </Box>
          <Box sx={{ flex: 1, borderTop: "2px dashed rgba(255,255,255,.4)", position: "relative" }}>
            <FlightIcon sx={{ position: "absolute", left: "50%", top: -13, transform: "translateX(-50%) rotate(90deg)", color: "#D4A72C" }} />
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h3" component="div">{leg.to}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>{to.city}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 2 }}>
          <Field label="Passenger" value={`${passenger.firstName} ${passenger.lastName}`} />
          <Field label="Flight" value={leg.flightNo.replace("IN", "IN ")} />
          <Field label="Date" value={formatDate(leg.depUtc, from.tz)} />
          <Field label="Boarding" value={formatTime(boardingUtc(leg), from.tz)} />
          <Field label="Departs" value={formatTime(leg.depUtc, from.tz)} />
          <Field label="Seat" value={seat ?? "At check-in"} />
        </Box>
      </Box>
      <Box
        sx={{
          width: { sm: 200 },
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          bgcolor: "background.paper",
          borderLeft: { sm: "2px dashed" },
          borderTop: { xs: "2px dashed", sm: "none" },
          borderColor: { xs: "divider", sm: "divider" },
        }}
      >
        <Box sx={{ p: 1, bgcolor: "#fff", borderRadius: 2 }}>
          <QRCodeSVG value={qr} size={120} fgColor="#06283D" />
        </Box>
        <Typography variant="caption" color="text.secondary">Booking ref</Typography>
        <Typography variant="h6" sx={{ letterSpacing: "0.15em", mt: -1 }}>{booking.pnr}</Typography>
      </Box>
    </Paper>
  );
}
