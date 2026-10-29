"use client";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Edit from "@mui/icons-material/Edit";
import TravelExplore from "@mui/icons-material/TravelExplore";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { ItineraryCard } from "@/components/ItineraryCard";
import { SearchForm } from "@/components/SearchForm";
import { fetcher } from "@/lib/api";
import { CABIN_LABEL, addDaysISO, formatDate, formatMoney, todayISO } from "@/lib/format";
import { useAirports } from "@/lib/hooks";
import { useTrip } from "@/lib/trip";
import type { Cabin, Itinerary, SearchQuery } from "@/lib/types";

type Sort = "best" | "price" | "duration" | "departure";
type SearchResponse = { results: Itinerary[] };

const searchKey = (from: string, to: string, date: string, q: SearchQuery) =>
  `/flights/search?from=${from}&to=${to}&date=${date}&adults=${q.adults}&children=${q.children}`;

function cheapest(results: Itinerary[] | undefined, cabin: Cabin) {
  const prices = (results || []).map((r) => r.cabins[cabin]).filter((o) => o?.available).map((o) => o!.price.total);
  return prices.length ? Math.min(...prices) : null;
}

function DateTab({ date, active, q, from, to, cabin, onClick }: { date: string; active: boolean; q: SearchQuery; from: string; to: string; cabin: Cabin; onClick: () => void }) {
  const { data, isLoading } = useSWR<SearchResponse>(searchKey(from, to, date, q), fetcher, { revalidateOnFocus: false });
  const min = cheapest(data?.results, cabin);
  const noon = Date.parse(`${date}T12:00:00Z`);
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flex: "1 0 96px", flexDirection: "column", py: 1.25, px: 1, borderRadius: 3,
        bgcolor: active ? "primary.main" : "transparent", color: active ? "primary.contrastText" : "text.primary",
        "&:hover": { bgcolor: active ? "primary.main" : "action.hover" },
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatDate(noon, "UTC")}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, minHeight: 20 }}>
        {isLoading ? <Skeleton width={60} sx={{ bgcolor: active ? "rgba(255,255,255,.3)" : undefined }} /> : min ? formatMoney(min) : "—"}
      </Typography>
    </ButtonBase>
  );
}

