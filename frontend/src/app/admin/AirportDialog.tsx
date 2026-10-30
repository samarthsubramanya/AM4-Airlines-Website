"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { api } from "@/lib/api";

const EMPTY = { icao: "", code: "", name: "", city: "", country: "", lat: "", lon: "", tz: "" };

export function AirportDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const field = (k: keyof typeof EMPTY, label: string, helper?: string, xs = 6) => (
    <Grid size={{ xs: 12, sm: xs }}>
      <TextField label={label} value={form[k]} helperText={helper} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
    </Grid>
  );

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api("/admin/airports", { method: "POST", json: form });
      setForm(EMPTY);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Add airport</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {field("icao", "ICAO", "e.g. VOMY", 3)}
          {field("code", "IATA", "e.g. MYQ", 3)}
          {field("name", "Airport name")}
          {field("city", "City")}
          {field("country", "Country", "Use \"India\" for Indian airports")}
          {field("lat", "Latitude", "Decimal degrees", 3)}
          {field("lon", "Longitude", "Decimal degrees", 3)}
          {field("tz", "Time zone", "IANA name, e.g. Asia/Kolkata")}
        </Grid>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy}>Add airport</Button>
      </DialogActions>
    </Dialog>
  );
}
