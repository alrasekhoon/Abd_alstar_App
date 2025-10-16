'use client';

import { useState, useEffect } from 'react';

type TprintItem = {
  id?: number;
  m_name: string;
  m_code: string;
  sy_price: string;
  d_price: string;
  type1: string;
  year1: number;
  semester: number;
  active: number;
  mokarar_free: number;
  quiz_free: number;
  voice_free: number;
};

export default function TprintManagement() {
  const [data, setData] = useState<TprintItem[]>([]);
  const [filteredData, setFilteredData] = useState<TprintItem[]>([]);
  const [editingItem, setEditingItem] = useState<TprintItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // حالات الفلترة
  const [filters, setFilters] = useState({
    type: '',
    year: ''
  });

  const API_URL = '/api/proxy/cp_tprint.php';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
  const applyFilters = () => {
    let result = [...data];
    
    if (filters.type) {
      result = result.filter(item => item.type1 === filters.type);
    }
    
    if (filters.year) {
      result = result.filter(item => item.year1.toString() === filters.year);
    }
    
    setFilteredData(result);
  };

  applyFilters();
}, [data, filters]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!Array.isArray(result.data)) {
        throw new Error('تنسيق البيانات غير صحيح');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

 

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      year: ''
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      

       console.log(response)
      if (!response.ok) throw new Error('فشل في الحذف');

     
      
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
        const method = editingItem.id ? 'PUT' : 'POST';
        const url = editingItem.id ? `${API_URL}?id=${editingItem.id}` : API_URL;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(editingItem),
        });

        const result = await response.json();
        
        if (!response.ok) {
            // عرض رسالة الخطأ من السيرفر إن وجدت
            throw new Error(result.message || 'فشل في حفظ البيانات');
        }

        if (!result.success) {
            // عرض رسالة الخطأ من السيرفر
            throw new Error(result.message || 'فشل في العملية');
        }

        setEditingItem(null);
        fetchData();
        
        // عرض رسالة نجاح
        alert(result.message || 'تمت العملية بنجاح');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
        setError(errorMessage);
        console.error('Error details:', err);
        
        // عرض رسالة الخطأ للمستخدم
        alert(errorMessage);
    }
};

  const openEditForm = (item: TprintItem) => {
    setEditingItem({ ...item });
  };

  const openAddForm = () => {
    setEditingItem({ 
      m_name: '',
      m_code: '',
      sy_price: '',
      d_price: '',
      type1: 'كتاب جامعي', // قيمة افتراضية
      year1: 1, // قيمة افتراضية بين 1-4
      semester: 1,
      active: 1,
      mokarar_free: 0,
      quiz_free: 0,
      voice_free: 0
    });
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
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md mx-auto">
        <p className="font-bold">خطأ</p>
        <p>{error}</p>
      </div>
    </div>
  );

 return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة مواد الطباعة</h1>
          <button
            onClick={openAddForm}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة جديد
          </button>
        </div>

        {/* واجهة الفلترة */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">تصفية البيانات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select
                name="type"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">كل الأنواع</option>
                <option value="كتاب جامعي">كتاب جامعي</option>
                <option value="مقرر ذهبي">مقرر ذهبي</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
              <select
                name="year"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={filters.year}
                onChange={handleFilterChange}
              >
                <option value="">كل السنوات</option>
                <option value="1">السنة الأولى</option>
                <option value="2">السنة الثانية</option>
                <option value="3">السنة الثالثة</option>
                <option value="4">السنة الرابعة</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>

        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingItem.id ? 'تعديل العنصر' : 'إضافة عنصر جديد'}
                </h2>
                <button onClick={() => setEditingItem(null)} className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.m_name}
                      onChange={(e) => setEditingItem({...editingItem, m_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الكود</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.m_code}
                      onChange={(e) => setEditingItem({...editingItem, m_code: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السعر المحلي ل.س</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.sy_price}
                      onChange={(e) => setEditingItem({...editingItem, sy_price: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السعر العالمي $</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.d_price}
                      onChange={(e) => setEditingItem({...editingItem, d_price: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.type1}
                      onChange={(e) => setEditingItem({...editingItem, type1: e.target.value})}
                      required
                    >
                      <option value="كتاب جامعي">كتاب جامعي</option>
                      <option value="مقرر ذهبي">مقرر ذهبي</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.year1}
                      onChange={(e) => setEditingItem({...editingItem, year1: parseInt(e.target.value)})}
                      required
                    >
                      <option value="1">السنة الأولى</option>
                      <option value="2">السنة الثانية</option>
                      <option value="3">السنة الثالثة</option>
                      <option value="4">السنة الرابعة</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الفصل</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.semester}
                      onChange={(e) => setEditingItem({...editingItem, semester: parseInt(e.target.value)})}
                    >
                      <option value="1">الفصل الأول</option>
                      <option value="2">الفصل الثاني</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.active}
                      onChange={(e) => setEditingItem({...editingItem, active: parseInt(e.target.value)})}
                    >
                      <option value="1">نشط</option>
                      <option value="0">غير نشط</option>
                    </select>
                  </div>

                  {/* الحقول الجديدة */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">مقرر مجاني</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.mokarar_free}
                      onChange={(e) => setEditingItem({...editingItem, mokarar_free: parseInt(e.target.value)})}
                    >
                      <option value="0">لا</option>
                      <option value="1">نعم</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اختبار مجاني</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.quiz_free}
                      onChange={(e) => setEditingItem({...editingItem, quiz_free: parseInt(e.target.value)})}
                    >
                      <option value="0">لا</option>
                      <option value="1">نعم</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">صوت مجاني</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.voice_free}
                      onChange={(e) => setEditingItem({...editingItem, voice_free: parseInt(e.target.value)})}
                    >
                      <option value="0">لا</option>
                      <option value="1">نعم</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
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

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الكود</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">السنة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الفصل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">مقرر مجاني</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اختبار مجاني</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">صوت مجاني</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.m_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{item.m_code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{item.type1}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{item.year1}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {item.semester === 1 ? 'الفصل الأول' : 'الفصل الثاني'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.mokarar_free ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.mokarar_free ? 'نعم' : 'لا'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.quiz_free ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.quiz_free ? 'نعم' : 'لا'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.voice_free ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.voice_free ? 'نعم' : 'لا'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditForm(item)}
                        className="text-yellow-600 hover:text-yellow-900 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        تعديل
                      </button>
                      <button
                        onClick={() => item.id && handleDelete(item.id)}
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

        {filteredData.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد بيانات</h3>
            <p className="mt-1 text-sm text-gray-500">لا توجد عناصر مطابقة لمعايير البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}