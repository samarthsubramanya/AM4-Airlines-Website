"use client";
import Search from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { BookingView } from "@/components/BookingView";
import { HeroBackdrop } from "@/components/Hero";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";

export function ManageBooking() {
  const params = useSearchParams();
  const [pnr, setPnr] = useState(params.get("pnr") || "");
  const [lastName, setLastName] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const find = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pnr.trim().length !== 6 || !lastName.trim()) {
      setError("Enter your 6-character booking reference and the last name of any traveller.");
      return;
    }
    setLoading(true);
    setError("");
    setBooking(null);
    try {
      setBooking(await api<Booking>(`/bookings/${pnr.trim().toUpperCase()}?lastName=${encodeURIComponent(lastName.trim())}`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HeroBackdrop minHeight={260}>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Typography variant="h3" component="h1">Manage your booking</Typography>
          <Typography sx={{ opacity: 0.85, mt: 1 }}>View your itinerary, get boarding passes or cancel a trip.</Typography>
        </Container>
      </HeroBackdrop>
      <Container maxWidth="md" sx={{ mt: -5 }}>
        <Paper component="form" onSubmit={find} elevation={6} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Booking reference" placeholder="e.g. K7PX2M" value={pnr} onChange={(e) => setPnr(e.target.value.toUpperCase().slice(0, 6))} slotProps={{ htmlInput: { style: { letterSpacing: "0.15em", fontWeight: 700 } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField label="Last name" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Button type="submit" variant="contained" size="large" fullWidth sx={{ height: 56 }} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Search />} disabled={loading}>
                Find
              </Button>
            </Grid>
          </Grid>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>
        {booking ? <BookingView booking={booking} onChange={setBooking} /> : (
          <Box sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
            <Typography variant="body2">Your booking reference is in your confirmation email and on every boarding pass.</Typography>
          </Box>
        )}
      </Container>
    </>
  );
}
