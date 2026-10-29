"use client";
import SwapHoriz from "@mui/icons-material/SwapHoriz";
import Search from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addDaysISO, todayISO } from "@/lib/format";
import type { Cabin, SearchQuery } from "@/lib/types";
import { AirportField } from "./AirportField";

export function searchUrl(q: SearchQuery) {
  const p = new URLSearchParams({ from: q.from, to: q.to, date: q.date, adults: String(q.adults), children: String(q.children), cabin: q.cabin });
  if (q.returnDate) p.set("return", q.returnDate);
  return `/flights?${p}`;
}

export function SearchForm({ initial, compact = false }: { initial?: Partial<SearchQuery>; compact?: boolean }) {
  const router = useRouter();
  const today = todayISO();
  const [tripType, setTripType] = useState<"return" | "oneway">(initial && !initial.returnDate && initial.from ? "oneway" : "return");
  const [from, setFrom] = useState(initial?.from ?? "BLR");
  const [to, setTo] = useState(initial?.to ?? "");
  const [date, setDate] = useState(initial?.date ?? addDaysISO(today, 14));
  const [returnDate, setReturnDate] = useState(initial?.returnDate ?? addDaysISO(initial?.date ?? addDaysISO(today, 14), 7));
  const [adults, setAdults] = useState(initial?.adults ?? 1);
  const [children, setChildren] = useState(initial?.children ?? 0);
  const [cabin, setCabin] = useState<Cabin>(initial?.cabin ?? "economy");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!from) errs.from = "Choose where you're flying from";
    if (!to) errs.to = "Choose a destination";
    if (from && from === to) errs.to = "Pick a different destination";
    if (tripType === "return" && returnDate < date) errs.returnDate = "Return must be after departure";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    router.push(searchUrl({ from, to, date, returnDate: tripType === "return" ? returnDate : undefined, adults, children, cabin }));
  };

  const maxDate = dayjs(today).add(330, "day");

  return (
    <Paper component="form" onSubmit={submit} elevation={compact ? 0 : 8} variant={compact ? "outlined" : "elevation"} sx={{ p: { xs: 2, md: 3 }, borderRadius: "28px" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5, alignItems: "center" }}>
        <ToggleButtonGroup size="small" exclusive value={tripType} onChange={(_e, v) => v && setTripType(v)} color="primary">
          <ToggleButton value="return" sx={{ borderRadius: "999px 0 0 999px", px: 2 }}>Return</ToggleButton>
          <ToggleButton value="oneway" sx={{ borderRadius: "0 999px 999px 0", px: 2 }}>One way</ToggleButton>
        </ToggleButtonGroup>
        <TextField select size="small" value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)} sx={{ width: 140 }} aria-label="Cabin">
          <MenuItem value="economy">Economy</MenuItem>
          <MenuItem value="business">Business</MenuItem>
          <MenuItem value="first">First</MenuItem>
        </TextField>
        <TextField select size="small" label="Adults" value={adults} onChange={(e) => setAdults(+e.target.value)} sx={{ width: 100 }}>
          {Array.from({ length: 9 - children }, (_, i) => i + 1).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Children (2–11)" value={children} onChange={(e) => setChildren(+e.target.value)} sx={{ width: 140 }}>
          {Array.from({ length: 10 - adults }, (_, i) => i).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
        </TextField>
      </Box>
      <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
        <Grid size={{ xs: 12, md: tripType === "return" ? 2.8 : 3.6 }} sx={{ position: "relative" }}>
          <AirportField label="From" value={from} onChange={setFrom} exclude={to} error={errors.from} />
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} sx={{ display: "flex", justifyContent: "center", mt: { xs: -1.5, md: 1 }, mb: { xs: -1.5, md: 0 } }}>
          <IconButton
            aria-label="Swap origin and destination"
            onClick={() => { setFrom(to); setTo(from); }}
            sx={{ border: 1, borderColor: "divider", bgcolor: "background.paper", zIndex: 1, transform: { xs: "rotate(90deg)", md: "none" } }}
          >
            <SwapHoriz />
          </IconButton>
        </Grid>
        <Grid size={{ xs: 12, md: tripType === "return" ? 2.8 : 3.6 }}>
          <AirportField label="To" value={to} onChange={setTo} icon="land" exclude={from} error={errors.to} />
        </Grid>
        <Grid size={{ xs: tripType === "return" ? 6 : 12, md: 2 }}>
          <DatePicker
            label="Depart"
            value={dayjs(date)}
            minDate={dayjs(today)}
            maxDate={maxDate}
            format="DD MMM YYYY"
            onChange={(v) => {
              if (!v?.isValid()) return;
              const d = v.format("YYYY-MM-DD");
              setDate(d);
              if (returnDate < d) setReturnDate(addDaysISO(d, 7));
            }}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        {tripType === "return" && (
          <Grid size={{ xs: 6, md: 2 }}>
            <DatePicker
              label="Return"
              value={dayjs(returnDate)}
              minDate={dayjs(date)}
              maxDate={maxDate}
              format="DD MMM YYYY"
              onChange={(v) => v?.isValid() && setReturnDate(v.format("YYYY-MM-DD"))}
              slotProps={{ textField: { fullWidth: true, error: !!errors.returnDate, helperText: errors.returnDate } }}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, md: "grow" }} sx={{ minWidth: { md: 130 } }}>
          <Button type="submit" variant="contained" color="secondary" size="large" fullWidth startIcon={<Search />} sx={{ height: 56 }}>
            Search
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
