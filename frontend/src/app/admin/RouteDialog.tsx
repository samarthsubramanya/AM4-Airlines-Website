"use client";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { api } from "@/lib/api";
import type { AdminRoute, Airport } from "@/lib/types";

export interface AircraftOption {
  code: string;
  name: string;
  category: string;
  cargo: boolean;
}

interface Props {
  open: boolean;
  route: AdminRoute | null; // null = new route
  airports: Airport[];
  aircraft: AircraftOption[];
  onClose: () => void;
  onSaved: () => void;
}

const toRad = (d: number) => (d * Math.PI) / 180;
function km(a: Airport, b: Airport) {
  const h = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}

function AirportPicker({ label, value, airports, onChange }: { label: string; value: string; airports: Airport[]; onChange: (icao: string) => void }) {
  return (
    <Autocomplete
      options={airports}
      value={airports.find((a) => a.icao === value) || null}
      onChange={(_e, a) => onChange(a?.icao || "")}
      getOptionLabel={(a) => `${a.icao} · ${a.code} · ${a.city}`}
      isOptionEqualToValue={(a, b) => a.icao === b.icao}
      renderInput={(p) => <TextField {...p} label={label} required />}
    />
  );
}

export function RouteDialog({ open, route, airports, aircraft, onClose, onSaved }: Props) {
  const [form, setForm] = useState(() => ({
    from: route?.from ?? "",
    to: route?.to ?? "",
    flightNumber: route?.flightNumber ?? "#IN-",
    aircraft: route?.aircraft ?? "B3XM",
    registration: route?.registration ?? "VT-",
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const A = airports.find((a) => a.icao === form.from);
  const B = airports.find((a) => a.icao === form.to);
  const type = aircraft.find((a) => a.code === form.aircraft);
  const india = A?.country === "India" || B?.country === "India";

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api(route ? `/admin/routes/${route.id}` : "/admin/routes", { method: route ? "PUT" : "POST", json: form });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const groups = [...new Set(aircraft.map((a) => a.category))];

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>{route ? `Edit route ${route.flightNumber}` : "Add route"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AirportPicker label="From (ICAO)" value={form.from} airports={airports} onChange={(from) => set({ from })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AirportPicker label="To (ICAO)" value={form.to} airports={airports} onChange={(to) => set({ to })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Route / flight number" value={form.flightNumber} onChange={(e) => set({ flightNumber: e.target.value })} helperText="As in AM4, e.g. #IN-0093" required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Registration" value={form.registration} onChange={(e) => set({ registration: e.target.value })} required />
          </Grid>
          <Grid size={12}>
            <TextField select label="Aircraft type" value={form.aircraft} onChange={(e) => set({ aircraft: e.target.value })}>
              {groups.flatMap((g) => [
                <ListSubheader key={g}>{g}</ListSubheader>,
                ...aircraft.filter((a) => a.category === g).map((a) => <MenuItem key={a.code} value={a.code}>{a.name}</MenuItem>),
              ])}
            </TextField>
          </Grid>
        </Grid>
        {A && B && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {km(A, B).toLocaleString("en-IN")} km · sold as <strong>{type?.cargo ? "Indus Cargo (not bookable)" : india ? "Indian.com" : "Indus Air"}</strong>
          </Typography>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !form.from || !form.to}>{route ? "Save changes" : "Add route"}</Button>
      </DialogActions>
    </Dialog>
  );
}
