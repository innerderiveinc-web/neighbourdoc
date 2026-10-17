import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@neighbordoc/shared", "@neighbordoc/api", "@neighbordoc/ui"]
};

export default nextConfig;
