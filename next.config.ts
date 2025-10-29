import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    CUSTOM_API_URL: process.env.CUSTOM_API_URL,
  },
  
  experimental: {
    serverComponentsExternalPackages: [],
    // إضافة هذه الإعدادات المهمة
    staleTimes: {
      dynamic: 0,  // لا كاش للصفحات الديناميكية
      static: 60,  // 60 ثانية فقط للصفحات الثابتة
    },
  },
  
  images: {
    domains: ['alrasekhooninlaw.com'],
    unoptimized: true,
  },
  
  // تحسين إعدادات الهيدرز
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
        source: '/:path*', // لجميع الصفحات
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