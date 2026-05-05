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
<div dir="rtl" className="font-sans min-h-screen bg-gray-100">
  <div className="bg-gray-100 p-2 md:p-4">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 bg-blue-100 text-blue-900 p-4 rounded-xl shadow-sm border border-blue-200">
  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">إدارة المستخدمين</h1>
  <div className="text-sm bg-blue-200 shadow-inner px-4 py-2 rounded-md font-bold">
    إجمالي المستخدمين: {pagination?.totalUsers || 0}
  </div>
</div>

{/* شريط البحث والتصفية + زر إعادة التعيين */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 items-center">
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

<div className="flex col-span-1 justify-end">
 <button
      onClick={resetFilters}
      className="w-full px-4 py-3 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl transition shadow-sm font-bold flex items-center justify-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
      إعادة التعيين
    </button>
  </div>
</div>


{/* === منطقة عرض المستخدمين === */}
        <div>
          
          {/* 1. نسخة الحاسوب (جدول ثابت وأنيق - يختفي في الهاتف) */}
          <div className="hidden md:block w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="w-full text-right divide-y divide-gray-200 table-auto">
              <thead>
  <tr>
    <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800 w-10">#</th>
    <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">الاسم والهاتف</th>
    <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">نوع الحساب</th>
    <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">المدينة</th>
    <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">الحالة</th>
    <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">التاريخ</th>
    <th className="px-3 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">الإجراءات</th>
  </tr>
</thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
  <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
  <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div><div className="h-3 bg-gray-100 rounded w-24 mt-1"></div></td>
  <td className="px-3 py-4"><div className="h-7 bg-gray-200 rounded w-24"></div></td>
  <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
  <td className="px-3 py-4"><div className="h-7 bg-gray-200 rounded w-20"></div></td>
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
                    <tr key={`desktop-${user.id}`} className={`transition ${user.block === 1 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
  <td className="px-3 py-3 text-sm text-gray-400 font-medium w-10">{getCurrentUserNumber(index)}</td>
  <td className="px-3 py-3">
    <div className="text-sm font-bold text-gray-900">{user.name}</div>
    <div className="text-xs text-gray-800 font-bold mt-0.5" dir="ltr">{user.phone}</div>
  </td>
  <td className="px-3 py-3">
    <select
      value={user.user_type || ''}
      onChange={(e) => handleUserTypeChange(user.id, e.target.value)}
      disabled={updatingUser === user.id}
      className={`text-xs border rounded-lg px-2 py-1.5 font-bold focus:ring-2 focus:ring-[#c4a900] transition cursor-pointer ${user.user_type === 'vip' ? 'bg-purple-50 border-purple-400 text-purple-800' : user.user_type === 'موثوق' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-amber-50 border-amber-400 text-amber-700'}`}
    >
      <option value="غير موثوق">غير موثوق</option>
      <option value="موثوق">موثوق</option>
      <option value="vip">VIP</option>
    </select>
  </td>
  <td className="px-3 py-3 text-sm text-gray-600">{user.city || '-'}</td>
  <td className="px-3 py-3">
    <button
      onClick={() => handleBlockUser(user.id, user.block === 1 ? 0 : 1)}
      disabled={updatingUser === user.id}
      className={`text-xs px-3 py-1.5 rounded-lg transition font-bold flex items-center gap-1 ${
        user.block === 1
          ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
          : 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
      }`}
    >
      {user.block === 1 ? (
        <><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>فك الحظر</>
      ) : (
        <><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/></svg>حظر</>
      )}
    </button>
  </td>
  <td className="px-3 py-3 text-sm text-gray-500">{formatDate(user.date1)}</td>
                     <td className="px-2 py-3">
  <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 min-w-[140px]">
    <button onClick={() => openUserDetails(user)} className="bg-[#3b66f5] text-white text-xs py-1.5 px-1 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-1 shadow-sm transition">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
      عرض
    </button>
    <button onClick={() => openNotificationsModal(user.id, user.name)} className="bg-[#ed7c1e] text-white text-xs py-1.5 px-1 rounded-lg font-bold hover:bg-orange-600 flex items-center justify-center gap-1 shadow-sm transition">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
      إشعار
    </button>
    <button onClick={() => openSubscriptionsModal(user.id, user.name)} className="bg-[#c2aa27] text-black text-xs py-1.5 px-1 rounded-lg font-bold hover:bg-[#b39a00] flex items-center justify-center gap-1 shadow-sm transition">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>
      اشتراك
    </button>
    <button onClick={() => openTransactionsModal(user.id, user.name)} className="bg-[#8b3dff] text-white text-xs py-1.5 px-1 rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center gap-1 shadow-sm transition">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/></svg>
      دفعات
    </button>
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
                <div key={`mobile-${user.id}`} className={`p-4 rounded-2xl shadow-sm border relative overflow-hidden ${user.block === 1 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>

  {/* الشريط العلوي: الرقم يسار، الحالة يمين */}
  <div className="flex justify-between items-center mb-4">
    <span className="text-gray-400 font-bold text-xs bg-gray-100 px-2 py-1 rounded-full">#{getCurrentUserNumber(index)}</span>
    <div>{getStatusBadge(user.block, user.user_type)}</div>
  </div>

  {/* الاسم في المنتصف */}
  <div className="text-center mb-4">
    <div className="text-xl font-extrabold text-gray-900">{user.name}</div>
    <div className="text-sm font-bold text-gray-800 mt-1" dir="ltr">{user.phone}</div>
  </div>

  {/* بيانات مدمجة: المدينة والتاريخ */}
  <div className="grid grid-cols-2 gap-2 mb-4">
    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
      <span className="text-gray-400 block text-[10px] font-medium mb-1">المدينة</span>
      <span className="font-extrabold text-gray-900 text-sm">{user.city || '-'}</span>
    </div>
    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
      <span className="text-gray-400 block text-[10px] font-medium mb-1">تاريخ التسجيل</span>
      <span className="font-bold text-gray-800 text-sm">{formatDate(user.date1)}</span>
    </div>
  </div>

{/* نوع المستخدم وحالة الحساب (في صف واحد) */}
<div className="flex flex-row items-center justify-between gap-3 mb-4">
<select value={user.user_type || ''} onChange={(e) => handleUserTypeChange(user.id, e.target.value)} disabled={updatingUser === user.id} className={`flex-1 w-1/2 text-sm border rounded-xl px-3 py-3 font-bold focus:ring-2 focus:ring-[#c4a900] outline-none cursor-pointer text-center ${user.user_type === 'vip' ? 'bg-purple-50 border-purple-400 text-purple-800' : user.user_type === 'موثوق' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-amber-50 border-amber-400 text-amber-700'}`}>
    <option value="غير موثوق">غير موثوق</option>
      <option value="موثوق">موثوق</option>
      <option value="vip">VIP</option>
    </select>
  <button onClick={() => handleBlockUser(user.id, user.block === 1 ? 0 : 1)} disabled={updatingUser === user.id} className={`flex-1 w-1/2 py-3 rounded-xl text-sm font-bold shadow-sm transition ${user.block === 1 ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-[#d32f2f] hover:bg-red-700 text-white'}`}>
    {user.block === 1 ? 'فك الحظر' : 'حظر'}
  </button>
</div>

{/* الأزرار الأربعة مع أيقونات */}
<div className="grid grid-cols-2 gap-3 mt-2">
  <button onClick={() => openUserDetails(user)} className="bg-[#3b66f5] text-white py-3 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition flex items-center justify-center gap-1.5">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
    عرض
  </button>
  <button onClick={() => openNotificationsModal(user.id, user.name)} className="bg-[#ed7c1e] text-white py-3 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition flex items-center justify-center gap-1.5">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
    إشعار
  </button>
  <button onClick={() => openTransactionsModal(user.id, user.name)} className="bg-[#8b3dff] text-white py-3 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition flex items-center justify-center gap-1.5">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/></svg>
    دفعات
  </button>
  <button onClick={() => openSubscriptionsModal(user.id, user.name)} className="bg-[#c2aa27] text-black py-3 rounded-xl text-sm font-extrabold shadow-sm active:scale-95 transition flex items-center justify-center gap-1.5">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>
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
         <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-3">
  <div className="bg-white border border-gray-200 shadow-sm px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 text-right w-full md:w-auto">
    عرض{' '}
    <span className="text-blue-600">{((pagination.currentPage - 1) * pagination.usersPerPage) + 1}</span>
    {' '}إلى{' '}
    <span className="text-blue-600">{Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)}</span>
    {' '}من{' '}
    <span className="text-[#c4a900] font-extrabold">{pagination.totalUsers}</span>
    {' '}مستخدم
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
        <button onClick={() => setIsUserModalOpen(false)} className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-8">

        <div className="flex-shrink-0 w-full md:w-56 flex flex-col gap-3">
          
          {/* إطار الصورة */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="relative w-full aspect-square">
              <Image
                src={`/api/proxy/uploads/card_${selectedUser.id}.jpg`}
                alt={`صورة ${selectedUser.name}`}
                width={224}
                height={224}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const defaultImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random&size=200&color=fff`;
                  e.currentTarget.src = defaultImageUrl;
                }}
              />
            </div>
            <div className="p-2">
              <p className="text-[10px] text-center text-gray-400 font-bold mb-1.5">ID: {selectedUser.id}</p>
              <button
                onClick={() => window.open(`/api/proxy/uploads/card_${selectedUser.id}.jpg`, '_blank')}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 border border-blue-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                عرض الصورة
              </button>
            </div>
          </div>

          {/* OTP - زر تفاعلي */}
          <button
            onClick={() => fetchUsers(pagination?.currentPage || 1, debouncedSearch, filters)}
            className="w-full bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-400 rounded-2xl p-3 text-center shadow-sm transition group"
          >
            <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest block mb-1">🔑 رمز OTP — اضغط للتحديث</span>
            <span className="text-blue-900 font-extrabold tracking-widest text-2xl block">{selectedUser.auth || '-'}</span>
            <span className="text-[9px] text-blue-400 mt-1 block">{formatDateTime(selectedUser.updated_at)}</span>
          </button>

          {/* نوع المستخدم */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">نوع المستخدم</label>
            <select
              value={selectedUser.user_type || ''}
              onChange={(e) => {
                handleUserTypeChange(selectedUser.id, e.target.value);
                setSelectedUser(prev => prev ? {...prev, user_type: e.target.value} : prev);
              }}
              disabled={updatingUser === selectedUser.id}
              className={`w-full text-sm border-2 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-[#c4a900] outline-none cursor-pointer transition ${selectedUser.user_type === 'vip' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : selectedUser.user_type === 'موثوق' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-gray-100 border-gray-400 text-gray-700'}`}
            >
              <option value="غير موثوق">غير موثوق</option>
              <option value="موثوق">موثوق</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          {/* الحالة */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">الحالة</label>
            <button
              onClick={() => {
                const newBlock = selectedUser.block === 1 ? 0 : 1;
                handleBlockUser(selectedUser.id, newBlock);
                setSelectedUser(prev => prev ? {...prev, block: newBlock} : prev);
              }}
              disabled={updatingUser === selectedUser.id}
              className={`w-full py-2 px-3 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 ${selectedUser.block === 1 ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
              {selectedUser.block === 1 ? '✅ فك الحظر' : '🚫 حظر'}
            </button>
          </div>

          {/* الجهاز */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">الجهاز</label>
            <p className="text-gray-700 text-xs font-mono break-all">{selectedUser.device_uuid || '-'}</p>
          </div>

        </div>


      {/* قسم البيانات */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* الصف الأول: الاسم الأول - الاسم الأخير - الهاتف */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">الاسم الأول</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium">{selectedUser.f_name || '-'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">الاسم الأخير</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium">{selectedUser.last_name || '-'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">الهاتف</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium" dir="ltr">{selectedUser.phone}</p>
            </div>

            {/* الصف الثاني: الجامعة - السنة - الرقم الجامعي */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">الجامعة</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium">{selectedUser.university || '-'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">السنة</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium">{selectedUser.year1 || '-'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">الرقم الجامعي</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium">{selectedUser.uni_number || '-'}</p>
            </div>

            {/* الصف الثالث: الجنس - المسمى الوظيفي - المدينة */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">الجنس</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium">{selectedUser.gender || '-'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">المسمى الوظيفي</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium">{selectedUser.title || '-'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">المدينة</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium">{selectedUser.city || '-'}</p>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">العنوان</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm font-medium">{selectedUser.address || '-'}</p>
            </div>


            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">وقت إنشاء الحساب</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm text-xs" dir="ltr">{formatDateTime(selectedUser.created_at)}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">آخر تحديث للحساب</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm text-xs" dir="ltr">{formatDateTime(selectedUser.updated_at)}</p>
            </div>


            {/* ملاحظات - صف كامل */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">ملاحظات</label>
              <p className="text-gray-900 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm min-h-[80px] whitespace-pre-wrap">{selectedUser.note || '-'}</p>
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


