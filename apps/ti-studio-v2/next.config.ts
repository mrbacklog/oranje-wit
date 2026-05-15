import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.platform === "win32" ? undefined : "standalone",
  transpilePackages: [
    "@oranje-wit/database",
    "@oranje-wit/types",
    "@oranje-wit/auth",
    "@oranje-wit/ui",
    "@atlaskit/pragmatic-drag-and-drop",
  ],
  serverExternalPackages: ["pg", "pg-connection-string", "pgpass"],
  // TypeScript checking gebeurt al via `pnpm typecheck` in CI;
  // in de Docker build is het overbodig.
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  experimental: {
    serverActions: {
      allowedOrigins: [
        "studio-test.ckvoranjewit.app",
        "studio-v2.ckvoranjewit.app",
        "localhost:3002",
      ],
    },
  },
};

export default nextConfig;
