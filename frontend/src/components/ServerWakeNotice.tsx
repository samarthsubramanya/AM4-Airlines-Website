"use client";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { useEffect, useState } from "react";
import { onSlowRequests } from "@/lib/api";

export function ServerWakeNotice() {
  const [slow, setSlow] = useState(false);
  useEffect(() => onSlowRequests(setSlow), []);
  return (
    <Snackbar open={slow} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
      <Alert severity="info" variant="filled" sx={{ bgcolor: "primary.main" }}>
        Our servers are waking up. The first request can take up to a minute on free hosting.
      </Alert>
    </Snackbar>
  );
}
