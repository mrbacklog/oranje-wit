import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@oranje-wit/database", "@oranje-wit/types", "@oranje-wit/auth"],
};

export default nextConfig;
