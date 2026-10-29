import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  { title: "Book & manage", links: [["/", "Book a flight"], ["/manage", "Manage booking"], ["/manage", "Cancel a trip"]] },
  { title: "Discover", links: [["/network", "Route map"], ["/fleet", "Our fleet"], ["/alliance", "Australia World alliance"]] },
  { title: "Mayur Miles", links: [["/miles", "My account"], ["/miles#tiers", "Membership tiers"], ["/login", "Sign in"]] },
];

export function Footer() {
  return (
    <Box component="footer" sx={{ mt: 10, bgcolor: "#06283D", color: "rgba(255,255,255,0.8)", py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Logo inverse size={34} />
            <Typography variant="body2" sx={{ mt: 2, maxWidth: 320 }}>
              Flying the world from Bengaluru, with hubs in Delhi, Dubai, Singapore, Hong Kong, Sydney, Auckland, Rome and San Francisco.
            </Typography>
            <Typography variant="caption" sx={{ display: "block", mt: 2, opacity: 0.7 }}>
              A proud member of the Australia World alliance.
            </Typography>
          </Grid>
          {COLUMNS.map((c) => (
            <Grid key={c.title} size={{ xs: 6, md: 2.66 }}>
              <Typography variant="overline" sx={{ color: "#D4A72C" }}>{c.title}</Typography>
              {c.links.map(([href, label]) => (
                <Typography key={label} variant="body2" sx={{ mt: 1 }}>
                  <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>{label}</Link>
                </Typography>
              ))}
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" component="p" sx={{ mt: 5, opacity: 0.6 }}>
          Indian.com is a fictional airline from the game Airline Manager 4, built as a portfolio project. No real flights are sold and no payments are taken.
        </Typography>
      </Container>
    </Box>
  );
}
