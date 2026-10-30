"use client";
import Add from "@mui/icons-material/Add";
import AdminPanelSettings from "@mui/icons-material/AdminPanelSettingsOutlined";
import Delete from "@mui/icons-material/DeleteOutlined";
import Download from "@mui/icons-material/Download";
import Edit from "@mui/icons-material/EditOutlined";
import Upload from "@mui/icons-material/Upload";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { DataGrid, GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { AirlineMark } from "@/components/Airline";
import { API_URL, ApiError, api, fetcher, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDuration, formatNumber } from "@/lib/format";
import type { AdminRoute, Airport } from "@/lib/types";
import { AirportDialog } from "./AirportDialog";
import { RouteDialog, type AircraftOption } from "./RouteDialog";

type RoutesResponse = { routes: AdminRoute[]; aircraft: AircraftOption[] };
type Filter = "all" | "IN" | "IS" | "cargo" | "problems";

function AdminLogin() {
  const { adminLogin } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminLogin(password);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <Container maxWidth="xs" sx={{ py: 10 }}>
      <Card>
        <CardContent component="form" onSubmit={submit} sx={{ p: 4 }}>
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
            <AdminPanelSettings color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5">Network admin</Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in with the admin password (<code>ADMIN_PASSWORD</code> on the API). Zoho Catalyst users listed in <code>ADMIN_EMAILS</code> get in automatically.
            </Typography>
            <TextField type="password" label="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            {error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}
            <Button type="submit" variant="contained" fullWidth size="large" disabled={busy || !password}>Sign in</Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

function ImportExport({ onDone }: { onDone: (msg: string) => void }) {
  const [csv, setCsv] = useState("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  const readFile = async (f: File | undefined) => {
    if (f) setCsv(await f.text());
  };

  const run = async () => {
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      const r = await api<{ imported: number; skipped: number; errors: string[] }>("/admin/routes/import", { method: "POST", json: { csv, mode } });
      setResult(r);
      onDone(`Imported ${r.imported} routes`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    const res = await fetch(`${API_URL}/api/admin/routes/export.csv`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) return setError("Export failed");
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: "active_routes.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6">Import from Airline Manager 4</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload or paste your AM4 &ldquo;active routes&rdquo; export (Source Airport, Destination Airport, Route/Flight Number, Aircraft Type, Aircraft Registration Number).
            </Typography>
            <Button component="label" variant="outlined" startIcon={<Upload />} sx={{ mb: 2 }}>
              Choose CSV file
              <input hidden type="file" accept=".csv,text/csv" onChange={(e) => readFile(e.target.files?.[0])} />
            </Button>
            <TextField multiline minRows={6} maxRows={14} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="Source Airport,Destination Airport,Route/Flight Number,Aircraft Type,Aircraft Registration Number" slotProps={{ htmlInput: { style: { fontFamily: "monospace", fontSize: 12 } } }} />
            <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as "merge" | "replace")} sx={{ mt: 1 }}>
              <FormControlLabel value="merge" control={<Radio />} label="Add to existing routes" />
              <FormControlLabel value="replace" control={<Radio />} label="Replace all routes" />
            </RadioGroup>
            <Button variant="contained" disabled={!csv.trim() || busy} onClick={() => (mode === "replace" ? setConfirm(true) : run())} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <Upload />}>
              Import
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {result && (
              <Alert severity={result.skipped ? "warning" : "success"} sx={{ mt: 2 }}>
                Imported {result.imported} routes{result.skipped ? `, skipped ${result.skipped}:` : "."}
                {result.errors.map((e) => <div key={e}>{e}</div>)}
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6">Export</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Download the live network in the same CSV format.</Typography>
            <Button variant="outlined" startIcon={<Download />} onClick={exportCsv}>Download CSV</Button>
          </CardContent>
        </Card>
      </Grid>
      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>Replace every route?</DialogTitle>
        <DialogContent>
          <DialogContentText>All current routes are deleted and replaced with this file. Existing bookings keep their flights.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={run}>Replace routes</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

function Dashboard() {
  const { data, error, mutate, isLoading } = useSWR<RoutesResponse>("/admin/routes", fetcher);
  const { data: airports, mutate: mutateAirports } = useSWR<(Airport & { custom?: boolean })[]>("/admin/airports", fetcher);
  const { signOut } = useAuth();
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminRoute | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<AdminRoute | null>(null);
  const [addingAirport, setAddingAirport] = useState(false);
  const [toast, setToast] = useState("");

  const byIcao = useMemo(() => new Map((airports || []).map((a) => [a.icao, a])), [airports]);
  const aircraftName = useMemo(() => new Map((data?.aircraft || []).map((a) => [a.code, a.name])), [data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.routes || []).filter((r) => {
      const c = r.computed;
      if (filter === "problems" && !r.problem) return false;
      if (filter === "cargo" && !c?.cargo) return false;
      if ((filter === "IN" || filter === "IS") && (c?.operator !== filter || c.cargo)) return false;
      if (!q) return true;
      const hay = [r.flightNumber, r.from, r.to, r.registration, aircraftName.get(r.aircraft), byIcao.get(r.from)?.city, byIcao.get(r.to)?.city].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [data, filter, query, byIcao, aircraftName]);

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" action={<Button color="inherit" onClick={signOut}>Sign out</Button>}>{error.message}</Alert>
      </Container>
    );
  }

  const routes = data?.routes || [];
  const pax = routes.filter((r) => r.computed && !r.computed.cargo);
  const stats = [
    [routes.length, "Routes"],
    [pax.filter((r) => r.computed!.operator === "IN").length, "Indian.com"],
    [pax.filter((r) => r.computed!.operator === "IS").length, "Indus Air"],
    [routes.filter((r) => r.computed?.cargo).length, "Indus Cargo"],
    [new Set(routes.map((r) => r.registration)).size, "Aircraft"],
    [pax.reduce((s, r) => s + r.computed!.weeklyFlights * 2, 0), "Pax flights / week"],
  ] as const;

  const columns: GridColDef<AdminRoute>[] = [
    {
      field: "operator", headerName: "", width: 48, sortable: false,
      valueGetter: (_v, r) => r.computed?.operator,
      renderCell: ({ row }) => row.computed && <Box sx={{ display: "grid", placeItems: "center", height: "100%" }}><AirlineMark code={row.computed.operator} size={22} /></Box>,
    },
    { field: "flightNumber", headerName: "Route #", width: 110 },
    { field: "display", headerName: "Sold as", width: 90, valueGetter: (_v, r) => r.computed?.flightNo ?? "—" },
    { field: "from", headerName: "From", width: 170, valueGetter: (_v, r) => `${r.from} · ${byIcao.get(r.from)?.city ?? "?"}` },
    { field: "to", headerName: "To", width: 170, valueGetter: (_v, r) => `${r.to} · ${byIcao.get(r.to)?.city ?? "?"}` },
    {
      field: "aircraft", headerName: "Aircraft", width: 210,
      valueGetter: (_v, r) => aircraftName.get(r.aircraft) ?? r.aircraft,
      renderCell: ({ row, value }) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", height: "100%" }}>
          <span>{value}</span>
          {row.computed?.cargo && <Chip size="small" label="Cargo" color="secondary" />}
        </Stack>
      ),
    },
    { field: "registration", headerName: "Registration", width: 140 },
    { field: "km", headerName: "Distance", width: 100, type: "number", valueGetter: (_v, r) => r.computed?.km, valueFormatter: (v?: number) => (v ? `${formatNumber(v)} km` : "") },
    { field: "block", headerName: "Block", width: 90, valueGetter: (_v, r) => r.computed?.blockMin, valueFormatter: (v?: number) => (v ? formatDuration(v) : "") },
    {
      field: "weekly", headerName: "Weekly", width: 90, type: "number",
      valueGetter: (_v, r) => r.computed?.weeklyFlights,
      renderCell: ({ row, value }) => (row.problem ? <Chip size="small" color="error" label={row.problem} /> : value),
    },
    {
      field: "actions", type: "actions", width: 90,
      getActions: ({ row }) => [
        <GridActionsCellItem key="e" icon={<Edit />} label="Edit" onClick={() => setEditing(row)} />,
        <GridActionsCellItem key="d" icon={<Delete />} label="Delete" onClick={() => setDeleting(row)} />,
      ],
    },
  ];

  const airportColumns: GridColDef<Airport & { custom?: boolean }>[] = [
    { field: "icao", headerName: "ICAO", width: 90 },
    { field: "code", headerName: "IATA", width: 80 },
    { field: "name", headerName: "Airport", flex: 1, minWidth: 200 },
    { field: "city", headerName: "City", width: 150 },
    { field: "country", headerName: "Country", width: 160 },
    { field: "tz", headerName: "Time zone", width: 190 },
    { field: "hub", headerName: "Hub", width: 100, renderCell: ({ value }) => value && <Chip size="small" label={value} /> },
    {
      field: "actions", type: "actions", width: 60,
      getActions: ({ row }) => (row.custom ? [
        <GridActionsCellItem key="d" icon={<Delete />} label="Delete" onClick={async () => {
          try {
            await api(`/admin/airports/${row.icao}`, { method: "DELETE" });
            mutateAirports();
            setToast(`Deleted ${row.icao}`);
          } catch (err) {
            setToast((err as ApiError).message);
          }
        }} />,
      ] : []),
    },
  ];

  const remove = async () => {
    if (!deleting) return;
    try {
      await api(`/admin/routes/${deleting.id}`, { method: "DELETE" });
      setToast(`Deleted ${deleting.flightNumber} ${deleting.from}–${deleting.to}`);
      mutate();
    } catch (err) {
      setToast((err as Error).message);
    }
    setDeleting(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="overline" color="primary">Indian.com group</Typography>
          <Typography variant="h4" component="h1">Network admin</Typography>
        </Box>
        <Button onClick={signOut}>Sign out</Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map(([n, label]) => (
          <Grid key={label} size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" color="primary">{formatNumber(n)}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Routes" />
        <Tab label="Airports" />
        <Tab label="Import / export" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <Stack direction="row" spacing={2} sx={{ p: 2, alignItems: "center", flexWrap: "wrap", rowGap: 1.5 }}>
            <TextField size="small" placeholder="Search flight, airport, registration…" value={query} onChange={(e) => setQuery(e.target.value)} sx={{ maxWidth: 320 }} />
            <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_e, v) => v && setFilter(v)}>
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="IN">Indian.com</ToggleButton>
              <ToggleButton value="IS">Indus Air</ToggleButton>
              <ToggleButton value="cargo">Cargo</ToggleButton>
              <ToggleButton value="problems">Problems</ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" startIcon={<Add />} onClick={() => setEditing(null)}>Add route</Button>
          </Stack>
          <Box sx={{ height: 640 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={isLoading}
              density="compact"
              disableRowSelectionOnClick
              initialState={{ sorting: { sortModel: [{ field: "flightNumber", sort: "asc" }] }, pagination: { paginationModel: { pageSize: 50 } } }}
              pageSizeOptions={[25, 50, 100]}
              sx={{ border: 0 }}
            />
          </Box>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <Stack direction="row" sx={{ p: 2, justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">Built-in airports plus any you add. Routes can only use airports listed here.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setAddingAirport(true)}>Add airport</Button>
          </Stack>
          <Box sx={{ height: 640 }}>
            <DataGrid rows={airports || []} getRowId={(a) => a.icao} columns={airportColumns} density="compact" loading={!airports} disableRowSelectionOnClick sx={{ border: 0 }} />
          </Box>
        </Card>
      )}

      {tab === 2 && <ImportExport onDone={(msg) => { setToast(msg); mutate(); }} />}

      {editing !== undefined && data && airports && (
        <RouteDialog
          key={editing?.id ?? "new"}
          open
          route={editing}
          airports={airports}
          aircraft={data.aircraft}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setToast(editing ? "Route updated" : "Route added");
            setEditing(undefined);
            mutate();
          }}
        />
      )}
      <AirportDialog open={addingAirport} onClose={() => setAddingAirport(false)} onSaved={() => { setAddingAirport(false); setToast("Airport added"); mutateAirports(); }} />

      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete route {deleting?.flightNumber}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleting?.from} ⇄ {deleting?.to} on {deleting && (aircraftName.get(deleting.aircraft) ?? deleting.aircraft)} {deleting?.registration}. It disappears from search straight away; existing bookings are kept.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={remove}>Delete route</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast("")} message={toast} />
    </Container>
  );
}

export function AdminDashboard() {
  const { user, ready } = useAuth();
  // Password admins carry an admin claim; Catalyst admins are recognised by the API.
  const { data, isLoading } = useSWR<RoutesResponse>(user ? "/admin/routes" : null, fetcher, { shouldRetryOnError: false });
  if (!ready || (user && isLoading)) return <Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>;
  if (!user || (!user.admin && !data)) return <AdminLogin />;
  return <Dashboard />;
}
