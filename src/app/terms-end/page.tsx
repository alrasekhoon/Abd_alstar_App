'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EndTermPage() {
  const [activeTerm, setActiveTerm] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    const currentActive = savedTerms.find((t: any) => t.status === 'نشط');
    setActiveTerm(currentActive);
  }, []);

  const handleEndTerm = () => {
    if (!activeTerm) return;
    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    const updatedTerms = savedTerms.map((t: any) => 
      t.id === activeTerm.id ? { ...t, status: 'مؤرشف' } : t
    );
    localStorage.setItem('app_terms', JSON.stringify(updatedTerms));
    alert('تم إنهاء الفصل وأرشفته بنجاح!');
    router.push('/terms-my');
  };

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-100 p-2 md:p-4">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-[#3b66f5] text-white rounded-full text-sm font-bold shadow-md">إنهاء فصل</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">سجل الفصول</Link>
      </div>

      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-200">
        {!activeTerm ? (
           <div className="py-10">
             <h2 className="text-xl font-bold text-gray-500 mb-4">لا يوجد فصل دراسي نشط حالياً لإنهاءه</h2>
             <Link href="/terms-add" className="bg-[#3b66f5] text-white px-6 py-2 rounded-lg font-bold">إضافة فصل جديد</Link>
           </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-black text-gray-900 mb-2">أرشفة الفصل الحالي</h1>
            <div className="bg-blue-50 border border-blue-200 text-blue-900 font-bold py-2 px-4 rounded-lg inline-block mb-4">
              {activeTerm.name}
            </div>
            
            <p className="text-gray-500 mb-8 text-sm leading-relaxed font-bold">
              هذا الإجراء سيقوم بإغلاق كافة العمليات التعليمية للفصل الحالي ونقل البيانات للأرشيف.
            </p>

            <div className="space-y-3">
              <button onClick={handleEndTerm} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-sm active:scale-95 transition-all">
                تأكيد الإغلاق النهائي
              </button>
              <Link href="/terms-my" className="block w-full text-gray-500 font-bold py-2 text-sm hover:text-gray-800 bg-gray-100 rounded-xl">
                إلغاء والعودة للسجل
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
