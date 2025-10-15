//page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // التحقق من وجود token عند تحميل الصفحة
    const token = localStorage.getItem('authToken');
    
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">جاري التحميل...</h1>
        <p>يتم التحقق من حالة تسجيل الدخول</p>
      </div>
    </div>
  );
}

///G~-LNCN+5XuXpXJ-