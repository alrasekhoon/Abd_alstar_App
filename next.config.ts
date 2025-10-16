import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    CUSTOM_API_URL: process.env.CUSTOM_API_URL,
  },
};

export default nextConfig;