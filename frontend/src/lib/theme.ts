"use client";
import { createTheme } from "@mui/material/styles";

// Peacock palette: deep peacock blue, feather teal, emerald and an "eye" gold.
export const peacock = {
  blue: "#0A4D68",
  teal: "#088395",
  emerald: "#1B7F5C",
  gold: "#D4A72C",
  ink: "#06283D",
};

const headingFont = "var(--font-heading), 'Outfit', system-ui, sans-serif";

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: peacock.blue, light: "#2C7A99", dark: peacock.ink, contrastText: "#fff" },
        secondary: { main: peacock.gold, dark: "#A97F12", contrastText: peacock.ink },
        success: { main: peacock.emerald },
        info: { main: peacock.teal },
        background: { default: "#F5F8F8", paper: "#FFFFFF" },
        text: { primary: "#0F1F26", secondary: "#4A5E66" },
        divider: "rgba(10, 77, 104, 0.12)",
      },
    },
    dark: {
      palette: {
        primary: { main: "#6FD3E4", light: "#9DE4F0", dark: "#2BA8BE", contrastText: "#03202A" },
        secondary: { main: "#F0C75A", contrastText: "#2A1E00" },
        success: { main: "#5FD3A2" },
        info: { main: "#5CC8D6" },
        background: { default: "#071419", paper: "#0E2129" },
        text: { primary: "#E6F1F3", secondary: "#9DB4BB" },
        divider: "rgba(157, 228, 240, 0.14)",
      },
    },
  },
  // sx `borderRadius: n` = n × 4px
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
    h1: { fontFamily: headingFont, fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontFamily: headingFont, fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontFamily: headingFont, fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontFamily: headingFont, fontWeight: 600 },
    h5: { fontFamily: headingFont, fontWeight: 600 },
    h6: { fontFamily: headingFont, fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    overline: { fontWeight: 700, letterSpacing: "0.12em" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, paddingInline: 20 }, sizeLarge: { paddingBlock: 12, fontSize: "1rem" } },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: { root: { borderRadius: 20 } },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 20 } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 12 } } },
    MuiAutocomplete: { styleOverrides: { paper: { borderRadius: 12 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    MuiAppBar: { defaultProps: { elevation: 0, color: "inherit" } },
  },
});
