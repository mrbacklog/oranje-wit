import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oranje-wit/database", "@oranje-wit/types", "@oranje-wit/auth"],
  experimental: {
    serverActions: {
      allowedOrigins: ["teamindeling.ckvoranjewit.app"],
    },
  },
};

export default nextConfig;
