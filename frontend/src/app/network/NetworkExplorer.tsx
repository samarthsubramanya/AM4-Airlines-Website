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
import { AIRLINE, AirlineMark } from "@/components/Airline";
import { formatNumber } from "@/lib/format";
import { useNetwork } from "@/lib/hooks";

const NetworkMap = dynamic(() => import("@/components/NetworkMap"), { ssr: false, loading: () => <Skeleton variant="rounded" height="100%" sx={{ borderRadius: 6 }} /> });

type Layer = "IN" | "IS" | "cargo";

export function NetworkExplorer() {
  const { data } = useNetwork();
  const [focus, setFocus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ IN: true, IS: true, cargo: false });

  const links = useMemo(
    () => (data?.links || []).filter((l) => (l.cargo ? layers.cargo : layers[l.operator as "IN" | "IS"])),
    [data, layers],
  );
  const airports = useMemo(() => {
    const served = new Set(links.flatMap((l) => [l.from, l.to]));
    return (data?.airports || []).filter((a) => served.has(a.code) || a.hub);
  }, [data, links]);
  const hubs = useMemo(() => airports.filter((a) => a.hub).sort((a, b) => (a.hub === "primary" ? -1 : b.hub === "primary" ? 1 : a.city.localeCompare(b.city))), [airports]);

  const stats = useMemo(() => {
    if (!data) return null;
    const pax = data.links.filter((l) => !l.cargo);
    return [
      [new Set(data.links.flatMap((l) => [l.from, l.to])).size, "Airports served"],
      [new Set(data.airports.map((a) => a.country)).size, "Countries & territories"],
      [pax.length, "Passenger routes"],
      [data.links.length - pax.length, "Indus Cargo routes"],
      [pax.reduce((s, l) => s + l.weeklyFlights * 2, 0), "Passenger flights a week"],
      [new Set(data.links.map((l) => l.registration)).size, "Aircraft"],
    ] as const;
  }, [data]);

  const focused = data?.airports.find((a) => a.code === focus);
  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (focus) {
      return links
        .filter((l) => l.from === focus || l.to === focus)
        .map((l) => ({ l, a: data.airports.find((x) => x.code === (l.from === focus ? l.to : l.from))! }))
        .filter(({ a }) => !q || `${a.city} ${a.code} ${a.country}`.toLowerCase().includes(q))
        .sort((x, y) => x.a.city.localeCompare(y.a.city));
    }
    return airports
      .filter((a) => !q || `${a.city} ${a.code} ${a.country}`.toLowerCase().includes(q))
      .sort((a, b) => a.city.localeCompare(b.city))
      .map((a) => ({ l: null, a }));
  }, [data, links, airports, focus, query]);

  const toggle = (k: Layer) => setLayers((s) => ({ ...s, [k]: !s[k] }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="overline" color="primary">Where we fly</Typography>
      <Typography variant="h3" component="h1">Our route network</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 720 }}>
        Indian.com flies every route to and from India. Our global subsidiary Indus Air connects the rest of the world, and Indus Cargo moves freight.
        Anywhere else, our Australia World partners take you the rest of the way.
      </Typography>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map(([n, label]) => (
            <Grid key={label} size={{ xs: 6, sm: 4, md: 2 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h5" color="primary">{formatNumber(n)}</Typography>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Stack direction="row" sx={{ mb: 1.5, flexWrap: "wrap", gap: 1 }}>
        {(["IN", "IS"] as const).map((c) => (
          <Chip key={c} avatar={<Box sx={{ bgcolor: "transparent !important" }}><AirlineMark code={c} size={20} /></Box>} label={AIRLINE[c].name} onClick={() => toggle(c)} variant={layers[c] ? "filled" : "outlined"} color={layers[c] ? "primary" : "default"} />
        ))}
        <Chip label="Indus Cargo (freighters)" onClick={() => toggle("cargo")} variant={layers.cargo ? "filled" : "outlined"} color={layers.cargo ? "secondary" : "default"} />
      </Stack>
      <Stack direction="row" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Chip label="All airports" color={!focus ? "primary" : "default"} variant={!focus ? "filled" : "outlined"} onClick={() => setFocus(null)} />
        {hubs.map((h) => (
          <Chip key={h.code} label={h.city} color={focus === h.code ? "primary" : "default"} variant={focus === h.code ? "filled" : "outlined"} onClick={() => setFocus(h.code)} />
        ))}
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8.5 }} sx={{ height: { xs: 380, md: 580 } }}>
          {data ? <NetworkMap airports={airports} links={links} focus={focus} onFocus={setFocus} /> : <Skeleton variant="rounded" height="100%" sx={{ borderRadius: 6 }} />}
        </Grid>
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Card sx={{ height: { md: 580 }, display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6">{focused ? `Routes at ${focused.city}` : "All airports"}</Typography>
              <TextField size="small" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} sx={{ mt: 1 }} />
            </CardContent>
            <Box sx={{ overflow: "auto", flex: 1, maxHeight: { xs: 320, md: "none" } }}>
              <List dense>
                {rows.map(({ l, a }) => (
                  <ListItemButton key={l ? l.routeId : a.code} selected={!l && a.code === focus} onClick={() => setFocus(a.code)}>
                    <ListItemText
                      primary={`${l ? (l.from === focus ? "→ " : "← ") : ""}${a.city} (${a.code})`}
                      secondary={l ? `${l.flightNo} · ${l.aircraft} · ${l.registration} · ${l.weeklyFlights}× weekly${l.cargo ? " · cargo" : ""}` : a.country}
                    />
                    {!l && a.hub && <Chip size="small" label={a.hub === "primary" ? "Main hub" : "Hub"} color={a.hub === "primary" ? "secondary" : "success"} variant="outlined" />}
                    {l && <AirlineMark code={l.operator} size={20} />}
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
