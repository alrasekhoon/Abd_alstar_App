'use client';

import { useState, useEffect } from 'react';

type MaterialItem = {
  id?: number;
  category_id: number;
  material_name: string;
  material_code: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  year1: number;
  unit_price: string;
  quizall_price: string;
  quiz_price: string;
  voice_price: string;
  category_name?: string;
};

type CategoryItem = {
  id: number;
  category_name: string;
};

type UnitItem = {
  id?: number;
  material_id: number;
  unit_name: string;
  unit_num: number;
  pages: string;
  free: number;
  url1: string;
  english: number; // 0 for Arabic, 1 for English
};

type QuizItem = {
  id?: number;
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
};

export default function MaterialManagement() {
  const [data, setData] = useState<MaterialItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [filteredData, setFilteredData] = useState<MaterialItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [units, setUnits] = useState<UnitItem[]>([]);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [showQuizzes, setShowQuizzes] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<{materialId: number, unitNum: number} | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null);

  const API_URL = 'http://alraskun.atwebpages.com/cp_material.php';
  const CATEGORY_API_URL = 'http://alraskun.atwebpages.com/cp_ashtrak.php';
  const UNITS_API_URL = 'http://alraskun.atwebpages.com/cp_tunits.php';
  const QUIZ_API_URL = 'http://alraskun.atwebpages.com/cp_quiz.php';

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(item => item.category_id === selectedCategory));
    }
  }, [selectedCategory, data]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!Array.isArray(result.data)) {
        throw new Error('تنسيق البيانات غير صحيح: لم يتم استلام مصفوفة');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('Error fetching data:', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(CATEGORY_API_URL);
      if (!response.ok) throw new Error('فشل في جلب الفئات');
      const result = await response.json();
      setCategories(result);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الفئات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnits = async (materialId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${UNITS_API_URL}?material_id=${materialId}`);
      if (!response.ok) throw new Error('فشل في جلب الوحدات');
      const result = await response.json();
      setUnits(result.data || []);
      setSelectedMaterialId(materialId);
    } catch (err) {
      console.error('Error fetching units:', err);
      setUnits([]);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الوحدات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizzes = async (materialId: number, unitNum: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${QUIZ_API_URL}?material_id=${materialId}&unit_num=${unitNum}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `فشل في جلب الأسئلة - حالة الخطأ: ${response.status}`);
      }

      const quizzes = await response.json();
      
      if (!Array.isArray(quizzes)) {
        throw new Error('تنسيق البيانات غير صحيح: لم يتم استلام مصفوفة');
      }

      setQuizzes(quizzes);
      setSelectedUnit({materialId, unitNum});
      setShowQuizzes(true);
      
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setQuizzes([]);
      
      const errorMessage = err instanceof Error ? 
        err.message : 
        'حدث خطأ غير متوقع أثناء جلب الأسئلة';
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف المادة');
      
      await fetchData();
      alert('تم حذف المادة بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
      alert('حدث خطأ أثناء حذف المادة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnitDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${UNITS_API_URL}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `حدث خطأ: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'فشل في حذف الوحدة');
      }

      if (selectedMaterialId) {
        await fetchUnits(selectedMaterialId);
      }
      
      alert(data.message || 'تم حذف الوحدة بنجاح');
    } catch (err) {
      console.error('Error deleting unit:', err);
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء الحذف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${QUIZ_API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف السؤال');
      
      if (selectedUnit) {
        await fetchQuizzes(selectedUnit.materialId, selectedUnit.unitNum);
      }
      alert('تم حذف السؤال بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف السؤال');
      alert('حدث خطأ أثناء حذف السؤال');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsSubmitting(true);
      const method = editingItem.id ? 'PUT' : 'POST';
      const url = editingItem.id ? `${API_URL}?id=${editingItem.id}` : API_URL;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingItem),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          throw new Error(`HTTP error! status: ${response.status} ${jsonError}`);
        }
        throw new Error(errorData.message || 'فشل في حفظ البيانات ' );
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'فشل في العملية');
      }

      setEditingItem(null);
      await fetchData();
      alert('تم حفظ البيانات بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('Error details:', err);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingUnit) return;

  console.log('Submitting Unit:', editingUnit); // ✅ تسجيل البيانات قبل الإرسال

  try {
    setIsSubmitting(true);
      setIsSubmitting(true);
      const errors: string[] = [];
      
      if (!editingUnit.material_id) {
        errors.push("معرف المادة مطلوب");
      }
      
      if (!editingUnit.unit_name?.trim()) {
        errors.push("اسم الوحدة مطلوب");
      }
      
      if (!editingUnit.unit_num || editingUnit.unit_num < 1) {
        errors.push("يجب أن يكون رقم الوحدة رقمًا صحيحًا موجبًا");
      }

      if (errors.length > 0) {
        throw new Error(errors.join(". "));
      }

      const payload = {
        material_id: editingUnit.material_id,
        unit_name: editingUnit.unit_name.trim(),
        unit_num: editingUnit.unit_num,
        pages: editingUnit.pages || '',
        free: editingUnit.free || 0,
        url1: editingUnit.url1 || '',
         english: editingUnit.english || 0 // تأكد من إرسال هذا الحقل
        
      };

      const method = editingUnit.id ? 'PUT' : 'POST';
      const url = editingUnit.id 
        ? `${UNITS_API_URL}?id=${editingUnit.id}` 
        : UNITS_API_URL;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل في حفظ الوحدة');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'فشل في حفظ الوحدة');
      }

      if (selectedMaterialId) {
        await fetchUnits(selectedMaterialId);
      }
      
      setEditingUnit(null);
      alert('تم حفظ الوحدة بنجاح');
      
    } catch (err) {
      console.error('Error details:', err);
      alert(`حدث خطأ: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz || !selectedUnit) return;

    try {
      setIsSubmitting(true);
      const method = editingQuiz.id ? 'PUT' : 'POST';
      const url = editingQuiz.id 
        ? `${QUIZ_API_URL}?id=${editingQuiz.id}` 
        : QUIZ_API_URL;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingQuiz,
          material_id: selectedUnit.materialId,
          unit_num: selectedUnit.unitNum
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON:', jsonError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to save question');
      }

      setEditingQuiz(null);
      await fetchQuizzes(selectedUnit.materialId, selectedUnit.unitNum);
      alert('تم حفظ السؤال بنجاح');
      
    } catch (err) {
      console.error('Error details:', err);
      let errorMessage = 'حدث خطأ غير متوقع';
      
      if (err instanceof Error) {
        errorMessage = err.message.replace(/<[^>]*>?/gm, '');
      }
      
      alert(`حدث خطأ: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditForm = (item: MaterialItem) => {
    setEditingItem({ ...item });
  };

  const openAddForm = () => {
    setEditingItem({ 
      category_id: categories[0]?.id || 0,
      material_name: '',
      material_code: '',
      description: '',
      year1: 1, // القيمة الافتراضية للسنة هي 1
      unit_price: '',
      quizall_price: '',
      quiz_price: '',
      voice_price: '' 
    });
  };

  const openUnitEditForm = (unit: UnitItem) => {
  setEditingUnit({ 
    ...unit,
    english: unit.english || 0 // تأكد من عدم وجود قيمة `undefined`
  });
};

  const openAddUnitForm = (materialId: number) => {
    setEditingUnit({ 
      material_id: materialId,
      unit_name: '',
      unit_num: 1,
      pages: '',
      free: 0,
      url1: '',
       english: 0 // Default to Arabic
    });
  };

  const openQuizEditForm = (quiz: QuizItem) => {
    setEditingQuiz({ ...quiz });
  };

  const openAddQuizForm = () => {
    if (!selectedUnit) return;
    
    setEditingQuiz({ 
      material_id: selectedUnit.materialId,
      unit_num: selectedUnit.unitNum,
      page_num: 1,
      parent: '',
      q_txt: '',
      a1: '',
      a2: '',
      a3: '',
      a4: '',
      answer: 1,
      note: '',
      q_code: '',
      timer: 0
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
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md mx-auto" role="alert">
        <p className="font-bold">خطأ</p>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* العنوان وقائمة الفئات في سطر واحد */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">إدارة المواد</h1>
            
            {/* قائمة تصفية الفئات بجانب العنوان */}
            <div className="relative">
              <select
                className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              >
                <option value="all">جميع الفئات</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.category_name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* زر الإضافة */}
          <button
            onClick={openAddForm}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition duration-300 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة مادة جديدة
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">كود المادة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اسم المادة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الفئة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">السنة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">سعر الوحدة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.material_code}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm font-medium text-gray-900">{item.material_name}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">{item.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{item.category_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.year1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.unit_price}</div>
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
                      <button
                        onClick={() => item.id && fetchUnits(item.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                          <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                        الوحدات
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* عرض حالة عدم وجود مواد */}
        {filteredData.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد مواد</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedCategory === 'all' 
                ? 'ابدأ بإضافة مادة جديدة بالنقر على الزر أعلاه' 
                : 'لا توجد مواد في الفئة المحددة'}
            </p>
          </div>
        )}

        {/* قسم إدارة الوحدات */}
        {selectedMaterialId && !showQuizzes && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                وحدات المادة: {data.find(m => m.id === selectedMaterialId)?.material_name}
              </h2>
              <button
                onClick={() => openAddUnitForm(selectedMaterialId)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                إضافة وحدة جديدة
              </button>
            </div>

            {/* جدول الوحدات */}
            {units.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 mb-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">رقم الوحدة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اسم الوحدة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الصفحات</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">مجانية</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {units.map((unit) => (
                      <tr key={unit.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{unit.unit_num}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{unit.unit_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{unit.pages}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{unit.free ? 'نعم' : 'لا'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openUnitEditForm(unit)}
                              className="text-yellow-600 hover:text-yellow-900 flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              تعديل
                            </button>
                            <button
                              onClick={() => unit.id && handleUnitDelete(unit.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              حذف
                            </button>
                            <button
                              onClick={() => fetchQuizzes(unit.material_id, unit.unit_num)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              الأسئلة
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <p className="text-gray-500">لا توجد وحدات لهذه المادة</p>
              </div>
            )}

            <button
              onClick={() => setSelectedMaterialId(null)}
              className="text-blue-600 hover:text-blue-800 flex items-center mt-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              العودة إلى قائمة المواد
            </button>
          </div>
        )}

        {/* قسم إدارة الأسئلة */}
        {showQuizzes && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                أسئلة الوحدة {selectedUnit?.unitNum} - المادة: {data.find(m => m.id === selectedUnit?.materialId)?.material_name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={openAddQuizForm}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  إضافة سؤال جديد
                </button>
                <button
                  onClick={() => setShowQuizzes(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {quizzes.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">رمز السؤال</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">رقم الصفحة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">السؤال</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجابة الصحيحة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">شرح</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quizzes.map((quiz, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{quiz.q_code}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{quiz.page_num}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{quiz.q_txt}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {[quiz.a1, quiz.a2, quiz.a3, quiz.a4].map((a, i) => (
                              <div key={i}>{i+1}. {a}</div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {quiz.answer}
                          </span>
                        </td>
                        <td className="px-6 py-4">{quiz.note}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openQuizEditForm(quiz)}
                              className="text-yellow-600 hover:text-yellow-900 flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              تعديل
                            </button>
                            <button
                              onClick={() => quiz.id && handleQuizDelete(quiz.id)}
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
            ) : (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <p className="text-gray-500">لا توجد أسئلة لهذه الوحدة</p>
              </div>
            )}
          </div>
        )}

        {/* Modal for Add/Edit Material */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingItem.id ? 'تعديل المادة' : 'إضافة مادة جديدة'}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.category_id}
                      onChange={(e) => setEditingItem({...editingItem, category_id: parseInt(e.target.value)})}
                      required
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.category_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المادة</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.material_name}
                      onChange={(e) => setEditingItem({...editingItem, material_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">كود المادة</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.material_code}
                      onChange={(e) => setEditingItem({...editingItem, material_code: e.target.value})}
                      required
                    />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر الوحدة</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.unit_price}
                      onChange={(e) => setEditingItem({...editingItem, unit_price: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر الكويز الكامل</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.quizall_price}
                      onChange={(e) => setEditingItem({...editingItem, quizall_price: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر الكويز</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.quiz_price}
                      onChange={(e) => setEditingItem({...editingItem, quiz_price: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر الصوت</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingItem.voice_price}
                      onChange={(e) => setEditingItem({...editingItem, voice_price: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center min-w-24"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      
        {/* Modal for Add/Edit Unit */}
{editingUnit && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {editingUnit.id ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
        </h2>
        <button 
          onClick={() => setEditingUnit(null)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleUnitSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوحدة</label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={editingUnit.unit_num}
              onChange={(e) => setEditingUnit({...editingUnit, unit_num: parseInt(e.target.value)})}
              required
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الوحدة</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={editingUnit.unit_name}
              onChange={(e) => setEditingUnit({...editingUnit, unit_name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الصفحات</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={editingUnit.pages}
              onChange={(e) => setEditingUnit({...editingUnit, pages: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الرابط (URL)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={editingUnit.url1}
              onChange={(e) => setEditingUnit({...editingUnit, url1: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وحدة مجانية؟</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={editingUnit.free}
              onChange={(e) => setEditingUnit({...editingUnit, free: parseInt(e.target.value)})}
            >
              <option value="0">لا</option>
              <option value="1">نعم</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={editingUnit.english}
              onChange={(e) => setEditingUnit({ ...editingUnit, english: Number(e.target.value) })}
              required
            >
              <option value="0">عربي</option>
              <option value="1">English</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setEditingUnit(null)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center min-w-24"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الحفظ...
              </>
            ) : (
              'حفظ التغييرات'
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

        {/* Modal for Add/Edit Quiz */}
        {editingQuiz && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingQuiz.id ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
                </h2>
                <button 
                  onClick={() => setEditingQuiz(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleQuizSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الصفحة</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.page_num}
                      onChange={(e) => setEditingQuiz({...editingQuiz, page_num: parseInt(e.target.value)})}
                      required
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رمز السؤال</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.q_code}
                      onChange={(e) => setEditingQuiz({...editingQuiz, q_code: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">السؤال</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.q_txt}
                      onChange={(e) => setEditingQuiz({...editingQuiz, q_txt: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الإجابة 1</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.a1}
                      onChange={(e) => setEditingQuiz({...editingQuiz, a1: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الإجابة 2</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.a2}
                      onChange={(e) => setEditingQuiz({...editingQuiz, a2: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الإجابة 3</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.a3}
                      onChange={(e) => setEditingQuiz({...editingQuiz, a3: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الإجابة 4</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.a4}
                      onChange={(e) => setEditingQuiz({...editingQuiz, a4: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الإجابة الصحيحة</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.answer}
                      onChange={(e) => setEditingQuiz({...editingQuiz, answer: parseInt(e.target.value)})}
                      required
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوقت (ثانية)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.timer}
                      onChange={(e) => setEditingQuiz({...editingQuiz, timer: parseInt(e.target.value)})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">شرح</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingQuiz.note}
                      onChange={(e) => setEditingQuiz({...editingQuiz, note: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingQuiz(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center min-w-24"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري الحفظ...
                      </>
                    ) : (
                      'حفظ التغييرات'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}