import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@neighbourdoc/shared",
    "@neighbourdoc/api",
    "@neighbourdoc/ui",
    "@neighbordoc/shared",
    "@neighbordoc/api",
    "@neighbordoc/ui"
  ]
};

export default nextConfig;
