"use client";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { HeroBackdrop } from "@/components/Hero";
import { PeacockMark } from "@/components/Logo";
import { fetcher } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CABIN_LABEL, formatDate, formatNumber } from "@/lib/format";
import { useAirports, useTiers } from "@/lib/hooks";
import type { Account, Booking, Tier } from "@/lib/types";

const TIER_STYLE: Record<string, string> = {
  blue: "linear-gradient(135deg, #0A4D68, #088395)",
  silver: "linear-gradient(135deg, #5F6B73, #C9D3D8)",
  gold: "linear-gradient(135deg, #8A6410, #D4A72C 60%, #F3D27A)",
  royal: "linear-gradient(135deg, #06283D, #1B7F5C 50%, #D4A72C)",
};

function TierGrid({ tiers, current }: { tiers: Tier[]; current?: string }) {
  return (
    <Grid container spacing={2} id="tiers">
      {tiers.map((t) => (
        <Grid key={t.id} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: "100%", borderColor: t.id === current ? "secondary.main" : undefined, borderWidth: t.id === current ? 2 : 1 }}>
            <Box sx={{ height: 8, background: TIER_STYLE[t.id] }} />
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">{t.name}</Typography>
                {t.id === current && <Chip size="small" color="secondary" label="You" />}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t.minMiles ? `${formatNumber(t.minMiles)} miles flown` : "Free to join"}
              </Typography>
              {t.perks.map((p) => (
                <Stack key={p} direction="row" spacing={1} sx={{ mb: 0.75 }}>
                  <CheckCircleOutline color="success" sx={{ fontSize: 18, mt: "2px" }} />
                  <Typography variant="body2">{p}</Typography>
                </Stack>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function TripRow({ b }: { b: Booking }) {
  const { byCode } = useAirports();
  const first = b.journeys[0].legs[0];
  const a = byCode[first.from];
  const z = byCode[b.journeys[0].legs.at(-1)!.to];
  return (
    <Card>
      <CardActionArea component={Link} href={`/booking/${b.pnr}?lastName=${encodeURIComponent(b.passengers[0].lastName)}`} sx={{ p: 2, display: "flex", gap: 2, justifyContent: "flex-start" }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>{a?.city ?? first.from} → {z?.city}{b.journeys.length > 1 ? " · return" : ""}</Typography>
          <Typography variant="body2" color="text.secondary">
            {a && formatDate(first.depUtc, a.tz)} · {CABIN_LABEL[b.cabin]} · {b.pnr}
          </Typography>
        </Box>
        {b.status === "CANCELLED" ? <Chip size="small" color="error" variant="outlined" label="Cancelled" /> : <Chip size="small" color="success" variant="outlined" label={`+${formatNumber(b.milesEarned)} mi`} />}
      </CardActionArea>
    </Card>
  );
}

function Dashboard() {
  const { data, error, isLoading } = useSWR<Account>("/me", fetcher);
  const { data: tiers } = useTiers();
  const [tab, setTab] = useState(0);
  const [now] = useState(() => Date.now());
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (isLoading || !data) return <Skeleton variant="rounded" height={260} />;
  const { loyalty, user, bookings } = data;
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED" && b.journeys.at(-1)!.legs.at(-1)!.arrUtc >= now);
  const past = bookings.filter((b) => !upcoming.includes(b));
  const progress = loyalty.next ? ((loyalty.miles - loyalty.current.minMiles) / (loyalty.next.minMiles - loyalty.current.minMiles)) * 100 : 100;

  return (
    <Stack spacing={4}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ borderRadius: "24px", p: 3, color: "#fff", background: TIER_STYLE[loyalty.current.id], aspectRatio: "1.6", display: "flex", flexDirection: "column", boxShadow: 6 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="overline">{loyalty.current.name}</Typography>
              <PeacockMark size={40} />
            </Stack>
            <Box sx={{ mt: "auto" }}>
              <Typography variant="h5">{user.name}</Typography>
              <Typography sx={{ letterSpacing: "0.2em", opacity: 0.85 }}>{loyalty.memberId}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="overline" color="text.secondary">Miles balance</Typography>
              <Typography variant="h2" color="primary">{formatNumber(loyalty.miles)}</Typography>
              {loyalty.pending > 0 && (
                <Typography color="text.secondary">+ {formatNumber(loyalty.pending)} pending from upcoming trips</Typography>
              )}
              <Box sx={{ mt: 3 }}>
                <LinearProgress variant="determinate" value={Math.min(100, progress)} color="secondary" sx={{ height: 10, borderRadius: 5 }} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {loyalty.next ? `${formatNumber(loyalty.toNext)} miles to ${loyalty.next.name}` : "You've reached our highest tier. Thank you!"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Upcoming (${upcoming.length})`} />
          <Tab label={`Past & cancelled (${past.length})`} />
        </Tabs>
        <Stack spacing={1.5}>
          {(tab ? past : upcoming).map((b) => <TripRow key={b.pnr} b={b} />)}
          {!(tab ? past : upcoming).length && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>No trips here yet.</Typography>
              <Button component={Link} href="/" variant="contained">Book a flight</Button>
            </Box>
          )}
        </Stack>
      </Box>

      {tiers && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Membership tiers</Typography>
          <TierGrid tiers={tiers} current={loyalty.current.id} />
        </Box>
      )}
    </Stack>
  );
}

export function MilesDashboard() {
  const { user, ready } = useAuth();
  const { data: tiers } = useTiers();
  return (
    <>
      <HeroBackdrop minHeight={240}>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Typography variant="overline" sx={{ color: "secondary.main" }}>Frequent flyer programme</Typography>
          <Typography variant="h3" component="h1">Mayur Miles</Typography>
          <Typography sx={{ opacity: 0.85, mt: 1, maxWidth: 560 }}>
            Earn 1× miles in Economy, 2× in Business and 3× in First, for every mile you fly with Indian.com.
          </Typography>
        </Container>
      </HeroBackdrop>
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        {!ready ? null : user ? (
          <Dashboard />
        ) : (
          <Stack spacing={4}>
            <Card>
              <CardContent sx={{ p: 4, display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
                <PeacockMark size={56} />
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography variant="h5">Join free and start earning</Typography>
                  <Typography color="text.secondary">Sign in before you book and miles are added to your account automatically.</Typography>
                </Box>
                <Button component={Link} href="/login?next=/miles" variant="contained" size="large">Sign in or join</Button>
              </CardContent>
            </Card>
            {tiers ? <TierGrid tiers={tiers} /> : <Skeleton variant="rounded" height={220} />}
          </Stack>
        )}
      </Container>
    </>
  );
}
