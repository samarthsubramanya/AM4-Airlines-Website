"use client";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PeacockMark } from "@/components/Logo";
import { AUTH_MODE, CATALYST_APP_URL, useAuth } from "@/lib/auth";

// Only allow same-site relative redirects after sign-in.
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/miles");

type CatalystWindow = Window & { catalyst?: { auth: { signIn: (id: string, config?: Record<string, unknown>) => void } } };

function CatalystSignIn({ next }: { next: string }) {
  const { completeCatalystLogin } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [sdkReady, setSdkReady] = useState(0);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const returning = params.get("catalyst") === "done";

  // After Catalyst redirects back, swap the Catalyst session for an API token.
  useEffect(() => {
    if (!returning) return;
    completeCatalystLogin().then(() => router.replace(next), (e) => setError(e.message));
  }, [returning, completeCatalystLogin, router, next]);

  // Both scripts loaded → mount Catalyst's embedded sign-in iframe.
  useEffect(() => {
    if (sdkReady < 2 || returning || mounted.current) return;
    const w = window as CatalystWindow;
    if (!w.catalyst) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Zoho Catalyst SDK failed to load.");
      return;
    }
    mounted.current = true;
    w.catalyst.auth.signIn("catalyst-login", {
      service_url: `${window.location.origin}/login?catalyst=done&next=${encodeURIComponent(next)}`,
    });
  }, [sdkReady, returning, next]);

  return (
    <>
      <Script src="https://static.zohocdn.com/catalyst/sdk/js/4.6.2/catalystWebSDK.js" onLoad={() => setSdkReady((n) => n + 1)} onError={() => setError("Couldn't load Zoho sign-in.")} />
      <Script src={`${CATALYST_APP_URL}/__catalyst/sdk/init.js`} onLoad={() => setSdkReady((n) => n + 1)} onError={() => setError("Couldn't reach the Catalyst project.")} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {returning && !error ? (
        <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>
      ) : (
        <Box id="catalyst-login" sx={{ minHeight: 420, "& iframe": { width: "100%", minHeight: 420, border: 0 } }} />
      )}
    </>
  );
}

function DemoSignIn({ next }: { next: string }) {
  const { demoLogin } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter your name and a valid email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await demoLogin(name.trim(), email.trim());
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Stack component="form" spacing={2} onSubmit={submit}>
      <Alert severity="info">
        Demo sign-in: no password needed. Your miles and trips are tied to the email you enter.
      </Alert>
      <TextField label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      <TextField type="email" label="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <Alert severity="error">{error}</Alert>}
      <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}>
        Continue
      </Button>
    </Stack>
  );
}

export function Login() {
  const next = safeNext(useSearchParams().get("next"));
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, router, next]);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <PeacockMark size={64} />
            <Typography variant="h4" component="h1" sx={{ mt: 1 }}>Welcome to Mayur Miles</Typography>
            <Typography color="text.secondary">Sign in to earn miles, see your trips and book faster.</Typography>
          </Box>
          {AUTH_MODE === "catalyst" ? <CatalystSignIn next={next} /> : <DemoSignIn next={next} />}
        </CardContent>
      </Card>
    </Container>
  );
}
