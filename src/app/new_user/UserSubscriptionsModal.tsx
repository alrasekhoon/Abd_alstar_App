'use client';

import { useState, useEffect, useCallback } from 'react';

type Subscription = {
  id: number;
  userid: number;
  materialid: number;
  material_name: string;
  type1: string;
  price1: string;
  dolar: string;
  created_at: string;
};

type UserSubscriptionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
};

const SUBSCRIPTION_TYPES = ['مقرر', 'اسئلة', 'صوت'] as const;
type SubscriptionType = typeof SUBSCRIPTION_TYPES[number];

type MaterialOption = {
  id: number;
  material_name: string;
  material_code: string;
  unit_price: string;
  quizall_price: string;
  voice_price: string;
};

export default function UserSubscriptionsModal({
  isOpen,
  onClose,
  userId,
  userName
}: UserSubscriptionsModalProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [deletedSubscriptions, setDeletedSubscriptions] = useState<Subscription[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const [quickNotification, setQuickNotification] = useState({
    isOpen: false,
    title: '',
    body: ''
  });

  const [newSubscription, setNewSubscription] = useState({
    materialid: '',
    materialName: '',
    type1: '' as SubscriptionType | '',
    price1: '',
    dolar: '0'
  });

  const [availableMaterials, setAvailableMaterials] = useState<MaterialOption[]>([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');

  const API_URL = '/api/proxy/cp_user_subscriptions.php';

  useEffect(() => {
    if (isOpen && userId) {
      fetchSubscriptions();
      fetchAvailableMaterials();
    }
  }, [isOpen, userId]);

  const fetchAvailableMaterials = async () => {
    try {
      setIsMaterialsLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/proxy/cp_material.php?refresh=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store' as RequestCache
      });

      if (!response.ok) throw new Error('فشل في جلب المواد');
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setAvailableMaterials(result.data);
      } else if (Array.isArray(result.data)) {
        setAvailableMaterials(result.data);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setIsMaterialsLoading(false);
    }
  };

  useEffect(() => {
    if (newSubscription.materialid && newSubscription.type1) {
      const material = availableMaterials.find(m => m.id === parseInt(newSubscription.materialid));
      if (material) {
        let price = '0';
        switch (newSubscription.type1) {
          case 'مقرر':
            price = material.unit_price || '0';
            break;
          case 'اسئلة':
            price = material.quizall_price || '0';
            break;
          case 'صوت':
            price = material.voice_price || '0';
            break;
        }
        setNewSubscription(prev => ({ ...prev, price1: price }));
      }
    }
  }, [newSubscription.materialid, newSubscription.type1, availableMaterials]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const timestamp = new Date().getTime();
      const response = await fetch(`${API_URL}?user_id=${userId}&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store' as RequestCache
      });

      if (!response.ok) {
        throw new Error(`فشل في جلب البيانات: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'حدث خطأ غير متوقع');
      }

      setSubscriptions(result.subscriptions || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleAddSubscription = async () => {
    try {
      if (!newSubscription.materialid || !newSubscription.type1) {
        setError('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const timestamp = Date.now();
      const response = await fetch(`/api/proxy/add_subscribe.php?refresh=${timestamp}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          userid: userId,
          materialid: parseInt(newSubscription.materialid),
          type: newSubscription.type1,
          price: parseFloat(newSubscription.price1) || 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'حدث خطأ أثناء الإضافة');
      }

      const result = await response.json();

      if (result.status === 'error') {
        throw new Error(result.message || 'حدث خطأ أثناء الإضافة');
      }

      const savedMaterialName = newSubscription.materialName;
      const savedType = newSubscription.type1;

      await fetchSubscriptions();
      setShowAddForm(false);
      resetForm();
      setError('');

      setQuickNotification({
        isOpen: true,
        title: 'إضافة اشتراك جديد',
        body: `عزيزي الطالب،\nتمت إضافة "${savedMaterialName}" إلى سلة مشترياتك بنجاح.\n• نوع الاشتراك: ${savedType}.\nمع خالص أمنياتنا لكم بالتفوق والنجاح.`
      });

    } catch (err) {
      console.error('Error adding subscription:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) {
      return;
    }

    const subToDelete = subscriptions.find(sub => sub.id === id);

    try {
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store' as RequestCache,
        body: JSON.stringify({ id })
      });

      const result = await response.json();

      if (result.success === false || result.status === 'error') {
        throw new Error(result.error || result.message || 'حدث خطأ أثناء الحذف');
      }

      if (subToDelete) {
        setDeletedSubscriptions(prev => [...prev, subToDelete]);
      }

      await fetchSubscriptions();
      setError('');

    } catch (err) {
      console.error('Error deleting subscription:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleUpdateSubscription = async (id: number, newType: SubscriptionType) => {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store' as RequestCache,
        body: JSON.stringify({
          subscription_id: id,
          type1: newType
        })
      });

      const result = await response.json();

      if (result.success === false || result.status === 'error') {
        throw new Error(result.error || result.message || 'حدث خطأ أثناء التحديث');
      }

      await fetchSubscriptions();
      setEditingSubscription(null);
      setError('');

    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleSendQuickNotification = async () => {
    try {
      setError('');
      setIsLoading(true);
      const response = await fetch('/api/proxy/cp_notifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: quickNotification.title,
          body: quickNotification.body,
          url1: '',
          note1: ''
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('تم إرسال الإشعار للطالب بنجاح!');
        setQuickNotification({ isOpen: false, title: '', body: '' });
      } else {
        throw new Error(result.error || 'فشل في إرسال الإشعار');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء الإرسال');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewSubscription({
      materialid: '',
      materialName: '',
      type1: '',
      price1: '',
      dolar: '0'
    });
    setMaterialSearch('');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return '-';
    try {
      const priceNum = parseFloat(price);
      return new Intl.NumberFormat('ar-SY', {
        style: 'currency',
        currency: 'SYP'
      }).format(priceNum);
    } catch {
      return price;
    }
  };

  const formatDolar = (dolar: string) => {
    if (!dolar) return '-';
    try {
      const dolarNum = parseFloat(dolar);
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'USD'
      }).format(dolarNum);
    } catch {
      return dolar;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      {/* التعتيم الخاص بالنافذة الأساسية */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col">
        
        {/* الهيدر */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 flex-wrap gap-4 rounded-t-xl shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">اشتراكات المستخدم</h2>
            <p className="text-gray-600 mt-1 font-medium">
              {userName} - ID: {userId}
            </p>
          </div>

          {/* الإحصائيات العلوية */}
          {!isLoading && !error && subscriptions.length > 0 && (
            <div className="flex gap-4 bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm text-sm">
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-500 uppercase text-xs">المواد</span>
                <span className="font-extrabold text-gray-900 text-lg">{subscriptions.length}</span>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-500 uppercase text-xs">الإجمالي (ل.س)</span>
                <span className="font-extrabold text-green-600 text-lg">
                  {formatPrice(subscriptions.reduce((total, sub) => total + (parseFloat(sub.price1) || 0), 0).toString())}
                </span>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-500 uppercase text-xs">الإجمالي ($)</span>
                <span className="font-extrabold text-blue-600 text-lg">
                  {formatDolar(subscriptions.reduce((total, sub) => total + (parseFloat(sub.dolar) || 0), 0).toString())}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              سجل المحذوفات
              {deletedSubscriptions.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">{deletedSubscriptions.length}</span>
              )}
            </button>
            <button
              onClick={() => {
                setShowAddForm(true);
                fetchAvailableMaterials();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              إضافة اشتراك
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-200 transition border border-transparent hover:border-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* محتوى النافذة (قابل للتمرير) */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* نموذج الإضافة */}
          {showAddForm && (
            <div className="mb-6 p-6 border border-blue-200 rounded-xl bg-blue-50/50 shadow-sm">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
                تفاصيل الاشتراك الجديد
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-1">المادة</label>
                  <input
                    type="text"
                    value={materialSearch || newSubscription.materialName}
                    onChange={(e) => {
                      setMaterialSearch(e.target.value);
                      if (newSubscription.materialid) {
                        setNewSubscription(prev => ({ ...prev, materialid: '', materialName: '' }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    placeholder="ابحث عن مادة..."
                  />
                  {(materialSearch && !newSubscription.materialid) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isMaterialsLoading ? (
                        <div className="p-2 text-sm text-gray-500 font-medium">جاري التحميل...</div>
                      ) : availableMaterials.filter(m =>
                        m.material_name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                        m.material_code.toLowerCase().includes(materialSearch.toLowerCase())
                      ).length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 font-medium">لا توجد نتائج</div>
                      ) : (
                        availableMaterials.filter(m =>
                          m.material_name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                          m.material_code.toLowerCase().includes(materialSearch.toLowerCase())
                        ).slice(0, 10).map(material => (
                          <div
                            key={material.id}
                            onClick={() => {
                              setNewSubscription({
                                ...newSubscription,
                                materialid: material.id.toString(),
                                materialName: material.material_name
                              });
                              setMaterialSearch(material.material_name);
                            }}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition"
                          >
                            <div className="font-bold text-sm text-gray-800">{material.material_name}</div>
                            <div className="text-xs text-gray-500 font-medium mt-0.5">{material.material_code}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">نوع الاشتراك</label>
                  <select
                    value={newSubscription.type1}
                    onChange={(e) => setNewSubscription({ ...newSubscription, type1: e.target.value as SubscriptionType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="">اختر النوع</option>
                    {SUBSCRIPTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">السعر (ل.س)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSubscription.price1}
                    onChange={(e) => setNewSubscription({ ...newSubscription, price1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-extrabold text-blue-800"
                    placeholder="السعر بالليرة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">السعر (دولار)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSubscription.dolar}
                    onChange={(e) => setNewSubscription({ ...newSubscription, dolar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-extrabold text-blue-800"
                    placeholder="السعر بالدولار"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleAddSubscription}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
                >
                  حفظ الاشتراك
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition shadow-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* محتوى الاشتراكات */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-lg font-bold text-gray-700">جاري تحميل الاشتراكات...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm">
              <div className="text-red-600 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-800 font-bold text-lg mb-4">{error}</p>
              <button
                onClick={fetchSubscriptions}
                className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-700 transition shadow-sm"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-extrabold text-gray-800">لا توجد اشتراكات</h3>
              <p className="text-gray-500 mt-2 font-medium">لم يتم العثور على أي اشتراكات فعالة لهذا المستخدم</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
              <table className="w-full text-right divide-y divide-gray-200 table-auto">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800 w-12">#</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">المادة</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">نوع الاشتراك</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">السعر (ل.س)</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">السعر (دولار)</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">التاريخ</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription, index) => (
                    <tr key={subscription.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-extrabold text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-gray-900">{subscription.material_name}</div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">ID: {subscription.materialid}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {editingSubscription?.id === subscription.id ? (
                          <select
                            value={editingSubscription.type1}
                            onChange={(e) => setEditingSubscription({
                              ...editingSubscription,
                              type1: e.target.value as SubscriptionType
                            })}
                            className="px-2 py-1.5 text-xs font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            onBlur={() => handleUpdateSubscription(subscription.id, editingSubscription.type1 as SubscriptionType)}
                            autoFocus
                          >
                            {SUBSCRIPTION_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="cursor-pointer text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition inline-block min-w-[70px] text-center border border-blue-100"
                            onClick={() => setEditingSubscription(subscription)}
                          >
                            {subscription.type1 || '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-extrabold text-green-600">
                        {formatPrice(subscription.price1)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-extrabold text-blue-600">
                        {formatDolar(subscription.dolar)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-600">
                        {formatDate(subscription.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="text-red-500 hover:text-white border border-red-500 hover:bg-red-500 px-3 py-1.5 rounded-lg transition shadow-sm flex items-center justify-center gap-1"
                          title="حذف الاشتراك"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* الفوتر */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 shadow-sm transition"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* الدرج الجانبي للمحذوفات (Side Drawer) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-red-900 tracking-tight">سجل المحذوفات</h3>
              <p className="text-xs font-bold text-red-600 mt-1">الاشتراكات المحذوفة للقراءة فقط</p>
            </div>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="bg-white text-gray-500 hover:text-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">تصفية حسب الفصل (ميزة مستقبلية)</label>
          <select 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-red-200 outline-none transition shadow-sm cursor-pointer"
          >
            <option value="">جميع الفصول</option>
            <option value="F23">F23 (خريف 2023)</option>
            <option value="S24">S24 (ربيع 2024)</option>
            <option value="F24">F24 (خريف 2024)</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {deletedSubscriptions.length === 0 ? (
            <div className="text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <p className="text-gray-500 font-bold">سجل المحذوفات فارغ</p>
            </div>
          ) : (
            deletedSubscriptions.map((subscription, index) => (
              <div key={`del-${subscription.id}-${index}`} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-red-400"></div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 line-through decoration-red-400 decoration-2">{subscription.material_name}</h4>
                    <span className="text-xs font-medium text-gray-400 mt-1 inline-block">كود المادة: {subscription.materialid}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg border border-gray-200">
                    {subscription.type1 || '-'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">السعر (ل.س)</span>
                    <span className="text-sm font-extrabold text-gray-600">{formatPrice(subscription.price1)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">تاريخ الاشتراك</span>
                    <span className="text-sm font-bold text-gray-600">{formatDate(subscription.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* تعتيم الخلفية للدرج الجانبي */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[65] transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}

      {quickNotification.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[80]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative z-10">
            <h3 className="text-xl font-bold text-gray-800 mb-4">إرسال إشعار للطالب</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الإشعار</label>
                <input
                  type="text"
                  value={quickNotification.title}
                  onChange={(e) => setQuickNotification(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الإشعار</label>
                <textarea
                  value={quickNotification.body}
                  onChange={(e) => setQuickNotification(prev => ({ ...prev, body: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3 gap-2">
              <button
                onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold"
              >
                تخطي / إلغاء
              </button>
              <button
                onClick={handleSendQuickNotification}
                disabled={isLoading || !quickNotification.title || !quickNotification.body}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-bold"
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
