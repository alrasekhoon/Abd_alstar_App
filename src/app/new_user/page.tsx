'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import UserSubscriptionsModal from './UserSubscriptionsModal';

import UserTransactionsModal from './UserTransactionsModal';
import UserNotificationsModal from './UserNotificationsModal';


 
type User = {
  id: number;
  name: string;
  phone: string;
  block: number;
  status: string;
  auth: number;
  note: string;
  f_name: string;
  last_name: string;
  uni_number: string;
  year1: number;
  gender: string;
  address: string;
  city: string;
  user_type: string;
  title: string;
  university: string;
  date1: string;
  device_uuid: string;
  global_account: number;
  created_at?: string;
  updated_at?: string;
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  usersPerPage: number;
};

type Filters = {
  user_type: string;
  block_status: string;
};

type ApiResponse = {
  success: boolean;
  users?: User[];
  pagination?: PaginationInfo;
  error?: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({
    user_type: '',
    block_status: ''
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);

  const API_URL = '/api/proxy/cp_news_new.php';

  const [subscriptionsModal, setSubscriptionsModal] = useState({
  isOpen: false,
  userId: 0,
  userName: ''
  });

  const [notificationsModal, setNotificationsModal] = useState({
  isOpen: false,
  userId: 0,
  userName: ''
});

const [transactionsModal, setTransactionsModal] = useState({
  isOpen: false,
  userId: 0,
  userName: ''
});


  // Debounce للبحث
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async (page: number = 1, search: string = '', filters: Filters = { user_type: '', block_status: '' }) => {
    try {
      setIsLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(filters.user_type && { user_type: filters.user_type }),
        ...(filters.block_status !== '' && { block_status: filters.block_status })
      });

      // إضافة timestamp ومنع الـ cache في المتصفح
      const url = `${API_URL}?${params}&_t=${new Date().getTime()}`;
      const response = await fetch(url, {
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
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'حدث خطأ غير متوقع');
      }
      
      // التحقق من وجود البيانات
      if (result.users && result.pagination) {
        setUsers(result.users);
        setPagination(result.pagination);
      } else {
        setUsers([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setUsers([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, debouncedSearch, filters);
  }, [debouncedSearch, filters, fetchUsers]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      fetchUsers(newPage, debouncedSearch, filters);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleBlockUser = async (userId: number, blockStatus: number) => {
    try {
      setUpdatingUser(userId);
      const response = await fetch(`${API_URL}?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store' as RequestCache,
        body: JSON.stringify({ block: blockStatus }),
      });

      if (!response.ok) {
        throw new Error(`فشل في تحديث الحالة: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في تحديث الحالة');
      }

      // تحديث الواجهة مباشرة
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, block: blockStatus } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleUserTypeChange = async (userId: number, userType: string) => {
    try {
      setUpdatingUser(userId);
      const response = await fetch(`${API_URL}?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store' as RequestCache,
        body: JSON.stringify({ user_type: userType }),
      });

      if (!response.ok) {
        throw new Error(`فشل في تحديث النوع: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في تحديث النوع');
      }

      // تحديث الواجهة مباشرة
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, user_type: userType } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    } finally {
      setUpdatingUser(null);
    }
  };

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const getStatusBadge = (block: number, userType: string) => {
    if (block === 1) {
      return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">محظور</span>;
    }
    
    switch (userType) {
      case 'vip':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">VIP</span>;
      case 'موثوق':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">موثوق</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">عادي</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('ar-EG');
    } catch {
      return dateString;
    }
  };

  const resetFilters = () => {
    setFilters({
      user_type: '',
      block_status: ''
    });
    setSearchTerm('');
  };

  // حساب رقم المستخدم في الصفحة الحالية
  const getCurrentUserNumber = (index: number) => {
    if (!pagination) return index + 1;
    return ((pagination.currentPage - 1) * pagination.usersPerPage) + index + 1;
  };


  ////الاشتراكات
  const openSubscriptionsModal = (userId: number, userName: string) => {
  setSubscriptionsModal({
    isOpen: true,
    userId,
    userName
  });



};

//الدفعات المالية
const openTransactionsModal = (userId: number, userName: string) => {
  setTransactionsModal({
    isOpen: true,
    userId,
    userName
  });
};

const openNotificationsModal = (userId: number, userName: string) => {
  setNotificationsModal({
    isOpen: true,
    userId,
    userName
  });
};





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
<div dir="rtl" className="font-sans min-h-screen bg-gray-50 p-2 md:p-4">
  <div className="w-full max-w-full">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-[#c4a900] rounded-full"></div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">إدارة المستخدمين</h1>
      </div>
      <div className="text-sm bg-gray-50 text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2">
        إجمالي المستخدمين: <span className="text-blue-600 text-base">{pagination?.totalUsers || 0}</span>
      </div>
    </div>

{/* شريط البحث والتصفية */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="col-span-2">
            <div className="relative group">
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900] transition-all text-right"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#c4a900] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="col-span-1">
            <select
              value={filters.user_type}
              onChange={(e) => handleFilterChange('user_type', e.target.value)}
              className="w-full px-2 md:px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900] transition-all cursor-pointer"
            >
              <option value="">الأنواع</option>
              <option value="غير موثوق">غير موثوق</option>
              <option value="موثوق">موثوق</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          
          <div className="col-span-1">
            <select
              value={filters.block_status}
              onChange={(e) => handleFilterChange('block_status', e.target.value)}
              className="w-full px-2 md:px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900] transition-all cursor-pointer"
            >
              <option value="">الحالات</option>
              <option value="0">نشط</option>
              <option value="1">محظور</option>
            </select>
          </div>
        </div>

        {/* زر إعادة التعيين */}
        <div className="mb-5">
  <button
    onClick={resetFilters}
    className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition shadow-sm"
  >
    إعادة التعيين
  </button>
</div>

{/* === منطقة عرض المستخدمين === */}
        <div>
          
          {/* 1. نسخة الحاسوب (جدول ثابت وأنيق - يختفي في الهاتف) */}
          <div className="hidden md:block w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="w-full text-right divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-600">#</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-600">الاسم</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-600">الهاتف</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-600">النوع</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-600">المدينة</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-600">الحالة</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-600">التاريخ</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                      <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-3 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-3 py-4"><div className="h-8 bg-gray-200 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : users && users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-bold">لا توجد بيانات</td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={`desktop-${user.id}`} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-4 text-sm text-gray-500">{getCurrentUserNumber(index)}</td>
                      <td className="px-3 py-4">
                        <div className="text-sm font-bold text-gray-900">{user.name}</div>
                        {user.f_name && <div className="text-xs text-gray-500">{user.f_name} {user.last_name}</div>}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 font-medium">{user.phone}</td>
                      <td className="px-3 py-4">
                        <select value={user.user_type || ''} onChange={(e) => handleUserTypeChange(user.id, e.target.value)} disabled={updatingUser === user.id} className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-[#c4a900] bg-white transition">
                          <option value="غير موثوق">غير موثوق</option>
                          <option value="موثوق">موثوق</option>
                          <option value="vip">VIP</option>
                        </select>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">{user.city || '-'}</td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(user.block, user.user_type)}
                          <button onClick={() => handleBlockUser(user.id, user.block === 1 ? 0 : 1)} disabled={updatingUser === user.id} className={`text-xs px-2 py-1 rounded transition font-bold ${user.block === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.block === 1 ? 'فك الحظر' : 'حظر'}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">{formatDate(user.date1)}</td>
                      <td className="px-3 py-4">
<div className="flex flex-col gap-2 w-[90px] mx-auto">
  <button onClick={() => openUserDetails(user)} className="bg-[#3b66f5] text-white text-sm py-1.5 rounded-lg font-bold hover:bg-blue-700 w-full text-center shadow-sm transition">عرض</button>
  <button onClick={() => openNotificationsModal(user.id, user.name)} className="bg-[#ed7c1e] text-white text-sm py-1.5 rounded-lg font-bold hover:bg-orange-600 w-full text-center shadow-sm transition">إشعار</button>
  <button onClick={() => openSubscriptionsModal(user.id, user.name)} className="bg-[#c2aa27] text-black text-sm py-1.5 rounded-lg font-bold hover:bg-[#b39a00] w-full text-center shadow-sm transition">اشتراك</button>
  <button onClick={() => openTransactionsModal(user.id, user.name)} className="bg-[#8b3dff] text-white text-sm py-1.5 rounded-lg font-bold hover:bg-purple-700 w-full text-center shadow-sm transition">دفعات</button>
</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 2. نسخة الهاتف (بطاقات احترافية - تظهر في الهاتف فقط) */}
          <div className="md:hidden space-y-4 mt-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`mob-skel-${index}`} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4 mx-auto"></div>
                  <div className="h-24 bg-gray-100 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded mb-4"></div>
                </div>
              ))
            ) : users && users.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl"><p className="text-gray-500 font-bold">لا توجد بيانات</p></div>
            ) : (
              users.map((user, index) => (
                <div key={`mobile-${user.id}`} className={`p-4 rounded-2xl shadow-sm border relative overflow-hidden transition-colors ${user.block === 1 ? 'bg-red-50/70 border-red-200' : 'bg-white border-gray-100'}`}>
                  
                  {/* الشريط العلوي للبطاقة (# والحالة) */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="scale-90 origin-right">{getStatusBadge(user.block, user.user_type)}</div>
                    <span className="text-gray-400 font-extrabold text-sm">#{getCurrentUserNumber(index)}</span>
                  </div>

                  {/* الاسم */}
                  <div className="text-center mb-4">
                    <div className="text-lg font-extrabold text-gray-900">{user.name}</div>
                    {user.f_name && <div className="text-sm text-gray-500 mt-0.5">{user.f_name} {user.last_name}</div>}
                  </div>

                  {/* التفاصيل المنسقة */}
                  <div className="mb-4 mt-2">
                    <div className="flex justify-between items-center mb-4 px-1">
                      <div className="text-right">
                        <span className="text-gray-400 block text-[11px] mb-1 font-medium">المدينة:</span>
                        <span className="font-extrabold text-gray-900 text-sm">{user.city || '-'}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-gray-400 block text-[11px] mb-1 font-medium">الهاتف:</span>
                        <span className="font-extrabold text-gray-900 text-sm" dir="ltr">{user.phone}</span>
                      </div>
                    </div>
                    <div className="w-full text-center bg-gray-50 rounded-xl py-3 border border-gray-100 mb-4">
                      <span className="text-gray-400 text-xs ml-1">تاريخ التسجيل:</span> 
                      <span className="font-bold text-gray-800 text-sm">{formatDate(user.date1)}</span>
                    </div>
                  </div>

                  {/* نوع المستخدم وحالة الحساب (في صف واحد) */}
                  <div className="flex flex-row items-center justify-between gap-3 mb-4">
                    <select value={user.user_type || ''} onChange={(e) => handleUserTypeChange(user.id, e.target.value)} disabled={updatingUser === user.id} className="flex-1 w-1/2 text-sm border border-gray-200 rounded-xl px-3 py-3 font-bold text-gray-800 bg-white focus:ring-2 focus:ring-[#c4a900] outline-none cursor-pointer text-center">
                      <option value="غير موثوق">غير موثوق</option>
                      <option value="موثوق">موثوق</option>
                      <option value="vip">VIP</option>
                    </select>
                    <button onClick={() => handleBlockUser(user.id, user.block === 1 ? 0 : 1)} disabled={updatingUser === user.id} className={`flex-1 w-1/2 py-3 rounded-xl text-sm font-bold shadow-sm transition ${user.block === 1 ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-[#d32f2f] hover:bg-red-700 text-white'}`}>
                      {user.block === 1 ? 'فك الحظر' : 'حظر'}
                    </button>
                  </div>

                  {/* الأزرار الأربعة مع أيقونات للهاتف */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => openUserDetails(user)} className="flex items-center justify-center gap-1.5 bg-[#3b66f5] text-white py-3 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      عرض
                    </button>
                    <button onClick={() => openNotificationsModal(user.id, user.name)} className="flex items-center justify-center gap-1.5 bg-[#ed7c1e] text-white py-3 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      إشعار
                    </button>
                    <button onClick={() => openTransactionsModal(user.id, user.name)} className="flex items-center justify-center gap-1.5 bg-[#8b3dff] text-white py-3 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      دفعات
                    </button>
                    <button onClick={() => openSubscriptionsModal(user.id, user.name)} className="flex items-center justify-center gap-1.5 bg-[#c2aa27] text-black py-3 rounded-xl text-sm font-extrabold shadow-sm active:scale-95 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      اشتراك
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

       {/* التحميل التدريجي */}
        {!isLoading && pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4 w-full">
            {/* النص داخل إطار أنيق - محاذاة لليمين */}
            <div className="bg-white border border-gray-200 shadow-sm px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 text-center md:text-right w-full md:w-auto">
              عرض <span className="text-blue-600">{((pagination.currentPage - 1) * pagination.usersPerPage) + 1}</span> إلى{' '}
              <span className="text-blue-600">{Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)}</span> من{' '}
              <span className="text-[#c4a900]">{pagination.totalUsers}</span> مستخدم
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                السابق
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                        pagination.currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

        {/* مودال تفاصيل المستخدم */}

{isUserModalOpen && selectedUser && (
  <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/60 backdrop-blur-sm transition-all duration-300">
    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">تفاصيل المستخدم</h2>
        <button 
          onClick={() => setIsUserModalOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* قسم الصورة */}
        <div className="flex-shrink-0">
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <div className="relative w-48 h-48 mx-auto mb-4">
  <Image
    src={`/api/proxy/uploads/card_${selectedUser.id}.jpg`}
    alt={`صورة ${selectedUser.name}`}
    width={192}
    height={192}
    className="w-full h-full object-cover rounded-lg border-2 border-gray-300"
    onError={(e) => {
      // استخدام صورة افتراضية
      const defaultImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random&size=200&color=fff`;
      e.currentTarget.src = defaultImageUrl;
    }}
  />
</div>
            <p className="text-sm text-gray-600">
              ID: {selectedUser.id}
            </p>
            <button
              onClick={() => {
                // فتح الصورة في نافذة جديدة
                window.open(`/api/proxy/uploads/${selectedUser.id}_card.jpg`, '_blank');
              }}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
              عرض الصورة كاملة
            </button>
          </div>
        </div>

        {/* قسم البيانات */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.phone}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.f_name || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأخير</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.last_name || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الجامعي</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.uni_number || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.year1 || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.gender || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.city || '-'}</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200 min-h-[60px]">{selectedUser.address || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الجامعة</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.university || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedUser.title || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع المستخدم</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.user_type === 'vip' 
                    ? 'bg-purple-100 text-purple-800'
                    : selectedUser.user_type === 'موثوق'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedUser.user_type || 'غير محدد'}
                </span>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.block === 1 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedUser.block === 1 ? 'محظور' : 'نشط'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رمز التفعيل (OTP)</label>
              <p className="text-blue-900 bg-blue-50 p-2 rounded-lg border border-blue-200 font-bold tracking-widest text-center">{selectedUser.auth || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التسجيل القديم</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{formatDate(selectedUser.date1)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وقت إنشاء الحساب</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200" dir="ltr">{formatDateTime(selectedUser.created_at)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">آخر تحديث للحساب</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200" dir="ltr">{formatDateTime(selectedUser.updated_at)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الجهاز</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200 text-xs font-mono">{selectedUser.device_uuid || '-'}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200 min-h-[80px] whitespace-pre-wrap">{selectedUser.note || '-'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
        <button
          onClick={() => setIsUserModalOpen(false)}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          إغلاق
        </button>
      </div>
    </div>
  </div>
)}


{/* خلفية التعتيم الشاملة للنوافذ المستقلة */}
      {(transactionsModal.isOpen || subscriptionsModal.isOpen || notificationsModal.isOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] transition-all duration-300"></div>
      )}

      {/* مودال الدفعات المالية */}
      <div className="relative z-[50]">
        <UserTransactionsModal
          isOpen={transactionsModal.isOpen}
          onClose={() => setTransactionsModal(prev => ({ ...prev, isOpen: false }))}
          userId={transactionsModal.userId}
          userName={transactionsModal.userName}
        />
      </div>

      {/* مودال الاشتراكات  */}
      <div className="relative z-[50]">
        <UserSubscriptionsModal
          isOpen={subscriptionsModal.isOpen}
          onClose={() => setSubscriptionsModal(prev => ({ ...prev, isOpen: false }))}
          userId={subscriptionsModal.userId}
          userName={subscriptionsModal.userName}
        />
      </div>

      {/* مودال الإشعارات */}
      <div className="relative z-[50]">
        <UserNotificationsModal
          isOpen={notificationsModal.isOpen}
          onClose={() => setNotificationsModal(prev => ({ ...prev, isOpen: false }))}
          userId={notificationsModal.userId}
          userName={notificationsModal.userName}
        />
      </div>

    </div>
  );
}
