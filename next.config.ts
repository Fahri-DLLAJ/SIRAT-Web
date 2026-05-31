import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.16"],
  experimental: {
    // Allow the stream proxy route to run without a response timeout
    proxyTimeout: 0,
  },
};

export default nextConfig;
