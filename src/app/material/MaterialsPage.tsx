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
  // الحقول الجديدة
  page_count: number;
  active: number;
  mokarar_active: number;
  quiz_active: number;
  voice_active: number;
};

type CategoryItem = {
  id: number;
  category_name: string;
  // الحقول الجديدة للأسعار الافتراضية
  mokarar_price: string;
  quiz_price: string;
  voice_price: string;
};

// تعريف نوع محدد لمعاملات onNavigate
type NavigateParams = {
  materialId: number;
};

interface MaterialsPageProps {
  onNavigate: (page: 'units' | 'quizzes', params?: NavigateParams) => void;
}

export default function MaterialsPage({ onNavigate }: MaterialsPageProps) {
  const [data, setData] = useState<MaterialItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filteredData, setFilteredData] = useState<MaterialItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState<Partial<MaterialItem>>({
    category_id: 0,
    material_name: '',
    material_code: '',
    description: '',
    year1: 1,
    unit_price: '',
    quizall_price: '',
    quiz_price: '',
    voice_price: '',
    // القيم الافتراضية للحقول الجديدة
    page_count: 0,
    active: 1,
    mokarar_active: 1,
    quiz_active: 1,
    voice_active: 1
  });

  const API_URL = '/api/proxy/cp_material.php';
  const CATEGORY_API_URL = '/api/proxy/cp_ashtrak.php';

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  useEffect(() => {
    let result = data;
    
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category_id === selectedCategory);
    }
    
    if (selectedYear !== 'all') {
      result = result.filter(item => item.year1 === selectedYear);
    }
    
    setFilteredData(result);
  }, [selectedCategory, selectedYear, data]);

  // دالة للحصول على الأسعار الافتراضية من الفئة المحددة
  const getDefaultPricesFromCategory = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      return {
        quizall_price: category.mokarar_price || '',
        quiz_price: category.quiz_price || '',
        voice_price: category.voice_price || ''
      };
    }
    return {
      quizall_price: '',
      quiz_price: '',
      voice_price: ''
    };
  };

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
      const response = await fetch(CATEGORY_API_URL);
      if (!response.ok) throw new Error('فشل في جلب الفئات');
      const result = await response.json();
      setCategories(result);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الفئات');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف المادة');
      
      fetchData();
      alert('تم حذف المادة بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
      alert('حدث خطأ أثناء حذف المادة');
    }
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = async (item: MaterialItem) => {
    try {
      const method = 'PUT';
      const url = `${API_URL}?id=${item.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) throw new Error('فشل في حفظ البيانات');

      setEditingId(null);
      fetchData();
      alert('تم حفظ البيانات بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleAdd = async () => {
    if (!newItem.material_name || !newItem.material_code) {
      alert('يرجى إدخال اسم المادة وكود المادة');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) throw new Error('فشل في إضافة المادة');

      setNewItem({
        category_id: 0,
        material_name: '',
        material_code: '',
        description: '',
        year1: 1,
        unit_price: '',
        quizall_price: '',
        quiz_price: '',
        voice_price: '',
        page_count: 0,
        active: 1,
        mokarar_active: 1,
        quiz_active: 1,
        voice_active: 1
      });
      fetchData();
      alert('تم إضافة المادة بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة');
      alert('حدث خطأ أثناء إضافة المادة');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    fetchData();
  };

  const handleInputChange = (id: number, field: string, value: string | number) => {
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleNewItemChange = (field: string, value: string | number) => {
    setNewItem(prev => {
      const updatedItem = { ...prev, [field]: value };
      
      // إذا تم تغيير الفئة، قم بتحديث الأسعار الافتراضية تلقائياً
      if (field === 'category_id' && value !== 0) {
        const defaultPrices = getDefaultPricesFromCategory(Number(value));
        return {
          ...updatedItem,
          quizall_price: defaultPrices.quizall_price,
          quiz_price: defaultPrices.quiz_price,
          voice_price: defaultPrices.voice_price
        };
      }
      
      return updatedItem;
    });
  };

  const handleViewUnits = (materialId: number) => {
    onNavigate('units', { materialId });
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
        <button 
          onClick={() => setError('')}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          المحاولة مرة أخرى
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* العنوان وقوائم التصفية في سطر واحد */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-800">إدارة المواد</h1>
            
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
                <option value="1">السنة الأولى</option>
                <option value="2">السنة الثانية</option>
                <option value="3">السنة الثالثة</option>
                <option value="4">السنة الرابعة</option>
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
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">المادة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">التصنيف</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الأسعار</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Add new row */}
              <tr className="bg-blue-50">
                 <td className="px-4 py-4">
    <div className="space-y-3">
      {/* كود المادة */}
      <div className="flex items-center gap-3">
        <label className="w-10 text-sm text-gray-700">كود المادة:</label>
        <input
          type="text"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          value={newItem.material_code || ''}
          onChange={(e) => handleNewItemChange('material_code', e.target.value)}
        />
      </div>

      {/* اسم المادة */}
      <div className="flex items-center gap-3">
        <label className="w-10 text-sm text-gray-700">اسم المادة:</label>
        <input
          type="text"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          value={newItem.material_name || ''}
          onChange={(e) => handleNewItemChange('material_name', e.target.value)}
        />
      </div>
    </div>
  </td>
                <td className="px-4 py-4">
  <div className="space-y-3">
    {/* الفئة */}
    <div className="flex items-center gap-3">
      <label className="w-10 text-sm text-gray-700">الفئة:</label>
      <select
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        value={newItem.category_id || 0}
        onChange={(e) => handleNewItemChange('category_id', parseInt(e.target.value))}
      >
        <option value="0">اختر الفئة</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>{category.category_name}</option>
        ))}
      </select>
    </div>

    {/* السنة */}
    <div className="flex items-center gap-3">
      <label className="w-10 text-sm text-gray-700">السنة:</label>
      <select
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        value={newItem.year1 || 1}
        onChange={(e) => handleNewItemChange('year1', parseInt(e.target.value))}
      >
        <option value="1">السنة 1</option>
        <option value="2">السنة 2</option>
        <option value="3">السنة 3</option>
        <option value="4">السنة 4</option>
      </select>
    </div>

    {/* عدد الصفحات */}
    <div className="flex items-center gap-3">
      <label className="w-10 text-sm text-gray-700">الصفحات:</label>
      <input
        type="number"
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        value={newItem.page_count || 0}
        onChange={(e) => handleNewItemChange('page_count', parseInt(e.target.value) || 0)}
      />
    </div>
  </div>
</td>

                <td className="px-4 py-4">
  <div className="space-y-3">
    {/* سعر الوحدة */}
    <div className="flex items-center gap-3">
      <label className="w-10 text-sm text-gray-700">الوحدة:</label>
      <input
        type="text"
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        value={newItem.unit_price || ''}
        onChange={(e) => handleNewItemChange('unit_price', e.target.value)}
      />
    </div>

    {/* سعر المقرر */}
    <div className="flex items-center gap-3">
      <label className="w-10 text-sm text-gray-700">المقرر:</label>
      <input
        type="text"
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        value={newItem.quizall_price || ''}
        onChange={(e) => handleNewItemChange('quizall_price', e.target.value)}
      />
    </div>

    {/* سعر الكويز */}
    <div className="flex items-center gap-3">
      <label className="w-10 text-sm text-gray-700">الكويز:</label>
      <input
        type="text"
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        value={newItem.quiz_price || ''}
        onChange={(e) => handleNewItemChange('quiz_price', e.target.value)}
      />
    </div>

    {/* سعر الصوت */}
    <div className="flex items-center gap-3">
      <label className="w-10 text-sm text-gray-700">الصوت:</label>
      <input
        type="text"
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        value={newItem.voice_price || ''}
        onChange={(e) => handleNewItemChange('voice_price', e.target.value)}
      />
    </div>
  </div>
</td>

                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">نشط:</span>
                      <select
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        value={newItem.active || 1}
                        onChange={(e) => handleNewItemChange('active', parseInt(e.target.value))}
                      >
                        <option value={1}>نعم</option>
                        <option value={0}>لا</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">مقرر:</span>
                      <select
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        value={newItem.mokarar_active || 1}
                        onChange={(e) => handleNewItemChange('mokarar_active', parseInt(e.target.value))}
                      >
                        <option value={1}>نعم</option>
                        <option value={0}>لا</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">كويز:</span>
                      <select
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        value={newItem.quiz_active || 1}
                        onChange={(e) => handleNewItemChange('quiz_active', parseInt(e.target.value))}
                      >
                        <option value={1}>نعم</option>
                        <option value={0}>لا</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">صوت</span>
                      <select
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        value={newItem.voice_active || 1}
                        onChange={(e) => handleNewItemChange('voice_active', parseInt(e.target.value))}
                      >
                        <option value={1}>نعم</option>
                        <option value={0}>لا</option>
                      </select>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-lg font-medium">
                  <button
                    onClick={handleAdd}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition flex items-center justify-center text-xs w-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    إضافة
                  </button>
                </td>
              </tr>

              {/* Data rows */}
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  {/* معلومات المادة */}
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={item.material_code}
                          onChange={(e) => handleInputChange(item.id!, 'material_code', e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={item.material_name}
                          onChange={(e) => handleInputChange(item.id!, 'material_name', e.target.value)}
                        />
                        <textarea
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={item.description}
                          onChange={(e) => handleInputChange(item.id!, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.material_code}</div>
                        <div className="text-sm font-semibold text-gray-800">{item.material_name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</div>
                      </div>
                    )}
                  </td>
                  
                  {/* التصنيف والمعلومات الأساسية */}
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={item.category_id}
                          onChange={(e) => handleInputChange(item.id!, 'category_id', parseInt(e.target.value))}
                        >
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.category_name}</option>
                          ))}
                        </select>
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={item.year1}
                          onChange={(e) => handleInputChange(item.id!, 'year1', parseInt(e.target.value))}
                        >
                          <option value="1">السنة 1</option>
                          <option value="2">السنة 2</option>
                          <option value="3">السنة 3</option>
                          <option value="4">السنة 4</option>
                        </select>
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={item.page_count}
                          onChange={(e) => handleInputChange(item.id!, 'page_count', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">الفئة:</span> {item.category_name}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">السنة:</span> {item.year1}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">الصفحات:</span> {item.page_count}
                        </div>
                      </div>
                    )}
                  </td>
                  
                  {/* الأسعار */}
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">الوحدة:</span>
                          <input
                            type="text"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.unit_price}
                            onChange={(e) => handleInputChange(item.id!, 'unit_price', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">المقرر:</span>
                          <input
                            type="text"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.quizall_price}
                            onChange={(e) => handleInputChange(item.id!, 'quizall_price', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">الكويز:</span>
                          <input
                            type="text"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.quiz_price}
                            onChange={(e) => handleInputChange(item.id!, 'quiz_price', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">الصوت:</span>
                          <input
                            type="text"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.voice_price}
                            onChange={(e) => handleInputChange(item.id!, 'voice_price', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">الوحدة:</span> {item.unit_price}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">المقرر:</span> {item.quizall_price}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">الكويز:</span> {item.quiz_price}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">الصوت:</span> {item.voice_price}
                        </div>
                      </div>
                    )}
                  </td>
                  
                  {/* الحالة */}
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">نشط:</span>
                          <select
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.active}
                            onChange={(e) => handleInputChange(item.id!, 'active', parseInt(e.target.value))}
                          >
                            <option value={1}>نعم</option>
                            <option value={0}>لا</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">مقرر:</span>
                          <select
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.mokarar_active}
                            onChange={(e) => handleInputChange(item.id!, 'mokarar_active', parseInt(e.target.value))}
                          >
                            <option value={1}>نعم</option>
                            <option value={0}>لا</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">كويز:</span>
                          <select
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.quiz_active}
                            onChange={(e) => handleInputChange(item.id!, 'quiz_active', parseInt(e.target.value))}
                          >
                            <option value={1}>نعم</option>
                            <option value={0}>لا</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">صوت:</span>
                          <select
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.voice_active}
                            onChange={(e) => handleInputChange(item.id!, 'voice_active', parseInt(e.target.value))}
                          >
                            <option value={1}>نعم</option>
                            <option value={0}>لا</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">نشط:</span> {item.active ? 'نعم' : 'لا'}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">مقرر:</span> {item.mokarar_active ? 'نعم' : 'لا'}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">كويز:</span> {item.quiz_active ? 'نعم' : 'لا'}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">صوت:</span> {item.voice_active ? 'نعم' : 'لا'}
                        </div>
                      </div>
                    )}
                  </td>
                  
                  {/* الإجراءات */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => handleSave(item)}
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
                        <>
                          <button
                            onClick={() => handleEdit(item.id!)}
                            className="text-yellow-600 hover:text-yellow-900 flex items-center justify-center text-xs p-2 border border-yellow-600 rounded"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            تعديل
                          </button>
                          <button
                            onClick={() => item.id && handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 flex items-center justify-center text-xs p-2 border border-red-600 rounded"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            حذف
                          </button>
                          <button
                            onClick={() => item.id && handleViewUnits(item.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-center text-xs p-2 border border-blue-600 rounded"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                              <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                            </svg>
                            الوحدات
                          </button>
                        </>
                      )}
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد مواد</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedCategory === 'all' && selectedYear === 'all'
                ? 'ابدأ بإضافة مادة جديدة من الصف الأول في الجدول' 
                : 'لا توجد مواد تطابق معايير التصفية المحددة'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}