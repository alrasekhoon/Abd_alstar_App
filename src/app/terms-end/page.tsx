'use client';

import React from 'react';
import Link from 'next/link';

export default function EndTermPage() {
  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-50 p-4 md:p-6">
      {/* شريط التنقل العلوي */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-white text-sky-600 border border-sky-200 rounded-full text-sm font-bold hover:bg-sky-50">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-sky-500 text-white rounded-full text-sm font-bold shadow-md">إنهاء فصل</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-white text-sky-600 border border-sky-200 rounded-full text-sm font-bold hover:bg-sky-50">سجل الفصول</Link>
      </div>

      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-8 text-center border border-red-100">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-3">أرشفة الفصل الحالي</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          هذا الإجراء سيقوم بإغلاق كافة العمليات التعليمية للفصل الحالي ونقل البيانات للأرشيف.
        </p>

        <div className="space-y-4">
          <button className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
            تأكيد الإغلاق النهائي
          </button>
          <Link href="/terms-my" className="block w-full text-gray-400 font-bold py-2 text-sm hover:text-gray-600">
            إلغاء والعودة للسجل
          </Link>
        </div>
      </div>
    </div>
  );
}
