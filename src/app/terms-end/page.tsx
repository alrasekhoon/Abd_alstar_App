'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ActiveTermPage() {
  const [activeTerms, setActiveTerms] = useState<any[]>([]);

  useEffect(() => {
    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    // جلب الفصل النشط فقط
    const currentActive = savedTerms.filter((t: any) => t.status === 'نشط');
    setActiveTerms(currentActive);
  }, []);

  const handleEndTerm = (id: number) => {
    if(confirm('هل أنت متأكد من رغبتك في إنهاء هذا الفصل وأرشفته بشكل نهائي؟')) {
      const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
      const updatedTerms = savedTerms.map((t: any) => 
        t.id === id ? { ...t, status: 'مؤرشف' } : t
      );
      localStorage.setItem('app_terms', JSON.stringify(updatedTerms));
      setActiveTerms([]);
      alert('تم إغلاق الفصل وأرشفته بنجاح.');
    }
  };

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-100 p-2 md:p-4">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-[#3b66f5] text-white rounded-full text-sm font-bold shadow-md">الفصل الحالي</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:
