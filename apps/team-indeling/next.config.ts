import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oranje-wit/database", "@oranje-wit/types"],
};

export default nextConfig;
