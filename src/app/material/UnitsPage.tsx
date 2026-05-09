
'use client';

import { useState, useEffect } from 'react';

// أنواع البيانات (يجب نقلها إلى ملف types.ts مشترك)
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

type UnitItem = {
  id?: number;
  material_id: number;
  unit_name: string;
  unit_num: number;
  pages: string;
  free: number;
  url1: string;
  english: number;
  show1: number; 
  material_name?: string;
};

type CategoryItem = {
  id: number;
  category_name: string;
};

// تعريف نوع للمعاملات
interface QuizNavigationParams {
  materialId: number;
  unitNum: number;
}

// تعريف نوع للدالة onNavigate
interface UnitsPageProps {
  onNavigate: (page: 'quizzes', params?: QuizNavigationParams) => void;
  initialMaterialId?: number;
}

export default function UnitsPage({ onNavigate, initialMaterialId }: UnitsPageProps) {
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // حالات الفلترة الجديدة
  const [filteredUnits, setFilteredUnits] = useState<UnitItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<number | 'all' | null>(initialMaterialId || 'all');
  const [years, setYears] = useState<number[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // حالة جديدة للوحدة الجديدة
  const [newUnit, setNewUnit] = useState<Partial<UnitItem>>({
    material_id: selectedMaterial && selectedMaterial !== 'all' ? selectedMaterial : 0,
    unit_name: '',
    unit_num: 1,
    pages: '',
    free: 0,
    url1: '',
    english: 0,
    show1: 1 // قيمة افتراضية 1 للحقل الجديد
  });

  // حالة للرسائل (بديل عن alert)
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);


  // حالة لمربع التأكيد (بديل عن confirm)
  // Modal states
const [showAddModal, setShowAddModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);

// Multi-add rows
const [bulkRows, setBulkRows] = useState<Partial<UnitItem>[]>([]);

// Unit name generator
const [addUnitType, setAddUnitType] = useState<'فصل' | 'وحدة'>('وحدة');
const [editUnitType, setEditUnitType] = useState<'فصل' | 'وحدة'>('وحدة');

const arabicOrdinals: Record<number, string> = {
  1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع',
  5: 'الخامس', 6: 'السادس', 7: 'السابع', 8: 'الثامن',
  9: 'التاسع', 10: 'العاشر', 11: 'الحادي عشر', 12: 'الثاني عشر',
  13: 'الثالث عشر', 14: 'الرابع عشر', 15: 'الخامس عشر', 16: 'السادس عشر'
};

const generateUnitName = (type: 'فصل' | 'وحدة', num: number): string => {
  if (num >= 1 && num <= 16) return `${type} ${arabicOrdinals[num]}`;
  return '';
};


  const API_URL = '/api/proxy/cp_material.php';
  const UNITS_API_URL = '/api/proxy/cp_tunits.php';
  const CATEGORY_API_URL = '/api/proxy/cp_ashtrak.php';

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, []);

  useEffect(() => {
    // إذا تم اختيار مادة محددة، جلب وحداتها
    if (selectedMaterial !== 'all' && selectedMaterial !== null) {
      fetchUnits(selectedMaterial);
    } else {
      setUnits([]);
      setFilteredUnits([]);
    }
  }, [selectedMaterial]);

  useEffect(() => {
    // تطبيق الفلترة عند تغيير أي من معايير التصفية
    applyFilters();
  }, [units, selectedYear, selectedCategory, selectedMaterial]);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const url = `${API_URL}?refresh=${timestamp}`;
      
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!Array.isArray(result.data)) {
        throw new Error('تنسيق البيانات غير صحيح: لم يتم استلام مصفوفة');
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
      const timestamp = Date.now();
      const url = `${CATEGORY_API_URL}?refresh=${timestamp}`;
      
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) throw new Error('فشل في جلب الفئات');
      const result = await response.json();
      setCategories(result);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchUnits = async (materialId: number) => {
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const url = `${UNITS_API_URL}?material_id=${materialId}&refresh=${timestamp}`;
      
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) throw new Error('فشل في جلب الوحدات');
      const result = await response.json();
      
      // إضافة اسم المادة لكل وحدة
      const unitsWithMaterialName = (result.data || []).map((unit: UnitItem) => ({
        ...unit,
        material_name: materials.find(m => m.id === materialId)?.material_name
      }));
      
      setUnits(unitsWithMaterialName);
      
      // تحديث حالة الوحدة الجديدة
      setNewUnit(prev => ({
        ...prev,
        material_id: materialId
      }));
    } catch (err) {
      console.error('Error fetching units:', err);
      setUnits([]);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الوحدات');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = units;
    
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
    
    setFilteredUnits(result);
  };

  const showConfirmation = (message: string, onConfirm: () => void) => {
    setMessage(message);
    setIsError(false);
    setConfirmAction(() => onConfirm);
    setShowConfirm(true);
  };

  const handleUnitDelete = async (id: number) => {
    const onDelete = async () => {
      setShowConfirm(false);
      try {
        setIsLoading(true);
        const timestamp = Date.now();
        const url = `${UNITS_API_URL}?id=${id}&refresh=${timestamp}`;
        
        const response = await fetch(url, {
          method: 'DELETE',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || `حدث خطأ: ${response.status}`);
        }

        if (!data.success) {
          throw new Error(data.message || 'فشل في حذف الوحدة');
        }

        if (selectedMaterial !== 'all' && selectedMaterial !== null) {
          await fetchUnits(selectedMaterial);
        }
        
      } catch (err) {
        console.error('Error deleting unit:', err);
        setMessage(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء الحذف');
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    showConfirmation('هل أنت متأكد من حذف هذه الوحدة؟', onDelete);
  };

  const handleUnitSave = async (unit: UnitItem) => {
    try {
      const method = unit.id ? 'PUT' : 'POST';
      const timestamp = Date.now();
      const url = unit.id ? `${UNITS_API_URL}?id=${unit.id}&refresh=${timestamp}` : `${UNITS_API_URL}?refresh=${timestamp}`;

      const payload = {
        material_id: unit.material_id,
        unit_name: unit.unit_name.trim(),
        unit_num: unit.unit_num,
        pages: unit.pages || '',
        free: unit.free || 0,
        url1: unit.url1 || '',
        english: unit.english || 0,
        show1: unit.show1 
      };

      console.log("Payload sent:", payload);

      const response = await fetch(url, {
        method,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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

      setEditingId(null);
      
      if (selectedMaterial !== 'all' && selectedMaterial !== null) {
        await fetchUnits(selectedMaterial);
      }
      
    } catch (err) {
      console.error('Error saving unit:', err);
      setMessage(`حدث خطأ: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
      setIsError(true);
    }
  };

  const handleUnitAdd = async () => {
    if (!newUnit.unit_name?.trim()) {
      setMessage('يرجى إدخال اسم الوحدة');
      setIsError(true);
      return;
    }

    if (!newUnit.material_id) {
      setMessage('يجب اختيار مادة أولاً');
      setIsError(true);
      return;
    }

    try {
      const timestamp = Date.now();
      const url = `${UNITS_API_URL}?refresh=${timestamp}`;

      const payload = {
        material_id: newUnit.material_id,
        unit_name: newUnit.unit_name.trim(),
        unit_num: newUnit.unit_num || 1,
        pages: newUnit.pages || '',
        free: newUnit.free || 0,
        url1: newUnit.url1 || '',
        english: newUnit.english || 0,
        show1: newUnit.show1 
      };

      const response = await fetch(url, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل في إضافة الوحدة');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'فشل في إضافة الوحدة');
      }

      // إعادة تعيين حالة الوحدة الجديدة
      setNewUnit({
        material_id: selectedMaterial && selectedMaterial !== 'all' ? selectedMaterial : 0,
        unit_name: '',
        unit_num: 1,
        pages: '',
        free: 0,
        url1: '',
        english: 0,
        show1: 1
      });

      if (selectedMaterial !== 'all' && selectedMaterial !== null) {
        await fetchUnits(selectedMaterial);
      }
      
    } catch (err) {
      console.error('Error adding unit:', err);
      setMessage(`حدث خطأ: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
      setIsError(true);
    }
  };

  const handleInputChange = (id: number, field: string, value: string | number) => {
    setUnits(prevUnits => 
      prevUnits.map(unit => 
        unit.id === id ? { ...unit, [field]: value } : unit
      )
    );
  };

  const handleNewUnitChange = (field: string, value: string | number) => {
    setNewUnit(prev => ({ ...prev, [field]: value }));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    if (selectedMaterial !== 'all' && selectedMaterial !== null) {
      fetchUnits(selectedMaterial);
    }
  };

const handleToggleShow = async (unit: UnitItem) => {
  const newVal = unit.show1 === 1 ? 0 : 1;
  handleInputChange(unit.id!, 'show1', newVal);
  try {
    const url = `${UNITS_API_URL}?id=${unit.id}&refresh=${Date.now()}`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...unit, show1: newVal }),
    });
    if (selectedMaterial !== 'all' && selectedMaterial !== null) {
      await fetchUnits(selectedMaterial);
    }
  } catch (err) {
    console.error('Error toggling show:', err);
  }
};

const handleToggleFree = async (unit: UnitItem) => {
  const newVal = unit.free === 1 ? 0 : 1;
  handleInputChange(unit.id!, 'free', newVal);
  try {
    const url = `${UNITS_API_URL}?id=${unit.id}&refresh=${Date.now()}`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...unit, free: newVal }),
    });
    if (selectedMaterial !== 'all' && selectedMaterial !== null) {
      await fetchUnits(selectedMaterial);
    }
  } catch (err) {
    console.error('Error toggling free:', err);
  }
};

