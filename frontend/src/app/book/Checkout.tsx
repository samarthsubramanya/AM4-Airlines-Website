"use client";
import Lock from "@mui/icons-material/LockOutlined";
import Spa from "@mui/icons-material/Spa";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SeatMap } from "@/components/SeatMap";
import { TripSummary } from "@/components/TripSummary";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { useAirports } from "@/lib/hooks";
import { useTrip } from "@/lib/trip";
import type { Booking, PassengerInput } from "@/lib/types";

const STEPS = ["Travellers", "Seats", "Payment"];
const NAME_RE = /^[\p{L}' .-]+$/u;
const ADULT_TITLES = ["Mr", "Ms", "Mrs", "Mx", "Dr"];
const CHILD_TITLES = ["Mstr", "Miss", "Mx"];

function blankPassengers(adults: number, children: number, legsPerJourney: number[]): PassengerInput[] {
  const seats = () => legsPerJourney.map((n) => Array<string | null>(n).fill(null));
  return [
    ...Array.from({ length: adults }, () => ({ type: "adult" as const, title: "", firstName: "", lastName: "", dob: "", seats: seats() })),
    ...Array.from({ length: children }, () => ({ type: "child" as const, title: "", firstName: "", lastName: "", dob: "", seats: seats() })),
  ];
}

function ageOn(dob: string, date: string) {
  const b = new Date(dob);
  const d = new Date(date);
  let age = d.getFullYear() - b.getFullYear();
  if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) age--;
  return age;
}

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

function estimateMiles(km: number, cabin: string, pax: number) {
  const rate = cabin === "first" ? 3 : cabin === "business" ? 2 : 1;
  return Math.round(km * 0.621371 * rate) * pax;
}

