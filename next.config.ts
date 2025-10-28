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
  
  // ⭐ إعدادات متقدمة للكاش ⭐
  async headers() {
    return [
      {
        // منع الكاش لجميع طلبات API والبروكسي
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Vary', value: '*' },
        ],
      },
      {
        // منع الكاش لجميع الصفحات الديناميكية
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
        missing: [
          { type: 'header', key: 'next-router-prefetch' },
          { type: 'header', key: 'purpose', value: 'prefetch' },
        ],
      },
      {
        // ملفات JavaScript - تحديث متكرر
        source: '/_next/static/chunks/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
        ],
      },
      {
        // CSS والويب باك - تحديث متكرر
        source: '/_next/static/css/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
        ],
      },
      {
        // الصور عبر Next Image
        source: '/_next/image/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
        ],
      },
    ];
  },
  
  // ⭐ إعدادات الترحيل مع التحكم في الكاش ⭐
  poweredByHeader: false,
  generateEtags: false, // تعطيل ETags للتقليل من الكاش
  
  // تحسينات الأداء
  compress: true,
  
  // إعدادات الترجمة (إذا كنت تستخدمها)
  i18n: {
    locales: ['ar'],
    defaultLocale: 'ar',
  },
};

export default nextConfig;