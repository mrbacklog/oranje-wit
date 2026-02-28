import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oranje-wit/database", "@oranje-wit/ui", "@oranje-wit/auth"],
};

export default nextConfig;
