import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    CUSTOM_API_URL: process.env.CUSTOM_API_URL,
  },
  // إعدادات مهمة لـ Vercel
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // السماح بعرض الصور من النطاقات الخارجية
  images: {
    domains: ['https://alrasekhooninlaw.com', 'http://alrasekhooninlaw.com'],
    unoptimized: true, // مهم لـ Vercel
  },
};

export default nextConfig;