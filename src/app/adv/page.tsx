
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

type AdvItem = {
  id?: number;
  title: string;
  description: string;
  image_path: string;
  note: string;
};

export default function AdvManagement() {
  const [data, setData] = useState<AdvItem[]>([]);
  const [editingItem, setEditingItem] = useState<AdvItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = '/api/proxy/cp_adv.php';
  const UPLOAD_URL = '/api/proxy/upload_adv.php';

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
        cache: 'no-store', // ⚠️ الحل السحري لـ Vercel
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        next: {
          tags: ['ads'] // إذا كنت ستستخدم revalidateTag لاحقاً
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

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!editingItem?.image_path.trim()) {
      errors.image = 'صورة الإعلان مطلوبة';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const timestamp = Date.now();
    const response = await fetch(`${UPLOAD_URL}?refresh=${timestamp}`, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في رفع الصورة');
    }

    const result = await response.json();
    return result.fileName;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setError('الرجاء اختيار ملف صورة فقط');
      return;
    }

    // التحقق من حجم الملف (5MB كحد أقصى)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 5MB');
      return;
    }

    try {
      setUploading(true);
      setFormErrors(prev => ({ ...prev, image: '' }));
      const fileName = await handleFileUpload(file);

      if (editingItem) {
        setEditingItem({
          ...editingItem,
          image_path: fileName
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;

    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_URL}?id=${id}&refresh=${timestamp}`, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // التحقق من صحة النموذج
    if (!validateForm()) {
      return;
    }

    try {
      const method = editingItem.id ? 'PUT' : 'POST';
      const url = editingItem.id ? `${API_URL}?id=${editingItem.id}` : API_URL;

      const timestamp = Date.now();
      const finalUrl = `${url}${url.includes('?') ? '&' : '?'}refresh=${timestamp}`;

      const response = await fetch(finalUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store',
        body: JSON.stringify(editingItem),
      });

      if (!response.ok) throw new Error('فشل في حفظ البيانات');

      setEditingItem(null);
      setFormErrors({});
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    }
  };

  const openEditForm = (item: AdvItem) => {
    setEditingItem({ ...item });
    setFormErrors({});
  };

  const openAddForm = () => {
    setEditingItem({ title: '', description: '', image_path: '', note: '' });
    setFormErrors({});
  };

  const removeImage = () => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        image_path: ''
      });
      setFormErrors(prev => ({ ...prev, image: 'صورة الإعلان مطلوبة' }));
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
          className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          إغلاق
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 bg-blue-100 text-blue-900 p-4 rounded-xl shadow-sm border border-blue-200">
  <h1 className="text-3xl font-bold">إدارة الإعلانات</h1>
          <button
            onClick={openAddForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة إعلان جديد
          </button>
        </div>

        {/* Modal for Add/Edit */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingItem.id ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      العنوان
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 placeholder-gray-400 transition-all text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      صورة الإعلان <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageChange}
                        className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900] ${formErrors.image ? 'border-red-500' : 'border-gray-200'}`}
                        required={!editingItem.image_path}
                      />
                      {formErrors.image && (
                        <p className="text-sm text-red-600">{formErrors.image}</p>
                      )}
                      {uploading && (
                        <div className="flex items-center text-blue-600">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          جاري رفع الصورة...
                        </div>
                      )}
                      {editingItem.image_path && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Image
                              src={`/api/proxy/img/adv/${editingItem.image_path}`}
                              alt="Preview"
                              width={48}
                              height={48}
                              className="h-12 w-12 object-cover rounded-md"
                              unoptimized={true}
                              loading="eager"
                            />
                            <span className="text-sm text-gray-600">{editingItem.image_path}</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="إزالة الصورة"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    الوصف
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 placeholder-gray-400 transition-all text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">ملاحظات</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 placeholder-gray-400 transition-all text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                    value={editingItem.note}
                    onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                  />
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="mr-3">
                      <p className="text-sm text-yellow-700">
                        <span className="font-medium">ملاحظة:</span> يجب إضافة صورة للإعلان.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !editingItem.image_path}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

{/* Mobile Cards — mobile only */}
<div className="md:hidden space-y-3">
  {data.map((item) => (
    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
      <div className="flex items-start gap-3 mb-3">
        {item.image_path && (
          <Image
            src={`/api/proxy/img/adv/${item.image_path}`}
            alt={item.title}
            width={64}
            height={64}
            className="h-16 w-16 object-cover rounded-xl flex-shrink-0"
            unoptimized={true}
            loading="eager"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="block text-sm font-bold text-gray-700 mb-1.5">العنوان</p>
          <p className="text-sm text-gray-900 font-medium">{item.title || '—'}</p>
        </div>
      </div>

      {item.description && (
        <div className="mb-3">
          <p className="block text-sm font-bold text-gray-700 mb-1.5">الوصف</p>
          <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
        </div>
      )}

      {item.note && (
        <div className="mb-3">
          <p className="block text-sm font-bold text-gray-700 mb-1.5">ملاحظات</p>
          <p className="text-sm text-gray-500">{item.note}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => openEditForm(item)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2 flex-1 justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          تعديل
        </button>
        <button
          onClick={() => item.id && handleDelete(item.id)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2 flex-1 justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          حذف
        </button>
      </div>
    </div>
  ))}
</div>

        {/* Data Table — desktop only */}
<div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800 w-20">الصورة</th>
<th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800 w-28">العنوان</th>
<th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800 w-64">الوصف</th>
<th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800 w-48">ملاحظات</th>
<th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800 w-36">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.image_path && (
                      <Image
                        src={`/api/proxy/img/adv/${item.image_path}`}
                        alt={item.title}
                        width={64}
                        height={64}
                        className="h-16 w-16 object-cover rounded-md"
                        unoptimized={true}
                        loading="eager"
                        priority={true}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="text-sm text-gray-500 line-clamp-2">{item.description}</div>
                  </td>
                  <td className="px-3 py-4 w-48">
  <div className="text-sm text-gray-500 truncate max-w-[180px]">{item.note}</div>
</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-left">
  <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEditForm(item)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        تعديل
                      </button>
                      <button
                        onClick={() => item.id && handleDelete(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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

        {data.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد إعلانات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة إعلان جديد بالنقر على الزر أعلاه</p>
          </div>
        )}
      </div>
    </div>
  );
}