const handleHideAll = async () => {
  showConfirmation('هل تريد إخفاء جميع الوحدات؟', async () => {
    setShowConfirm(false);
    try {
      await Promise.all(
        filteredUnits.map(unit =>
          fetch(`${UNITS_API_URL}?id=${unit.id}&refresh=${Date.now()}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...unit, show1: 0 }),
          })
        )
      );
      if (selectedMaterial !== 'all' && selectedMaterial !== null) {
        await fetchUnits(selectedMaterial);
      }
    } catch (err) {
      setMessage('حدث خطأ أثناء إخفاء الوحدات');
      setIsError(true);
    }
  });
};

const handleFreeAll = async () => {
  showConfirmation('هل تريد تحويل جميع الوحدات إلى مجانية؟', async () => {
    setShowConfirm(false);
    try {
      await Promise.all(
        filteredUnits.map(unit =>
          fetch(`${UNITS_API_URL}?id=${unit.id}&refresh=${Date.now()}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...unit, free: 1 }),
          })
        )
      );
      if (selectedMaterial !== 'all' && selectedMaterial !== null) {
        await fetchUnits(selectedMaterial);
      }
    } catch (err) {
      setMessage('حدث خطأ أثناء تحديث الوحدات');
      setIsError(true);
    }
  });
};

