import type { NextConfig } from "next";

// NEXT_PUBLIC_API_URL is baked into the browser bundle at build time. On a hosted build
// (Vercel, Netlify, CI) a missing value would silently ship http://localhost:4000, so fail instead.
const hosted = process.env.VERCEL || process.env.NETLIFY || process.env.CI;
if (hosted && !process.env.NEXT_PUBLIC_API_URL?.trim()) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set for this build. Add it (e.g. https://indian-com-api.onrender.com) in your hosting " +
      "project's environment variables for this environment (Production/Preview), then redeploy.",
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
