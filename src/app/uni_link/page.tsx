'use client';

import { useState, useEffect } from 'react';

type UniLink = {
  id: number;
  url_name: string;
  url: string;
  show1: number;
};

export default function UniLinksPage() {
  const [links, setLinks] = useState<UniLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<UniLink | null>(null);
  const [formData, setFormData] = useState({
    url_name: '',
    url: '',
    show1: 1
  });

  const API_URL = '/api/proxy/cp_uni_links.php';

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('فشل في جلب البيانات');
      const result = await response.json();
      setLinks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked ? 1 : 0 : value
    }));
  };

  const openAddModal = () => {
    setEditingLink(null);
    setFormData({
      url_name: '',
      url: '',
      show1: 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (link: UniLink) => {
    setEditingLink(link);
    setFormData({
      url_name: link.url_name,
      url: link.url,
      show1: link.show1
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const url = editingLink 
        ? `${API_URL}?id=${editingLink.id}`
        : API_URL;

      const response = await fetch(url, {
        method: editingLink ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('فشل في حفظ البيانات');
      
      closeModal();
      fetchLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف البيانات');
      
      fetchLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShow = async (id: number, currentShow: number) => {
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ show1: currentShow === 1 ? 0 : 1 }),
      });
      
      if (!response.ok) throw new Error('فشل في تحديث الحالة');
      
      fetchLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    }
  };

  if (isLoading && links.length === 0) return (
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
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* إدارة الروابط الجامعية */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">إدارة الروابط الجامعية</h1>
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة رابط جديد
          </button>
        </div>

        {/* جدول البيانات */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">اسم الرابط</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الرابط</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {links.map((link, index) => (
                <tr key={link.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{link.url_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm truncate block max-w-xs"
                      title={link.url}
                    >
                      {link.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => toggleShow(link.id, link.show1)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        link.show1 === 1 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {link.show1 === 1 ? 'مفعل' : 'معطل'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(link)}
                        className="text-yellow-600 hover:text-yellow-900 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
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

        {links.length === 0 && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد روابط</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة رابط جديد بالنقر على الزر أعلاه</p>
          </div>
        )}
      </div>

      {/* Modal للإضافة والتعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingLink ? 'تعديل الرابط' : 'إضافة رابط جديد'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الرابط *</label>
                <input
                  type="text"
                  name="url_name"
                  value={formData.url_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="أدخل اسم الرابط"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرابط *</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show1"
                  name="show1"
                  checked={formData.show1 === 1}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    show1: e.target.checked ? 1 : 0
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show1" className="mr-2 block text-sm font-medium text-gray-700">
                  تفعيل الرابط
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {isLoading ? 'جاري الحفظ...' : (editingLink ? 'تحديث' : 'إضافة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}