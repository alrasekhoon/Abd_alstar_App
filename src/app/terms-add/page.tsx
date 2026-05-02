'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AddTermPage() {
  const [termName, setTermName] = useState('');
  const [startDate, setStartDate] = useState('');
  const router = useRouter();

  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termName || !startDate) return alert('الرجاء تعبئة كافة الحقول');

    // جلب الفصول السابقة أو إنشاء مصفوفة جديدة
    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    
    const newTerm = {
      id: savedTerms.length > 0 ? Math.max(...savedTerms.map((t: any) => t.id)) + 1 : 1,
      name: termName,
      status: 'نشط',
      date: startDate,
      students: 0
    };

    localStorage.setItem('app_terms', JSON.stringify([newTerm, ...savedTerms]));
    alert('تمت إضافة الفصل بنجاح!');
    router.push('/terms-my');
  };

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-100 p-2 md:p-4">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-[#3b66f5] text-white rounded-full text-sm font-bold shadow-md">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">إنهاء فصل</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">سجل الفصول</Link>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col mb-0 gap-1 bg-blue-100 text-blue-900 p-6 shadow-sm border-b border-blue-200 text-right">
          <h1 className="text-2xl font-extrabold tracking-tight">إضافة فصل دراسي جديد</h1>
          <p className="text-sm font-bold opacity-80">قم بتعبئة البيانات لفتح فصل دراسي جديد في النظام</p>
        </div>

        <form onSubmit={handleAddTerm} className="p-8 space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2 text-sm">اسم الفصل الدراسي</label>
            <input
              type="text"
              placeholder="مثلاً: الفصل الدراسي الأول 2025"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900] transition-all text-right"
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2 text-sm">تاريخ البداية</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900] transition-all text-right" 
            />
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-[#c2aa27] hover:bg-[#b39a00] text-black font-extrabold py-3.5 rounded-xl shadow-sm transition-all active:scale-95 text-lg">
              اعتماد وفتح الفصل الدراسي
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
