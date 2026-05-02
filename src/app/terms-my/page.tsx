'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// ======================================================
// بيانات تجريبية - سيتم استبدالها بـ API calls لاحقاً
// ======================================================
const MOCK_ARCHIVED_STUDENTS: Record<number, any[]> = {
  1: [
    { id: 1, name: 'أحمد محمد', phone: '+963991234567', subscriptions: [
      { subject: 'رياضيات', type: 'مطبوع', cost: 5000 },
      { subject: 'فيزياء', type: 'فيديو', cost: 4000 },
      { subject: 'كيمياء', type: 'أسئلة', cost: 2000 },
    ]},
    { id: 2, name: 'سارة علي', phone: '+963997654321', subscriptions: [
      { subject: 'رياضيات', type: 'إلكتروني', cost: 3000 },
      { subject: 'فيزياء', type: 'صوتي', cost: 2500 },
    ]},
    { id: 3, name: 'محمد خالد', phone: '+963994567890', subscriptions: [
      { subject: 'فيزياء', type: 'مطبوع', cost: 5000 },
      { subject: 'كيمياء', type: 'فيديو', cost: 4000 },
    ]},
  ],
  2: [
    { id: 4, name: 'لينا حسن', phone: '+963993456789', subscriptions: [
      { subject: 'كيمياء', type: 'مطبوع', cost: 5000 },
      { subject: 'رياضيات', type: 'صوتي', cost: 2500 },
    ]},
    { id: 5, name: 'عمر سعيد', phone: '+963992345678', subscriptions: [
      { subject: 'رياضيات', type: 'مطبوع', cost: 5000 },
      { subject: 'كيمياء', type: 'أسئلة', cost: 2000 },
    ]},
  ],
};

const MOCK_ARCHIVED_SUBJECTS: Record<number, any[]> = {
  1: [
    { name: 'رياضيات', total: 2, printed: 1, digital: 1, video: 0, audio: 0, questions: 0 },
    { name: 'فيزياء',  total: 3, printed: 1, digital: 0, video: 1, audio: 1, questions: 0 },
    { name: 'كيمياء',  total: 2, printed: 0, digital: 0, video: 1, audio: 0, questions: 1 },
  ],
  2: [
    { name: 'رياضيات', total: 2, printed: 1, digital: 0, video: 0, audio: 1, questions: 0 },
    { name: 'كيمياء',  total: 2, printed: 1, digital: 0, video: 0, audio: 0, questions: 1 },
  ],
};

const TYPE_BADGE: Record<string, string> = {
  'مطبوع':    'bg-green-100 text-green-700',
  'إلكتروني': 'bg-purple-100 text-purple-700',
  'فيديو':    'bg-red-100 text-red-600',
  'صوتي':     'bg-amber-100 text-amber-600',
  'أسئلة':    'bg-teal-100 text-teal-600',
};

const ALL_TYPES = ['مطبوع', 'إلكتروني', 'فيديو', 'صوتي', 'أسئلة'];

export default function PreviousTermsPage() {
  const [archivedTerms, setArchivedTerms] = useState<any[]>([]);
  const [expandedTerm, setExpandedTerm] = useState<number | null>(null);
  const [studentsModal, setStudentsModal] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [subjectModal, setSubjectModal] = useState<{ termId: number; subject: any } | null>(null);

  useEffect(() => {
    const savedTerms = JSON.parse(localStorage.getItem('app_terms') || '[]');
    const previous = savedTerms.filter((t: any) => t.status === 'مؤرشف');
    setArchivedTerms(previous);
  }, []);

  const getStudents = (termId: number) => MOCK_ARCHIVED_STUDENTS[termId] || [];
  const getSubjects = (termId: number) => MOCK_ARCHIVED_SUBJECTS[termId] || [];

  const getSubjectStudents = (termId: number, subjectName: string) =>
    getStudents(termId).filter(s =>
      s.subscriptions.some((sub: any) => sub.subject === subjectName)
    );

  // ======= تصدير Excel لفصل واحد =======
  const exportTermToExcel = (term: any) => {
    const students = getStudents(term.id);
    const subjects = getSubjects(term.id);
    const wb = XLSX.utils.book_new();

    // ورقة 1: قائمة الطلاب
    const studentsData = students.flatMap(s =>
      s.subscriptions.map((sub: any) => ({
        'الاسم': s.name,
        'الهاتف': s.phone,
        'المادة': sub.subject,
        'النوع': sub.type,
        'التكلفة (ل.س)': sub.cost,
      }))
    );
    const ws1 = XLSX.utils.json_to_sheet(studentsData);
    ws1['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'قائمة الطلاب');

    // ورقة 2: إحصائيات المواد
    const subjectsData = subjects.map(sub => ({
      'المادة': sub.name,
      'الإجمالي': sub.total,
      'مطبوع': sub.printed,
      'إلكتروني': sub.digital,
      'فيديو': sub.video,
      'صوتي': sub.audio,
      'أسئلة': sub.questions,
    }));
    const ws2 = XLSX.utils.json_to_sheet(subjectsData);
    ws2['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'إحصائيات المواد');

    // ورقة 3: الجدوى المالية
    const totalRevenue = students.reduce((sum, s) =>
      sum + s.subscriptions.reduce((ss: number, sub: any) => ss + sub.cost, 0), 0);

    const financeData = ALL_TYPES.map(type => {
      const count = students.reduce((sum, s) =>
        sum + s.subscriptions.filter((sub: any) => sub.type === type).length, 0);
      const revenue = students.reduce((sum, s) =>
        sum + s.subscriptions.filter((sub: any) => sub.type === type).reduce((ss: number, sub: any) => ss + sub.cost, 0), 0);
      return { 'النوع': type, 'العدد': count, 'الإيراد (ل.س)': revenue };
    }).filter(r => r['العدد'] > 0);

    financeData.push({ 'النوع': 'الإجمالي', 'العدد': students.length, 'الإيراد (ل.س)': totalRevenue });

    const ws3 = XLSX.utils.json_to_sheet(financeData);
    ws3['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'الجدوى المالية');

    XLSX.writeFile(wb, `فصل_${term.name}_${term.date || ''}.xlsx`);
  };

  // ======= تصدير Excel لجميع الفصول =======
  const exportAllToExcel = () => {
    const wb = XLSX.utils.book_new();

    archivedTerms.forEach((term) => {
      const students = getStudents(term.id);
      const data = students.flatMap(s =>
        s.subscriptions.map((sub: any) => ({
          'الفصل': term.name,
          'الاسم': s.name,
          'الهاتف': s.phone,
          'المادة': sub.subject,
          'النوع': sub.type,
          'التكلفة (ل.س)': sub.cost,
        }))
      );
      if (data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, `فصل_${term.name}`.slice(0, 31));
      }
    });

    XLSX.writeFile(wb, `جميع_الفصول_المؤرشفة.xlsx`);
  };

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gray-100 p-2 md:p-4">

      {/* شريط التنقل */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/terms-add" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">إضافة فصل</Link>
        <Link href="/terms-end" className="px-6 py-2 bg-white text-blue-900 border border-blue-200 rounded-full text-sm font-bold hover:bg-blue-50">الفصل الحالي</Link>
        <Link href="/terms-my" className="px-6 py-2 bg-[#3b66f5] text-white rounded-full text-sm font-bold shadow-md">الفصول السابقة</Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 bg-blue-100 text-blue-900 p-4 rounded-xl shadow-sm border border-blue-200">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">سجل الفصول السابقة</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm bg-blue-200 shadow-inner px-4 py-2 rounded-md font-bold">
            الفصول المؤرشفة: {archivedTerms.length}
          </div>
          {archivedTerms.length > 0 && (
            <button
              onClick={exportAllToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              تصدير الكل Excel
            </button>
          )}
        </div>
      </div>

      {archivedTerms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
          <p className="text-gray-500 font-bold">لا توجد فصول مؤرشفة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {archivedTerms.map((term, index) => {
            const students = getStudents(term.id);
            const subjects = getSubjects(term.id);
            const isExpanded = expandedTerm === term.id;

            return (
              <div key={term.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                {/* رأس الفصل */}
                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-bold text-sm bg-gray-100 px-2 py-1 rounded-full">#{index + 1}</span>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-lg">{term.name}</h3>
                      <p className="text-gray-400 text-xs font-medium">تاريخ البدء: {term.date}</p>
                    </div>
                    <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-bold">مؤرشف</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-bold border border-blue-100">
                      {students.length} طالب
                    </span>
                    <button
                      onClick={() => exportTermToExcel(term)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Excel
                    </button>
                    <button
                      onClick={() => setExpandedTerm(isExpanded ? null : term.id)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2"
                    >
                      {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* التفاصيل القابلة للطي */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50">

                    {/* بطاقة المستخدمين */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-extrabold text-gray-900 flex items-center gap-2 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#3b66f5]" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                          </svg>
                          المشتركون في هذا الفصل
                        </h4>
                        <button
                          onClick={() => { setStudentsModal(term.id); setSelectedStudent(null); }}
                          className="bg-[#3b66f5] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                        >
                          عرض القائمة ({students.length})
                        </button>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <p className="text-xl font-extrabold text-[#3b66f5]">{students.length}</p>
                          <p className="text-xs text-gray-500 mt-0.5">إجمالي</p>
                        </div>
                        {ALL_TYPES.map(type => (
                          <div key={type} className={`rounded-lg p-2 text-center ${TYPE_BADGE[type].replace('text-', 'bg-').split(' ')[0].replace('bg-', 'bg-').replace('100', '50')} border border-gray-100`}>
                            <p className="text-xl font-extrabold text-gray-700">
                              {students.filter(s => s.subscriptions.some((sub: any) => sub.type === type)).length}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{type}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* جدول المواد */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <h4 className="font-extrabold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#c4a900]" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                        المشتريات حسب المادة
                      </h4>

                      {/* Desktop */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-right text-sm">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 bg-[#f5e97a] border-b border-[#c8b800] text-gray-800 font-extrabold text-xs">المادة</th>
                              <th className="px-3 py-2 bg-[#f0e060] border-b border-[#c8b800] text-gray-800 font-extrabold text-xs">الإجمالي</th>
                              <th className="px-3 py-2 bg-[#f5e97a] border-b border-[#c8b800] text-gray-800 font-extrabold text-xs">مطبوع</th>
                              <th className="px-3 py-2 bg-[#f0e060] border-b border-[#c8b800] text-gray-800 font-extrabold text-xs">إلكتروني</th>
                              <th className="px-3 py-2 bg-[#f5e97a] border-b border-[#c8b800] text-gray-800 font-extrabold text-xs">فيديو</th>
                              <th className="px-3 py-2 bg-[#f0e060] border-b border-[#c8b800] text-gray-800 font-extrabold text-xs">صوتي</th>
                              <th className="px-3 py-2 bg-[#f5e97a] border-b border-[#c8b800] text-gray-800 font-extrabold text-xs">أسئلة</th>
                              <th className="px-3 py-2 bg-[#f0e060] border-b border-[#c8b800] text-gray-800 font-extrabold text-xs">عرض</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {subjects.map((subject: any) => (
                              <tr key={subject.name} className="hover:bg-gray-50 transition">
                                <td className="px-3 py-2 font-bold text-gray-900">{subject.name}</td>
                                <td className="px-3 py-2 font-bold text-[#3b66f5]">{subject.total}</td>
                                <td className="px-3 py-2">{subject.printed > 0 && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">{subject.printed}</span>}</td>
                                <td className="px-3 py-2">{subject.digital > 0 && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">{subject.digital}</span>}</td>
                                <td className="px-3 py-2">{subject.video > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{subject.video}</span>}</td>
                                <td className="px-3 py-2">{subject.audio > 0 && <span className="bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full font-bold">{subject.audio}</span>}</td>
                                <td className="px-3 py-2">{subject.questions > 0 && <span className="bg-teal-100 text-teal-600 text-xs px-2 py-0.5 rounded-full font-bold">{subject.questions}</span>}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => setSubjectModal({ termId: term.id, subject })}
                                    className="bg-[#c4a900] text-black px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#b39a00] transition"
                                  >
                                    عرض
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden space-y-2">
                        {subjects.map((subject: any) => (
                          <div key={subject.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 text-sm">{subject.name}</span>
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{subject.total}</span>
                              {subject.printed > 0 && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">{subject.printed} م</span>}
                              {subject.digital > 0 && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">{subject.digital} إ</span>}
                              {subject.video > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{subject.video} ف</span>}
                              {subject.audio > 0 && <span className="bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full font-bold">{subject.audio} ص</span>}
                              {subject.questions > 0 && <span className="bg-teal-100 text-teal-600 text-xs px-2 py-0.5 rounded-full font-bold">{subject.questions} أ</span>}
                            </div>
                            <button
                              onClick={() => setSubjectModal({ termId: term.id, subject })}
                              className="bg-[#c4a900] text-black px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#b39a00] transition shrink-0"
                            >
                              عرض
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* مودال قائمة الطلاب */}
      {studentsModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="bg-gray-700 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-lg font-bold">مشتركو الفصل المؤرشف ({getStudents(studentsModal).length})</h3>
              <button onClick={() => { setStudentsModal(null); setSelectedStudent(null); }} className="text-white/80 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/2 border-l border-gray-200 overflow-y-auto">
                {getStudents(studentsModal).map((student: any) => (
                  <button key={student.id} onClick={() => setSelectedStudent(student)}
                    className={`w-full text-right px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${selectedStudent?.id === student.id ? 'bg-gray-50 border-r-4 border-r-gray-600' : ''}`}>
                    <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                    <p className="text-xs text-gray-500" dir="ltr">{student.phone}</p>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">{student.subscriptions.length} اشتراكات</p>
                  </button>
                ))}
              </div>
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
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${TYPE_BADGE[sub.type] || 'bg-gray-100 text-gray-700'}`}>{sub.type}</span>
                            <span className="text-xs font-bold text-gray-700">{sub.cost.toLocaleString()} ل.س</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 bg-gray-100 rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium">إجمالي التكلفة</p>
                      <p className="text-lg font-extrabold text-gray-800">
                        {selectedStudent.subscriptions.reduce((sum: number, s: any) => sum + s.cost, 0).toLocaleString()} ل.س
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-gray-400">
                    <p className="text-sm font-medium">اختر طالباً لعرض تفاصيله</p>
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
              <h3 className="text-lg font-bold">مشتركو مادة: {subjectModal.subject.name}</h3>
              <button onClick={() => setSubjectModal(null)} className="hover:opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {getSubjectStudents(subjectModal.termId, subjectModal.subject.name).map((student: any) => {
                const sub = student.subscriptions.find((s: any) => s.subject === subjectModal.subject.name);
                return (
                  <div key={student.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                      <p className="text-xs text-gray-500" dir="ltr">{student.phone}</p>
                    </div>
                    <div className="text-left">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${TYPE_BADGE[sub?.type || ''] || 'bg-gray-100 text-gray-700'}`}>{sub?.type}</span>
                      <p className="text-xs font-bold text-gray-700 mt-1 text-center">{sub?.cost.toLocaleString()} ل.س</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
