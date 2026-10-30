"use client";
import AirlineSeatFlat from "@mui/icons-material/AirlineSeatFlat";
import AirlineSeatReclineNormal from "@mui/icons-material/AirlineSeatReclineNormal";
import AirplanemodeActive from "@mui/icons-material/AirplanemodeActive";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { HeroBackdrop } from "@/components/Hero";
import { CABIN_LABEL, formatNumber } from "@/lib/format";
import { useFleet } from "@/lib/hooks";
import type { Cabin } from "@/lib/types";

const CABIN_ICON = { first: <AirlineSeatFlat />, business: <AirlineSeatFlat />, economy: <AirlineSeatReclineNormal /> };

export function FleetGallery() {
  const { data } = useFleet();
  const total = data?.aircraft.reduce((s, a) => s + a.count, 0);
  const aircraft = [...(data?.aircraft || [])].sort((a, b) => Number(a.cargo) - Number(b.cargo) || b.count - a.count);

  return (
    <>
      <HeroBackdrop minHeight={240}>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Typography variant="overline" sx={{ color: "secondary.main" }}>{total ? `${total} aircraft` : "Our fleet"}</Typography>
          <Typography variant="h3" component="h1">Each one named for the peacock</Typography>
          <Typography sx={{ opacity: 0.85, mt: 1, maxWidth: 600 }}>
            From the double-deck A380 &ldquo;Mayur Mahal&rdquo; to the 737 MAX 10 &ldquo;Morni&rdquo;, private jets and the Indus Cargo freighters, every aircraft carries our feathered livery.
          </Typography>
        </Container>
      </HeroBackdrop>
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Grid container spacing={3}>
          {!data && Array.from({ length: 4 }, (_, i) => <Grid key={i} size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={320} /></Grid>)}
          {aircraft.map((a) => {
            const totalSeats = Object.values(a.seats).reduce((s, n) => s + (n || 0), 0);
            return (
              <Grid key={a.code} size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: "100%" }}>
                  <Box sx={{ height: 140, position: "relative", background: "linear-gradient(120deg, #06283D, #0A4D68 50%, #1B7F5C)", color: "#fff", p: 3, overflow: "hidden" }}>
                    <AirplanemodeActive sx={{ position: "absolute", right: -10, bottom: -30, fontSize: 200, opacity: 0.15, transform: "rotate(45deg)" }} />
                    <Typography variant="overline" sx={{ color: "#D4A72C" }}>&ldquo;{a.nickname}&rdquo;</Typography>
                    <Typography variant="h5">{a.name}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip size="small" label={`× ${a.count} in service`} sx={{ bgcolor: "rgba(255,255,255,.15)", color: "#fff" }} />
                      <Chip size="small" label={a.category} sx={{ bgcolor: a.cargo ? "#D4A72C" : "rgba(255,255,255,.15)", color: a.cargo ? "#06283D" : "#fff" }} />
                    </Stack>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Typography color="text.secondary">{a.description}</Typography>
                    <Grid container spacing={2} sx={{ my: 1 }}>
                      {[
                        a.cargo ? [`${a.cargoTonnes} t`, "Payload"] : [formatNumber(totalSeats), "Seats"],
                        [`${formatNumber(a.rangeKm)} km`, "Range"],
                        [`${a.cruiseKmh} km/h`, "Cruise"],
                        [a.routes, "Routes"],
                      ].map(([v, l]) => (
                        <Grid key={l as string} size={3}>
                          <Typography sx={{ fontWeight: 700 }}>{v}</Typography>
                          <Typography variant="caption" color="text.secondary">{l}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                    {!a.cargo && <Divider sx={{ my: 2 }} />}
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                      {(["first", "business", "economy"] as Cabin[]).filter((c) => a.seats[c]).map((c) => (
                        <Chip key={c} icon={CABIN_ICON[c]} variant="outlined" label={`${CABIN_LABEL[c]} · ${a.seats[c]}`} />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {data && (
          <Box sx={{ mt: 8 }}>
            <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Cabins</Typography>
            <Grid container spacing={2}>
              {(["economy", "business", "first"] as Cabin[]).map((c) => (
                <Grid key={c} size={{ xs: 12, md: 4 }}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6">{data.cabins[c].label}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Baggage: {data.cabins[c].baggage}</Typography>
                      {data.cabins[c].perks.map((p) => <Typography key={p} variant="body2" sx={{ mb: 0.5 }}>• {p}</Typography>)}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </>
  );
}
