'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ======================================================
// بيانات تجريبية - سيتم استبدالها بـ API calls لاحقاً
// ======================================================
const MOCK_STUDENTS = [
  { id: 1, name: 'أحمد محمد', phone: '+963991234567', subscriptions: [
    { subject: 'رياضيات', type: 'مطبوع', cost: 5000 },
    { subject: 'فيزياء', type: 'إلكتروني', cost: 3000 },
  ]},
  { id: 2, name: 'سارة علي', phone: '+963997654321', subscriptions: [
    { subject: 'رياضيات', type: 'إلكتروني', cost: 3000 },
    { subject: 'كيمياء', type: 'مطبوع', cost: 5000 },
  ]},
  { id: 3, name: 'محمد خالد', phone: '+963994567890', subscriptions: [
    { subject: 'فيزياء', type: 'مطبوع', cost: 5000 },
    { subject: 'كيمياء', type: 'إلكتروني', cost: 3000 },
    { subject: 'رياضيات', type: 'مطبوع', cost: 5000 },
  ]},
  { id: 4, name: 'لينا حسن', phone: '+963993456789', subscriptions: [
    { subject: 'كيمياء', type: 'مطبوع', cost: 5000 },
  ]},
];

const MOCK_SUBJECTS = [
  { name: 'رياضيات', total: 3, printed: 2, digital: 1 },
  { name: 'فيزياء', total: 2, printed: 1, digital: 1 },
  { name: 'كيمياء', total: 3, printed: 2, digital: 1 },
];

