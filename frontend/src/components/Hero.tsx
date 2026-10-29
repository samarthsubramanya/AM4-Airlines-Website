import Box from "@mui/material/Box";

/** Dark peacock backdrop with soft feather "eyes". */
export function HeroBackdrop({ children, minHeight = 420 }: { children: React.ReactNode; minHeight?: number }) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        color: "#fff",
        minHeight,
        background: "linear-gradient(160deg, #06283D 0%, #0A4D68 55%, #088395 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(circle at 85% 20%, rgba(212,167,44,0.35) 0 40px, rgba(10,77,104,0.0) 41px, rgba(27,127,92,0.35) 42px 90px, transparent 91px)",
            "radial-gradient(circle at 70% 85%, rgba(212,167,44,0.25) 0 26px, transparent 27px, rgba(8,131,149,0.4) 28px 64px, transparent 65px)",
            "radial-gradient(circle at 10% 90%, rgba(27,127,92,0.35) 0 120px, transparent 121px)",
            "radial-gradient(ellipse at 100% 100%, rgba(212,167,44,0.18), transparent 50%)",
          ].join(","),
        },
      }}
    >
      <Box sx={{ position: "relative" }}>{children}</Box>
    </Box>
  );
}
