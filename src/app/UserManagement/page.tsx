'use client';

import { useState, useEffect } from 'react';


type User = {
  id?: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  block_status: boolean;
  note: string;
  last_login?: string;
  created_at?: string;
  password?: string;
  permissions?: string[];
};

const AVAILABLE_PERMISSIONS = [
  { id: '/adv', name: 'الاعلانات', group: 'الواجهة الرئيسية' },
  { id: '/home_work', name: 'الوظائف', group: 'الواجهة الرئيسية' },
  { id: '/news', name: 'الأخبار', group: 'الواجهة الرئيسية' },
  { id: '/Notification', name: 'الاشعارات', group: 'الواجهة الرئيسية' },
  { id: '/uni_link', name: 'الروابط الجامعة', group: 'الواجهة الرئيسية' },
  { id: '/uni_material', name: 'مواد الجامعة', group: 'الواجهة الرئيسية' },
  { id: '/ashtrak', name: 'انواع الاشتراكات', group: 'المقررات' },
  { id: '/material', name: 'المواد الدراسية', group: 'المقررات' },
  { id: '/quiz', name: 'إستخراج الاسئلة', group: 'المقررات' },
  { id: '/voice', name: 'الأصوات', group: 'المقررات' },
  { id: '/quiz_questions', name: 'استفسارات الاختبارات', group: 'المقررات' },
  { id: '/print', name: 'الطباعة', group: 'الطباعة والتوصيل' },
  { id: '/delv', name: 'التوصيل والشحن', group: 'الطباعة والتوصيل' },
  { id: '/print_bill', name: 'الفواتير', group: 'الطباعة والتوصيل' },
  { id: '/users', name: 'المستخدمين', group: 'المستخدمين والمالية' },
  { id: '/mony1', name: 'الدفعات المالية', group: 'المستخدمين والمالية' },
  { id: '/new_user', name: 'إدارة المستخدمين', group: 'المستخدمين والمالية' },
  { id: '/verify_users', name: 'مراجعة وتوثيق الحسابات', group: 'المستخدمين والمالية' },
  { id: '/finance', name: 'الجدوى المالية', group: 'المستخدمين والمالية' },
  { id: '/settings', name: 'الإعدادات', group: 'إدارة النظام' },
  { id: '/UserManagement', name: 'ادارة لوحة التحكم', group: 'إدارة النظام' },
  { id: '/support_chat', name: 'الدردشة المباشرة', group: 'إدارة النظام' }
];


