//UserNotificationsModal
'use client';

import { useState, useEffect } from 'react';

type Notification = {
  id: number;
  title: string;
  body: string;
  url1: string;
  user_id: number;
  note1: string;
};

type UserNotificationsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
};

export default function UserNotificationsModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName 
}: UserNotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  // بيانات النموذج الجديد
  const [newNotification, setNewNotification] = useState({
    title: '',
    body: '',
    url1: '',
    note1: ''
  });

  const API_URL = '/api/proxy/cp_notifications.php';

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('فشل في جلب الإشعارات');
      }

      const result = await response.json();
      
      if (result.success) {
        setNotifications(result.notifications || []);
      } else {
        throw new Error(result.error || 'فشل في جلب الإشعارات');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNotification = async () => {
    try {
      setError('');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newNotification,
          user_id: userId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsAddModalOpen(false);
        setNewNotification({ title: '', body: '', url1: '', note1: '' });
        fetchNotifications(); // إعادة تحميل الإشعارات
      } else {
        throw new Error(result.error || 'فشل في إضافة الإشعار');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة');
    }
  };

  const handleEditNotification = async () => {
    if (!editingNotification) return;

    try {
      setError('');
      
      const response = await fetch(`${API_URL}?id=${editingNotification.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingNotification.title,
          body: editingNotification.body,
          url1: editingNotification.url1,
          note1: editingNotification.note1
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setEditingNotification(null);
        fetchNotifications(); // إعادة تحميل الإشعارات
      } else {
        throw new Error(result.error || 'فشل في تعديل الإشعار');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التعديل');
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;

    try {
      setError('');
      
      const response = await fetch(`${API_URL}?id=${notificationId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        fetchNotifications(); // إعادة تحميل الإشعارات
      } else {
        throw new Error(result.error || 'فشل في حذف الإشعار');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">إشعارات المستخدم</h2>
            <p className="text-gray-600 mt-1">{userName} - ID: {userId}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة إشعار جديد
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-lg font-medium">لا توجد إشعارات</p>
              <p className="text-sm">لم يتم العثور على أي إشعارات لهذا المستخدم</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-800">
                      {notification.title}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingNotification(notification)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="تعديل"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="حذف"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3 whitespace-pre-wrap">{notification.body}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                    {notification.url1 && (
                      <div>
                        <span className="font-medium">الرابط:</span>
                        <a href={notification.url1} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mr-2">
                          {notification.url1}
                        </a>
                      </div>
                    )}
                    {notification.note1 && (
                      <div>
                        <span className="font-medium">ملاحظة:</span>
                        <span className="mr-2">{notification.note1}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Notification Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">إضافة إشعار جديد</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل عنوان الإشعار"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى</label>
                  <textarea
                    value={newNotification.body}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, body: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل محتوى الإشعار"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرابط (اختياري)</label>
                  <input
                    type="text"
                    value={newNotification.url1}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, url1: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل الرابط"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة (اختياري)</label>
                  <input
                    type="text"
                    value={newNotification.note1}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, note1: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل ملاحظة"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddNotification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Notification Modal */}
        {editingNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">تعديل الإشعار</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                  <input
                    type="text"
                    value={editingNotification.title}
                    onChange={(e) => setEditingNotification(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى</label>
                  <textarea
                    value={editingNotification.body}
                    onChange={(e) => setEditingNotification(prev => prev ? { ...prev, body: e.target.value } : null)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرابط</label>
                  <input
                    type="text"
                    value={editingNotification.url1}
                    onChange={(e) => setEditingNotification(prev => prev ? { ...prev, url1: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة</label>
                  <input
                    type="text"
                    value={editingNotification.note1}
                    onChange={(e) => setEditingNotification(prev => prev ? { ...prev, note1: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingNotification(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleEditNotification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}