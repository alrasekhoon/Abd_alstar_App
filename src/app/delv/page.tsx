'use client';

import { useState, useEffect, useCallback } from 'react';

// قائمة المحافظات السورية
const SYRIAN_CITIES = [
  'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'اللاذقية', 'حماه', 'طرطوس', 
  'دير الزور', 'الحسكة', 'السويداء', 'الرقة', 'إدلب', 'درعا', 'القنيطرة'
];

type TdelvItem = {
  id?: number;
  d_name: string;
  d_price: string;
  type1: string;
  note: string;
  active: number;
  city: string;
  fraa: string;
};

export default function TdelvManagement() {
  const [allData, setAllData] = useState<TdelvItem[]>([]); // جميع البيانات
  const [filteredData, setFilteredData] = useState<TdelvItem[]>([]); // البيانات المفلترة
  const [editingItem, setEditingItem] = useState<TdelvItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');

  const API_URL = '/api/proxy/cp_delv.php';

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('فشل في جلب البيانات');
      const result = await response.json();
      setAllData(result);
      setFilteredData(result); // تهيئة البيانات المفلترة بجميع البيانات
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // تطبيق الفلترة عند تغيير الفلاتر
  useEffect(() => {
    let result = allData;
    
    if (filterType) {
      result = result.filter(item => item.type1 === filterType);
    }
    
    if (filterCity) {
      result = result.filter(item => item.city === filterCity);
    }
    
    setFilteredData(result);
  }, [allData, filterType, filterCity]);

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف العنصر');
      
      // تحديث البيانات المحلية بعد الحذف
      setAllData(prev => prev.filter(item => item.id !== id));
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

      if (!response.ok) throw new Error('فشل في حفظ البيانات');

      setEditingItem(null);
      fetchData(); // إعادة جلب البيانات لتحديثها
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    }
  };

  const openEditForm = (item: TdelvItem) => {
    setEditingItem({ ...item });
  };

  const openAddForm = () => {
    setEditingItem({ 
      d_name: '', 
      d_price: '', 
      type1: '', 
      note: '', 
      active: 1, 
      city: '', 
      fraa: '' 
    });
  };

  // وظيفة مساعدة لإعادة تعيين الفلاتر
  const resetFilters = () => {
    setFilterType('');
    setFilterCity('');
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">بيانات التوصيل والشحن</h1>
          <button
            onClick={openAddForm}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة عنصر جديد
          </button>
        </div>

        {/* Filter Section */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">تصفية حسب النوع</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">عرض الكل</option>
                <option value="شحن">شحن</option>
                <option value="توصيل">توصيل</option>
              </select>
            </div>
            
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">تصفية حسب المحافظة</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              >
                <option value="">عرض الكل</option>
                {SYRIAN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {(filterType || filterCity) && (
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  إعادة تعيين
                </button>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            <span>العدد الكلي: {allData.length}</span>
            {(filterType || filterCity) && (
              <span className="mr-3"> | النتائج المفلترة: {filteredData.length}</span>
            )}
          </div>
        </div>

        {/* Modal for Add/Edit */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingItem.id ? 'تعديل العنصر' : 'إضافة عنصر جديد'}
                </h2>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">فرع الشحن او مكان التوصيل</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.d_name}
                      onChange={(e) => setEditingItem({...editingItem, d_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.d_price}
                      onChange={(e) => setEditingItem({...editingItem, d_price: e.target.value})}
                      required
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
                      <option value="">اختر النوع</option>
                      <option value="شحن">شحن</option>
                      <option value="توصيل">توصيل</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.city}
                      onChange={(e) => setEditingItem({...editingItem, city: e.target.value})}
                      required
                    >
                      <option value="">اختر المحافظة</option>
                      {SYRIAN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingItem.note}
                    onChange={(e) => setEditingItem({...editingItem, note: e.target.value})}
                  />
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
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">فرع الشحن او مكان التوصيل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">السعر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">المحافظة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">ملاحظات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm font-medium text-gray-900">{item.d_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.d_price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.type1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.city || 'غير محدد'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm text-gray-500 line-clamp-2">{item.note}</div>
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد عناصر</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterType || filterCity 
                ? 'لا توجد عناصر مطابقة للفلتر المحدد' 
                : 'ابدأ بإضافة عنصر جديد بالنقر على الزر أعلاه'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}