const handleOpenEditModal = (unit: UnitItem) => {
  setEditingUnit({ ...unit });
  setShowEditModal(true);
};

const handleEditModalSave = async () => {
  if (!editingUnit) return;
  await handleUnitSave(editingUnit);
  setShowEditModal(false);
  setEditingUnit(null);
};

const handleAddBulkRow = () => {
  setBulkRows(prev => [...prev, {
    material_id: selectedMaterial !== 'all' && selectedMaterial !== null ? selectedMaterial : 0,
    unit_name: '',
    unit_num: 1,
    pages: '',
    free: 0,
    url1: '',
    english: 0,
    show1: 1,
  }]);
};

const handleBulkRowChange = (index: number, field: string, value: string | number) => {
  setBulkRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
};

const handleBulkRowDelete = (index: number) => {
  setBulkRows(prev => prev.filter((_, i) => i !== index));
};

const handleSaveBulkRows = async () => {
  const validRows = bulkRows.filter(r => r.unit_name?.trim());
  if (validRows.length === 0) {
    setMessage('يرجى إدخال اسم الوحدة على الأقل لصف واحد');
    setIsError(true);
    return;
  }
  try {
    await Promise.all(validRows.map(row =>
      fetch(`${UNITS_API_URL}?refresh=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      })
    ));
    setBulkRows([]);
    if (selectedMaterial !== 'all' && selectedMaterial !== null) {
      await fetchUnits(selectedMaterial);
    }
  } catch (err) {
    setMessage('حدث خطأ أثناء الحفظ');
    setIsError(true);
  }
};


  const handleViewQuizzes = (materialId: number, unitNum: number) => {
    onNavigate('quizzes', { materialId, unitNum });
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

        {/* العنوان وقوائم التصفية في سطر واحد */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
  <div className="flex items-center gap-4 flex-wrap">
    <h1 className="text-3xl font-bold text-gray-800">إدارة الوحدات</h1>
    <button
      onClick={() => setShowAddModal(true)}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      إضافة وحدة
    </button>

            
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
                onChange={(e) => setSelectedMaterial(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
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
          </div>
        </div>

        {/* Data Table */}
{selectedMaterial !== 'all' && selectedMaterial !== null && (
  <div>
    {/* Bulk Action Buttons */}
    <div className="flex gap-2 mb-3">
      <button
        onClick={handleHideAll}
        className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-medium transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
        </svg>
        إخفاء الجميع
      </button>
      <button
        onClick={handleFreeAll}
        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v1h2V7a5 5 0 00-5-5z" />
        </svg>
        تحويل الجميع لمجاني
      </button>
    </div>

    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">رقم الوحدة</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اسم الوحدة</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الصفحات</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الرابط</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">مجاني</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اللغة</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">مفعل</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
          </tr>
        </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {/* Bulk add rows */}
{bulkRows.map((row, index) => (
  <tr key={`bulk-${index}`} className="bg-blue-50">
    <td className="px-4 py-3">
      <input
        type="number"
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        value={row.unit_num || 1}
        onChange={(e) => {
          const num = parseInt(e.target.value) || 1;
          const name = generateUnitName('وحدة', num);
          setBulkRows(prev => prev.map((r, i) => i === index ? { ...r, unit_num: num, unit_name: name } : r));
        }}
        min="1" max="16"
      />
    </td>
    <td className="px-4 py-3">
      <input
        type="text"
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        value={row.unit_name || ''}
        onChange={(e) => handleBulkRowChange(index, 'unit_name', e.target.value)}
        placeholder="اسم الوحدة"
      />
    </td>
    <td className="px-4 py-3">
      <input
        type="text"
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        value={row.pages || ''}
        onChange={(e) => handleBulkRowChange(index, 'pages', e.target.value)}
        placeholder="الصفحات"
      />
    </td>
    <td className="px-4 py-3">
      <input
        type="text"
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        value={row.url1 || ''}
        onChange={(e) => handleBulkRowChange(index, 'url1', e.target.value)}
        placeholder="الرابط"
      />
    </td>
    <td className="px-4 py-3">
      <button
        type="button"
        onClick={() => handleBulkRowChange(index, 'free', row.free === 1 ? 0 : 1)}
        title={row.free === 1 ? 'مجاني' : 'مدفوع'}
      >
        {row.free === 1 ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v1h2V7a5 5 0 00-5-5z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </td>
    <td className="px-4 py-3">
      <select
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        value={row.english || 0}
        onChange={(e) => handleBulkRowChange(index, 'english', parseInt(e.target.value))}
      >
        <option value={0}>عربي</option>
        <option value={1}>English</option>
      </select>
    </td>
    <td className="px-4 py-3">
      <button
        type="button"
        onClick={() => handleBulkRowChange(index, 'show1', row.show1 === 1 ? 0 : 1)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${row.show1 === 1 ? 'bg-green-500' : 'bg-red-400'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${row.show1 === 1 ? '-translate-x-6' : '-translate-x-1'}`} />
      </button>
    </td>
    <td className="px-4 py-3">
      <button
        onClick={() => handleBulkRowDelete(index)}
        className="text-red-500 hover:text-red-700"
        title="حذف الصف"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </td>
  </tr>
))}

                {/* Data rows */}
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 py-4">
                      {editingId === unit.id ? (
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={unit.unit_num}
                          onChange={(e) => handleInputChange(unit.id!, 'unit_num', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">#{unit.unit_num}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === unit.id ? (
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={unit.unit_name}
                          onChange={(e) => handleInputChange(unit.id!, 'unit_name', e.target.value)}
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-800">{unit.unit_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === unit.id ? (
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={unit.pages}
                          onChange={(e) => handleInputChange(unit.id!, 'pages', e.target.value)}
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{unit.pages || '-'}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === unit.id ? (
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={unit.url1}
                          onChange={(e) => handleInputChange(unit.id!, 'url1', e.target.value)}
                        />
                      ) : unit.url1 ? (
                        <a 
                          href={unit.url1} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline text-sm"
                        >
                          عرض الرابط
                        </a>
                      ) : (
                        <div className="text-sm text-gray-500">-</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === unit.id ? (
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={unit.free}
                          onChange={(e) => handleInputChange(unit.id!, 'free', parseInt(e.target.value))}
                        >
                          <option value={0}>لا</option>
                          <option value={1}>نعم</option>
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleFree(unit)}
                          title={unit.free === 1 ? 'مجاني - اضغط للتغيير' : 'مدفوع - اضغط للتغيير'}
                        >
                          {unit.free === 1 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v1h2V7a5 5 0 00-5-5z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      )}

                    </td>
                    <td className="px-4 py-4">
                      {editingId === unit.id ? (
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={unit.english}
                          onChange={(e) => handleInputChange(unit.id!, 'english', parseInt(e.target.value))}
                        >
                          <option value={0}>عربي</option>
                          <option value={1}>English</option>
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500">{unit.english ? 'English' : 'عربي'}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === unit.id ? (
                        <div className="flex items-center">
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-l text-xs font-medium ${
                              unit.show1 === 1 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => handleInputChange(unit.id!, 'show1', 1)}
                          >
                            عرض
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-r text-xs font-medium ${
                              unit.show1 === 0 
                                ? 'bg-red-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => handleInputChange(unit.id!, 'show1', 0)}
                          >
                            إخفاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleShow(unit)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${unit.show1 === 1 ? 'bg-green-500' : 'bg-red-400'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${unit.show1 === 1 ? '-translate-x-6' : '-translate-x-1'}`} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {editingId === unit.id ? (
                          <>
                            <button
                              onClick={() => handleUnitSave(unit)}
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
                              onClick={() => handleOpenEditModal(unit)}
                              className="text-yellow-600 hover:text-yellow-900 flex items-center justify-center text-xs p-2 border border-yellow-600 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.380-8.379-2.83-2.828z" />
                              </svg>
                              تعديل
                            </button>
                            <button
                              onClick={() => unit.id && handleUnitDelete(unit.id)}
                              className="text-red-600 hover:text-red-900 flex items-center justify-center text-xs p-2 border border-red-600 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              حذف
                            </button>
                            <button
                              onClick={() => handleViewQuizzes(unit.material_id, unit.unit_num)}
                              className="text-blue-600 hover:text-blue-900 flex items-center justify-center text-xs p-2 border border-blue-600 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                           <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                              </svg>
                              الأسئلة
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

          {/* Bulk add controls */}

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleAddBulkRow}
              className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              إضافة صف
            </button>
            {bulkRows.length > 0 && (
              <button
                onClick={handleSaveBulkRows}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                حفظ الكل ({bulkRows.length})
              </button>
            )}
          </div>
        </div>
        )}
        {selectedMaterial !== 'all' && selectedMaterial !== null && filteredUnits.length === 0 && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد وحدات</h3>
            <p className="mt-1 text-sm text-gray-500">
              ابدأ بإضافة وحدة جديدة من الصف الأول في الجدول
            </p>
          </div>
        )}

        {selectedMaterial === 'all' || selectedMaterial === null ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">اختر مادة لعرض وحداتها</h3>
            <p className="mt-1 text-sm text-gray-500">
              يرجى اختيار مادة من القائمة المنسدلة أعلاه
            </p>
          </div>
        ) : null}
      
{/* Add Unit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">إضافة وحدة جديدة</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={addUnitType}
                      onChange={(e) => {
                        const t = e.target.value as 'فصل' | 'وحدة';
                        setAddUnitType(t);
                        setNewUnit(prev => ({ ...prev, unit_name: generateUnitName(t, prev.unit_num || 1) }));
                      }}
                    >
                      <option value="وحدة">وحدة</option>
                      <option value="فصل">فصل</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">الرقم التسلسلي</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={newUnit.unit_num || 1}
                      min="1" max="16"
                      onChange={(e) => {
                        const num = parseInt(e.target.value) || 1;
                        setNewUnit(prev => ({ ...prev, unit_num: num, unit_name: generateUnitName(addUnitType, num) }));
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الوحدة</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={newUnit.unit_name || ''}
                    onChange={(e) => handleNewUnitChange('unit_name', e.target.value)}
                    placeholder="يُولَّد تلقائياً أو اكتب يدوياً"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الصفحات</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={newUnit.pages || ''}
                    onChange={(e) => handleNewUnitChange('pages', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرابط</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={newUnit.url1 || ''}
                    onChange={(e) => handleNewUnitChange('url1', e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={newUnit.english || 0}
                      onChange={(e) => handleNewUnitChange('english', parseInt(e.target.value))}
                    >
                      <option value={0}>عربي</option>
                      <option value={1}>English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">مجاني</label>
                    <button type="button" onClick={() => handleNewUnitChange('free', newUnit.free === 1 ? 0 : 1)}>
                      {newUnit.free === 1 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v1h2V7a5 5 0 00-5-5z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">مفعل</label>
                    <button
                      type="button"
                      onClick={() => handleNewUnitChange('show1', newUnit.show1 === 1 ? 0 : 1)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${newUnit.show1 === 1 ? 'bg-green-500' : 'bg-red-400'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${newUnit.show1 === 1 ? '-translate-x-6' : '-translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => { await handleUnitAdd(); setShowAddModal(false); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Unit Modal */}
        {showEditModal && editingUnit && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">تعديل الوحدة</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={editUnitType}
                      onChange={(e) => {
                        const t = e.target.value as 'فصل' | 'وحدة';
                        setEditUnitType(t);
                        setEditingUnit(prev => prev ? { ...prev, unit_name: generateUnitName(t, prev.unit_num) } : prev);
                      }}
                    >
                      <option value="وحدة">وحدة</option>
                      <option value="فصل">فصل</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">الرقم التسلسلي</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={editingUnit.unit_num}
                      min="1" max="16"
                      onChange={(e) => {
                        const num = parseInt(e.target.value) || 1;
                        setEditingUnit(prev => prev ? { ...prev, unit_num: num, unit_name: generateUnitName(editUnitType, num) } : prev);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الوحدة</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={editingUnit.unit_name}
                    onChange={(e) => setEditingUnit(prev => prev ? { ...prev, unit_name: e.target.value } : prev)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الصفحات</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={editingUnit.pages}
                    onChange={(e) => setEditingUnit(prev => prev ? { ...prev, pages: e.target.value } : prev)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرابط</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={editingUnit.url1}
                    onChange={(e) => setEditingUnit(prev => prev ? { ...prev, url1: e.target.value } : prev)}
                  />
                </div>
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={editingUnit.english}
                      onChange={(e) => setEditingUnit(prev => prev ? { ...prev, english: parseInt(e.target.value) } : prev)}
                    >
                      <option value={0}>عربي</option>
                      <option value={1}>English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">مجاني</label>
                    <button type="button" onClick={() => setEditingUnit(prev => prev ? { ...prev, free: prev.free === 1 ? 0 : 1 } : prev)}>
                      {editingUnit.free === 1 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v1h2V7a5 5 0 00-5-5z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">مفعل</label>
                    <button
                      type="button"
                      onClick={() => setEditingUnit(prev => prev ? { ...prev, show1: prev.show1 === 1 ? 0 : 1 } : prev)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${editingUnit.show1 === 1 ? 'bg-green-500' : 'bg-red-400'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${editingUnit.show1 === 1 ? '-translate-x-6' : '-translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleEditModalSave}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium"
                >
                  حفظ التعديل
                </button>
          </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




