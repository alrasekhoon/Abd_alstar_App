'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AddTermPage() {
  const [termName, setTermName] = useState('');

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-50 p-4 md:p-6">
      {/* شريط التنقل العلوي للربط بين الصفحات */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-sky-500 text-white rounded-full text-sm font-bold shadow-md">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-white text-sky-600 border border-sky-200 rounded-full text-sm font-bold hover:bg-sky-50">إنهاء فصل</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-white text-sky-600 border border-sky-200 rounded-full text-sm font-bold hover:bg-sky-50">سجل الفصول</Link>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
        <div className="bg-sky-500 p-6 text-white text-right">
          <h1 className="text-2xl font-bold">إضافة فصل دراسي جديد</h1>
          <p className="text-sky-50 text-sm mt-1">أدخل بيانات الفصل الجديد لفتحه في النظام</p>
        </div>

        <form className="p-8 space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2 text-sm">اسم الفصل الدراسي</label>
            <input
              type="text"
              placeholder="مثلاً: الفصل الدراسي الأول 2025"
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none transition text-right"
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2 text-sm">تاريخ البداية</label>
            <input type="date" className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none transition" />
          </div>

          <button type="submit" className="w-full bg-[#c4a900] hover:bg-[#b39a00] text-black font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 text-lg">
            اعتماد وفتح الفصل الدراسي
          </button>
        </form>
      </div>
    </div>
  );
}
