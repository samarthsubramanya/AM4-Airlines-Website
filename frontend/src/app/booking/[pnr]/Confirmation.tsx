"use client";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookingView } from "@/components/BookingView";
import { api } from "@/lib/api";
import { useTrip } from "@/lib/trip";
import type { Booking } from "@/lib/types";

export function Confirmation() {
  const { pnr } = useParams<{ pnr: string }>();
  const lastName = useSearchParams().get("lastName") || "";
  const { setTrip } = useTrip();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    let cached: Booking | null = null;
    try {
      const raw = sessionStorage.getItem(`indiancom.booking.${pnr}`);
      if (raw) cached = JSON.parse(raw);
    } catch {
      // ignore
    }
    if (cached) {
      // Just booked: show the confirmation from the checkout response, then forget the trip.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBooking(cached);
      setFresh(true);
      setTrip(null);
      try {
        sessionStorage.removeItem(`indiancom.booking.${pnr}`);
      } catch {
        // ignore
      }
      return;
    }
    api<Booking>(`/bookings/${pnr}?lastName=${encodeURIComponent(lastName)}`).then(setBooking, (e) => setError(e.message));
  }, [pnr, lastName, setTrip]);

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      {fresh && booking && (
        <Box sx={{ textAlign: "center", mb: 4 }} className="no-print">
          <CheckCircle color="success" sx={{ fontSize: 64 }} />
          <Typography variant="h3" component="h1" sx={{ mt: 1 }}>You&apos;re booked!</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Your e-ticket is on its way to {booking.contact.email}. Keep your booking reference handy.
          </Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" action={<Button component={Link} href="/manage" color="inherit">Find booking</Button>}>{error}</Alert>
      )}
      {!booking && !error && <Skeleton variant="rounded" height={420} />}
      {booking && <BookingView booking={booking} onChange={setBooking} />}
    </Container>
  );
}
