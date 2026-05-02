'use client';

import React from 'react';
import Link from 'next/link';

export default function MyTermsPage() {
  const terms = [
    { id: 1, name: 'الفصل الدراسي الأول 2025', status: 'نشط', date: '2025-01-10', students: 450 },
    { id: 2, name: 'فصل خريف 2024', status: 'مؤرشف', date: '2024-09-05', students: 890 },
  ];

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-50 p-4 md:p-6">
      {/* شريط التنقل العلوي */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-white text-sky-600 border border-sky-200 rounded-full text-sm font-bold hover:bg-sky-50">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-white text-sky-600 border border-sky-200 rounded-full text-sm font-bold hover:bg-sky-50">إنهاء فصل</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-sky-500 text-white rounded-full text-sm font-bold shadow-md">سجل الفصول</Link>
      </div>

      <div className="bg-sky-500 p-6 rounded-2xl text-white mb-6 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">سجل الفصول الدراسية</h1>
          <p className="text-sky-100 text-xs mt-1">إدارة ومتابعة كافة الفصول الدراسية المسجلة</p>
        </div>
        <div className="bg-sky-700/30 px-4 py-2 rounded-xl border border-sky-400/30 font-bold text-sm">
          العدد: {terms.length}
        </div>
      </div>

      {/* الجدول (حاسوب) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#c4a900] text-black">
              <th className="p-4 text-sm font-black">#</th>
              <th className="p-4 text-sm font-black">المسمى</th>
              <th className="p-4 text-sm font-black">الحالة</th>
              <th className="p-4 text-sm font-black">التاريخ</th>
              <th className="p-4 text-sm font-black">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {terms.map((term) => (
              <tr key={term.id} className="hover:bg-sky-50/50 transition-colors">
                <td className="p-4 text-gray-400 font-bold text-sm">{term.id}</td>
                <td className="p-4 font-black text-gray-800 text-sm">{term.name}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${term.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {term.status}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-sm">{term.date}</td>
                <td className="p-4">
                  <button className="bg-sky-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">عرض</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* البطاقات (هاتف) */}
      <div className="md:hidden space-y-4">
        {terms.map((term) => (
          <div key={term.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between mb-4">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${term.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{term.status}</span>
                <span className="text-gray-300 font-black italic">#{term.id}</span>
             </div>
             <div className="text-center font-black text-gray-800 mb-5">{term.name}</div>
             <div className="bg-gray-50 p-4 rounded-xl space-y-2 mb-4 text-xs">
                <div className="flex justify-between font-bold"><span className="opacity-50">تاريخ البدء:</span> <span>{term.date}</span></div>
                <div className="flex justify-between font-bold"><span className="opacity-50">الطلاب:</span> <span className="text-sky-600">{term.students} طالب</span></div>
             </div>
             <button className="w-full bg-sky-500 text-white py-3.5 rounded-xl font-black text-xs shadow-md">تقرير الفصل</button>
          </div>
        ))}
      </div>
    </div>
  );
}
