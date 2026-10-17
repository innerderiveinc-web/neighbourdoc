import type { NextConfig } from "next";

const apiBase = process.env.NEIGHBORDOC_API_ORIGIN ?? "http://localhost:3100";

const nextConfig: NextConfig = {
  transpilePackages: ["@neighbordoc/ui"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  }
};

export default nextConfig;