export default function ActiveTermPage() {
  const [activeTerms, setActiveTerms] = useState<any[]>([]);
  const [studentsModal, setStudentsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [subjectModal, setSubjectModal] = useState<any>(null);
  const [notifModal, setNotifModal] = useState(false);
  const [notifText, setNotifText] = useState('');

  useEffect(() => {
    // TODO: استبدل بـ API call: GET /api/terms?status=active
    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    const currentActive = savedTerms.filter((t: any) => t.status === 'نشط');
    setActiveTerms(currentActive);
  }, []);

  const handleEndTerm = (id: number) => {
    if (confirm('هل أنت متأكد من رغبتك في إنهاء هذا الفصل وأرشفته؟')) {
      // TODO: API call: PUT /api/terms/:id { status: 'مؤرشف' }
      // ملاحظة مهمة: عند إنهاء الفصل، يجب على الخادم:
      // 1. تغيير حالة الفصل إلى 'مؤرشف'
      // 2. حذف/تصفير جميع الاشتراكات الحالية للطلاب المرتبطة بهذا الفصل
      // 3. إرسال إشعار للطلاب بانتهاء الفصل
      const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
      const updatedTerms = savedTerms.map((t: any) =>
        t.id === id ? { ...t, status: 'مؤرشف' } : t
      );
      localStorage.setItem('app_terms', JSON.stringify(updatedTerms));
      setActiveTerms([]);
      alert('تم إغلاق الفصل وأرشفته بنجاح.');
    }
  };

  const handleDeleteTerm = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الفصل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      // TODO: API call: DELETE /api/terms/:id
      const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
      localStorage.setItem('app_terms', JSON.stringify(savedTerms.filter((t: any) => t.id !== id)));
      setActiveTerms([]);
      alert('تم حذف الفصل.');
    }
  };

  const handleSendNotification = () => {
    // TODO: API call: POST /api/notifications { termId, message, recipients: 'all_subscribers' }
    alert(`تم إرسال الإشعار: "${notifText}"`);
    setNotifModal(false);
    setNotifText('');
  };

  // الطلاب المشتركون في مادة معينة
  const getSubjectStudents = (subjectName: string) => {
    return MOCK_STUDENTS.filter(s => s.subscriptions.some(sub => sub.subject === subjectName));
  };

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-100 p-2 md:p-4">
      {/* شريط التنقل */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-[#3b66f5] text-white rounded-full text-sm font-bold shadow-md">الفصل الحالي</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">الفصول السابقة</Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 bg-blue-100 text-blue-900 p-4 rounded-xl shadow-sm border border-blue-200">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">الفصل الدراسي الحالي</h1>
        <div className="text-sm bg-blue-200 shadow-inner px-4 py-2 rounded-md font-bold">
          الفصول النشطة: {activeTerms.length}
        </div>
      </div>

      {activeTerms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <p className="text-gray-500 font-bold mb-4">لا يوجد فصل نشط حالياً</p>
          <Link href="/terms-add" className="bg-[#3b66f5] text-white px-6 py-2.5 rounded-xl font-bold text-sm inline-block">إضافة فصل جديد</Link>
        </div>
      ) : (
        activeTerms.map((term) => (
          <div key={term.id} className="space-y-4">

            {/* بطاقة معلومات الفصل */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse inline-block"></span>
                    <h2 className="text-2xl font-extrabold text-gray-900">{term.name}</h2>
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold">نشط</span>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">تاريخ البدء: {term.date}</p>
                  {term.notes && <p className="text-gray-400 text-xs mt-1">{term.notes}</p>}
                </div>
                {/* أزرار الإجراءات السريعة */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setNotifModal(true)} className="bg-[#ed7c1e] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
                    إشعار للمشتركين
                  </button>
                  <button onClick={() => handleEndTerm(term.id)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-600 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"/></svg>
                    إنهاء الفصل
                  </button>
                  <button onClick={() => handleDeleteTerm(term.id)} className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    حذف الفصل
                  </button>
                </div>
              </div>
            </div>

            {/* بطاقة المستخدمين */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#3b66f5]" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                  المستخدمون المشتركون
                </h3>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-bold">{MOCK_STUDENTS.length} طالب</span>
                  <button onClick={() => setStudentsModal(true)} className="bg-[#3b66f5] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">
                    عرض القائمة
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <p className="text-2xl font-extrabold text-[#3b66f5]">{MOCK_STUDENTS.length}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">إجمالي الطلاب</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                  <p className="text-2xl font-extrabold text-green-700">{MOCK_STUDENTS.filter(s => s.subscriptions.some(sub => sub.type === 'مطبوع')).length}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">مشتركو المطبوع</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                  <p className="text-2xl font-extrabold text-purple-700">{MOCK_STUDENTS.filter(s => s.subscriptions.some(sub => sub.type === 'إلكتروني')).length}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">مشتركو الإلكتروني</p>
                </div>
              </div>
            </div>

            {/* جدول المشتريات حسب المادة */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#c4a900]" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
                إحصائيات المشتريات حسب المادة
              </h3>

              {/* نسخة الحاسوب */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-xs font-extrabold bg-[#f5e97a] border-b border-[#c8b800] text-gray-800">المادة</th>
                      <th className="px-4 py-3 text-xs font-extrabold bg-[#f0e060] border-b border-[#c8b800] text-gray-800">الإجمالي</th>
                      <th className="px-4 py-3 text-xs font-extrabold bg-[#f5e97a] border-b border-[#c8b800] text-gray-800">مطبوع</th>
                      <th className="px-4 py-3 text-xs font-extrabold bg-[#f0e060] border-b border-[#c8b800] text-gray-800">إلكتروني</th>
                      <th className="px-4 py-3 text-xs font-extrabold bg-[#f5e97a] border-b border-[#c8b800] text-gray-800">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {MOCK_SUBJECTS.map((subject) => (
                      <tr key={subject.name} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-bold text-gray-900">{subject.name}</td>
                        <td className="px-4 py-3 font-bold text-[#3b66f5]">{subject.total}</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">{subject.printed} مطبوع</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold">{subject.digital} إلكتروني</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSubjectModal(subject)} className="bg-[#3b66f5] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition">
                            عرض الطلاب
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* نسخة الهاتف */}
              <div className="md:hidden space-y-3">
                {MOCK_SUBJECTS.map((subject) => (
                  <div key={subject.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-extrabold text-gray-900">{subject.name}</h4>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">{subject.total} إجمالي</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">{subject.printed} مطبوع</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold">{subject.digital} إلكتروني</span>
                    </div>
                    <button onClick={() => setSubjectModal(subject)} className="w-full bg-[#3b66f5] text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition">
                      عرض الطلاب المشتركين
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      {/* مودال قائمة الطلاب */}
      {studentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="bg-[#3b66f5] text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-lg font-bold">قائمة المشتركين ({MOCK_STUDENTS.length})</h3>
              <button onClick={() => { setStudentsModal(false); setSelectedStudent(null); }} className="text-white/80 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* قائمة الطلاب */}
              <div className="w-1/2 border-l border-gray-200 overflow-y-auto">
                {MOCK_STUDENTS.map((student) => (
                  <button key={student.id} onClick={() => setSelectedStudent(student)}
                    className={`w-full text-right px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition ${selectedStudent?.id === student.id ? 'bg-blue-50 border-r-4 border-r-[#3b66f5]' : ''}`}>
                    <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                    <p className="text-xs text-gray-500" dir="ltr">{student.phone}</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{student.subscriptions.length} اشتراكات</p>
                  </button>
                ))}
              </div>
              {/* تفاصيل الطالب */}
              <div className="w-1/2 overflow-y-auto p-4">
                {selectedStudent ? (
                  <div>
                    <h4 className="font-extrabold text-gray-900 mb-1">{selectedStudent.name}</h4>
                    <p className="text-xs text-gray-500 mb-4" dir="ltr">{selectedStudent.phone}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">الاشتراكات</p>
                    <div className="space-y-2">
                      {selectedStudent.subscriptions.map((sub: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="font-bold text-gray-900 text-sm">{sub.subject}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${sub.type === 'مطبوع' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{sub.type}</span>
                            <span className="text-xs font-bold text-gray-700">{sub.cost.toLocaleString()} ل.س</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs text-gray-500 font-medium">إجمالي التكلفة</p>
                      <p className="text-lg font-extrabold text-[#3b66f5]">
                        {selectedStudent.subscriptions.reduce((sum: number, s: any) => sum + s.cost, 0).toLocaleString()} ل.س
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-gray-400">
                    <div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <p className="text-sm font-medium">اختر طالباً لعرض تفاصيله</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال طلاب المادة */}
      {subjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="bg-[#c4a900] text-black px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-lg font-bold">مشتركو مادة: {subjectModal.name}</h3>
              <button onClick={() => setSubjectModal(null)} className="hover:opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {getSubjectStudents(subjectModal.name).map((student) => {
                const sub = student.subscriptions.find(s => s.subject === subjectModal.name);
                return (
                  <div key={student.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                      <p className="text-xs text-gray-500" dir="ltr">{student.phone}</p>
                    </div>
                    <div className="text-left">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${sub?.type === 'مطبوع' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{sub?.type}</span>
                      <p className="text-xs font-bold text-gray-700 mt-1 text-center">{sub?.cost.toLocaleString()} ل.س</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* مودال إرسال إشعار */}
      {notifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#ed7c1e] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">إرسال إشعار للمشتركين</h3>
              <button onClick={() => setNotifModal(false)} className="text-white/80 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 font-medium">سيتم إرسال هذا الإشعار لجميع مشتركي الفصل الحالي ({MOCK_STUDENTS.length} طالب)</p>
              <textarea
                value={notifText}
                onChange={(e) => setNotifText(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-xl p-3 text-right focus:ring-2 focus:ring-orange-400 outline-none resize-none text-sm"
                placeholder="اكتب نص الإشعار هنا..."
              />
              <div className="flex gap-3">
                <button onClick={handleSendNotification} disabled={!notifText.trim()} className="flex-1 bg-[#ed7c1e] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm">
                  إرسال الإشعار
                </button>
                <button onClick={() => setNotifModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm border border-gray-200">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
