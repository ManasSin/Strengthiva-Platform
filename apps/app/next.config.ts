import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build (server + only the node_modules
  // it actually needs) — keeps the production Docker image small instead of shipping
  // the full pnpm workspace node_modules tree.
  output: "standalone",
};

export default nextConfig;
