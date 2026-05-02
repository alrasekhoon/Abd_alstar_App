'use client';

import { useState } from 'react';

export default function AddTermPage() {
  const [termName, setTermName] = useState('');
  const [startDate, setStartDate] = useState('');

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        {/* العنوان */}
        <div className="bg-blue-600 p-6 text-white text-right">
          <h1 className="text-2xl font-bold">إضافة فصل دراسي جديد</h1>
          <p className="text-blue-100 text-sm mt-1">قم بتعبئة البيانات لفتح فصل دراسي جديد في النظام</p>
        </div>

        <form className="p-6 space-y-6">
          {/* اسم الفصل */}
          <div>
            <label className="block text-gray-700 font-bold mb-2">اسم الفصل الدراسي</label>
            <input
              type="text"
              placeholder="مثلاً: خريف 2024 أو الفصل الدراسي الأول"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c4a900] outline-none transition"
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
            />
          </div>

          {/* تاريخ البدء */}
          <div>
            <label className="block text-gray-700 font-bold mb-2">تاريخ بداية الفصل</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c4a900] outline-none transition"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* زر الحفظ */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-[#c4a900] hover:bg-[#b39a00] text-black font-black py-4 rounded-xl shadow-lg transition-all active:scale-95"
            >
              اعتماد وإضافة الفصل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
