import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  // Allow the dev server to serve assets/HMR when accessed through GitHub
  // Codespaces' forwarded-port domain, which is a different origin than
  // localhost and is otherwise blocked by Next's dev cross-origin check.
  allowedDevOrigins: ['*.app.github.dev'],
  // Poll the filesystem so Turbopack detects edits made on the Windows host
  // through the Docker bind mount (native FS events don't cross that boundary).
  watchOptions: {
    pollIntervalMs: 1000,
  },
};

export default nextConfig;
