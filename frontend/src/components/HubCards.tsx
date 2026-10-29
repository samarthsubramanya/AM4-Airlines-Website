"use client";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { addDaysISO, todayISO } from "@/lib/format";
import { searchUrl } from "./SearchForm";

// Each hub gets its own feather-inspired gradient.
const HUBS = [
  { code: "DEL", city: "Delhi", tagline: "Gateway to the north", colors: ["#7B2D26", "#D4A72C"] },
  { code: "DXB", city: "Dubai", tagline: "Our bridge to Europe & Africa", colors: ["#A0522D", "#E3B04B"] },
  { code: "SIN", city: "Singapore", tagline: "Heart of Southeast Asia", colors: ["#1B7F5C", "#5FD3A2"] },
  { code: "HKG", city: "Hong Kong", tagline: "East Asia, connected", colors: ["#8E244D", "#E86A92"] },
  { code: "SYD", city: "Sydney", tagline: "Harbour city nonstops", colors: ["#0A4D68", "#088395"] },
  { code: "AKL", city: "Auckland", tagline: "Aotearoa & the Pacific", colors: ["#1E5631", "#88B04B"] },
  { code: "FCO", city: "Rome", tagline: "La dolce vita via da Vinci", colors: ["#5B3A8E", "#B48EDB"] },
  { code: "SFO", city: "San Francisco", tagline: "Bengaluru ⇄ Bay Area nonstop", colors: ["#B33F00", "#F28C28"] },
];

export function HubCards() {
  const date = addDaysISO(todayISO(), 21);
  return (
    <Grid container spacing={2}>
      {HUBS.map((h) => (
        <Grid key={h.code} size={{ xs: 6, md: 3 }}>
          <Card variant="elevation" elevation={0} sx={{ height: "100%", color: "#fff", background: `linear-gradient(135deg, ${h.colors[0]}, ${h.colors[1]})` }}>
            <CardActionArea
              component={Link}
              href={searchUrl({ from: "BLR", to: h.code, date, returnDate: addDaysISO(date, 7), adults: 1, children: 0, cabin: "economy" })}
              sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", minHeight: 150 }}
            >
              <Typography variant="overline" sx={{ opacity: 0.85 }}>BLR → {h.code}</Typography>
              <Typography variant="h5" sx={{ mt: "auto" }}>{h.city}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Typography variant="body2" sx={{ opacity: 0.9, flex: 1 }}>{h.tagline}</Typography>
                <ArrowForward fontSize="small" />
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