export function FlightResults() {
  const params = useSearchParams();
  const router = useRouter();
  const { byCode } = useAirports();
  const { setTrip } = useTrip();

  const q: SearchQuery = {
    from: (params.get("from") || "").toUpperCase(),
    to: (params.get("to") || "").toUpperCase(),
    date: params.get("date") || todayISO(),
    returnDate: params.get("return") || undefined,
    adults: Math.max(1, Number(params.get("adults")) || 1),
    children: Math.max(0, Number(params.get("children")) || 0),
    cabin: (["economy", "business", "first"].includes(params.get("cabin") || "") ? params.get("cabin") : "economy") as Cabin,
  };
  const pax = q.adults + q.children;

  const [cabin, setCabin] = useState<Cabin>(q.cabin);
  const [sort, setSort] = useState<Sort>("best");
  const [nonstopOnly, setNonstopOnly] = useState(false);
  const [outbound, setOutbound] = useState<Itinerary | null>(null);
  const [editing, setEditing] = useState(false);

  const step = q.returnDate && outbound ? 1 : 0;
  const legFrom = step ? q.to : q.from;
  const legTo = step ? q.from : q.to;
  const legDate = step ? q.returnDate! : q.date;

  const setDate = (d: string) => {
    const p = new URLSearchParams(params.toString());
    if (step) p.set("return", d);
    else {
      p.set("date", d);
      if (q.returnDate && q.returnDate < d) p.set("return", d);
    }
    router.replace(`/flights?${p}`, { scroll: false });
  };

  const { data, error, isLoading } = useSWR<SearchResponse>(q.from && q.to ? searchKey(legFrom, legTo, legDate, q) : null, fetcher, { revalidateOnFocus: false });

  const results = useMemo(() => {
    let list = (data?.results || []).filter((r) => r.cabins[cabin]);
    if (nonstopOnly) list = list.filter((r) => r.stops === 0);
    // A return flight must leave at least 2 hours after the outbound lands.
    if (step && outbound) list = list.filter((r) => r.depUtc >= outbound.arrUtc + 2 * 3600_000);
    const price = (r: Itinerary) => (r.cabins[cabin]?.available ? r.cabins[cabin]!.price.total : Infinity);
    const sorters: Record<Sort, (a: Itinerary, b: Itinerary) => number> = {
      best: (a, b) => a.stops - b.stops || price(a) * (a.durationMin / 600) - price(b) * (b.durationMin / 600),
      price: (a, b) => price(a) - price(b),
      duration: (a, b) => a.durationMin - b.durationMin,
      departure: (a, b) => a.depUtc - b.depUtc,
    };
    return [...list].sort(sorters[sort]);
  }, [data, cabin, nonstopOnly, sort, step, outbound]);

  const choose = (it: Itinerary, c: Cabin) => {
    if (!q.returnDate) {
      setTrip({ query: q, cabin: c, journeys: [it] });
      router.push("/book");
    } else if (step === 0) {
      setCabin(c);
      setOutbound(it);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setTrip({ query: q, cabin: c, journeys: [outbound!, it] });
      router.push("/book");
    }
  };

  const fromA = byCode[legFrom];
  const toA = byCode[legTo];
  const minDate = step ? q.date : todayISO();
  const dates = Array.from({ length: 7 }, (_, i) => addDaysISO(legDate, i - 3)).filter((d) => d >= minDate);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 2, mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <TravelExplore color="primary" />
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ fontWeight: 700 }}>
            {byCode[q.from]?.city ?? q.from} → {byCode[q.to]?.city ?? q.to}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {q.returnDate ? "Return" : "One way"} · {pax} traveller{pax > 1 ? "s" : ""} · {CABIN_LABEL[cabin]}
          </Typography>
        </Box>
        <Button startIcon={<Edit />} onClick={() => setEditing(!editing)}>{editing ? "Close" : "Modify search"}</Button>
      </Paper>
      <Collapse in={editing} unmountOnExit>
        <Box sx={{ mb: 3 }}>
          <SearchForm compact initial={q} key={params.toString()} />
        </Box>
      </Collapse>

      {q.returnDate && (
        <Stepper activeStep={step} sx={{ mb: 3, maxWidth: 520 }}>
          <Step><StepLabel>Departing flight</StepLabel></Step>
          <Step><StepLabel>Return flight</StepLabel></Step>
        </Stepper>
      )}

      {step === 1 && outbound && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="overline" color="text.secondary">Your departing flight</Typography>
            <Button size="small" startIcon={<ArrowBack />} onClick={() => setOutbound(null)}>Change</Button>
          </Stack>
          <ItineraryCard it={outbound} byCode={byCode} cabin={cabin} pax={pax} onSelect={() => setOutbound(null)} selected onlyCabin={cabin} />
        </Box>
      )}

      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
        {step ? "Choose your return" : "Choose your flight"}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {fromA?.city ?? legFrom} to {toA?.city ?? legTo} · times shown are local to each airport
      </Typography>

      <Paper variant="outlined" sx={{ display: "flex", gap: 0.5, p: 0.75, mb: 2, overflowX: "auto" }}>
        {dates.map((d) => (
          <DateTab key={d} date={d} active={d === legDate} q={q} from={legFrom} to={legTo} cabin={cabin} onClick={() => setDate(d)} />
        ))}
      </Paper>

      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center", flexWrap: "wrap", rowGap: 1.5 }}>
        <TextField select size="small" label="Cabin" value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)} sx={{ width: 150 }} disabled={step === 1}>
          {(["economy", "business", "first"] as Cabin[]).map((c) => <MenuItem key={c} value={c}>{CABIN_LABEL[c]}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as Sort)} sx={{ width: 170 }}>
          <MenuItem value="best">Recommended</MenuItem>
          <MenuItem value="price">Lowest price</MenuItem>
          <MenuItem value="duration">Shortest</MenuItem>
          <MenuItem value="departure">Earliest departure</MenuItem>
        </TextField>
        <FormControlLabel control={<Switch checked={nonstopOnly} onChange={(e) => setNonstopOnly(e.target.checked)} />} label="Nonstop only" />
        <Box sx={{ flex: 1 }} />
        {!isLoading && data && <Typography variant="body2" color="text.secondary">{results.length} option{results.length === 1 ? "" : "s"}</Typography>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      <Stack spacing={2}>
        {isLoading && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="rounded" height={150} sx={{ borderRadius: 5 }} />)}
        {!isLoading && data && results.length === 0 && (
          <Alert severity="info">
            No {CABIN_LABEL[cabin]} flights{nonstopOnly ? " without stops" : ""} on this day. Try another date{nonstopOnly ? ", allow connections" : ""} or a different cabin.
          </Alert>
        )}
        {results.map((it) => (
          <ItineraryCard key={it.id} it={it} byCode={byCode} cabin={cabin} pax={pax} onSelect={(c) => choose(it, c)} onlyCabin={step ? cabin : undefined} />
        ))}
      </Stack>
    </Container>
  );
}
