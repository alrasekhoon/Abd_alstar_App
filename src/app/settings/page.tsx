'use client';

import { useState, useEffect } from 'react';

type Settings = {
  ashtrak2: string;
  ashtrak3: string;
  ashtrak4: string;
  whatsapp_uuid: string;
  whatsapp_api: string;
  print_show: number;
  homework_show: number;
  uni_show: number;
  link_show: number;
  calc_show: number;
  version: string;
  version_url: string;
  max_offline_date: number;
  max_location_update: number;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    ashtrak2: '',
    ashtrak3: '',
    ashtrak4: '',
    whatsapp_uuid: '',
    whatsapp_api: '',
    print_show: 0,
    homework_show: 0,
    uni_show: 0,
    link_show: 0,
    calc_show: 0,
    version: '',
    version_url: '',
    max_offline_date: 0,
    max_location_update: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = '/api/proxy/cp_settings.php';

  // جلب الإعدادات عند تحميل الصفحة
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
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
      
      if (!response.ok) throw new Error('فشل في جلب الإعدادات');
      const result = await response.json();
      setSettings(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    
    let processedValue: string | number = value;
    
    if (type === 'checkbox') {
      processedValue = checked ? 1 : 0;
    } else if (type === 'number') {
      processedValue = value === '' ? 0 : Number(value);
    }
    
    setSettings(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // تصحيح: تأكد من صحة البيانات قبل الإرسال
      console.log('بيانات الإعدادات المرسلة:', settings);
      
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
        body: JSON.stringify(settings),
      });
      
      const responseData = await response.json();
      console.log('استجابة الخادم:', responseData);
      
      if (!response.ok) throw new Error('فشل في حفظ الإعدادات');
      
      setIsEditing(false);
      fetchSettings(); // إعادة تحميل الإعدادات للتأكد من الحفظ
    } catch (err) {
      console.error('خطأ في الحفظ:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsLoading(false);
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
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">الإعدادات العامة</h1>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              تعديل الإعدادات
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchSettings();
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* قسم حسم الاشتراكات */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات حسم الاشتراكات</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="ashtrak2" className="block text-sm font-medium text-gray-700 mb-1">
                    حسم اشتراكين%
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="ashtrak2"
                      name="ashtrak2"
                      value={settings.ashtrak2}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">
                      {settings.ashtrak2 || 'لا يوجد قيمة'}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="ashtrak3" className="block text-sm font-medium text-gray-700 mb-1">
                    حسم 3 اشتراكات%    
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="ashtrak3"
                      name="ashtrak3"
                      value={settings.ashtrak3}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">
                      {settings.ashtrak3 || 'لا يوجد قيمة'}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="ashtrak4" className="block text-sm font-medium text-gray-700 mb-1">
                    حسم 4 اشتراكات%
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="ashtrak4"
                      name="ashtrak4"
                      value={settings.ashtrak4}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">
                      {settings.ashtrak4 || 'لا يوجد قيمة'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* قسم إعدادات الواتساب */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات الواتساب</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="whatsapp_uuid" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp UUID
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="whatsapp_uuid"
                      name="whatsapp_uuid"
                      value={settings.whatsapp_uuid}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="أدخل معرف الواتساب"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">
                      {settings.whatsapp_uuid || 'لا يوجد قيمة'}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="whatsapp_api" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp API
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="whatsapp_api"
                      name="whatsapp_api"
                      value={settings.whatsapp_api}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="أدخل رابط API الواتساب"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">
                      {settings.whatsapp_api || 'لا يوجد قيمة'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* قسم إعدادات العرض */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات العرض</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex items-center">
                  {isEditing ? (
                    <input
                      type="checkbox"
                      id="print_show"
                      name="print_show"
                      checked={settings.print_show === 1}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  ) : (
                    <div className={`h-4 w-4 rounded border ${settings.print_show === 1 ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-300'}`}></div>
                  )}
                  <label htmlFor="print_show" className="mr-2 block text-sm font-medium text-gray-700">
                  زر تفعيل
                  </label>
                </div>

                <div className="flex items-center">
                  {isEditing ? (
                    <input
                      type="checkbox"
                      id="homework_show"
                      name="homework_show"
                      checked={settings.homework_show === 1}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  ) : (
                    <div className={`h-4 w-4 rounded border ${settings.homework_show === 1 ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-300'}`}></div>
                  )}
                  <label htmlFor="homework_show" className="mr-2 block text-sm font-medium text-gray-700">
                    تفعيل وظائف الفصل
                  </label>
                </div>

                <div className="flex items-center">
                  {isEditing ? (
                    <input
                      type="checkbox"
                      id="uni_show"
                      name="uni_show"
                      checked={settings.uni_show === 1}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  ) : (
                    <div className={`h-4 w-4 rounded border ${settings.uni_show === 1 ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-300'}`}></div>
                  )}
                  <label htmlFor="uni_show" className="mr-2 block text-sm font-medium text-gray-700">
                    تفعيل مواد الجامعة
                  </label>
                </div>

                <div className="flex items-center">
                  {isEditing ? (
                    <input
                      type="checkbox"
                      id="link_show"
                      name="link_show"
                      checked={settings.link_show === 1}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  ) : (
                    <div className={`h-4 w-4 rounded border ${settings.link_show === 1 ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-300'}`}></div>
                  )}
                  <label htmlFor="link_show" className="mr-2 block text-sm font-medium text-gray-700">
                    تفعيل روابط جامعية
                  </label>
                </div>

                <div className="flex items-center">
                  {isEditing ? (
                    <input
                      type="checkbox"
                      id="calc_show"
                      name="calc_show"
                      checked={settings.calc_show === 1}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  ) : (
                    <div className={`h-4 w-4 rounded border ${settings.calc_show === 1 ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-300'}`}></div>
                  )}
                  <label htmlFor="calc_show" className="mr-2 block text-sm font-medium text-gray-700">
                    تفعيل الألة الحاسبة
                  </label>
                </div>
              </div>
            </div>

            {/* قسم إعدادات التطبيق */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات التطبيق</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الإصدار
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="version"
                      name="version"
                      value={settings.version}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="مثال: 1.0.0"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">
                      {settings.version || 'لا يوجد قيمة'}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="version_url" className="block text-sm font-medium text-gray-700 mb-1">
                    رابط التحديث
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="version_url"
                      name="version_url"
                      value={settings.version_url}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="رابط تحميل الإصدار الجديد"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">
                      {settings.version_url || 'لا يوجد قيمة'}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="max_offline_date" className="block text-sm font-medium text-gray-700 mb-1">
                    أقصى مدة للعمل بدون إنترنت (أيام)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      id="max_offline_date"
                      name="max_offline_date"
                      value={settings.max_offline_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">
                      {settings.max_offline_date || '0'} يوم
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="max_location_update" className="block text-sm font-medium text-gray-700 mb-1">
                    أقصى مدة لتحديث الموقع (ايام)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      id="max_location_update"
                      name="max_location_update"
                      value={settings.max_location_update}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">
                      {settings.max_location_update || '0'} يوم
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}