type Role = {
  id: number;
  name: string;
  description: string;
  permissions: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
const [showPassword, setShowPassword] = useState(false);


  const API_URL = '/api/proxy/cp_users1.php';
  const ROLES_API_URL = '/api/proxy/cp_roles.php';

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const response = await fetch(`${API_URL}?_t=${timestamp}`, {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      if (!response.ok) throw new Error('فشل في جلب بيانات المستخدمين');
      const result = await response.json();
      const parsedUsers = result.map((u: any) => ({
        ...u,
        permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions || "[]") : (u.permissions || [])
      }));
      setUsers(parsedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(ROLES_API_URL);
      if (!response.ok) throw new Error('فشل في جلب بيانات الأدوار');
      const result = await response.json();
      setRoles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الأدوار');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف المستخدم');
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingUser) return;

  // التحقق من الحقول المطلوبة
  if (!editingUser.username || !editingUser.email || !editingUser.role) {
    setError('جميع الحقول المطلوبة يجب ملؤها');
    return;
  }

  // التحقق من كلمة المرور في حالة الإضافة فقط
  if (!editingUser.id && (!password || password !== confirmPassword)) {
    setError('كلمة المرور غير متطابقة أو فارغة');
    return;
  }

  try {
    const userData = { 
      ...editingUser,
      // إضافة كلمة المرور فقط إذا كانت موجودة
      ...(password && { password })
    };

    const method = editingUser.id ? 'PUT' : 'POST';
    const url = editingUser.id ? `${API_URL}?id=${editingUser.id}` : API_URL;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'فشل في حفظ البيانات');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'فشل في العملية');
    }

    setEditingUser(null);
    setPassword('');
    setConfirmPassword('');
    setShowPasswordFields(false);
    fetchData();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
  }
};

  const openEditForm = (user: User) => {
    setEditingUser({ ...user });
    setShowPasswordFields(false);
    setPassword('');
    setConfirmPassword('');
  };

  const openAddForm = () => {
    setEditingUser({ 
      username: '', 
      email: '', 
      phone: '', 
      role: '', 
      block_status: false, 
      note: '',
      permissions: []
    });
    setShowPasswordFields(true);
    setPassword('');
    setConfirmPassword('');
  };

  const toggleBlockStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ block_status: !currentStatus }),
      });

      if (!response.ok) throw new Error('فشل في تغيير حالة الحظر');
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === id ? { ...user, block_status: !currentStatus } : user
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تغيير الحالة');
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
          className="mt-2 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          إغلاق
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <button
            onClick={openAddForm}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            إضافة مستخدم جديد
          </button>
        </div>

        {/* Modal for Add/Edit */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingUser.id ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                </h2>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                      required
                    >
                      <option value="">اختر دور المستخدم</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {editingUser.id && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">حالة الحظر</label>
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id="block_status"
                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                            checked={editingUser.block_status}
                            onChange={(e) => setEditingUser({...editingUser, block_status: e.target.checked})}
                          />
                          <label htmlFor="block_status" className="mr-2 text-sm text-gray-700">
                            {editingUser.block_status ? 'محظور' : 'غير محظور'}
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowPasswordFields(!showPasswordFields)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {showPasswordFields ? 'إخفاء حقول كلمة المرور' : 'تغيير كلمة المرور'}
                        </button>
                      </div>
                    </>
                  )}
                {(showPasswordFields || !editingUser.id) && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={!editingUser.id}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-[30px] left-3 text-gray-500 hover:text-gray-700">
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        )}
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={!editingUser.id}
                      />
                    </div>
                  </>
                )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingUser.note || ''}
                    onChange={(e) => setEditingUser({...editingUser, note: e.target.value})}
                  />
                </div>
                
               {/* قسم الصلاحيات المخصصة */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                     صلاحيات الوصول للقوائم (Custom Permissions)
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    ملاحظة: إذا كان اسم الدور "admin" أو "owner"، فلن يتأثر المستخدم بهذه الاختيارات وسيتمكن من رؤية كل شيء، لكن يمكنك تخصيص الصلاحيات لبقية الأدوار.
                  </p>
                  
                  <div className="flex flex-col gap-6">
                    {Array.from(new Set(AVAILABLE_PERMISSIONS.map(p => p.group))).map(group => (
                      <div key={group} className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm" dir="rtl">
                        <h4 className="text-[#2b3a82] font-bold mb-5 flex items-center justify-start gap-2 text-lg border-b border-gray-200 pb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {group === 'الواجهة الرئيسية' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            )}
                          </svg>
                          {group}
                        </h4>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {AVAILABLE_PERMISSIONS.filter(p => p.group === group).map(perm => (
                            <label key={perm.id} className="flex items-center justify-start gap-2 p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
                              <input 
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                checked={(editingUser.permissions || []).includes(perm.id)}
                                onChange={(e) => {
                                  const currentPerms = editingUser.permissions || [];
                                  if (e.target.checked) {
                                    setEditingUser({ ...editingUser, permissions: [...currentPerms, perm.id] });
                                  } else {
                                    setEditingUser({ ...editingUser, permissions: currentPerms.filter(id => id !== perm.id) });
                                  }
                                }}
                              />
                              <span className="text-[13px] font-medium text-gray-700 leading-tight">{perm.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm w-full">
          <table className="w-full text-right whitespace-nowrap min-w-max divide-y divide-gray-200">
            <thead className="bg-[#fbedaa] border-b-2 border-yellow-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 tracking-wider rounded-tr-lg">اسم المستخدم</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 tracking-wider">البريد الإلكتروني</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 tracking-wider">الدور</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 tracking-wider">آخر دخول</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 tracking-wider rounded-tl-lg">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.block_status ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {user.block_status ? 'محظور' : 'نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'لم يسجل دخول بعد'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditForm(user)}
                        className="text-yellow-600 hover:text-yellow-900 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        تعديل
                      </button>
                      <button
                        onClick={() => user.id && handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        حذف
                      </button>
                      <button
                        onClick={() => user.id && toggleBlockStatus(user.id, user.block_status)}
                        className={`flex items-center ${user.block_status ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          {user.block_status ? (
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                          )}
                        </svg>
                        {user.block_status ? 'رفع الحظر' : 'حظر'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا يوجد مستخدمون</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة مستخدم جديد بالنقر على الزر أعلاه</p>
          </div>
        )}
      </div>
    </div>
  );
}


