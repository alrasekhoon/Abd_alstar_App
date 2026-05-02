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

    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    const newTerm = {
      id: savedTerms.length > 0 ? Math.max(...savedTerms.map((t: any) => t.id)) + 1 : 1,
      name: termName,
      status: 'نشط',
      date: startDate,
      notes: notes,
      students: 0
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
    <div dir="rtl" className="font-sans min-h-screen bg-gray-50 p-4 md:p-6 relative">
      {/* شريط التنقل العلوي المحدث */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-md">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">الفصل الحالي</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">الفصول السابقة</Link>
      </div>

      <div className="max-w-4xl mx-auto mt-10 text-center">
        <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-3xl p-12 flex flex-col items-center justify-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-24 h-24 bg-[#c4a900] hover:bg-[#b39a00] text-white rounded-full shadow-xl flex items-center justify-center text-5xl transition-transform hover:scale-105 active:scale-95 mb-6"
          >
            +
          </button>
          <h2 className="text-2xl font-extrabold text-blue-900 mb-2">إضافة فصل دراسي جديد</h2>
          <p className="text-gray-500 font-medium">اضغط على الزر أعلاه لفتح نافذة إضافة فصل جديد للنظام</p>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className={`px-6 py-4 flex justify-between items-center text-white ${modalStep === 'warning' ? 'bg-orange-500' : 'bg-blue-600'}`}>
              <h3 className="text-xl font-bold">{modalStep === 'warning' ? 'تنبيه تنظيمي' : 'إضافة فصل جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {modalStep === 'warning' && activeTerm && (
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-xl font-black text-gray-900">عذراً، لا يمكن إضافة فصل جديد</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 leading-relaxed">
                  يوجد فصل دراسي نشط حالياً وهو: <br/>
                  <span className="font-black text-blue-600 text-base">{activeTerm.name}</span><br/>
                  يجب إنهاء هذا الفصل وأرشفته أولاً.
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleEndCurrentTerm} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-xs">
                    إنهاء الفصل الحالي والمتابعة
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-all text-xs border border-gray-200">
                    تراجع
                  </button>
                </div>
              </div>
            )}

            {modalStep === 'form' && (
              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">اسم الفصل <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-right" value={termName} onChange={(e) => setTermName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">تاريخ البداية <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-right" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">ملاحظات</label>
                  <textarea rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-right resize-none" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-[#c4a900] hover:bg-[#b39a00] text-black font-extrabold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-sm">حفظ البيانات</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-all text-sm border border-gray-200">إلغاء</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
