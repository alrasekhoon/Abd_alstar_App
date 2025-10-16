'use client';

import { useState, useEffect } from 'react';

type NotificationItem = {
  id?: number;
  title: string;
  body: string;
  url1: string;
  ashtrak: string | null;
  note1: string | null;
  user_type: string;
};

type Subscription = {
  id: number;
  category_name: string;
};

// تعريف نوع للبيانات القادمة من API
type ApiNotificationItem = {
  id?: number;
  title?: string | null;
  body?: string | null;
  url1?: string | null;
  ashtrak?: string | null;
  note1?: string | null;
  user_type?: string | null;
};

export default function NotificationManagement() {
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [editingItem, setEditingItem] = useState<NotificationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | 'all'>('all');

  // قائمة أنواع المستخدم الثابتة
  const userTypes = [
    { value: 'الكل', label: 'الكل' },
    { value: 'غير موثوق', label: 'غير موثوق' },
    { value: 'موثوق', label: 'موثوق' },
    { value: 'vip', label: 'VIP' }
  ];

  const API_URL = '/api/proxy/cp_notif.php';

  useEffect(() => {
    fetchData();
    fetchSubscriptions();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // جلب الإشعارات
      const response = await fetch(`${API_URL}?action=get_notifications`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب الإشعارات: ${response.status}`);
      }
      
      const data: ApiNotificationItem[] = await response.json();
      // تنظيف البيانات من القيم null
      const cleanedData: NotificationItem[] = data.map((item: ApiNotificationItem) => ({
        id: item.id,
        title: item.title || '',
        body: item.body || '',
        url1: item.url1 || '',
        ashtrak: item.ashtrak || null,
        note1: item.note1 || null,
        user_type: item.user_type || userTypes[0].value
      }));
      setNotificationItems(cleanedData);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`${API_URL}?action=get_subscriptions`);
      if (!response.ok) {
        throw new Error('فشل في جلب الاشتراكات');
      }
      const data: Subscription[] = await response.json();
      setSubscriptions(data);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('حدث خطأ في جلب قائمة الاشتراكات');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?action=delete_notification&id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف الإشعار');
      
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const method = editingItem.id ? 'PUT' : 'POST';
      const action = editingItem.id ? 'update_notification' : 'add_notification';
      const url = `${API_URL}?action=${action}${editingItem.id ? `&id=${editingItem.id}` : ''}`;

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

  const openAddForm = () => {
    setEditingItem({ 
      title: '', 
      body: '', 
      url1: '', 
      ashtrak: '0', // القيمة الافتراضية الآن هي "0" (الكل)
      note1: null, 
      user_type: userTypes[0].value
    });
  };

  const openEditForm = (item: NotificationItem) => {
    setEditingItem({ 
      ...item,
      title: item.title || '',
      body: item.body || '',
      url1: item.url1 || '',
      ashtrak: item.ashtrak || '0', // القيمة الافتراضية الآن هي "0" (الكل)
      note1: item.note1 || null,
      user_type: item.user_type || userTypes[0].value
    });
  };

  const filteredItems = notificationItems.filter(item => {
    if (!item) return false;
    return selectedTypeFilter === 'all' || item.user_type === selectedTypeFilter;
  });

  // Extract unique user types for filter
  const uniqueUserTypes = Array.from(new Set(notificationItems
    .filter(item => item && item.user_type)
    .map(item => item.user_type)
  ));

  // دالة مساعدة لعرض النص بأمان
  const safeSubstring = (text: string | null | undefined, length: number = 50): string => {
    if (!text) return 'لا يوجد محتوى';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  // دالة للحصول على اسم الاشتراك من الـ ID
  const getSubscriptionName = (ashtrakId: string | null): string => {
    if (!ashtrakId) return 'لا يوجد';
    if (ashtrakId === '0') return 'الكل';
    
    const subscription = subscriptions.find(sub => sub.id.toString() === ashtrakId);
    return subscription ? subscription.category_name : 'اشتراك غير معروف';
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
      {/* إدارة الإشعارات */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">إدارة الإشعارات</h1>
          <button
            onClick={openAddForm}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow hover:from-green-600 hover:to-green-700 transition duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة إشعار جديد
          </button>
        </div>

        {/* فلترة الإشعارات */}
        <div className="mb-6">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">تصفية حسب نوع المستخدم</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
            >
              <option value="all">جميع الأنواع</option>
              {uniqueUserTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal for Add/Edit Notification */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingItem.id ? 'تعديل الإشعار' : 'إضافة إشعار جديد'}
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
              
              <form onSubmit={handleSubmitItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع المستخدم</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      value={editingItem.user_type}
                      onChange={(e) => setEditingItem({...editingItem, user_type: e.target.value})}
                      required
                    >
                      {userTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    value={editingItem.body}
                    onChange={(e) => setEditingItem({...editingItem, body: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رابط URL</label>
                    <input
                      type="url"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      value={editingItem.url1}
                      onChange={(e) => setEditingItem({...editingItem, url1: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاشتراك</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      value={editingItem.ashtrak || '0'}
                      onChange={(e) => setEditingItem({...editingItem, ashtrak: e.target.value})}
                    >
                      <option value="0">الكل</option>
                      {subscriptions.map(sub => (
                        <option key={sub.id} value={sub.id.toString()}>
                          {sub.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    value={editingItem.note1 || ''}
                    onChange={(e) => setEditingItem({...editingItem, note1: e.target.value || null})}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    حفظ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notifications Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">العنوان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">نوع المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الرابط</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الاشتراك</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الملاحظات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {item.title || 'بدون عنوان'}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {safeSubstring(item.body, 50)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.user_type === 'vip' ? 'bg-purple-100 text-purple-800' :
                      item.user_type === 'موثوق' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.user_type || 'غير محدد'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.url1 ? (
                      <a href={item.url1} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:text-blue-900 truncate max-w-xs block">
                        {safeSubstring(item.url1, 30)}
                      </a>
                    ) : (
                      'لا يوجد'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getSubscriptionName(item.ashtrak)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {safeSubstring(item.note1, 30)}
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
                        onClick={() => item.id && handleDeleteItem(item.id)}
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

        {filteredItems.length === 0 && notificationItems.length > 0 && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد إشعارات مطابقة للفلتر</h3>
            <p className="mt-1 text-sm text-gray-500">جرب تغيير خيارات التصفية أو أضف إشعارًا جديدًا</p>
          </div>
        )}

        {notificationItems.length === 0 && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد إشعارات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة إشعار جديد بالنقر على الزر أعلاه</p>
          </div>
        )}
      </div>
    </div>
  );
}