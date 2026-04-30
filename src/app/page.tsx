'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // التحقق من وجود token عند تحميل الصفحة
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // ضع هنا مسار أول صفحة في لوحة التحكم (مثلاً /adv بدلاً من /dashboard إذا لم تكن موجودة)
      router.replace('/adv'); 
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-bold text-gray-800">جاري التحميل...</h1>
        <p className="text-gray-500 mt-2">يتم التحقق من صلاحيات الدخول</p>
      </div>
    </div>
  );
}
