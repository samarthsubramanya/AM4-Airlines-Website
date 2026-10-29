import CardMembership from "@mui/icons-material/CardMembership";
import ConnectingAirports from "@mui/icons-material/ConnectingAirports";
import Luggage from "@mui/icons-material/Luggage";
import Weekend from "@mui/icons-material/Weekend";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { LinkButton } from "@/components/LinkButton";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { HeroBackdrop } from "@/components/Hero";

export const metadata: Metadata = { title: "Australia World alliance" };

const BENEFITS = [
  { icon: <ConnectingAirports />, title: "One ticket, many airlines", body: "Connect onto partner flights on a single booking, with protected connections if a flight is delayed." },
  { icon: <Luggage />, title: "Bags checked through", body: "Check in once and your bags travel to your final destination, even across partner airlines." },
  { icon: <Weekend />, title: "Lounges worldwide", body: "Mayur Gold and Royal Peacock members relax in alliance lounges at hubs around the world." },
  { icon: <CardMembership />, title: "Status that travels", body: "Your Mayur Miles tier is recognised across the alliance, from priority boarding to extra baggage." },
];

export default function AlliancePage() {
  return (
    <>
      <HeroBackdrop minHeight={300}>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="overline" sx={{ color: "secondary.main" }}>Alliance membership</Typography>
          <Typography variant="h3" component="h1">Australia World</Typography>
          <Typography sx={{ opacity: 0.85, mt: 1, maxWidth: 620 }}>
            Indian.com is a member of the Australia World alliance, a group of airlines that work together so you can fly further on one journey.
          </Typography>
        </Container>
      </HeroBackdrop>
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Grid container spacing={2}>
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
              <Typography variant="h5">Our hubs anchor the alliance in India and beyond</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Bengaluru, Delhi, Dubai, Singapore, Hong Kong, Sydney, Auckland, Rome and San Francisco all connect onto partner networks.
              </Typography>
            </Box>
            <LinkButton href="/network" variant="contained" size="large">Explore the route map</LinkButton>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
