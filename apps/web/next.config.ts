import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // output: "standalone" is disabled lokaal vanwege Windows NTFS beperking
  // met Turbopack standalone (node:buffer in bestandsnaam). Railway build
  // draait op Linux en heeft dit probleem niet.
  output: process.platform === "win32" ? undefined : "standalone",
  transpilePackages: [
    "@oranje-wit/database",
    "@oranje-wit/types",
    "@oranje-wit/auth",
    "@oranje-wit/ui",
  ],
  serverExternalPackages: ["pg", "pg-connection-string", "pgpass"],
  // TypeScript checking wordt al gedaan in CI (GitHub Actions) —
  // in de Docker build is het overbodig en veroorzaakt Prisma type depth errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // Lege turbopack config zodat Next.js 16 niet faalt wanneer withPWA
  // een webpack-config injecteert.
  turbopack: {},
  experimental: {
    serverActions: {
      allowedOrigins: ["ckvoranjewit.app", "www.ckvoranjewit.app"],
    },
  },
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
})(nextConfig);
