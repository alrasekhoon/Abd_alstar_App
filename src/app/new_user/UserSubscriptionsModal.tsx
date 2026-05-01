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

// أنواع الاشتراك المتاحة
const SUBSCRIPTION_TYPES = ['مقرر', 'اسئلة', 'صوت'] as const;
type SubscriptionType = typeof SUBSCRIPTION_TYPES[number];

type MaterialOption = {
  id: number;
  material_name: string;
  material_code: string;
  unit_price: string;    // سعر المقرر
  quizall_price: string; // سعر الاسئلة
  voice_price: string;   // سعر الصوت
};

export default function UserSubscriptionsModal({
  isOpen,
  onClose,
  userId,
  userName
}: UserSubscriptionsModalProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  // حالة الإشعار السريع للإضافة
  const [quickNotification, setQuickNotification] = useState({
    isOpen: false,
    title: '',
    body: ''
  });

  // حالة النموذج الجديد
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

  // تحديث السعر تلقائياً عند تغيير المادة أو النوع
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

      // حالة حفظ اسم المادة والنوع لاستخدامها في الإشعار
      const savedMaterialName = newSubscription.materialName;
      const savedType = newSubscription.type1;

      // إعادة تحميل الاشتراكات
      await fetchSubscriptions();
      setShowAddForm(false);
      resetForm();
      setError('');

setQuickNotification({
  isOpen: true,
  title: 'إضافة اشتراك جديد',
  body: `عزيزي الطالب،\nتمت إضافة "${savedMaterialName}" إلى سلة مشترياتك بنجاح.\n• نوع الاشتراك: ${savedType}.\n• نوع الخدمة: \n• القيمة: \nمع خالص أمنياتنا لكم بالتفوق والنجاح.`
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

      // إعادة تحميل الاشتراكات
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
          subscription_id: id, // الـ PHP يتوقع subscription_id وليس id
          type1: newType
        })
      });

      const result = await response.json();

      if (result.success === false || result.status === 'error') {
        throw new Error(result.error || result.message || 'حدث خطأ أثناء التحديث');
      }

      // إعادة تحميل الاشتراكات
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* الهيدر */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">اشتراكات المستخدم</h2>
            <p className="text-gray-600 mt-1">
              {userName} - ID: {userId}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAddForm(true);
                fetchAvailableMaterials();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              إضافة اشتراك
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* نموذج الإضافة */}
        {showAddForm && (
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة اشتراك جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
                <input
                  type="text"
                  value={materialSearch || newSubscription.materialName}
                  onChange={(e) => {
                    setMaterialSearch(e.target.value);
                    if (newSubscription.materialid) {
                      setNewSubscription(prev => ({ ...prev, materialid: '', materialName: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ابحث عن مادة..."
                />
                {(materialSearch && !newSubscription.materialid) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isMaterialsLoading ? (
                      <div className="p-2 text-sm text-gray-500">جاري التحميل...</div>
                    ) : availableMaterials.filter(m =>
                      m.material_name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                      m.material_code.toLowerCase().includes(materialSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">لا توجد نتائج</div>
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
                          className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium">{material.material_name}</div>
                          <div className="text-xs text-gray-500">{material.material_code}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الاشتراك</label>
                <select
                  value={newSubscription.type1}
                  onChange={(e) => setNewSubscription({ ...newSubscription, type1: e.target.value as SubscriptionType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر النوع</option>
                  {SUBSCRIPTION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر (ل.س)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newSubscription.price1}
                  onChange={(e) => setNewSubscription({ ...newSubscription, price1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-blue-800"
                  placeholder="السعر بالليرة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر (دولار)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newSubscription.dolar}
                  onChange={(e) => setNewSubscription({ ...newSubscription, dolar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="السعر بالدولار"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddSubscription}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                حفظ
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* المحتوى */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            // حالة التحميل
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-lg font-medium text-gray-700">جاري تحميل الاشتراكات...</p>
              </div>
            </div>
          ) : error ? (
            // حالة الخطأ
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-red-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={fetchSubscriptions}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : subscriptions.length === 0 ? (
            // لا توجد اشتراكات
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">لا توجد اشتراكات</h3>
              <p className="text-gray-500 mt-1">لم يتم العثور على أي اشتراكات لهذا المستخدم</p>
            </div>
          ) : (
            // جدول الاشتراكات
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">المادة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">نوع الاشتراك</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">السعر (ل.س)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">السعر (دولار)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">تاريخ الإشتراك</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription, index) => (
                    <tr key={subscription.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{subscription.material_name}</div>
                        <div className="text-sm text-gray-500">ID: {subscription.materialid}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingSubscription?.id === subscription.id ? (
                          <select
                            value={editingSubscription.type1}
                            onChange={(e) => setEditingSubscription({
                              ...editingSubscription,
                              type1: e.target.value as SubscriptionType
                            })}
                            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            onBlur={() => handleUpdateSubscription(subscription.id, editingSubscription.type1 as SubscriptionType)}
                            autoFocus
                          >
                            {SUBSCRIPTION_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => setEditingSubscription(subscription)}
                          >
                            {subscription.type1 || '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(subscription.price1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDolar(subscription.dolar)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(subscription.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition"
                          title="حذف الاشتراك"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* إحصائيات */}
          {!isLoading && !error && subscriptions.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-blue-800">إجمالي المواد:</span>
                  <span className="font-bold text-blue-900 text-lg">{subscriptions.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-blue-800">إجمالي السعر (ل.س):</span>
                  <span className="font-bold text-blue-900 text-lg">
                    {formatPrice(subscriptions.reduce((total, sub) => {
                      const price = parseFloat(sub.price1) || 0;
                      return total + price;
                    }, 0).toString())}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-blue-800">إجمالي السعر (دولار):</span>
                  <span className="font-bold text-blue-900 text-lg">
                    {formatDolar(subscriptions.reduce((total, sub) => {
                      const dolar = parseFloat(sub.dolar) || 0;
                      return total + dolar;
                    }, 0).toString())}
                  </span>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* الفوتر */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            إغلاق
          </button>
        </div>
      </div>

      {quickNotification.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
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
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                تخطي / إلغاء
              </button>
              <button
                onClick={handleSendQuickNotification}
                disabled={isLoading || !quickNotification.title || !quickNotification.body}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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
