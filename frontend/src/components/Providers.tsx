"use client";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import "dayjs/locale/en-gb";
import { AuthProvider } from "@/lib/auth";
import { theme } from "@/lib/theme";
import { TripProvider } from "@/lib/trip";
import { ServerWakeNotice } from "./ServerWakeNotice";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <AuthProvider>
          <TripProvider>
            {children}
            <ServerWakeNotice />
          </TripProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
