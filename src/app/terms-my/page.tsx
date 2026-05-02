'use client';

import React from 'react';

export default function MyTermsPage() {
  // بيانات تجريبية
  const terms = [
    { id: 1, name: 'فصل خريف 2024', status: 'نشط', date: '2024-09-01', students: 150 },
    { id: 2, name: 'فصل ربيع 2024', status: 'مؤرشف', date: '2024-02-15', students: 230 },
  ];

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="bg-blue-600 p-6 rounded-2xl text-white mb-6 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">سجل الفصول الدراسية</h1>
        <span className="bg-blue-800 px-4 py-1 rounded-full text-xs font-bold">إجمالي الفصول: {terms.length}</span>
      </div>

      {/* عرض الحاسوب (جدول) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-[#c4a900] text-black">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">اسم الفصل</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">تاريخ البدء</th>
              <th className="p-4">عدد الطلاب</th>
              <th className="p-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {terms.map((term) => (
              <tr key={term.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-bold text-gray-400">#{term.id}</td>
                <td className="p-4 font-bold">{term.name}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${term.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {term.status}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{term.date}</td>
                <td className="p-4 font-bold text-blue-600">{term.students}</td>
                <td className="p-4"><button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs">عرض التفاصيل</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* عرض الهاتف (بطاقات مرتبة بجمل) */}
      <div className="md:hidden space-y-4">
        {terms.map((term) => (
          <div key={term.id} className="bg-white p-5 rounded-2xl shadow-sm border relative">
             <div className="flex justify-between items-start mb-4">
                <span className="text-gray-300 font-black text-xl">#{term.id}</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${term.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {term.status}
                </span>
             </div>
             <div className="text-center font-black text-lg text-gray-900 mb-4">{term.name}</div>
             <div className="space-y-2 mb-4 border-t pt-4">
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400 font-bold">تاريخ البداية:</span>
                   <span className="font-black text-gray-800">{term.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400 font-bold">عدد الطلاب المسجلين:</span>
                   <span className="font-black text-blue-700">{term.students} طالب</span>
                </div>
             </div>
             <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs shadow-md">عرض التقرير الكامل</button>
          </div>
        ))}
      </div>
    </div>
  );
}
