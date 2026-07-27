import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted in the canonical application checkout.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
