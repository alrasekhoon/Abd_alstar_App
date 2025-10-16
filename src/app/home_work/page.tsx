'use client';

import { useState, useEffect } from 'react';
//import Image from 'next/image';

type HomeWorkTitle = {
  id?: number;
  name1: string;
};

type HomeWork = {
  id?: number;
  title_id: number;
  name1: string;
  url1: string;
  note: string;
  year1: number; // 1, 2, 3, 4
};

export default function HomeWorkManagement() {
  const [titles, setTitles] = useState<HomeWorkTitle[]>([]);
  const [homeWorks, setHomeWorks] = useState<HomeWork[]>([]);
  const [editingTitle, setEditingTitle] = useState<HomeWorkTitle | null>(null);
  const [editingWork, setEditingWork] = useState<HomeWork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTitleFilter, setSelectedTitleFilter] = useState<number | 'all'>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | 'all'>('all');

  const API_URL = '/api/proxy/cp_homework.php';

  // قائمة السنوات الدراسية (المستويات)
  const academicYears = [1, 2, 3, 4];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // جلب عناوين الواجبات
      const titlesResponse = await fetch(`${API_URL}?action=get_titles`);
      if (!titlesResponse.ok) throw new Error('فشل في جلب عناوين الواجبات');
      const titlesData = await titlesResponse.json();
      setTitles(titlesData);
      
      // جلب الواجبات
      const worksResponse = await fetch(`${API_URL}?action=get_works`);
      if (!worksResponse.ok) throw new Error('فشل في جلب الواجبات');
      const worksData = await worksResponse.json();
      setHomeWorks(worksData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTitle = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنوان؟ سيتم حذف جميع الواجبات المرتبطة به.')) return;
    
    try {
      const response = await fetch(`${API_URL}?action=delete_title&id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف العنوان');
      
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleDeleteWork = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?action=delete_work&id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف الواجب');
      
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleSubmitTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTitle) return;

    try {
      const method = editingTitle.id ? 'PUT' : 'POST';
      const action = editingTitle.id ? 'update_title' : 'add_title';
      const url = `${API_URL}?action=${action}${editingTitle.id ? `&id=${editingTitle.id}` : ''}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTitle),
      });

      if (!response.ok) throw new Error('فشل في حفظ البيانات');

      setEditingTitle(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWork) return;

    try {
      const method = editingWork.id ? 'PUT' : 'POST';
      const action = editingWork.id ? 'update_work' : 'add_work';
      const url = `${API_URL}?action=${action}${editingWork.id ? `&id=${editingWork.id}` : ''}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingWork),
      });

      if (!response.ok) throw new Error('فشل في حفظ البيانات');

      setEditingWork(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    }
  };

  const openAddTitleForm = () => {
    setEditingTitle({ name1: '' });
  };

  const openEditTitleForm = (title: HomeWorkTitle) => {
    setEditingTitle({ ...title });
  };

  const openAddWorkForm = () => {
    setEditingWork({ 
      title_id: titles[0]?.id || 0, 
      name1: '', 
      url1: '', 
      note: '', 
      year1: 1 // القيمة الافتراضية السنة الأولى
    });
  };

  const openEditWorkForm = (work: HomeWork) => {
    setEditingWork({ ...work });
  };

  const filteredWorks = homeWorks.filter(work => {
    const matchesTitle = selectedTitleFilter === 'all' || work.title_id === selectedTitleFilter;
    const matchesYear = selectedYearFilter === 'all' || work.year1 === selectedYearFilter;
    return matchesTitle && matchesYear;
  });

  // دالة للحصول على اسم السنة الدراسية
  const getYearName = (year: number) => {
    const yearNames: { [key: number]: string } = {
      1: 'السنة الأولى',
      2: 'السنة الثانية',
      3: 'السنة الثالثة',
      4: 'السنة الرابعة'
    };
    return yearNames[year] || `السنة ${year}`;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-lg font-medium text-gray-700">جاري التحميل...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md mx-auto" role="alert">
        <p className="font-bold">خطأ</p>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* إدارة العناوين */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">إدارة عناوين الواجبات</h1>
          <button
            onClick={openAddTitleForm}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة عنوان جديد
          </button>
        </div>

        {/* Modal for Add/Edit Title */}
        {editingTitle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingTitle.id ? 'تعديل العنوان' : 'إضافة عنوان جديد'}
                </h2>
                <button 
                  onClick={() => setEditingTitle(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmitTitle} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العنوان</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingTitle.name1}
                    onChange={(e) => setEditingTitle({...editingTitle, name1: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingTitle(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    حفظ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Titles Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اسم العنوان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {titles.map((title, index) => (
                <tr key={title.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{title.name1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditTitleForm(title)}
                        className="text-yellow-600 hover:text-yellow-900 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        تعديل
                      </button>
                      <button
                        onClick={() => title.id && handleDeleteTitle(title.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {titles.length === 0 && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد عناوين</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة عنوان جديد بالنقر على الزر أعلاه</p>
          </div>
        )}
      </div>

      {/* إدارة الواجبات */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">إدارة الواجبات المنزلية</h1>
          <button
            onClick={openAddWorkForm}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow hover:from-green-600 hover:to-green-700 transition duration-300 flex items-center"
            disabled={titles.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة واجب جديد
          </button>
        </div>

        {/* فلترة الواجبات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تصفية حسب العنوان</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={selectedTitleFilter}
              onChange={(e) => setSelectedTitleFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">جميع العناوين</option>
              {titles.map(title => (
                <option key={title.id} value={title.id}>{title.name1}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تصفية حسب السنة الدراسية</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">جميع السنوات</option>
              {academicYears.map(year => (
                <option key={year} value={year}>{getYearName(year)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal for Add/Edit Work */}
        {editingWork && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingWork.id ? 'تعديل الواجب' : 'إضافة واجب جديد'}
                </h2>
                <button 
                  onClick={() => setEditingWork(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmitWork} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الرئيسي</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingWork.title_id}
                      onChange={(e) => setEditingWork({...editingWork, title_id: Number(e.target.value)})}
                      required
                    >
                      {titles.map(title => (
                        <option key={title.id} value={title.id}>{title.name1}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السنة الدراسية</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingWork.year1}
                      onChange={(e) => setEditingWork({...editingWork, year1: Number(e.target.value)})}
                      required
                    >
                      {academicYears.map(year => (
                        <option key={year} value={year}>{getYearName(year)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الواجب</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingWork.name1}
                    onChange={(e) => setEditingWork({...editingWork, name1: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رابط الواجب</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingWork.url1}
                    onChange={(e) => setEditingWork({...editingWork, url1: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingWork.note}
                    onChange={(e) => setEditingWork({...editingWork, note: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingWork(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    حفظ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Works Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">العنوان الرئيسي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اسم الواجب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الرابط</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">السنة الدراسية</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">ملاحظات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorks.map((work, index) => {
                const title = titles.find(t => t.id === work.title_id);
                return (
                  <tr key={work.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{title?.name1 || 'غير معروف'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{work.name1}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={work.url1} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        عرض الرابط
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getYearName(work.year1)}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-500 line-clamp-2">{work.note}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditWorkForm(work)}
                          className="text-yellow-600 hover:text-yellow-900 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          تعديل
                        </button>
                        <button
                          onClick={() => work.id && handleDeleteWork(work.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredWorks.length === 0 && homeWorks.length > 0 && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد واجبات مطابقة للفلتر</h3>
            <p className="mt-1 text-sm text-gray-500">جرب تغيير خيارات التصفية أو أضف واجبًا جديدًا</p>
          </div>
        )}

        {homeWorks.length === 0 && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد واجبات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة واجب جديد بالنقر على الزر أعلاه</p>
          </div>
        )}
      </div>
    </div>
  );
}