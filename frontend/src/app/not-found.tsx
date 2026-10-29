import Container from "@mui/material/Container";
import { LinkButton } from "@/components/LinkButton";
import Typography from "@mui/material/Typography";
import { PeacockMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 12, textAlign: "center" }}>
      <PeacockMark size={80} />
      <Typography variant="h3" component="h1" sx={{ mt: 2 }}>This page has flown off</Typography>
      <Typography color="text.secondary" sx={{ my: 2 }}>We couldn&apos;t find what you were looking for.</Typography>
      <LinkButton href="/" variant="contained">Back to booking</LinkButton>
    </Container>
  );
}
