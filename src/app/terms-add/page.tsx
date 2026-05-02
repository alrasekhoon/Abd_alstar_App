'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AddTermPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'warning' | 'form'>('form');
  const [activeTerm, setActiveTerm] = useState<any>(null);
  const [termName, setTermName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (isModalOpen) {
      const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
      const currentActive = savedTerms.find((t: any) => t.status === 'نشط');
      if (currentActive) {
        setActiveTerm(currentActive);
        setModalStep('warning');
      } else {
        setModalStep('form');
      }
    }
  }, [isModalOpen]);

  const handleEndCurrentTerm = () => {
    // TODO: API call to archive current term
    // عند الأرشفة، يجب حذف/تصفير جميع الاشتراكات الحالية للطلاب في الخادم
    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    const updatedTerms = savedTerms.map((t: any) =>
      t.id === activeTerm.id ? { ...t, status: 'مؤرشف' } : t
    );
    localStorage.setItem('app_terms', JSON.stringify(updatedTerms));
    setActiveTerm(null);
    setModalStep('form');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termName || !startDate) {
      alert('الرجاء تعبئة اسم الفصل وتاريخ البداية على الأقل');
      return;
    }
    // TODO: API call to create new term
    // ملاحظة: عند إنشاء فصل جديد، يجب وضع "فاصل" في سجلات الإشعارات المالية
    // والاشتراكات لتمييز بيانات الفصل الجديد عن السابق
    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    const newTerm = {
      id: savedTerms.length > 0 ? Math.max(...savedTerms.map((t: any) => t.id)) + 1 : 1,
      name: termName,
      status: 'نشط',
      date: startDate,
      notes: notes,
      students: 0,
      subscriptions: []
    };
    localStorage.setItem('app_terms', JSON.stringify([newTerm, ...savedTerms]));
    alert('تمت إضافة الفصل بنجاح!');
    setIsModalOpen(false);
    setTermName('');
    setStartDate('');
    setNotes('');
    router.push('/terms-end');
  };

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-100 p-2 md:p-4">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-[#3b66f5] text-white rounded-full text-sm font-bold shadow-md">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">الفصل الحالي</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">الفصول السابقة</Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 bg-blue-100 text-blue-900 p-4 rounded-xl shadow-sm border border-blue-200">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">إضافة فصل دراسي جديد</h1>
      </div>

      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#3b66f5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">بدء فصل دراسي جديد</h2>
          <p className="text-gray-500 mb-8 font-medium">اضغط على الزر أدناه لفتح نافذة إضافة فصل جديد للنظام</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#c4a900] hover:bg-[#b39a00] text-black font-extrabold px-10 py-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-3 mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة فصل جديد
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className={`px-6 py-4 flex justify-between items-center text-white ${modalStep === 'warning' ? 'bg-orange-500' : 'bg-[#3b66f5]'}`}>
              <h3 className="text-xl font-bold">{modalStep === 'warning' ? 'تنبيه تنظيمي' : 'إضافة فصل جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {modalStep === 'warning' && activeTerm && (
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-xl font-black text-gray-900">يوجد فصل نشط حالياً</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
                  الفصل النشط: <span className="font-black text-blue-600 text-base">{activeTerm.name}</span><br/>
                  يجب إنهاء هذا الفصل وأرشفته أولاً قبل إضافة فصل جديد.
                </div>
                <div className="flex gap-3">
                  <button onClick={handleEndCurrentTerm} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-xl transition-all active:scale-95 text-xs">
                    إنهاء الفصل الحالي والمتابعة
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-xs border border-gray-200">
                    تراجع
                  </button>
                </div>
              </div>
            )}

            {modalStep === 'form' && (
              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">اسم الفصل <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-right" placeholder="مثال: الفصل الأول 2025" value={termName} onChange={(e) => setTermName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">تاريخ البداية <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-right" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">ملاحظات</label>
                  <textarea rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-right resize-none" placeholder="أي ملاحظات إضافية..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-[#c4a900] hover:bg-[#b39a00] text-black font-extrabold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-sm">حفظ الفصل الجديد</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-sm border border-gray-200">إلغاء</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
