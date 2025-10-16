'use client';

import { useState, useEffect } from 'react';


type QuizParentItem = {
  id?: number;
  name1: string;
};

interface Material {
  id: string;
  material_name: string;
}

interface TquizItem {
  id: number;
  material_id: number;
  unit_num: number;
  page_num: number;
  parent: string;
  q_txt: string;
  a1: string;
  a2: string;
  a3: string;
  a4: string;
  answer: number;
  note: string;
  q_code: string;
  timer: number;
}

export default function QuizParentManagement() {
  const [data, setData] = useState<QuizParentItem[]>([]);
  const [editingItem, setEditingItem] = useState<QuizParentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<string>('1');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedParentName, setSelectedParentName] = useState<string>('');
  const [quizItems, setQuizItems] = useState<TquizItem[]>([]);
  const [isLoadingQuizItems, setIsLoadingQuizItems] = useState<boolean>(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('1');

  const API_URL = '/api/proxy/cp_quiz_parent.php';
  const TQUIZ_API_URL = '/api/proxy/get_quiz_items.php';



  useEffect(() => {
    if (selectedMaterial && selectedParentName) {
      fetchQuizItems();
    } else {
      setQuizItems([]);
    }
  }, [selectedMaterial, selectedParentName, selectedUnit]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('فشل في جلب البيانات');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setIsLoadingMaterials(true);
      setMaterials([]);
      setSelectedMaterial('');
      setFetchError(null);

      const response = await fetch(`/api/proxy/get_material.php?year1=${selectedYear}`);
      
      if (!response.ok) {
        throw new Error('فشل جلب البيانات من الخادم');
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        setFetchError(`لا توجد مواد متاحة للسنة ${selectedYear}`);
      } else if (data.message) {
        setFetchError(data.message);
      } else {
        setMaterials(data);
      }
    } catch (error) {
      console.error('حدث خطأ أثناء جلب المواد:', error);
      setFetchError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoadingMaterials(false);
    }
  };

    useEffect(() => {
    fetchData();
    fetchMaterials();
  }, [selectedYear]);

  const fetchQuizItems = async () => {
    try {
      setIsLoadingQuizItems(true);
      const response = await fetch(
        `${TQUIZ_API_URL}?material_id=${selectedMaterial}&parent=${encodeURIComponent(selectedParentName)}&unit_num=${selectedUnit}`
      );
      
      if (!response.ok) throw new Error('فشل في جلب بيانات الأسئلة');
      
      const result = await response.json();
      setQuizItems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الأسئلة');
    } finally {
      setIsLoadingQuizItems(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف العنصر');
      
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

      if (!response.ok) throw new Error('فشل في حفظ البيانات');

      setEditingItem(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    }
  };

  const openEditForm = (item: QuizParentItem) => {
    setEditingItem({ ...item });
  };

  const openAddForm = () => {
    setEditingItem({ name1: '' });
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
          <h1 className="text-3xl font-bold text-gray-800"> جدول النماذج الإمتحانية</h1>
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

        {/* Modal for Add/Edit */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم النموذج </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingItem.name1}
                    onChange={(e) => setEditingItem({...editingItem, name1: e.target.value})}
                    required
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
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اسم النموذج</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{item.name1}</div>
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

        {/* إضافة قسم تحديد السنة والمادة هنا */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">تحديد السنة والمادة والنموذج</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السنة الدراسية</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="1">الأولى</option>
                <option value="2">الثانية</option>
                <option value="3">الثالثة</option>
                <option value="4">الرابعة</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
              {isLoadingMaterials ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>جاري تحميل المواد...</span>
                </div>
              ) : fetchError ? (
                <div className="text-red-500 text-sm">{fetchError}</div>
              ) : (
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={materials.length === 0}
                >
                  <option value="">اختر المادة</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.material_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((unit) => (
                  <option key={unit} value={unit.toString()}>
                    الوحدة {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النموذج الإمتحاني</label>
              <select
                value={selectedParentName}
                onChange={(e) => setSelectedParentName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">اختر نموذج امتحاني</option>
                {data.map((item) => (
                  <option key={item.id || item.name1} value={item.name1}>
                    {item.name1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* جدول Tquiz */}
        {selectedMaterial && selectedParentName && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">أسئلة النموذج الامتحاني</h2>
            
            {isLoadingQuizItems ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="mr-2">جاري تحميل الأسئلة...</span>
              </div>
            ) : quizItems.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الصفحة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">كود السؤال</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">السؤال</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجابات</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجابة الصحيحة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الملاحظات</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الوقت</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quizItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.page_num}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.q_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-normal">
                          <div className="text-sm text-gray-900">{item.q_txt}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 space-y-1">
                            <div>1. {item.a1}</div>
                            <div>2. {item.a2}</div>
                            <div>3. {item.a3}</div>
                            <div>4. {item.a4}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-green-600">
                            {item.answer}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{item.note}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.timer} ثانية</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد أسئلة</h3>
                <p className="mt-1 text-sm text-gray-500">لم يتم العثور على أسئلة للمادة والنموذج المحددين</p>
              </div>
            )}
          </div>
        )}

        {data.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد عناصر</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة عنصر جديد بالنقر على الزر أعلاه</p>
          </div>
        )}
      </div>
    </div>
  );
}