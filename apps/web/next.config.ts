import type { NextConfig } from "next";

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
  experimental: {
    serverActions: {
      allowedOrigins: ["ckvoranjewit.app"],
    },
  },
};

export default nextConfig;