export function Checkout() {
  const router = useRouter();
  const { trip, ready, update } = useTrip();
  const { user } = useAuth();
  const { byCode } = useAirports();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [seatTab, setSeatTab] = useState(0);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", holder: "" });

  const legsPerJourney = useMemo(() => trip?.journeys.map((j) => j.legs.length) || [], [trip]);
  const passengers = useMemo(
    () => trip?.passengers || (trip ? blankPassengers(trip.query.adults, trip.query.children, legsPerJourney) : []),
    [trip, legsPerJourney],
  );
  const contact = trip?.contact || { email: user?.email || "", phone: "" };

  // Prefill the lead traveller from the signed-in account.
  useEffect(() => {
    if (!trip || trip.passengers || !user) return;
    const [first, ...rest] = user.name.split(" ");
    const ps = blankPassengers(trip.query.adults, trip.query.children, legsPerJourney);
    ps[0] = { ...ps[0], firstName: first, lastName: rest.join(" ") };
    update({ passengers: ps, contact: { email: user.email, phone: trip.contact?.phone || "" } });
  }, [trip, user, legsPerJourney, update]);

  if (!ready) return null;
  if (!trip) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h5">Your booking session has expired</Typography>
        <Typography color="text.secondary" sx={{ my: 2 }}>Search again to pick your flights.</Typography>
        <Button component={Link} href="/" variant="contained">Search flights</Button>
      </Container>
    );
  }

  const allLegs = trip.journeys.flatMap((j, ji) => j.legs.map((leg, li) => ({ leg, ji, li })));
  const firstDeparture = trip.journeys[0].legs[0].date;
  const lastDeparture = trip.journeys.at(-1)!.legs[0].date;

  const setPassenger = (i: number, patch: Partial<PassengerInput>) =>
    update({ passengers: passengers.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const setContact = (patch: Partial<typeof contact>) => update({ contact: { ...contact, ...patch } });

  const validateTravellers = () => {
    const e: Record<string, string> = {};
    passengers.forEach((p, i) => {
      if (!p.title) e[`${i}.title`] = "Required";
      if (!p.firstName.trim()) e[`${i}.firstName`] = "Required";
      else if (!NAME_RE.test(p.firstName)) e[`${i}.firstName`] = "Letters only, as on passport";
      if (!p.lastName.trim()) e[`${i}.lastName`] = "Required";
      else if (!NAME_RE.test(p.lastName)) e[`${i}.lastName`] = "Letters only, as on passport";
      if (!p.dob) e[`${i}.dob`] = "Required";
      else {
        const age = ageOn(p.dob, firstDeparture);
        const ageAtReturn = ageOn(p.dob, lastDeparture);
        if (age < 0 || p.dob > firstDeparture) e[`${i}.dob`] = "Check the date";
        else if (p.type === "adult" && age < 12) e[`${i}.dob`] = "Adults must be 12 or older";
        else if (p.type === "child" && (age < 2 || ageAtReturn > 11)) e[`${i}.dob`] = "Children must be 2–11 when travelling";
      }
    });
    if (!/^\S+@\S+\.\S+$/.test(contact.email)) e.email = "Enter a valid email";
    if (contact.phone.replace(/\D/g, "").length < 6) e.phone = "Enter a phone number";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validatePayment = () => {
    const e: Record<string, string> = {};
    const digits = card.number.replace(/\s/g, "");
    if (digits.length < 13) e.number = "Enter the full card number";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) e.expiry = "MM/YY";
    if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = "3–4 digits";
    if (card.holder.trim().length < 2) e.holder = "Name on card";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (step === 0 && !validateTravellers()) return;
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pay = async () => {
    if (!validatePayment()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const booking = await api<Booking>("/bookings", {
        method: "POST",
        json: {
          journeys: trip.journeys.map((j) => ({ itineraryId: j.id })),
          cabin: trip.cabin,
          passengers: passengers.map((p) => ({ ...p, firstName: p.firstName.trim(), lastName: p.lastName.trim() })),
          contact,
          payment: { cardNumber: card.number.replace(/\s/g, ""), expiry: card.expiry, cvc: card.cvc, holder: card.holder },
        },
      });
      try {
        sessionStorage.setItem(`indiancom.booking.${booking.pnr}`, JSON.stringify(booking));
      } catch {
        // fine — the confirmation page can refetch
      }
      router.push(`/booking/${booking.pnr}?lastName=${encodeURIComponent(booking.passengers[0].lastName)}`);
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitting(false);
    }
  };

  const travellerNames = passengers.map((p, i) => p.firstName.trim() || `Traveller ${i + 1}`);
  const totalKm = trip.journeys.reduce((s, j) => s + j.km, 0);
  const miles = estimateMiles(totalKm, trip.cabin, passengers.length);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
      </Stepper>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {step === 0 && (
            <Stack spacing={2}>
              {!user && (
                <Alert severity="info" icon={<Spa />} action={<Button component={Link} href="/login?next=/book" color="inherit" size="small">Sign in</Button>}>
                  Sign in to earn about {formatNumber(miles)} Mayur Miles on this trip.
                </Alert>
              )}
              {passengers.map((p, i) => (
                <Card key={i}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6">{p.type === "adult" ? "Adult" : "Child"} {i + 1}{i === 0 ? " · lead traveller" : ""}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Enter names exactly as they appear on the passport.</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 2.5 }}>
                        <TextField select label="Title" value={p.title || ""} onChange={(e) => setPassenger(i, { title: e.target.value })} error={!!errors[`${i}.title`]} helperText={errors[`${i}.title`]}>
                          {(p.type === "adult" ? ADULT_TITLES : CHILD_TITLES).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4.75 }}>
                        <TextField label="First & middle names" autoComplete={i === 0 ? "given-name" : "off"} value={p.firstName} onChange={(e) => setPassenger(i, { firstName: e.target.value })} error={!!errors[`${i}.firstName`]} helperText={errors[`${i}.firstName`]} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4.75 }}>
                        <TextField label="Last name" autoComplete={i === 0 ? "family-name" : "off"} value={p.lastName} onChange={(e) => setPassenger(i, { lastName: e.target.value })} error={!!errors[`${i}.lastName`]} helperText={errors[`${i}.lastName`]} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField type="date" label="Date of birth" value={p.dob} onChange={(e) => setPassenger(i, { dob: e.target.value })} error={!!errors[`${i}.dob`]} helperText={errors[`${i}.dob`]} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: firstDeparture } }} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Contact details</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField type="email" label="Email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ email: e.target.value })} error={!!errors.email} helperText={errors.email || "We'll send your e-ticket here"} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField type="tel" label="Mobile number" autoComplete="tel" placeholder="+91 98765 43210" value={contact.phone} onChange={(e) => setContact({ phone: e.target.value })} error={!!errors.phone} helperText={errors.phone || "For flight updates"} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          )}

          {step === 1 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6">Choose your seats</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Seat selection is free. Skip it and we&apos;ll assign seats at check-in.
                </Typography>
                <Tabs value={seatTab} onChange={(_e, v) => setSeatTab(v)} variant="scrollable" sx={{ mb: 2 }}>
                  {allLegs.map(({ leg }) => (
                    <Tab key={leg.key} label={`${leg.from} → ${leg.to}`} />
                  ))}
                </Tabs>
                {allLegs.map(({ leg, ji, li }, idx) =>
                  idx === seatTab ? (
                    <SeatMap
                      key={leg.key}
                      leg={leg}
                      cabin={trip.cabin}
                      travellers={travellerNames}
                      value={passengers.map((p) => p.seats[ji]?.[li] ?? null)}
                      onChange={(t, seat) =>
                        update({
                          passengers: passengers.map((p, pi) => {
                            if (pi !== t) return p;
                            const seats = p.seats.map((j) => [...j]);
                            seats[ji][li] = seat;
                            return { ...p, seats };
                          }),
                        })
                      }
                    />
                  ) : null,
                )}
                {byCode[allLegs[seatTab]?.leg.from] && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {byCode[allLegs[seatTab].leg.from].city} to {byCode[allLegs[seatTab].leg.to]?.city} · {allLegs[seatTab].leg.flightNo}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                  <Lock color="success" fontSize="small" />
                  <Typography variant="h6">Payment</Typography>
                </Stack>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  Demo checkout — no money is taken. Use test card <strong>4242 4242 4242 4242</strong>, any future expiry and any CVC.
                  Card <strong>4000 0000 0000 0002</strong> shows a decline.
                </Alert>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField label="Card number" autoComplete="cc-number" value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} error={!!errors.number} helperText={errors.number} slotProps={{ htmlInput: { inputMode: "numeric" } }} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Expiry"
                      placeholder="MM/YY"
                      autoComplete="cc-exp"
                      value={card.expiry}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCard({ ...card, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
                      }}
                      error={!!errors.expiry}
                      helperText={errors.expiry}
                      slotProps={{ htmlInput: { inputMode: "numeric" } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField label="CVC" autoComplete="cc-csc" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} error={!!errors.cvc} helperText={errors.cvc} slotProps={{ htmlInput: { inputMode: "numeric" } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Name on card" autoComplete="cc-name" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} error={!!errors.holder} helperText={errors.holder} />
                  </Grid>
                </Grid>
                {user && (
                  <Alert severity="success" icon={<Spa />} sx={{ mt: 3 }}>
                    You&apos;ll earn about {formatNumber(miles)} Mayur Miles once you fly.
                  </Alert>
                )}
                {submitError && <Alert severity="error" sx={{ mt: 3 }}>{submitError}</Alert>}
              </CardContent>
            </Card>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3, gap: 2 }}>
            <Button onClick={() => (step ? setStep(step - 1) : router.back())} disabled={submitting}>Back</Button>
            {step < 2 ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                {step === 1 && <Button onClick={next}>Skip seats</Button>}
                <Button variant="contained" size="large" onClick={next}>Continue</Button>
              </Box>
            ) : (
              <Button variant="contained" color="secondary" size="large" onClick={pay} disabled={submitting} startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Lock />}>
                {submitting ? "Confirming…" : "Pay & book"}
              </Button>
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ position: { md: "sticky" }, top: 88 }}>
            <TripSummary trip={trip} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
