import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@oranje-wit/database", "@oranje-wit/types", "@oranje-wit/auth"],
  experimental: {
    serverActions: {
      allowedOrigins: ["teamindeling.ckvoranjewit.app"],
    },
  },
};

export default nextConfig;
