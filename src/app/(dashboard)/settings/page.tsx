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
  const [activeTab, setActiveTab] = useState<'general' | 'database'>('general');

  // Database Manager States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tableToTruncate, setTableToTruncate] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isTruncating, setIsTruncating] = useState(false);

  const ALL_TABLES = [
    'adv', 'ashtrak', 'chat_messages', 'cp_roles', 'cp_users', 
    'home_work', 'home_work_title', 'last_updates', 'material', 'mony', 
    'orders', 'quiz_form', 'rseed', 'ser_chi', 'Tbill', 'Tbill_detlis', 
    'Tchat', 'Tdelv', 'Tnews', 'Tnotif', 'Tprint', 'Tquiz', 'Tquiz_parent', 
    'Tser', 'Tsetting', 'Tsubscribe', 'Tunits', 'Tuni_link', 'Tvoice', 
    'uni_material', 'users'
  ];
  const NO_EXPORT_TABLES = ['users', 'cp_users', 'cp_roles'];

  const API_URL = '/api/proxy/cp_settings.php';
  const DB_API_URL = '/api/proxy/cp_database_manager.php';

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

  const handleExport = (tableName: string) => {
    // Open in new window to force download
    window.open(`${DB_API_URL}?action=export&table=${tableName}`, '_blank');
  };

  const confirmTruncate = (tableName: string) => {
    setTableToTruncate(tableName);
    setConfirmText('');
    setShowConfirmModal(true);
  };

  const executeTruncate = async () => {
    if (confirmText !== tableToTruncate) {
      alert('اسم الجدول غير مطابق!');
      return;
    }

    try {
      setIsTruncating(true);
      const response = await fetch(`${DB_API_URL}?action=truncate&table=${tableToTruncate}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل في عملية التفريغ');
      }

      alert(`نجاح: ${data.message}`);
      setShowConfirmModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء التفريغ');
    } finally {
      setIsTruncating(false);
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
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 rtl:space-x-reverse" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('general')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            الإعدادات العامة
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'database'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            إدارة قواعد البيانات (الجداول)
          </button>
        </nav>
      </div>

      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">الإعدادات العـامة</h1>
          
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
      )}

      {activeTab === 'database' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">إدارة الجداول وقواعد البيانات</h2>
            <p className="text-sm text-gray-500">
              يمكنك من خلال هذه المنصة تصدير البيانات إلى ملفات Excel/CSV. 
              <br/>
              <span className="text-red-500 font-bold">تحذير: </span> استخدام زر التفريغ سيؤدي لضياع شامل لجميع سجلات الجدول. لا يمكن التراجع عن هذه الخطوة أبدًا.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_TABLES.map((tableName) => {
              const cantExport = NO_EXPORT_TABLES.includes(tableName);
              return (
                <div key={tableName} className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                    </svg>
                    <span className="font-bold font-mono text-gray-700">{tableName}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport(tableName)}
                      disabled={cantExport}
                      title={cantExport ? "غير مسموح أمنياً بتصدير هذا الجدول" : "تصدير بصيغة CSV"}
                      className={`flex-1 flex justify-center items-center gap-1 px-2 py-2 text-sm rounded ${
                        cantExport 
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      تصدير
                    </button>
                    
                    <button
                      onClick={() => confirmTruncate(tableName)}
                      className="flex-1 flex justify-center items-center gap-1 px-2 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-sm transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      إفراغ البيانات
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Truncation */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border-t-8 border-red-600">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">إجراء خطير جدًا!</h3>
            <p className="text-center text-gray-600 mb-6 text-sm leading-relaxed">
              ستقوم بمسح كافة السجلات من الجدول <span className="font-bold text-red-600 font-mono">"{tableToTruncate}"</span>. لا يمكن الاسترجاع أبدًا بعض الضغط على تأكيد. لحمايتك، يرجى كتابة اسم الجدول أدناه للتأكيد.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اكتب <span className="font-mono bg-gray-100 p-1 rounded font-bold">{tableToTruncate}</span> أدناه:
              </label>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-center font-mono"
                placeholder="اكتب اسم الجدول تمامًا"
                autoComplete="off"
                dir="ltr"
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
              >
                إلغاء التراجع
              </button>
              <button 
                onClick={executeTruncate}
                disabled={confirmText !== tableToTruncate || isTruncating}
                className={`flex-1 py-2 px-4 rounded text-white transition flex justify-center items-center ${
                  confirmText === tableToTruncate && !isTruncating 
                    ? 'bg-red-600 hover:bg-red-700 shadow-md' 
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                {isTruncating ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'تأكيد المسح'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}