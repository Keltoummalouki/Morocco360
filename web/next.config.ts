import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  // Poll the filesystem so Turbopack detects edits made on the Windows host
  // through the Docker bind mount (native FS events don't cross that boundary).
  watchOptions: {
    pollIntervalMs: 1000,
  },
};

export default nextConfig;
