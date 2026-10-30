"use client";
import "leaflet/dist/leaflet.css";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useColorScheme } from "@mui/material/styles";
import Link from "next/link";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import { addDaysISO, todayISO } from "@/lib/format";
import type { Airport, NetworkLink } from "@/lib/types";
import { AIRLINE } from "./Airline";
import { searchUrl } from "./SearchForm";

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Longitude used on the map: the Americas are drawn east of the Pacific so the network reads left-to-right. */
const displayLon = (lon: number) => (lon < -30 ? lon + 360 : lon);

/** Great-circle points from a to b, with longitudes unwrapped so the line never jumps across the map. */
function arc(a: Airport, b: Airport, n = 48): [number, number][] {
  const [φ1, λ1, φ2, λ2] = [toRad(a.lat), toRad(a.lon), toRad(b.lat), toRad(b.lon)];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2));
  const pts: [number, number][] = [];
  let prev = displayLon(a.lon);
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    let lon = toDeg(Math.atan2(y, x));
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    prev = lon;
    pts.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lon]);
  }
  return pts;
}

interface Props {
  airports: Airport[];
  links: NetworkLink[];
  focus: string | null;
  onFocus: (code: string | null) => void;
}

export default function NetworkMap({ airports, links, focus, onFocus }: Props) {
  const { mode, systemMode } = useColorScheme();
  const dark = (mode === "system" ? systemMode : mode) === "dark";
  const byCode = Object.fromEntries(airports.map((a) => [a.code, a]));
  const shown = focus ? links.filter((l) => l.from === focus || l.to === focus) : links;
  const date = addDaysISO(todayISO(), 21);
  const routeCount = (code: string) => links.filter((l) => l.from === code || l.to === code).length;

  return (
    <MapContainer
      bounds={[[-48, -10], [62, 290]]}
      zoomSnap={0.25}
      minZoom={1}
      maxZoom={7}
      worldCopyJump={false}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: 24, background: dark ? "#0b1a20" : "#dfeef2" }}
    >
      <TileLayer
        key={dark ? "dark" : "light"}
        attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
        url={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${dark ? "Dark" : "Light"}_Gray_Base/MapServer/tile/{z}/{y}/{x}`}
        maxNativeZoom={16}
      />
      {shown.flatMap((l) => {
        const a = byCode[l.from];
        const b = byCode[l.to];
        if (!a || !b) return [];
        const pts = arc(a, b);
        const color = l.cargo ? "#D4A72C" : l.operator === "IN" ? (dark ? "#6FD3E4" : "#088395") : dark ? "#A9A6F5" : "#4B47B5";
        const style = { color, weight: focus ? 2 : 1.3, opacity: focus ? 0.95 : 0.6, dashArray: l.cargo ? "4 5" : undefined };
        // If the arc ends on a different world copy than b's marker, draw a shifted copy too.
        const shift = displayLon(b.lon) - pts.at(-1)![1];
        const lines = [<Polyline key={l.routeId} positions={pts} pathOptions={style} />];
        if (Math.abs(shift) > 1) lines.push(<Polyline key={`${l.routeId}-copy`} positions={pts.map(([la, lo]) => [la, lo + shift])} pathOptions={style} />);
        return lines;
      })}
      {airports.map((a) => {
        const isFocus = a.code === focus;
        const color = a.hub === "primary" ? "#D4A72C" : a.hub ? "#1B7F5C" : dark ? "#9DE4F0" : "#0A4D68";
        return (
          <CircleMarker
            key={a.code}
            center={[a.lat, displayLon(a.lon)]}
            radius={a.hub === "primary" ? 9 : a.hub ? 7 : 4}
            pathOptions={{ color: isFocus ? "#fff" : color, fillColor: color, fillOpacity: 1, weight: isFocus ? 3 : 1.5 }}
            eventHandlers={{ click: () => onFocus(a.code) }}
          >
            <Popup>
              <Box sx={{ minWidth: 180 }}>
                <Typography sx={{ fontWeight: 700 }}>{a.city} ({a.code})</Typography>
                <Typography variant="caption" component="div">{a.name}</Typography>
                <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                  {a.hub === "primary" ? "Primary hub · " : a.hub ? "Hub · " : ""}{routeCount(a.code)} nonstop route{routeCount(a.code) === 1 ? "" : "s"}
                </Typography>
                {links
                  .filter((l) => (l.from === a.code || l.to === a.code) && !l.cargo)
                  .slice(0, 6)
                  .map((l) => {
                    const other = l.from === a.code ? l.to : l.from;
                    return (
                      <Typography key={l.routeId} variant="caption" component="div">
                        <Link href={searchUrl({ from: a.code, to: other, date, adults: 1, children: 0, cabin: "economy" })} style={{ color: AIRLINE[l.operator].color }}>
                          {l.flightNo} to {byCode[other]?.city ?? other} →
                        </Link>
                      </Typography>
                    );
                  })}
              </Box>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
