'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PreviousTermsPage() {
  const [archivedTerms, setArchivedTerms] = useState<any[]>([]);

  useEffect(() => {
    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    // جلب الفصول المؤرشفة فقط
    const previous = savedTerms.filter((t: any) => t.status === 'مؤرشف');
    setArchivedTerms(previous);
  }, []);

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-100 p-2 md:p-4">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">الفصل الحالي</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-[#3b66f5] text-white rounded-full text-sm font-bold shadow-md">الفصول السابقة</Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 bg-blue-100 text-blue-900 p-4 rounded-xl shadow-sm border border-blue-200">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">سجل الفصول السابقة</h1>
        <div className="text-sm bg-blue-200 shadow-inner px-4 py-2 rounded-md font-bold">
          الفصول المؤرشفة: {archivedTerms.length}
        </div>
      </div>

      <div className="hidden md:block w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-right divide-y divide-gray-200 table-auto">
          <thead>
            <tr>
              <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800 w-10">#</th>
              <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">اسم الفصل</th>
              <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">الحالة</th>
              <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">تاريخ البدء</th>
              <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">الطلاب</th>
              <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {archivedTerms.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-bold">لا توجد فصول مؤرشفة</td></tr>
            ) : (
              archivedTerms.map((term) => (
                <tr key={term.id} className="bg-gray-50 hover:bg-gray-100 transition">
                  <td className="px-3 py-3 text-sm text-gray-400 font-medium w-10">{term.id}</td>
                  <td className="px-3 py-3 font-bold text-gray-900">{term.name}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600">مؤرشف</span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">{term.date}</td>
                  <td className="px-3 py-3 font-bold text-[#3b66f5]">{term.students}</td>
                  <td className="px-3 py-3">
                    <button className="bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm hover:bg-gray-400">عرض التقرير</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {archivedTerms.length === 0 ? (
           <div className="text-center py-10 bg-white rounded-2xl"><p className="text-gray-500 font-bold">لا توجد بيانات</p></div>
        ) : (
          archivedTerms.map((term) => (
            <div key={term.id} className="p-4 rounded-2xl shadow-sm border relative overflow-hidden bg-gray-50 border-gray-200">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-bold text-xs bg-gray-200 px-2 py-1 rounded-full">#{term.id}</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">مؤرشف</span>
               </div>
               <div className="text-center font-extrabold text-lg text-gray-900 mb-4">{term.name}</div>
               <div className="grid grid-cols-2 gap-2 mb-4">
                 <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                   <span className="text-gray-400 block text-[10px] font-medium mb-1">تاريخ البدء</span>
                   <span className="font-extrabold text-gray-900 text-sm">{term.date}</span>
                 </div>
                 <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                   <span className="text-gray-400 block text-[10px] font-medium mb-1">عدد الطلاب</span>
                   <span className="font-bold text-[#3b66f5] text-sm">{term.students}</span>
                 </div>
               </div>
               <button className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-xl font-bold text-xs shadow-sm transition">عرض التقرير الكامل</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
