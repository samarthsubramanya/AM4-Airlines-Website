import CardMembership from "@mui/icons-material/CardMembership";
import ConnectingAirports from "@mui/icons-material/ConnectingAirports";
import Luggage from "@mui/icons-material/Luggage";
import Weekend from "@mui/icons-material/Weekend";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { AIRLINE, AirlineMark } from "@/components/Airline";
import { HeroBackdrop } from "@/components/Hero";
import { LinkButton } from "@/components/LinkButton";
import type { AirlineCode } from "@/lib/types";

export const metadata: Metadata = { title: "Australia World alliance" };

const BENEFITS = [
  { icon: <ConnectingAirports />, title: "One ticket, many airlines", body: "Book partner flights on one Indian.com ticket, with protected connections if a flight is delayed." },
  { icon: <Luggage />, title: "Bags checked through", body: "Check in once and your bags travel to your final destination, even across partner airlines." },
  { icon: <Weekend />, title: "Lounges worldwide", body: "Mayur Gold and Royal Peacock members relax in alliance lounges at hubs around the world." },
  { icon: <CardMembership />, title: "Status that travels", body: "Earn Mayur Miles on every alliance flight booked through us, and keep your perks with every member." },
];

const MEMBERS: { code: AirlineCode; role: string; body: string }[] = [
  { code: "IN", role: "Founding member", body: "Every route to and from India, from our Bengaluru home and Delhi hub." },
  { code: "IS", role: "Indian.com group", body: "Our global subsidiary, linking Asia, Oceania, Europe and the Americas without touching India." },
  { code: "QS", role: "Partner", body: "Takes you further across Australia, New Zealand and the Pacific islands." },
  { code: "GR", role: "Partner", body: "Covers Europe, Africa and the Americas where Indus Air doesn't fly." },
  { code: "RB", role: "Partner", body: "Fills in across Asia, the Middle East and Africa, including domestic connections." },
];

export default function AlliancePage() {
  return (
    <>
      <HeroBackdrop minHeight={300}>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="overline" sx={{ color: "secondary.main" }}>Alliance membership</Typography>
          <Typography variant="h3" component="h1">Australia World</Typography>
          <Typography sx={{ opacity: 0.85, mt: 1, maxWidth: 640 }}>
            Indian.com, Indus Air, Quantas, GRR and Ruby Air fly together as Australia World. When we don&apos;t fly a route ourselves, search
            results show alliance codeshares, booked and supported by Indian.com.
          </Typography>
        </Container>
      </HeroBackdrop>
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 2 }}>Members</Typography>
        <Grid container spacing={2}>
          {MEMBERS.map((m) => (
            <Grid key={m.code} size={{ xs: 12, sm: 6, md: m.code === "IN" || m.code === "IS" ? 6 : 4 }}>
              <Card sx={{ height: "100%", borderTop: 4, borderTopColor: AIRLINE[m.code].color }}>
                <CardContent sx={{ p: 3, display: "flex", gap: 2 }}>
                  <AirlineMark code={m.code} size={48} />
                  <Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                      <Typography variant="h6">{AIRLINE[m.code].name}</Typography>
                      <Chip size="small" label={m.role} variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{m.body}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2} sx={{ mt: 4 }}>
          {BENEFITS.map((b) => (
            <Grid key={b.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: "secondary.main", color: "secondary.contrastText", display: "grid", placeItems: "center", mb: 2 }}>{b.icon}</Box>
                  <Typography variant="h6">{b.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{b.body}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Card sx={{ mt: 4 }}>
          <CardContent sx={{ p: 4, display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
            <Box sx={{ flex: 1, minWidth: 240 }}>
              <Typography variant="h5">See where we fly</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Explore every Indian.com, Indus Air and Indus Cargo route on the map.
              </Typography>
            </Box>
            <LinkButton href="/network" variant="contained" size="large">Explore the route map</LinkButton>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
