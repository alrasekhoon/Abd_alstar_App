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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <div className="text-sm text-gray-600">
            إجمالي المستخدمين: <span className="font-bold">{pagination?.totalUsers || 0}</span>
          </div>
        </div>

        {/* شريط البحث والتصفية */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <select
              value={filters.user_type}
              onChange={(e) => handleFilterChange('user_type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">جميع الأنواع</option>
              <option value="غير موثوق">غير موثوق</option>
              <option value="موثوق">موثوق</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          
          <div>
            <select
              value={filters.block_status}
              onChange={(e) => handleFilterChange('block_status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">جميع الحالات</option>
              <option value="0">نشط</option>
              <option value="1">محظور</option>
            </select>
          </div>
        </div>

        {/* زر إعادة التعيين */}
        <div className="mb-6">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            إعادة التعيين
          </button>
        </div>

        {/* جدول المستخدمين */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الهاتف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">المدينة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  </tr>
                ))
              ) : users && users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="text-lg font-medium">لا توجد بيانات</p>
                      <p className="text-sm">لم يتم العثور على مستخدمين</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCurrentUserNumber(index)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      {user.f_name && (
                        <div className="text-xs text-gray-500">{user.f_name} {user.last_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.user_type || ''}
                        onChange={(e) => handleUserTypeChange(user.id, e.target.value)}
                        disabled={updatingUser === user.id}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
                      >
                        <option value="غير موثوق">غير موثوق</option>
                        <option value="موثوق">موثوق</option>
                        <option value="vip">VIP</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.city || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(user.block, user.user_type)}
                        <button
                          onClick={() => handleBlockUser(user.id, user.block === 1 ? 0 : 1)}
                          disabled={updatingUser === user.id}
                          className={`text-xs px-2 py-1 rounded transition ${
                            user.block === 1 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } disabled:opacity-50`}
                        >
                          {user.block === 1 ? 'فك الحظر' : 'حظر'}
                          {updatingUser === user.id && (
                            <span className="mr-1 inline-block w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.date1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
  <div className="flex space-x-2">
    {/* الأزرار الحالية */}
    <button
      onClick={() => openUserDetails(user)}
      className="text-blue-600 hover:text-blue-900 flex items-center"
    >
      {/* أيقونة العرض */}
      عرض
    </button>
    
    {/* زر الإشعارات الجديد */}
    <button
      onClick={() => openNotificationsModal(user.id, user.name)}
      className="text-orange-600 hover:text-orange-900 flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
      الإشعارات
    </button>

    {/* باقي الأزرار */}
    <button
      onClick={() => openSubscriptionsModal(user.id, user.name)}
      className="text-green-600 hover:text-green-900 flex items-center"
    >
      {/* أيقونة الاشتراكات */}
      الاشتراكات
    </button>
    
    <button
      onClick={() => openTransactionsModal(user.id, user.name)}
      className="text-purple-600 hover:text-purple-900 flex items-center"
    >
      {/* أيقونة الدفعات */}
      الدفعات
    </button>
  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* التحميل التدريجي */}
        {!isLoading && pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4">
            <div className="text-sm text-gray-700">
              عرض {((pagination.currentPage - 1) * pagination.usersPerPage) + 1} إلى{' '}
              {Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)} من{' '}
              {pagination.totalUsers} مستخدم
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التسجيل</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{formatDate(selectedUser.date1)}</p>
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


{/* مودال الدفعات المالية */}
<UserTransactionsModal
  isOpen={transactionsModal.isOpen}
  onClose={() => setTransactionsModal(prev => ({ ...prev, isOpen: false }))}
  userId={transactionsModal.userId}
  userName={transactionsModal.userName}
/>


{/* مودال الاشتراكات  */}
 <UserSubscriptionsModal
  isOpen={subscriptionsModal.isOpen}
  onClose={() => setSubscriptionsModal(prev => ({ ...prev, isOpen: false }))}
  userId={subscriptionsModal.userId}
  userName={subscriptionsModal.userName}
/>

{/* مودال الإشعارات */}
<UserNotificationsModal
  isOpen={notificationsModal.isOpen}
  onClose={() => setNotificationsModal(prev => ({ ...prev, isOpen: false }))}
  userId={notificationsModal.userId}
  userName={notificationsModal.userName}
/>

    </div>
  );

 
}