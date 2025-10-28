import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    CUSTOM_API_URL: process.env.CUSTOM_API_URL,
  },
  
  experimental: {
    serverComponentsExternalPackages: [],
  },
  
  images: {
    domains: ['alrasekhooninlaw.com'],
    unoptimized: true,
  },
  
  // إعدادات الكاش لـ Vercel (محدودة التأثير)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate, max-age=0' },
        ],
      },
    ];
  },
  
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
};

export default nextConfig;