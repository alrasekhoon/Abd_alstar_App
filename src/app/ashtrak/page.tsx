
'use client';

import { useState, useEffect } from 'react';

type AshtrakItem = {
  id?: number;
  priority_order: number;
  category_name: string;
  mokarar_price: string;
  mokarar_dolar: string;
  quiz_price: string;
  quiz_dolar: string;
  voice_price: string;
  voice_dolar: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function AshtrakManagement() {
  const [data, setData] = useState<AshtrakItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<AshtrakItem>({
    priority_order: 0,
    category_name: '',
    mokarar_price: '',
    mokarar_dolar: '',
    quiz_price: '',
    quiz_dolar: '',
    voice_price: '',
    voice_dolar: '',
    active: true
  });
  const [isLoading, setIsLoading] = useState(true);
const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');

  // Notification Modal State
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [selectedAshtrakName, setSelectedAshtrakName] = useState('');
  const [selectedAshtrakId, setSelectedAshtrakId] = useState<number | null>(null);

  const API_URL = '/api/proxy/cp_ashtrak.php';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      
      if (!response.ok) throw new Error('فشل في جلب البيانات');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
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
      
      if (!response.ok) throw new Error('فشل في حذف العنصر');
      
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = async (item: AshtrakItem) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ التغييرات');
    }
  };

  const handleOpenNotificationModal = (item: AshtrakItem) => {
    setSelectedAshtrakId(item.id!);
    setSelectedAshtrakName(item.category_name);
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
      const response = await fetch('/api/proxy/cp_ashtrak.php?action=send_notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: selectedAshtrakId,
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

  const handleUpdateMaterials = async (id: number) => {
    if (!confirm('تنبيه: هل أنت متأكد أنك تريد تطبيق هذه الأسعار بشكل آلي على جميع المواد المرتبطة بهذه الفئة؟\nهذا الإجراء سيقوم بتحديث أسعار المواد المتطابقة ولا يمكن التراجع عنه.')) return;
    
    try {
      const timestamp = Date.now();
      const url = `${API_URL}?action=update_materials_prices&id=${id}&refresh=${timestamp}`;
      
      const response = await fetch(url, {
        method: 'POST',
        cache: 'no-store',
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'فشل في تحديث المواد');
      
      alert('تم تحديث أسعار المواد التابعة لهذه الفئة بنجاح');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    }
  };

  const handleAdd = async () => {
    if (!newItem.category_name.trim()) {
      alert('يرجى إدخال اسم الفئة');
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

      if (!response.ok) throw new Error('فشل في إضافة العنصر');

      setNewItem({
        priority_order: 0,
        category_name: '',
        mokarar_price: '',
        mokarar_dolar: '',
        quiz_price: '',
        quiz_dolar: '',
        voice_price: '',
        voice_dolar: '',
        active: true
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    fetchData(); // إعادة تحميل البيانات لاستعادة القيم الأصلية
  };
const handleToggleActive = async (item: AshtrakItem) => {
  const updated = { ...item, active: !item.active };
  handleInputChange(item.id!, 'active', !item.active);
  try {
    const url = `${API_URL}?id=${item.id}&refresh=${Date.now()}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!response.ok) throw new Error('فشل التحديث');
  } catch {
    handleInputChange(item.id!, 'active', item.active); // rollback
  }
};

  const handleInputChange = (id: number, field: string, value: string | number | boolean) => {
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleNewItemChange = (field: string, value: string | number | boolean) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
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
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-amber-50 rounded-t-lg">
              <h3 className="text-lg font-bold text-amber-800 flex items-center">
                إرسال إشعار لمشتركين: {selectedAshtrakName}
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
                سيتم إرسال الإشعار لجميع المشتركين النشطين في مواد الدورة: <span className="font-bold">{selectedAshtrakName}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الإشعار</label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="أدخل عنوان الإشعار"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص الإشعار</label>
                <textarea
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  placeholder="اكتب المحتوى هنا..."
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

{showAddModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
      <div className="flex justify-between items-center p-4 border-b bg-green-50 rounded-t-lg">
        <h3 className="text-lg font-bold text-green-800">إضافة إشتراك جديد</h3>
        <button onClick={() => setShowAddModal(false)} className="text-green-500 hover:bg-green-100 p-1 rounded-full transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">تسلسل</label>
          <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            value={newItem.priority_order} onChange={(e) => handleNewItemChange('priority_order', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفئة</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            value={newItem.category_name} onChange={(e) => handleNewItemChange('category_name', e.target.value)} placeholder="اسم الفئة" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">مقرار ل.س</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            value={newItem.mokarar_price} onChange={(e) => handleNewItemChange('mokarar_price', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">مقرار دولار</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            value={newItem.mokarar_dolar} onChange={(e) => handleNewItemChange('mokarar_dolar', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اختبار ل.س</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            value={newItem.quiz_price} onChange={(e) => handleNewItemChange('quiz_price', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اختبار دولار</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            value={newItem.quiz_dolar} onChange={(e) => handleNewItemChange('quiz_dolar', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">صوتي ل.س</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            value={newItem.voice_price} onChange={(e) => handleNewItemChange('voice_price', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">صوتي دولار</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            value={newItem.voice_dolar} onChange={(e) => handleNewItemChange('voice_dolar', e.target.value)} />
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <label className="text-sm font-medium text-gray-700">مفعل</label>
          <button type="button" onClick={() => handleNewItemChange('active', !newItem.active)}
            className={`relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${newItem.active ? 'bg-green-500' : 'bg-red-400'}`}>
            <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${newItem.active ? '-translate-x-1' : '-translate-x-6'}`} />
          </button>
        </div>
      </div>
      <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-lg">
        <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition">
          إلغاء
        </button>
        <button onClick={() => { handleAdd(); setShowAddModal(false); }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
          إضافة
        </button>
      </div>
    </div>
  </div>
)}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
  <h1 className="text-3xl font-bold text-gray-800">إدارة الإشتراكات</h1>
  <button
    onClick={() => setShowAddModal(true)}
    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
    إضافة إشتراك
  </button>
</div>


        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">تسلسل</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اسم الفئة</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">مقرار ل.س</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">مقرار دولار</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اختبار ل.س</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اختبار دولار</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">صوتي ل.س</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">صوتي دولار</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">مفعل</th>
                
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">

              {/* Data rows */}
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-3 py-4">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={item.priority_order}
                        onChange={(e) => handleInputChange(item.id!, 'priority_order', parseInt(e.target.value) || 0)}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{item.priority_order}</div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={item.category_name}
                        onChange={(e) => handleInputChange(item.id!, 'category_name', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{item.category_name}</div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={item.mokarar_price}
                        onChange={(e) => handleInputChange(item.id!, 'mokarar_price', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.mokarar_price}</div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={item.mokarar_dolar}
                        onChange={(e) => handleInputChange(item.id!, 'mokarar_dolar', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.mokarar_dolar}</div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={item.quiz_price}
                        onChange={(e) => handleInputChange(item.id!, 'quiz_price', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.quiz_price}</div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={item.quiz_dolar}
                        onChange={(e) => handleInputChange(item.id!, 'quiz_dolar', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.quiz_dolar}</div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={item.voice_price}
                        onChange={(e) => handleInputChange(item.id!, 'voice_price', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.voice_price}</div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={item.voice_dolar}
                        onChange={(e) => handleInputChange(item.id!, 'voice_dolar', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.voice_dolar}</div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === item.id ? (
                      <button
  type="button"
  onClick={() => handleInputChange(item.id!, 'active', !item.active)}
  className={`relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${item.active ? 'bg-green-500' : 'bg-red-400'}`}
>
  <span
    className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${item.active ? '-translate-x-1' : '-translate-x-6'}`}
  />
</button>
                   ) : (
  <button type="button" onClick={() => handleToggleActive(item)}
    className={`relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${item.active ? 'bg-green-500' : 'bg-red-400'}`}>
    <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${item.active ? '-translate-x-1' : '-translate-x-6'}`} />
  </button>
)}
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => handleSave(item)}
                            className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors"
                            title="حفظ"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                            title="إلغاء"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpdateMaterials(item.id!)}
                            className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200 transition-colors"
                            title="تعميم الأسعار على المواد"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(item.id!)}
                            className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                            title="تعديل"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id!)}
                            className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors"
                            title="حذف"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenNotificationModal(item)}
                            className="bg-amber-100 text-amber-700 p-2 rounded-lg hover:bg-amber-200 transition-colors"
                            title="إرسال إشعار للمشتركين"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
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

        {data.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد بيانات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة عنصر جديد من الصف الأول في الجدول</p>
          </div>
        )}
      </div>
    </div>
  );
}



