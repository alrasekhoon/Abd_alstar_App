'use client';

import { useState, useEffect, useCallback } from 'react';

type QuizParent = {
  id: number;
  name1: string;
  material_id: number;
};

type Quiz = {
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
};

type QuizForm = {
  id: number;
  quiz_id: number;
  parent_id: number;
};

type Material = {
  id: number;
  material_name: string;
};



type parent_form = {
  id : number;
  quiz_title : string;
  questions_count : number;
};


export default function QuizFormsManagement() {
  const [quizParents, setQuizParents] = useState<QuizParent[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [parent_form, setparent_form] = useState<parent_form[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [selectedParent, setSelectedParent] = useState<number | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<Quiz[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [newFormName, setNewFormName] = useState('');
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    materials: false,
    questions: false,
    parents: false,
    formQuestions: false,
    formAction: false
  });

  // دالة مساعدة لتحديث حالة تحميل معينة
   const setLoading = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const API_URL = '/api/proxy/cp_quiz_form.php';

  




  const fetchAllData = useCallback(async () => {
    try {
      setLoading('materials', true);
      setError('');
      
      const response = await fetch(`${API_URL}?action=get_materials`);
      if (!response.ok) throw new Error('فشل في جلب المواد');
      
      const data = await response.json();
      setMaterials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading('materials', false);
    }
  }, []);

   const fetchQuestionsByMaterial = useCallback(async (materialId: number) => {
    try {
      setLoading('questions', true);
      const response = await fetch(`${API_URL}?action=get_questions_by_material&material_id=${materialId}`);
      if (!response.ok) throw new Error('فشل في جلب الأسئلة');
      
      const result = await response.json();
      setQuizzes(result);
      setAvailableQuestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الأسئلة');
    } finally {
      setLoading('questions', false);
    }
  }, []);

  const fetchParentsByMaterial = useCallback(async (materialId: number) => {
    try {
      setLoading('parents', true);
      const response = await fetch(`${API_URL}?action=get_parents_by_material&material_id=${materialId}`);
      if (!response.ok) throw new Error('فشل في جلب النماذج');
      
      const result = await response.json();
      setQuizParents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النماذج');
    } finally {
      setLoading('parents', false);
    }
  }, []);

  const fetchFormQuestions = useCallback(async (parentId: number, materialId: number) => {
    try {
      setLoading('formQuestions', true);
      const response = await fetch(`${API_URL}?action=get_form_questions&parent_id=${parentId}&material_id=${materialId}`);
      if (!response.ok) throw new Error('فشل في جلب أسئلة النموذج');
      
      const result = await response.json();
      const selectedIds = result.map((form: QuizForm) => form.quiz_id);
      setSelectedQuestions(selectedIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب أسئلة النموذج');
    } finally {
      setLoading('formQuestions', false);
    }
  }, []);


  const fetchparent_form = useCallback(async (materialId: number) => {
    try {
      setLoading('formQuestions', true);
      const response = await fetch(`${API_URL}?action=get_forms_with_details&material_id=${materialId}`);
      if (!response.ok) throw new Error('فشل في جلب جدول النماذج للمادة');
      
      const result = await response.json();
      setparent_form(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب جدول النماذج للمادة');
    } finally {
      setLoading('formQuestions', false);
    }
  }, []);

   useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (selectedMaterial) {
      fetchQuestionsByMaterial(selectedMaterial);
      fetchParentsByMaterial(selectedMaterial);
      setSelectedParent(null);
      fetchparent_form(selectedMaterial);
    } else {
      setAvailableQuestions([]);
      setQuizParents([]);
      setSelectedParent(null);
    }
  }, [selectedMaterial, fetchQuestionsByMaterial, fetchParentsByMaterial, fetchparent_form]);

  useEffect(() => {
    if (selectedParent && selectedMaterial) {
      fetchFormQuestions(selectedParent, selectedMaterial);
    } else {
      setSelectedQuestions([]);
    }
  }, [selectedParent, selectedMaterial, fetchFormQuestions]);

    const handleCreateForm = async () => {
    if (!newFormName.trim()) {
      setError('اسم النموذج مطلوب');
      return;
    }

    try {
      setLoading('formAction', true);
      const formData = {
        action: 'create_form',
        name: newFormName.trim()
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'فشل في إنشاء النموذج');
      }

      if (result.success) {
        setShowFormModal(false);
        setNewFormName('');
        if (selectedMaterial) {
          await fetchParentsByMaterial(selectedMaterial);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading('formAction', false);
    }
  };


   const handleUpdateForm = async () => {
    if (!selectedParent || selectedQuestions.length === 0) {
      alert('الرجاء تحديد النموذج والأسئلة');
      return;
    }

    try {
      setLoading('formAction', true);
      const formData = new FormData();
      formData.append('parent_id', selectedParent.toString());
      selectedQuestions.forEach(id => {
        formData.append('question_ids[]', id.toString());
      });

      const response = await fetch(`${API_URL}?action=update_form`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'فشل في التحديث');
      }

      alert('تم تحديث النموذج بنجاح!');
      if (selectedMaterial) {
        await fetchParentsByMaterial(selectedMaterial);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    } finally {
      setLoading('formAction', false);
    }
  };

  const handleDeleteForm = async (parentId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا النموذج؟ سيتم حذف جميع الأسئلة المرتبطة به.')) return;
    
    try {
      setLoading('formAction', true);
      const response = await fetch(`${API_URL}?action=delete_form&parent_id=${parentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف النموذج');
      
      const result = await response.json();
      if (result.success) {
        if (selectedMaterial) {
          await fetchParentsByMaterial(selectedMaterial);
        }
        if (selectedParent === parentId) {
          setSelectedParent(null);
          setSelectedQuestions([]);
        }
      } else {
        throw new Error(result.message || 'حدث خطأ أثناء حذف النموذج');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setLoading('formAction', false);
    }
  };

  const toggleQuestionSelection = (quizId: number) => {
    setSelectedQuestions(prev => {
      if (prev.includes(quizId)) {
        return prev.filter(id => id !== quizId);
      } else {
        return [...prev, quizId];
      }
    });
  };

  const openEditForm = (parentId: number) => {
    const parent = quizParents.find(p => p.id === parentId);
    if (parent) {
      setNewFormName(parent.name1);
      setSelectedParent(parentId);
      setSelectedMaterial(parent.material_id);
      setShowFormModal(true);
    }
  };

  const openAddForm = () => {
    setNewFormName('');
    setSelectedQuestions([]);
    setSelectedParent(null);
    setShowFormModal(true);
    //setEditingForm(null);
  };

 

   if (loadingStates.materials && materials.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">جاري تحميل المواد...</p>
        </div>
      </div>
    );
  }

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
      {/* إضافة مؤشرات تحميل في الأقسام المناسبة */}
      

      

      

      {loadingStates.formAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-4"></div>
            <span>جاري معالجة الطلب...</span>
          </div>
        </div>
      )}

    
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة نماذج الأسئلة</h1>
          <button
            onClick={openAddForm}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة نموذج جديد
          </button>
        </div>

        {/* Material Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">اختر المادة:</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            value={selectedMaterial || ''}
            onChange={(e) => {
              const materialId = e.target.value ? parseInt(e.target.value) : null;
              setSelectedMaterial(materialId);
              setSelectedParent(null);
            }}
          >
            <option value="">-- اختر المادة --</option>
            {materials.map(material => (
              <option key={material.id} value={material.id}>{material.material_name}</option>
            ))}
          </select>
        </div>

        {loadingStates.parents && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span>جاري تحميل النماذج...</span>
        </div>
      )}

        {/* Forms Dropdown */}
        {selectedMaterial && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">اختر النموذج:</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={selectedParent || ''}
              onChange={(e) => setSelectedParent(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">-- اختر نموذج --</option>
              {quizParents.map(parent => (
                <option key={parent.id} value={parent.id}>{parent.name1}</option>
              ))}
            </select>
          </div>
        )}

        {/* Questions Display */}
        {selectedMaterial && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {selectedParent ? 'أسئلة النموذج المحدد' : 'اختيار الأسئلة للنموذج الجديد'}
            </h2>
            
          

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loadingStates.questions && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span>جاري تحميل الأسئلة...</span>
        </div>
      )}
              {/* Available Questions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">أسئلة المادة ({availableQuestions.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableQuestions.map(quiz => (
                    <div 
                      key={quiz.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition ${selectedQuestions.includes(quiz.id) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => toggleQuestionSelection(quiz.id)}
                    >
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(quiz.id)}
                          onChange={() => toggleQuestionSelection(quiz.id)}
                          className="mt-1 mr-2"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{quiz.q_txt}</p>
                          <p className="text-xs text-gray-500 mt-1">الوحدة: {quiz.unit_num} - الصفحة: {quiz.page_num}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {loadingStates.formQuestions && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span>جاري تحميل أسئلة النموذج...</span>
        </div>
      )}
              
              {/* Selected Questions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">الأسئلة المختارة ({selectedQuestions.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedQuestions.length > 0 ? (
                    quizzes
                      .filter(quiz => selectedQuestions.includes(quiz.id))
                      .map(quiz => (
                        <div 
                          key={quiz.id} 
                          className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start"
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => toggleQuestionSelection(quiz.id)}
                            className="mt-1 mr-2"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800 line-clamp-2">{quiz.q_txt}</p>
                            <p className="text-xs text-gray-500 mt-1">الوحدة: {quiz.unit_num} - الصفحة: {quiz.page_num}</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>لم يتم اختيار أي أسئلة بعد</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex justify-end space-x-4">
              {selectedParent ? (
                <>
                  <button
                    onClick={handleUpdateForm}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    حفظ التعديلات
                  </button>
                  <button
                    onClick={() => {
                      setSelectedParent(null);
                      setSelectedQuestions([]);
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    إلغاء التعديل
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowFormModal(true)}
                  disabled={selectedQuestions.length === 0}
                  className={`px-6 py-2 rounded-lg transition flex items-center ${selectedQuestions.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  إنشاء نموذج جديد
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedParent ? 'تعديل النموذج' : 'إنشاء نموذج جديد'}
                </h2>
                <button 
                  onClick={() => setShowFormModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم النموذج</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newFormName}
                    onChange={(e) => setNewFormName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={selectedParent ? handleUpdateForm : handleCreateForm}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {selectedParent ? 'تحديث النموذج' : 'إنشاء النموذج'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forms List for Selected Material */}
        {selectedMaterial && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">نماذج المادة المحددة</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اسم النموذج</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">عدد الأسئلة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parent_form.map((parent) => (
                    <tr key={parent.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{parent.quiz_title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {parent.questions_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedParent(parent.id);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            عرض
                          </button>
                          <button
                            onClick={() => {
                              openEditForm(parent.id);
                            }}
                            className="text-yellow-600 hover:text-yellow-900 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteForm(parent.id)}
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

            {quizParents.length === 0  && (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد نماذج لهذه المادة</h3>
                <p className="mt-1 text-sm text-gray-500">يمكنك إنشاء نموذج جديد بعد اختيار الأسئلة</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}