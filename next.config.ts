import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parent directory is a stale clone with its own lockfile; keep Turbopack
  // rooted in this application checkout.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
