import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // لتحويل المشروع لملفات HTML ثابتة تعمل على هوستنجر
  basePath: '/12',  // لكي تعمل الروابط داخل مجلد 12
  images: {
    unoptimized: true, // لكي تظهر الصور بدون مشاكل
  },
};

export default nextConfig;
