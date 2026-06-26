import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;
