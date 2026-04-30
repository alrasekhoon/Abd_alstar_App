import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    CUSTOM_API_URL: process.env.CUSTOM_API_URL,
  },
  
  // تم نقل الخيار من experimental إلى الإعدادات الأساسية
  serverExternalPackages: [],

  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 60,
    },
  },
  
  images: {
    // تحديث domains إلى الطريقة الجديدة والآمنة
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'alrasekhooninlaw.com',
      },
    ],
    unoptimized: true,
  },
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { 
            key: 'Cache-Control', 
            value: 'no-cache, no-store, max-age=0, must-revalidate' 
          },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { 
            key: 'Cache-Control', 
            value: 'public, max-age=0, must-revalidate' 
          },
        ],
      },
    ];
  },
  
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
};

export default nextConfig;
