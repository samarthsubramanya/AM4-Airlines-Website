"use client";
import FlightLand from "@mui/icons-material/FlightLand";
import FlightTakeoff from "@mui/icons-material/FlightTakeoff";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAirports } from "@/lib/hooks";
import type { Airport } from "@/lib/types";

interface Props {
  label: string;
  value: string;
  onChange: (code: string) => void;
  icon?: "takeoff" | "land";
  exclude?: string;
  error?: string;
}

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function AirportField({ label, value, onChange, icon = "takeoff", exclude, error }: Props) {
  const { airports, byCode, isLoading } = useAirports();
  const options = airports.filter((a) => a.code !== exclude);
  return (
    <Autocomplete<Airport, false, false, false>
      options={options}
      loading={isLoading}
      value={byCode[value] || null}
      onChange={(_e, a) => onChange(a?.code || "")}
      groupBy={(a) => (a.hub ? "Indian.com hubs" : a.country)}
      // Hubs first, then by country/city so the grouping reads naturally.
      filterOptions={(opts, { inputValue }) => {
        const q = norm(inputValue.trim());
        const list = q
          ? opts.filter((a) => [a.code, a.city, a.name, a.country].some((s) => norm(s).includes(q)))
          : opts;
        return [...list].sort((a, b) => {
          if (q && a.code.toLowerCase() === q) return -1;
          if (q && b.code.toLowerCase() === q) return 1;
          return Number(!!b.hub) - Number(!!a.hub) || (a.hub ? 0 : a.country.localeCompare(b.country)) || a.city.localeCompare(b.city);
        });
      }}
      getOptionLabel={(a) => `${a.city} (${a.code})`}
      isOptionEqualToValue={(a, b) => a.code === b.code}
      renderOption={(props, a) => {
        const { key, ...rest } = props as typeof props & { key: string };
        return (
          <Box component="li" key={key} {...rest} sx={{ display: "flex", gap: 1.5 }}>
            <Typography sx={{ fontWeight: 700, width: 40, color: "primary.main" }}>{a.code}</Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.city}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap component="div">{a.name}</Typography>
            </Box>
            {a.hub === "primary" && <Chip size="small" color="secondary" label="Main hub" />}
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={error}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  {icon === "takeoff" ? <FlightTakeoff color="action" /> : <FlightLand color="action" />}
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}
