

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
  
  // Subscribers Modal State
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
const [showAddModal, setShowAddModal] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isSubscribersLoading, setIsSubscribersLoading] = useState(false);
  const [selectedMaterialName, setSelectedMaterialName] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [searchSubscribersQuery, setSearchSubscribersQuery] = useState('');

  // Notification Modal State
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);

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

      const timestamp = Date.now();
      const url = `${API_URL}?refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store', // ⚠️ الحل السحري لـ Vercel
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        next: {
          tags: ['materials'] // إذا كنت ستستخدم revalidateTag لاحقاً
        }
      });

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
      const timestamp = Date.now();
      const url = `${CATEGORY_API_URL}?refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store', // ⚠️ الحل السحري لـ Vercel
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        next: {
          tags: ['categories'] // إذا كنت ستستخدم revalidateTag لاحقاً
        }
      });

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
      const timestamp = Date.now();
      const url = `${API_URL}?id=${id}&refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
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
      const timestamp = Date.now();
      const url = `${API_URL}?id=${item.id}&refresh=${timestamp}`;

      const response = await fetch(url, {
        method,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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
      const timestamp = Date.now();
      const url = `${API_URL}?refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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
      setShowAddModal(false);
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

  const handleViewSubscribers = async (item: MaterialItem) => {
    setSelectedMaterialName(item.material_name);
    setSelectedMaterialId(item.id!);
    setSearchSubscribersQuery('');
    setShowSubscribersModal(true);
    setIsSubscribersLoading(true);
    try {
      const response = await fetch(`/api/proxy/cp_material_subscribers.php?material_id=${item.id}&refresh=${Date.now()}`);
      if (!response.ok) throw new Error('فشل في جلب البيانات من الخادم');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'فشل في جلب المشتركين');
      setSubscribers(data.subscribers || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsSubscribersLoading(false);
    }
  };

  const handleDeleteAllSubscribers = async () => {
    if (!selectedMaterialId) return;
    if (!window.confirm('تحذير نهائي: سيتم حذف جميع المشتركين بهذه المادة نهائياً ولا يمكن التراجع! هل أنت متأكد من الاستمرار؟')) return;

    try {
      const response = await fetch(`/api/proxy/cp_material_subscribers.php?action=delete_all&material_id=${selectedMaterialId}`, {
        method: 'DELETE',
        cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'فشل في حذف المشتركين');
      
      alert(data.message || 'تم حذف جميع المشتركين بنجاح');
      setSubscribers([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleDeleteSubscriber = async (subId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف اشتراك هذا المستخدم؟')) return;

    try {
      const response = await fetch(`/api/proxy/cp_material_subscribers.php?action=delete_single&sub_id=${subId}`, {
        method: 'DELETE',
        cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'فشل الحذف');
      
      setSubscribers(prev => prev.filter(s => s.sub_id !== subId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const filteredSubscribers = subscribers.filter(sub => 
    (sub.name && sub.name.toLowerCase().includes(searchSubscribersQuery.toLowerCase())) ||
    (sub.phone && sub.phone.includes(searchSubscribersQuery))
  );

  const handleOpenNotificationModal = (item: MaterialItem) => {
    setSelectedMaterialId(item.id!);
    setSelectedMaterialName(item.material_name);
    setNotificationTitle('');
    setNotificationBody('');
    setShowNotificationModal(true);
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      alert('الرجاء إدخال عنوان ونص الإشعار');
      return;
    }
    
    setIsSendingNotification(true);
    try {
      const response = await fetch('/api/proxy/cp_material_subscribers.php?action=send_notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: selectedMaterialId,
          title: notificationTitle,
          body: notificationBody
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'فشل إرسال الإشعار');
      
      alert(`نجاح: ${data.message}`);
      setShowNotificationModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsSendingNotification(false);
    }
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
      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-amber-50">
              <h3 className="text-lg font-bold text-amber-800 flex items-center">
                إرسال إشعار لمشتركي المادة
              </h3>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-amber-500 hover:bg-amber-100 p-1 rounded-full transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4">
                سيتم إرسال الإشعار لجميع المشتركين النشطين في مادة: <span className="font-bold">{selectedMaterialName}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الإشعار</label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="أدخل عنواناً جذاباً"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص الإشعار</label>
                <textarea
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  placeholder="اكتب المحتوى الذي ترغب بإرساله للطلاب..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                ></textarea>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-lg">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendNotification}
                disabled={isSendingNotification}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition flex items-center"
              >
                {isSendingNotification ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    إرسال الإشعار
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

{/* Add Material Modal */}
{showAddModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-5 border-b bg-green-50 rounded-t-xl">
        <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          إضافة مادة جديدة
        </h3>
        <button
          onClick={() => setShowAddModal(false)}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>{/* End Modal Header */}

      {/* Modal Body */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto max-h-[70vh]">
        {/* كود المادة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">كود المادة <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
            value={newItem.material_code || ''}
            onChange={(e) => handleNewItemChange('material_code', e.target.value)}
          />
        </div>

        {/* اسم المادة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم المادة <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
            value={newItem.material_name || ''}
            onChange={(e) => handleNewItemChange('material_name', e.target.value)}
          />
        </div>

        {/* الفئة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عدد الصفحات</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
            value={newItem.page_count || 0}
            onChange={(e) => handleNewItemChange('page_count', parseInt(e.target.value) || 0)}
          />
        </div>

        {/* سعر المقرر */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">سعر المقرر</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
            value={newItem.unit_price || ''}
            onChange={(e) => handleNewItemChange('unit_price', e.target.value)}
          />
        </div>

        {/* سعر أسئلة تدريبية */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">سعر أسئلة تدريبية</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
            value={newItem.quizall_price || ''}
            onChange={(e) => handleNewItemChange('quizall_price', e.target.value)}
          />
        </div>

        {/* سعر ملغى */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">سعر ملغى</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
            value={newItem.quiz_price || ''}
            onChange={(e) => handleNewItemChange('quiz_price', e.target.value)}
          />
        </div>

        {/* سعر الصوت */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">سعر الصوت</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
            value={newItem.voice_price || ''}
            onChange={(e) => handleNewItemChange('voice_price', e.target.value)}
          />
        </div>

        {/* أزرار الحالة */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">الحالة</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'نشط', field: 'active' },
              { label: 'مقرر', field: 'mokarar_active' },
              { label: 'كويز', field: 'quiz_active' },
              { label: 'صوت', field: 'voice_active' },
            ].map(({ label, field }) => (
              <div key={field} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <span className="text-sm text-gray-700">{label}</span>
                <button
                  type="button"
                  onClick={() => handleNewItemChange(field, (newItem as any)[field] === 1 ? 0 : 1)}
                  className={`relative inline-flex h-6 w-11 overflow-hidden items-center rounded-full transition-colors duration-200 focus:outline-none ${
          (item as any)[field] === 1 ? 'bg-green-500' : 'bg-red-400'
        }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      (newItem as any)[field] === 1 ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>{/* End Modal Body */}

      {/* Modal Footer */}
      <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
        <button
          onClick={() => setShowAddModal(false)}
          className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm"
        >
          إلغاء
        </button>
        <button
          onClick={() => { handleAdd(); setShowAddModal(false); }}
          className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          إضافة المادة
        </button>
      </div>{/* End Modal Footer */}
    </div>
  </div>
)}
{/* End Add Material Modal */}


      {/* Subscribers Modal */}
      {showSubscribersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                المشتركون في المادة: <span className="text-blue-600 mr-2">{selectedMaterialName}</span>
                <span className="bg-gray-200 text-gray-700 text-sm py-1 px-2 rounded-full mr-3">
                  {subscribers.length} مشترك
                </span>
              </h3>
              <div className="flex items-center gap-3">
                {subscribers.length > 0 && !isSubscribersLoading && (
                  <button
                    onClick={handleDeleteAllSubscribers}
                    className="flex items-center bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded transition text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    حذف جميع المشتركين
                  </button>
                )}
                <button
                  onClick={() => setShowSubscribersModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Search Input */}
            <div className="p-4 border-b bg-white border-gray-100 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن مشترك بالاسم أو رقم الهاتف..."
                  value={searchSubscribersQuery}
                  onChange={(e) => setSearchSubscribersQuery(e.target.value)}
                  className="w-full px-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  dir="rtl"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-right" dir="rtl">
              {isSubscribersLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredSubscribers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدينة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع الاشتراك</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ المدفوع</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الاشتراك</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSubscribers.map((sub) => (
                        <tr key={sub.sub_id} className="hover:bg-gray-50 group">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{sub.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600" dir="ltr">{sub.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{sub.city || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs whitespace-nowrap">
                              {sub.type1 == '1' ? 'مقرر' : sub.type1 == '2' ? 'أسئلة' : sub.type1 == '3' ? 'باقات' : sub.type1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600 font-bold whitespace-nowrap">{sub.price1}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap" dir="ltr">{new Date(sub.created_at).toLocaleDateString('ar-EG')}</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.sub_id)}
                              className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center"
                              title="حذف المشترك"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : subscribers.length > 0 ? (
                <div className="text-center p-8 text-gray-500">لا يوجد متطابق في نتائج البحث</div>
              ) : (
                <div className="text-center p-8 text-gray-500">لا يوجد مشتركون في هذه المادة حالياً</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* العنوان وقوائم التصفية في سطر واحد */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-800">إدارة المواد</h1>
<button
  onClick={() => setShowAddModal(true)}
  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium shadow"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
  إضافة مادة جديدة
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
                          <span className="text-xs text-gray-600 w-16">المقرر:</span>
                          <input
                            type="text"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.unit_price}
                            onChange={(e) => handleInputChange(item.id!, 'unit_price', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">اسئلة تدريبية:</span>
                          <input
                            type="text"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={item.quizall_price}
                            onChange={(e) => handleInputChange(item.id!, 'quizall_price', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">ملغى:</span>
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
                          <span className="font-medium">المقرر:</span> {item.unit_price}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">اسئلة تدريبية:</span> {item.quizall_price}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">الصوت:</span> {item.voice_price}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">ملغى:</span> {item.quiz_price}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* الحالة */}
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <div className="space-y-3">
  {[
    { label: 'نشط', field: 'active' },
    { label: 'مقرر', field: 'mokarar_active' },
    { label: 'كويز', field: 'quiz_active' },
    { label: 'صوت', field: 'voice_active' },
  ].map(({ label, field }) => (
    <div key={field} className="flex items-center gap-2">
      <span className="text-xs text-gray-600">{label}:</span>
      <button
        type="button"
        onClick={async () => {
          const newVal = (item as any)[field] === 1 ? 0 : 1;
          handleInputChange(item.id!, field, newVal);
          try {
            const url = `${API_URL}?id=${item.id}&refresh=${Date.now()}`;
            await fetch(url, {
              method: 'PUT',
              cache: 'no-store',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...item, [field]: newVal }),
            });
          } catch (err) {
            console.error('Toggle save error:', err);
          }
        }}
        className={`relative inline-flex h-6 w-11 overflow-hidden items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    (newItem as any)[field] === 1 ? 'bg-green-500' : 'bg-red-400'
                  }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            (item as any)[field] === 1 ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  ))}
</div>
                    ) : (
                      <div className="space-y-3">
                        {[
                          { label: 'نشط', field: 'active' },
                          { label: 'مقرر', field: 'mokarar_active' },
                          { label: 'كويز', field: 'quiz_active' },
                          { label: 'صوت', field: 'voice_active' },
                        ].map(({ label, field }) => (
                          <div key={field} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-600">{label}:</span>
                            <button
                              type="button"
                              onClick={async () => {
                                const newVal = (item as any)[field] === 1 ? 0 : 1;
                                handleInputChange(item.id!, field, newVal);
                                try {
                                  await fetch(`${API_URL}?id=${item.id}&refresh=${Date.now()}`, {
                                    method: 'PUT',
                                    cache: 'no-store',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...item, [field]: newVal }),
                                  });
                                } catch (err) {
                                  console.error('Toggle save error:', err);
                                }
                              }}
                             className={`relative inline-flex h-6 w-11 flex-shrink-0 overflow-hidden items-center rounded-full transition-colors duration-200 focus:outline-none ${(item as any)[field] === 1 ? 'bg-green-500' : 'bg-red-400'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${(item as any)[field] === 1 ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        ))}
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
                            onClick={() => item.id && handleViewSubscribers(item)}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-center text-xs p-2 border border-blue-600 rounded"
                            title="عرض المستخدمين المشتركين بالمادة"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            المشتركون
                          </button>
                          <button
                            onClick={() => item.id && handleOpenNotificationModal(item)}
                            className="text-amber-600 hover:text-amber-900 flex items-center justify-center text-xs p-2 border border-amber-600 rounded"
                            title="إرسال إشعار لمشتركي هذه المادة"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                            إشعار
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



