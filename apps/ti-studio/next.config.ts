import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.platform === "win32" ? undefined : "standalone",
  transpilePackages: [
    "@oranje-wit/database",
    "@oranje-wit/types",
    "@oranje-wit/auth",
    "@oranje-wit/ui",
    "@oranje-wit/sportlink",
    "@oranje-wit/teamindeling-shared",
  ],
  serverExternalPackages: ["pg", "pg-connection-string", "pgpass", "pdfkit"],
  outputFileTracingIncludes: {
    "/api/presentatie/preseason-pdf": [
      "./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/data/**",
    ],
  },
  // TypeScript checking wordt al gedaan in CI (GitHub Actions) —
  // in de Docker build is het overbodig en veroorzaakt Prisma type depth errors
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  experimental: {
    serverActions: {
      allowedOrigins: ["teamindeling.ckvoranjewit.app", "localhost:3001"],
    },
  },
};

export default nextConfig;
