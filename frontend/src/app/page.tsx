import CardTravel from "@mui/icons-material/CardTravel";
import Public from "@mui/icons-material/Public";
import Spa from "@mui/icons-material/Spa";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { LinkButton } from "@/components/LinkButton";
import Typography from "@mui/material/Typography";
import { HeroBackdrop } from "@/components/Hero";
import { HubCards } from "@/components/HubCards";
import { IndusLogo } from "@/components/Airline";
import { Logo } from "@/components/Logo";
import { SearchForm } from "@/components/SearchForm";

const FEATURES = [
  { icon: <Spa />, title: "Mayur Miles", body: "Earn up to 3 miles for every mile you fly and climb from Mayur Blue to Royal Peacock.", href: "/miles", cta: "Join free" },
  { icon: <Public />, title: "Australia World alliance", body: "One trip, one ticket across our alliance network, with lounges and status that travel with you.", href: "/alliance", cta: "Explore the alliance" },
  { icon: <CardTravel />, title: "A modern fleet", body: "A380 flagships, 777s, Dreamliners and ultra-long-range A350s that fly Bengaluru nonstop to the Bay Area.", href: "/fleet", cta: "Meet the fleet" },
];

export default function Home() {
  return (
    <>
      <HeroBackdrop minHeight={520}>
        <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 4, md: 6 } }}>
          <Typography variant="overline" sx={{ color: "secondary.main" }}>Namaste from Bengaluru</Typography>
          <Typography variant="h2" component="h1" sx={{ fontSize: { xs: "2.4rem", md: "3.75rem" }, maxWidth: 760, mt: 1 }}>
            Spread your wings. Fly the peacock.
          </Typography>
          <Typography variant="h6" component="p" sx={{ fontWeight: 400, opacity: 0.85, maxWidth: 620, mt: 2, mb: 5 }}>
            More than 120 airports on six continents, flown by Indian.com and our global sister airline Indus Air.
          </Typography>
          <Box sx={{ color: "text.primary" }}>
            <SearchForm />
          </Box>
        </Container>
      </HeroBackdrop>

      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: 3, gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="overline" color="primary">Our hubs</Typography>
            <Typography variant="h4" component="h2">Fly from Bengaluru to our hubs</Typography>
          </Box>
          <LinkButton href="/network" variant="outlined">See the route map</LinkButton>
        </Box>
        <HubCards />

        <Grid container spacing={2} sx={{ mt: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: "100%", borderTop: 4, borderTopColor: "#0A4D68" }}>
              <CardContent sx={{ p: 3 }}>
                <Logo size={36} />
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Every flight to, from and within India, from our home in Bengaluru and our Delhi hub.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: "100%", borderTop: 4, borderTopColor: "#2E2A6B" }}>
              <CardContent sx={{ p: 3 }}>
                <IndusLogo size={36} />
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Our global brand. Indus Air links Sydney, Singapore, Hong Kong, Rome, San Francisco and beyond without touching India, with the same peacock service.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {FEATURES.map((f) => (
            <Grid key={f.title} size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: "primary.main", color: "primary.contrastText", display: "grid", placeItems: "center", mb: 2 }}>
                    {f.icon}
                  </Box>
                  <Typography variant="h6">{f.title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1, mb: 2, flex: 1 }}>{f.body}</Typography>
                  <LinkButton href={f.href} sx={{ alignSelf: "flex-start", ml: -1.5 }}>{f.cta}</LinkButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
