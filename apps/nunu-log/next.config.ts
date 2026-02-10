import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bubu-log/ui", "@bubu-log/log-ui"],
};

export default nextConfig;
