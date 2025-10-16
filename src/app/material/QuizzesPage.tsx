'use client';

import { useState, useEffect } from 'react';

// أنواع البيانات
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
  code_q_number: string;
  timer: number;
  importance: number;
};

interface QuizzesPageProps {
  onNavigate: (page: 'materials' | 'units') => void;
  initialMaterialId?: number;
  initialUnitNum?: number;
}

export default function QuizzesPage({ initialMaterialId, initialUnitNum }: QuizzesPageProps) {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
 // const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(initialMaterialId || null);
  const [selectedUnitNum, setSelectedUnitNum] = useState<number | null>(initialUnitNum || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // حالات الفلترة الجديدة
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<number | 'all' | null>(initialMaterialId || 'all');
  const [years, setYears] = useState<number[]>([]);
  const [categories, setCategories] = useState<{id: number, category_name: string}[]>([]);

  // حالة جديدة للسؤال الجديد
  const [newQuiz, setNewQuiz] = useState<Partial<QuizItem>>({
    material_id: selectedMaterial && selectedMaterial !== 'all' ? selectedMaterial : 0,
    unit_num: selectedUnitNum || 1,
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
    code_q_number: '',
    timer: 0,
    importance: 1
  });

  // حالة للرسائل (بديل عن alert)
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // حالة لمربع التأكيد (بديل عن confirm)
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // حالة البحث
  const [searchTerm, setSearchTerm] = useState('');

  // حالة عرض كل الأسئلة
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);

  const API_URL = 'http://alraskun.atwebpages.com/cp_material.php';
  const QUIZ_API_URL = 'http://alraskun.atwebpages.com/cp_quiz.php';
  const CATEGORY_API_URL = 'http://alraskun.atwebpages.com/cp_ashtrak.php';

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, []);

  useEffect(() => {
    // إذا تم اختيار مادة ووحدة محددة، جلب أسئلتها
    if (selectedMaterial !== 'all' && selectedMaterial !== null && selectedUnitNum && !showAllQuizzes) {
      fetchQuizzes(selectedMaterial, selectedUnitNum);
    } else if (selectedMaterial !== 'all' && selectedMaterial !== null && showAllQuizzes) {
      fetchAllQuizzes(selectedMaterial);
    } else {
      setQuizzes([]);
      setFilteredQuizzes([]);
    }
  }, [selectedMaterial, selectedUnitNum, showAllQuizzes]);

  useEffect(() => {
    // تطبيق الفلترة والبحث عند تغيير أي من معايير التصفية
    applyFilters();
  }, [quizzes, selectedYear, selectedCategory, selectedMaterial, searchTerm]);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!Array.isArray(result.data)) {
        throw new Error('تنسيق البيانات غير صحيح: لم يتم استلال مصفوفة');
      }

      setMaterials(result.data);
      
      // استخراج السنوات المتاحة من المواد
      const availableYears = Array.from(new Set(result.data.map((m: MaterialItem) => m.year1)))
        .sort() as number[];
      setYears(availableYears);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('Error fetching materials:', err);
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(CATEGORY_API_URL);
      if (!response.ok) throw new Error('فشل في جلب الفئات');
      const result = await response.json();
      setCategories(result);
    } catch (err) {
      console.error('Error fetching categories:', err);
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

      const result = await response.json();
      
      // التصحيح: التحقق من أن البيانات مصفوفة مباشرة
      if (!Array.isArray(result)) {
        throw new Error('تنسيق البيانات غير صحيح: لم يتم استلام مصفوفة');
      }

      setQuizzes(result);
     // setSelectedMaterialId(materialId);
      setSelectedUnitNum(unitNum);
      
      // تحديث حالة السؤال الجديد
      setNewQuiz(prev => ({
        ...prev,
        material_id: materialId,
        unit_num: unitNum
      }));
      
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setQuizzes([]);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الأسئلة');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllQuizzes = async (materialId: number) => {
    try {
      setIsLoading(true);
      // نستخدم unit_num = 0 لجلب كل الأسئلة (قد تحتاج لتعديل API الخاص بك)
      const response = await fetch(`${QUIZ_API_URL}?material_id=${materialId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `فشل في جلب الأسئلة - حالة الخطأ: ${response.status}`);
      }

      const result = await response.json();
      
      if (!Array.isArray(result)) {
        throw new Error('تنسيق البيانات غير صحيح: لم يتم استلام مصفوفة');
      }

      setQuizzes(result);
     // setSelectedMaterialId(materialId);
      setSelectedUnitNum(null);
      
    } catch (err) {
      console.error('Error fetching all quizzes:', err);
      setQuizzes([]);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الأسئلة');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
  let result = quizzes;
  
  // فلترة حسب السنة
  if (selectedYear !== 'all') {
    const material = materials.find(m => m.id === selectedMaterial);
    if (material && material.year1 !== selectedYear) {
      result = [];
    }
  }
  
  // فلترة حسب الفئة
  if (selectedCategory !== 'all') {
    const material = materials.find(m => m.id === selectedMaterial);
    if (material && material.category_id !== selectedCategory) {
      result = [];
    }
  }
  
  // البحث حسب رمز السؤال
  if (searchTerm.trim() !== '') {
    const searchText = searchTerm.toLowerCase();
    result = result.filter(quiz => {
      // تحويل جميع القيم إلى نص بأمان
      const qCode = String(quiz.q_code || '');
      const codeQNumber = String(quiz.code_q_number || '');
      const combinedCode = qCode && codeQNumber ? `${qCode}/${codeQNumber}` : qCode || codeQNumber;
      
      return (
        combinedCode.toLowerCase().includes(searchText) ||
        qCode.toLowerCase().includes(searchText) ||
        codeQNumber.toLowerCase().includes(searchText)
      );
    });
  }
  
  setFilteredQuizzes(result);
};

  // دالة لدمج رمز السؤال للعرض
  const getCombinedCode = (quiz: QuizItem) => {
    if (quiz.q_code && quiz.code_q_number) {
      return `${quiz.q_code}/${quiz.code_q_number}`;
    } else if (quiz.q_code) {
      return quiz.q_code;
    } else if (quiz.code_q_number) {
      return quiz.code_q_number;
    }
    return '-';
  };

  const showConfirmation = (message: string, onConfirm: () => void) => {
    setMessage(message);
    setIsError(false);
    setConfirmAction(() => onConfirm);
    setShowConfirm(true);
  };

  const handleQuizDelete = async (id: number) => {
    const onDelete = async () => {
      setShowConfirm(false);
      try {
        setIsLoading(true);
        const response = await fetch(`${QUIZ_API_URL}?id=${id}`, {
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
          throw new Error(data.message || 'فشل في حذف السؤال');
        }

        if (selectedMaterial !== 'all' && selectedMaterial !== null) {
          if (showAllQuizzes) {
            await fetchAllQuizzes(selectedMaterial);
          } else if (selectedUnitNum) {
            await fetchQuizzes(selectedMaterial, selectedUnitNum);
          }
        }
        
      } catch (err) {
        console.error('Error deleting quiz:', err);
        setMessage(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء الحذف');
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    showConfirmation('هل أنت متأكد من حذف هذا السؤال؟', onDelete);
  };

 const handleQuizSave = async (quiz: QuizItem) => {
  try {
    const method = quiz.id ? 'PUT' : 'POST';
    const url = quiz.id ? `${QUIZ_API_URL}?id=${quiz.id}` : QUIZ_API_URL;

    const payload = {
      material_id: quiz.material_id,
      unit_num: quiz.unit_num,
      page_num: quiz.page_num,
      parent: quiz.parent || '',
      q_txt: quiz.q_txt.trim(),
      a1: quiz.a1 || '',
      a2: quiz.a2 || '',
      a3: quiz.a3 || '',
      a4: quiz.a4 || '',
      answer: quiz.answer,
      note: quiz.note || '',
      q_code: quiz.q_code || '',
      code_q_number: quiz.code_q_number || '',
      timer: quiz.timer || 0,
      importance: quiz.importance || 1
    };

    console.log("Payload sent:", payload);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status, response.statusText);

    // الحصول على النص الخام أولاً
    const responseText = await response.text();
    console.log("Raw response:", responseText);

    if (!response.ok) {
      throw new Error(`خطأ في السيرفر: ${response.status} - ${response.statusText}`);
    }

    if (!responseText.trim()) {
      throw new Error('استجابة فارغة من السيرفر');
    }

    // محاولة تحليل JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      throw new Error('تنسيق البيانات غير صحيح من السيرفر');
    }

    if (!result.success) {
      throw new Error(result.error || result.message || 'فشل في حفظ السؤال');
    }

    setEditingId(null);
    
    // إعادة تحميل البيانات
    if (selectedMaterial !== 'all' && selectedMaterial !== null) {
      if (showAllQuizzes) {
        await fetchAllQuizzes(selectedMaterial);
      } else if (selectedUnitNum) {
        await fetchQuizzes(selectedMaterial, selectedUnitNum);
      }
    }
    
    setMessage('تم حفظ السؤال بنجاح');
    setIsError(false);
    
  } catch (err) {
    console.error('Error saving quiz:', err);
    setMessage(`حدث خطأ: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    setIsError(true);
  }
};

  const handleQuizAdd = async () => {
  if (!newQuiz.q_txt?.trim()) {
    setMessage('يرجى إدخال نص السؤال');
    setIsError(true);
    return;
  }

  if (!newQuiz.material_id || !newQuiz.unit_num) {
    setMessage('يجب اختيار مادة ووحدة أولاً');
    setIsError(true);
    return;
  }

  try {
    const payload = {
      material_id: newQuiz.material_id,
      unit_num: newQuiz.unit_num,
      page_num: newQuiz.page_num || 1,
      parent: newQuiz.parent || '',
      q_txt: newQuiz.q_txt.trim(),
      a1: newQuiz.a1 || '',
      a2: newQuiz.a2 || '',
      a3: newQuiz.a3 || '',
      a4: newQuiz.a4 || '',
      answer: newQuiz.answer || 1,
      note: newQuiz.note || '',
      q_code: newQuiz.q_code || '',
      code_q_number: newQuiz.code_q_number || '',
      timer: newQuiz.timer || 0,
      importance: newQuiz.importance || 1
    };

    console.log("Add quiz payload:", payload);

    const response = await fetch(QUIZ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // نفس التحسينات هنا
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response error:', errorText);
      throw new Error(`خطأ في السيرفر: ${response.status} - ${response.statusText}`);
    }

    let result;
    try {
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (responseText.trim() === '') {
        throw new Error('استجابة فارغة من السيرفر');
      }
      
      result = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      throw new Error('تنسيق البيانات غير صحيح من السيرفر');
    }

    if (!result.success) {
      throw new Error(result.message || result.error || 'فشل في إضافة السؤال');
    }

    // إعادة تعيين حالة السؤال الجديد
    setNewQuiz({
      material_id: selectedMaterial && selectedMaterial !== 'all' ? selectedMaterial : 0,
      unit_num: selectedUnitNum || 1,
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
      code_q_number: '',
      timer: 0,
      importance: 1
    });

    if (selectedMaterial !== 'all' && selectedMaterial !== null) {
      if (showAllQuizzes) {
        await fetchAllQuizzes(selectedMaterial);
      } else if (selectedUnitNum) {
        await fetchQuizzes(selectedMaterial, selectedUnitNum);
      }
    }
    
  } catch (err) {
    console.error('Error adding quiz:', err);
    setMessage(`حدث خطأ: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    setIsError(true);
  }
};

  const handleInputChange = (id: number, field: string, value: string | number) => {
    setQuizzes(prevQuizzes => 
      prevQuizzes.map(quiz => 
        quiz.id === id ? { ...quiz, [field]: value } : quiz
      )
    );
  };

  const handleNewQuizChange = (field: string, value: string | number) => {
    setNewQuiz(prev => ({ ...prev, [field]: value }));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    if (selectedMaterial !== 'all' && selectedMaterial !== null) {
      if (showAllQuizzes) {
        fetchAllQuizzes(selectedMaterial);
      } else if (selectedUnitNum) {
        fetchQuizzes(selectedMaterial, selectedUnitNum);
      }
    }
  };

  const handleShowAllQuizzes = () => {
    if (selectedMaterial !== 'all' && selectedMaterial !== null) {
      setShowAllQuizzes(true);
      setSelectedUnitNum(null);
    }
  };

  const handleShowUnitQuizzes = () => {
    setShowAllQuizzes(false);
  };

  const closeMessage = () => {
    setMessage('');
    setShowConfirm(false);
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
        {/* Message and Confirm Modal */}
        {message && (
          <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50`}>
            <div className={`p-6 rounded-lg shadow-xl max-w-sm mx-auto ${isError ? 'bg-red-100 border border-red-400' : 'bg-green-100 border border-green-400'}`}>
              <div className="text-center">
                <p className={`font-bold text-lg ${isError ? 'text-red-700' : 'text-green-700'}`}>{isError ? 'خطأ' : 'نجاح'}</p>
                <p className={`mt-2 ${isError ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
                {showConfirm ? (
                  <div className="mt-4 flex justify-around">
                    <button
                      onClick={confirmAction || (() => {})}
                      className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600"
                    >
                      تأكيد
                    </button>
                    <button
                      onClick={closeMessage}
                      className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={closeMessage}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600"
                  >
                    حسناً
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* العنوان وقوائم التصفية */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-800">إدارة الأسئلة</h1>
            
            {/* قائمة تصفية الفئات */}
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

            {/* قائمة تصفية السنة */}
            <div className="relative">
              <select
                className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              >
                <option value="all">جميع السنوات</option>
                {years.map(year => (
                  <option key={year} value={year}>السنة {year}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* قائمة تصفية المواد */}
            <div className="relative">
              <select
                className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                value={selectedMaterial === null ? 'all' : selectedMaterial}
                onChange={(e) => {
                  const value = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                  setSelectedMaterial(value);
                  if (value === 'all') {
                    setShowAllQuizzes(false);
                  }
                }}
              >
                <option value="all">اختر المادة</option>
                {materials
                  .filter(material => 
                    (selectedCategory === 'all' || material.category_id === selectedCategory) &&
                    (selectedYear === 'all' || material.year1 === selectedYear)
                  )
                  .map(material => (
                    <option key={material.id} value={material.id}>{material.material_name}</option>
                  ))
                }
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* قائمة تصفية الوحدات - تظهر فقط عند عدم عرض كل الأسئلة */}
            {selectedMaterial !== 'all' && selectedMaterial !== null && !showAllQuizzes && (
              <div className="relative">
                <select
                  className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                  value={selectedUnitNum || ''}
                  onChange={(e) => setSelectedUnitNum(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">اختر الوحدة</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(unitNum => (
                    <option key={unitNum} value={unitNum}>الوحدة {unitNum}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

            {/* زر عرض كل الأسئلة */}
            {selectedMaterial !== 'all' && selectedMaterial !== null && !showAllQuizzes && (
              <button
                onClick={handleShowAllQuizzes}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                عرض كل الأسئلة
              </button>
            )}

            {/* زر العودة لعرض الوحدة */}
            {selectedMaterial !== 'all' && selectedMaterial !== null && showAllQuizzes && (
              <button
                onClick={handleShowUnitQuizzes}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                العودة للوحدة
              </button>
            )}
          </div>

          {/* حقل البحث */}
          <div className="relative">
            <input
              type="text"
              className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-64"
              placeholder="ابحث برمز السؤال (مثال: 1/5)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {selectedMaterial !== 'all' && selectedMaterial !== null && (showAllQuizzes || selectedUnitNum) && (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">رمز السؤال</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الوحدة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">رقم الصفحة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">السؤال</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجابات</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجابة الصحيحة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الأهمية</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الوقت</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Add new row - يظهر فقط عند عرض الوحدة وليس كل الأسئلة */}
                {!showAllQuizzes && (
                  <tr className="bg-blue-50">
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={newQuiz.q_code || ''}
                          onChange={(e) => handleNewQuizChange('q_code', e.target.value)}
                          placeholder="q_code"
                        />
                        <span className="self-center">/</span>
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={newQuiz.code_q_number || ''}
                          onChange={(e) => handleNewQuizChange('code_q_number', e.target.value)}
                          placeholder="code_q_number"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500">{selectedUnitNum}</div>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        value={newQuiz.page_num || 1}
                        onChange={(e) => handleNewQuizChange('page_num', parseInt(e.target.value) || 1)}
                        min="1"
                        placeholder="رقم الصفحة"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <textarea
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        value={newQuiz.q_txt || ''}
                        onChange={(e) => handleNewQuizChange('q_txt', e.target.value)}
                        placeholder="نص السؤال"
                        rows={2}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={newQuiz.a1 || ''}
                          onChange={(e) => handleNewQuizChange('a1', e.target.value)}
                          placeholder="الإجابة 1"
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={newQuiz.a2 || ''}
                          onChange={(e) => handleNewQuizChange('a2', e.target.value)}
                          placeholder="الإجابة 2"
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={newQuiz.a3 || ''}
                          onChange={(e) => handleNewQuizChange('a3', e.target.value)}
                          placeholder="الإجابة 3"
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={newQuiz.a4 || ''}
                          onChange={(e) => handleNewQuizChange('a4', e.target.value)}
                          placeholder="الإجابة 4"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        value={newQuiz.answer || 1}
                        onChange={(e) => handleNewQuizChange('answer', parseInt(e.target.value))}
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        value={newQuiz.importance || 1}
                        onChange={(e) => handleNewQuizChange('importance', parseInt(e.target.value))}
                      >
                        <option value={1}>عادية</option>
                        <option value={2}>متوسطة</option>
                        <option value={3}>عالية</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        value={newQuiz.timer || 0}
                        onChange={(e) => handleNewQuizChange('timer', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="الوقت"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-lg font-medium">
                      <button
                        onClick={handleQuizAdd}
                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition flex items-center justify-center text-xs w-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        إضافة
                      </button>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {filteredQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 py-4">
                      {editingId === quiz.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={quiz.q_code}
                            onChange={(e) => handleInputChange(quiz.id!, 'q_code', e.target.value)}
                            placeholder="q_code"
                          />
                          <span className="self-center">/</span>
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={quiz.code_q_number}
                            onChange={(e) => handleInputChange(quiz.id!, 'code_q_number', e.target.value)}
                            placeholder="code_q_number"
                          />
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{getCombinedCode(quiz)}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500">{quiz.unit_num}</div>
                    </td>
                    <td className="px-4 py-4">
                      {editingId === quiz.id ? (
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={quiz.page_num}
                          onChange={(e) => handleInputChange(quiz.id!, 'page_num', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{quiz.page_num}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === quiz.id ? (
                        <textarea
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={quiz.q_txt}
                          onChange={(e) => handleInputChange(quiz.id!, 'q_txt', e.target.value)}
                          rows={2}
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-800">{quiz.q_txt}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === quiz.id ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={quiz.a1}
                            onChange={(e) => handleInputChange(quiz.id!, 'a1', e.target.value)}
                          />
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={quiz.a2}
                            onChange={(e) => handleInputChange(quiz.id!, 'a2', e.target.value)}
                          />
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={quiz.a3}
                            onChange={(e) => handleInputChange(quiz.id!, 'a3', e.target.value)}
                          />
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={quiz.a4}
                            onChange={(e) => handleInputChange(quiz.id!, 'a4', e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>1. {quiz.a1}</div>
                          <div>2. {quiz.a2}</div>
                          <div>3. {quiz.a3}</div>
                          <div>4. {quiz.a4}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === quiz.id ? (
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={quiz.answer}
                          onChange={(e) => handleInputChange(quiz.id!, 'answer', parseInt(e.target.value))}
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                        </select>
                      ) : (
                        <div className="text-sm font-medium text-green-600">{quiz.answer}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === quiz.id ? (
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={quiz.importance}
                          onChange={(e) => handleInputChange(quiz.id!, 'importance', parseInt(e.target.value))}
                        >
                          <option value={1}>عادية</option>
                          <option value={2}>متوسطة</option>
                          <option value={3}>عالية</option>
                        </select>
                      ) : (
                        <div className={`text-sm font-medium ${
                          quiz.importance === 3 ? 'text-red-600' : 
                          quiz.importance === 2 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {quiz.importance === 3 ? 'عالية' : 
                           quiz.importance === 2 ? 'متوسطة' : 
                           'عادية'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === quiz.id ? (
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={quiz.timer}
                          onChange={(e) => handleInputChange(quiz.id!, 'timer', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{quiz.timer} ثانية</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {editingId === quiz.id ? (
                          <>
                            <button
                              onClick={() => handleQuizSave(quiz)}
                              className="text-green-600 hover:text-green-900 flex items-center justify-center text-xs p-2 border border-green-600 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              حفظ
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 flex items-center justify-center text-xs p-2 border border-gray-600 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              إلغاء
                            </button>
                          </>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingId(quiz.id!)}
                              className="text-yellow-600 hover:text-yellow-900 flex items-center justify-center text-xs p-2 border border-yellow-600 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.380-8.379-2.83-2.828z" />
                              </svg>
                              تعديل
                            </button>
                            <button
                              onClick={() => quiz.id && handleQuizDelete(quiz.id)}
                              className="text-red-600 hover:text-red-900 flex items-center justify-center text-xs p-2 border border-red-600 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              حذف
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedMaterial !== 'all' && selectedMaterial !== null && (showAllQuizzes || selectedUnitNum) && filteredQuizzes.length === 0 && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد أسئلة</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'لم يتم العثور على أسئلة تطابق بحثك' : 'لا توجد أسئلة متاحة'}
            </p>
          </div>
        )}

        {selectedMaterial === 'all' || selectedMaterial === null || (!showAllQuizzes && !selectedUnitNum) ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">اختر مادة ووحدة لعرض أسئلتها</h3>
            <p className="mt-1 text-sm text-gray-500">
              يرجى اختيار مادة ووحدة من القوائم المنسدلة أعلاه
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}