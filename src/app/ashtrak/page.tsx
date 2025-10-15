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
  const [error, setError] = useState('');

  const API_URL = 'http://alraskun.atwebpages.com/cp_ashtrak.php';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
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
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleAdd = async () => {
    if (!newItem.category_name.trim()) {
      alert('يرجى إدخال اسم الفئة');
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
    <div className="container mx-auto p-6 max-w-full">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة الإشتراكات</h1>
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
              {/* Add new row */}
              <tr className="bg-blue-50">
                <td className="px-3 py-4">
                  <input
                    type="number"
                    className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newItem.priority_order}
                    onChange={(e) => handleNewItemChange('priority_order', parseInt(e.target.value) || 0)}
                    placeholder="ترتيب"
                  />
                </td>
                <td className="px-3 py-4">
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newItem.category_name}
                    onChange={(e) => handleNewItemChange('category_name', e.target.value)}
                    placeholder="اسم الفئة"
                  />
                </td>
                <td className="px-3 py-4">
                  <input
                    type="text"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newItem.mokarar_price}
                    onChange={(e) => handleNewItemChange('mokarar_price', e.target.value)}
                    placeholder="ل.س"
                  />
                </td>
                <td className="px-3 py-4">
                  <input
                    type="text"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newItem.mokarar_dolar}
                    onChange={(e) => handleNewItemChange('mokarar_dolar', e.target.value)}
                    placeholder="دولار"
                  />
                </td>
                <td className="px-3 py-4">
                  <input
                    type="text"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newItem.quiz_price}
                    onChange={(e) => handleNewItemChange('quiz_price', e.target.value)}
                    placeholder="ل.س"
                  />
                </td>
                <td className="px-3 py-4">
                  <input
                    type="text"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newItem.quiz_dolar}
                    onChange={(e) => handleNewItemChange('quiz_dolar', e.target.value)}
                    placeholder="دولار"
                  />
                </td>
                <td className="px-3 py-4">
                  <input
                    type="text"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newItem.voice_price}
                    onChange={(e) => handleNewItemChange('voice_price', e.target.value)}
                    placeholder="ل.س"
                  />
                </td>
                <td className="px-3 py-4">
                  <input
                    type="text"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newItem.voice_dolar}
                    onChange={(e) => handleNewItemChange('voice_dolar', e.target.value)}
                    placeholder="دولار"
                  />
                </td>
                <td className="px-3 py-4">
                  <select
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={newItem.active ? '1' : '0'}
                    onChange={(e) => handleNewItemChange('active', e.target.value === '1')}
                  >
                    <option value="1">نعم</option>
                    <option value="0">لا</option>
                  </select>
                </td>
                
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={handleAdd}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition flex items-center text-xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    إضافة
                  </button>
                </td>
              </tr>

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
                      <select
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={item.active ? '1' : '0'}
                        onChange={(e) => handleInputChange(item.id!, 'active', e.target.value === '1')}
                      >
                        <option value="1">نعم</option>
                        <option value="0">لا</option>
                      </select>
                    ) : (
                      <div className="text-sm text-gray-900">{item.active ? 'نعم' : 'لا'}</div>
                    )}
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => handleSave(item)}
                            className="text-green-600 hover:text-green-900 flex items-center text-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            حفظ
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900 flex items-center text-xs"
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
                            className="text-yellow-600 hover:text-yellow-900 flex items-center text-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            تعديل
                          </button>
                          <button
                            onClick={() => item.id && handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 flex items-center text-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            حذف
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