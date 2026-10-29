"use client";
import Button, { type ButtonProps } from "@mui/material/Button";
import Link from "next/link";

/** MUI Button rendered as a Next.js link; usable from Server Components. */
export function LinkButton({ href, ...props }: Omit<ButtonProps, "href"> & { href: string }) {
  return <Button component={Link} href={href} {...props} />;
}
