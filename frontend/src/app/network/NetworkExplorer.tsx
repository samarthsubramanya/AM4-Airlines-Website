"use client";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";
import { useNetwork } from "@/lib/hooks";

const NetworkMap = dynamic(() => import("@/components/NetworkMap"), { ssr: false, loading: () => <Skeleton variant="rounded" height="100%" sx={{ borderRadius: 6 }} /> });

export function NetworkExplorer() {
  const { data } = useNetwork();
  const [focus, setFocus] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const hubs = useMemo(() => (data?.airports || []).filter((a) => a.hub).sort((a, b) => (a.hub === "primary" ? -1 : b.hub === "primary" ? 1 : a.city.localeCompare(b.city))), [data]);
  const stats = useMemo(() => {
    if (!data) return null;
    return {
      destinations: data.airports.length,
      countries: new Set(data.airports.map((a) => a.country)).size,
      routes: data.links.length,
      weekly: data.links.reduce((s, l) => s + l.weeklyFlights * 2, 0),
    };
  }, [data]);

  const focused = data?.airports.find((a) => a.code === focus);
  const destinations = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const list = focus
      ? data.links.filter((l) => l.from === focus || l.to === focus).map((l) => data.airports.find((a) => a.code === (l.from === focus ? l.to : l.from))!)
      : data.airports;
    return list.filter((a) => !q || `${a.city} ${a.code} ${a.country}`.toLowerCase().includes(q)).sort((a, b) => a.city.localeCompare(b.city));
  }, [data, focus, query]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="overline" color="primary">Where we fly</Typography>
      <Typography variant="h3" component="h1">Our route network</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 680 }}>
        Bengaluru is our home, and eight hubs carry you on to six continents. Gold lines are hub-to-hub trunk routes. Pick a hub or tap any airport.
      </Typography>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            [stats.destinations, "Destinations"],
            [stats.countries, "Countries & territories"],
            [stats.routes, "Nonstop routes"],
            [stats.weekly, "Flights every week"],
          ].map(([n, label]) => (
            <Grid key={label} size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">{formatNumber(n as number)}</Typography>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Stack direction="row" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Chip label="All routes" color={!focus ? "primary" : "default"} onClick={() => setFocus(null)} />
        {hubs.map((h) => (
          <Chip key={h.code} label={`${h.city}`} color={focus === h.code ? "primary" : "default"} variant={h.hub === "primary" ? "filled" : "outlined"} onClick={() => setFocus(h.code)} />
        ))}
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8.5 }} sx={{ height: { xs: 380, md: 560 } }}>
          {data ? <NetworkMap airports={data.airports} links={data.links} focus={focus} onFocus={setFocus} /> : <Skeleton variant="rounded" height="100%" sx={{ borderRadius: 6 }} />}
        </Grid>
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Card sx={{ height: { md: 560 }, display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6">{focused ? `Nonstop from ${focused.city}` : "All destinations"}</Typography>
              <TextField size="small" placeholder="Search destinations" value={query} onChange={(e) => setQuery(e.target.value)} sx={{ mt: 1 }} />
            </CardContent>
            <Box sx={{ overflow: "auto", flex: 1, maxHeight: { xs: 320, md: "none" } }}>
              <List dense>
                {destinations.map((a) => (
                  <ListItemButton key={a.code} selected={a.code === focus} onClick={() => setFocus(a.code)}>
                    <ListItemText primary={`${a.city} (${a.code})`} secondary={a.country} />
                    {a.hub && <Chip size="small" label={a.hub === "primary" ? "Main hub" : "Hub"} color={a.hub === "primary" ? "secondary" : "success"} variant="outlined" />}
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
