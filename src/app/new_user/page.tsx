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
  const [filters, setFilters] = useState<Filters>({ user_type: '', block_status: '' });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);

  const API_URL = '/api/proxy/cp_news_new.php';

  const [subscriptionsModal, setSubscriptionsModal] = useState({ isOpen: false, userId: 0, userName: '' });
  const [notificationsModal, setNotificationsModal] = useState({ isOpen: false, userId: 0, userName: '' });
  const [transactionsModal, setTransactionsModal] = useState({ isOpen: false, userId: 0, userName: '' });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
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
      const url = `${API_URL}?${params}&_t=${new Date().getTime()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' },
        cache: 'no-store' as RequestCache
      });
      if (!response.ok) throw new Error(`فشل في جلب البيانات: ${response.status}`);
      const result: ApiResponse = await response.json();
      if (!result.success) throw new Error(result.error || 'حدث خطأ غير متوقع');
      if (result.users && result.pagination) {
        setUsers(result.users);
        setPagination(result.pagination);
      } else {
        setUsers([]);
        setPagination(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setUsers([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(1, debouncedSearch, filters); }, [debouncedSearch, filters, fetchUsers]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1))
      fetchUsers(newPage, debouncedSearch, filters);
  };

  const handleBlockUser = async (userId: number, blockStatus: number) => {
    try {
      setUpdatingUser(userId);
      const response = await fetch(`${API_URL}?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        cache: 'no-store' as RequestCache,
        body: JSON.stringify({ block: blockStatus }),
      });
      if (!response.ok) throw new Error(`فشل في تحديث الحالة: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'فشل في تحديث الحالة');
      setUsers(prev => prev.map(user => user.id === userId ? { ...user, block: blockStatus } : user));
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
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        cache: 'no-store' as RequestCache,
        body: JSON.stringify({ user_type: userType }),
      });
      if (!response.ok) throw new Error(`فشل في تحديث النوع: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'فشل في تحديث النوع');
      setUsers(prev => prev.map(user => user.id === userId ? { ...user, user_type: userType } : user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    } finally {
      setUpdatingUser(null);
    }
  };

  const getStatusBadge = (block: number, userType: string) => {
    if (block === 1) return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">محظور</span>;
    switch (userType) {
      case 'vip': return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">VIP</span>;
      case 'موثوق': return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">موثوق</span>;
      default: return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">عادي</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleDateString('ar-EG'); } catch { return dateString; }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleString('ar-EG'); } catch { return dateString; }
  };

  const resetFilters = () => { setFilters({ user_type: '', block_status: '' }); setSearchTerm(''); };

  const getCurrentUserNumber = (index: number) => {
    if (!pagination) return index + 1;
    return ((pagination.currentPage - 1) * pagination.usersPerPage) + index + 1;
  };

  const openSubscriptionsModal = (userId: number, userName: string) => setSubscriptionsModal({ isOpen: true, userId, userName });
  const openTransactionsModal = (userId: number, userName: string) => setTransactionsModal({ isOpen: true, userId, userName });
  const openNotificationsModal = (userId: number, userName: string) => setNotificationsModal({ isOpen: true, userId, userName });

  if (error) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl max-w-md w-full text-center shadow">
        <p className="font-bold text-lg mb-1">خطأ</p>
        <p className="text-sm mb-4">{error}</p>
        <button onClick={() => setError('')} className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition text-sm">إغلاق</button>
      </div>
    </div>
  );

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* رأس الصفحة */}
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-white">إدارة المستخدمين</h1>
          <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full font-medium">
            {pagination?.totalUsers || 0} مستخدم
          </span>
        </div>

        <div className="p-4 md:p-6">
          {/* شريط البحث والتصفية */}
          <div className="flex flex-col gap-3 mb-4">
            {/* حقل البحث */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm bg-gray-50"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>

            {/* الفلاتر */}
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.user_type}
                onChange={e => setFilters(prev => ({ ...prev, user_type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
              >
                <option value="">جميع الأنواع</option>
                <option value="غير موثوق">غير موثوق</option>
                <option value="موثوق">موثوق</option>
                <option value="vip">VIP</option>
              </select>
              <select
                value={filters.block_status}
                onChange={e => setFilters(prev => ({ ...prev, block_status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
              >
                <option value="">جميع الحالات</option>
                <option value="0">نشط</option>
                <option value="1">محظور</option>
              </select>
            </div>

            <button
              onClick={resetFilters}
              className="self-start text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
            >
              ↺ إعادة التعيين
            </button>
          </div>

          {/* ===== جدول - شاشات كبيرة ===== */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-blue-600">
                <tr>
                  {['#','الاسم','الهاتف','النوع','المدينة','الحالة','التاريخ','الإجراءات'].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                      </svg>
                      <p className="font-medium">لا توجد بيانات</p>
                    </td>
                  </tr>
                ) : users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-blue-50/40 transition">
                    <td className="px-4 py-3 text-sm text-gray-400">{getCurrentUserNumber(index)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                      {user.f_name && <div className="text-xs text-gray-400">{user.f_name} {user.last_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{user.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={user.user_type || ''}
                        onChange={e => handleUserTypeChange(user.id, e.target.value)}
                        disabled={updatingUser === user.id}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 bg-gray-50 disabled:opacity-50"
                      >
                        <option value="غير موثوق">غير موثوق</option>
                        <option value="موثوق">موثوق</option>
                        <option value="vip">VIP</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{user.city || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getStatusBadge(user.block, user.user_type)}
                        <button
                          onClick={() => handleBlockUser(user.id, user.block === 1 ? 0 : 1)}
                          disabled={updatingUser === user.id}
                          className={`text-xs px-2 py-1 rounded-lg transition font-medium disabled:opacity-50 ${user.block === 1 ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                        >
                          {user.block === 1 ? 'فك الحظر' : 'حظر'}
                          {updatingUser === user.id && <span className="mr-1 inline-block w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin"></span>}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(user.date1)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-medium transition">عرض</button>
                        <button onClick={() => openNotificationsModal(user.id, user.name)} className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg font-medium transition">إشعارات</button>
                        <button onClick={() => openSubscriptionsModal(user.id, user.name)} className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2.5 py-1.5 rounded-lg font-medium transition">اشتراكات</button>
                        <button onClick={() => openTransactionsModal(user.id, user.name)} className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg font-medium transition">دفعات</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===== بطاقات - الهاتف ===== */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              ))
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="font-medium">لا توجد بيانات</p>
              </div>
            ) : users.map((user, index) => (
              <div key={user.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                {/* رأس البطاقة */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">#{getCurrentUserNumber(index)}</span>
                      <span className="font-bold text-gray-800 text-sm">{user.name}</span>
                    </div>
                    {user.f_name && <div className="text-xs text-gray-400 mt-0.5">{user.f_name} {user.last_name}</div>}
                    <div className="text-sm text-gray-600 mt-1 font-mono">{user.phone}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(user.block, user.user_type)}
                    {user.city && <span className="text-xs text-gray-400">{user.city}</span>}
                  </div>
                </div>

                {/* صف النوع + الحظر */}
                <div className="flex items-center gap-2 mb-3">
                  <select
                    value={user.user_type || ''}
                    onChange={e => handleUserTypeChange(user.id, e.target.value)}
                    disabled={updatingUser === user.id}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="غير موثوق">غير موثوق</option>
                    <option value="موثوق">موثوق</option>
                    <option value="vip">VIP</option>
                  </select>
                  <button
                    onClick={() => handleBlockUser(user.id, user.block === 1 ? 0 : 1)}
                    disabled={updatingUser === user.id}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap ${user.block === 1 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                  >
                    {user.block === 1 ? 'فك الحظر' : 'حظر'}
                    {updatingUser === user.id && <span className="mr-1 inline-block w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin"></span>}
                  </button>
                </div>

                {/* أزرار الإجراءات - شبكة 2×2 */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }} className="flex items-center justify-center gap-1 text-xs bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10z" clipRule="evenodd"/></svg>
                    عرض التفاصيل
                  </button>
                  <button onClick={() => openNotificationsModal(user.id, user.name)} className="flex items-center justify-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 py-2 rounded-lg font-medium hover:bg-orange-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
                    إشعارات
                  </button>
                  <button onClick={() => openSubscriptionsModal(user.id, user.name)} className="flex items-center justify-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg font-medium hover:bg-green-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/></svg>
                    اشتراكات
                  </button>
                  <button onClick={() => openTransactionsModal(user.id, user.name)} className="flex items-center justify-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 py-2 rounded-lg font-medium hover:bg-purple-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/></svg>
                    دفعات
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* الترقيم */}
          {!isLoading && pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-500 text-center">
                عرض {((pagination.currentPage - 1) * pagination.usersPerPage) + 1}–{Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)} من {pagination.totalUsers}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition">
                  ‹ السابق
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) pageNum = i + 1;
                  else if (pagination.currentPage <= 3) pageNum = i + 1;
                  else if (pagination.currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                  else pageNum = pagination.currentPage - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${pagination.currentPage === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition">
                  التالي ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* مودال تفاصيل المستخدم */}
      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsUserModalOpen(false)} />
          <div className="relative bg-white w-full sm:rounded-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
            {/* رأس المودال */}
            <div className="sticky top-0 bg-blue-600 px-5 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">تفاصيل المستخدم</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-white/70 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* صورة البطاقة */}
                <div className="flex-shrink-0 text-center">
                  <div className="relative w-36 h-36 mx-auto mb-2">
                    <Image
                      src={`/api/proxy/uploads/card_${selectedUser.id}.jpg`}
                      alt={`صورة ${selectedUser.name}`}
                      width={144} height={144}
                      className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=2563eb&size=200&color=fff`; }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">ID: {selectedUser.id}</p>
                  <button onClick={() => window.open(`/api/proxy/uploads/${selectedUser.id}_card.jpg`, '_blank')}
                    className="mt-2 text-blue-600 text-xs hover:underline">عرض الصورة كاملة</button>
                </div>

                {/* البيانات */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'الاسم الكامل', value: selectedUser.name },
                    { label: 'الهاتف', value: selectedUser.phone },
                    { label: 'الاسم الأول', value: selectedUser.f_name || '-' },
                    { label: 'الاسم الأخير', value: selectedUser.last_name || '-' },
                    { label: 'الرقم الجامعي', value: selectedUser.uni_number || '-' },
                    { label: 'السنة', value: String(selectedUser.year1 || '-') },
                    { label: 'النوع', value: selectedUser.gender || '-' },
                    { label: 'المدينة', value: selectedUser.city || '-' },
                    { label: 'الجامعة', value: selectedUser.university || '-' },
                    { label: 'المسمى الوظيفي', value: selectedUser.title || '-' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                      <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">{value}</p>
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">العنوان</label>
                    <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 min-h-[50px]">{selectedUser.address || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">نوع المستخدم</label>
                    <p className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">{getStatusBadge(0, selectedUser.user_type)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">الحالة</label>
                    <p className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${selectedUser.block === 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {selectedUser.block === 1 ? 'محظور' : 'نشط'}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">رمز التفعيل (OTP)</label>
                    <p className="text-sm font-bold tracking-widest text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 text-center">{selectedUser.auth || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">تاريخ التسجيل</label>
                    <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">{formatDate(selectedUser.date1)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">وقت إنشاء الحساب</label>
                    <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100" dir="ltr">{formatDateTime(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">آخر تحديث</label>
                    <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100" dir="ltr">{formatDateTime(selectedUser.updated_at)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">الجهاز</label>
                    <p className="text-xs font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 break-all">{selectedUser.device_uuid || '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">ملاحظات</label>
                    <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 min-h-[60px] whitespace-pre-wrap">{selectedUser.note || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
                <button onClick={() => setIsUserModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium">إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UserTransactionsModal isOpen={transactionsModal.isOpen} onClose={() => setTransactionsModal(prev => ({ ...prev, isOpen: false }))} userId={transactionsModal.userId} userName={transactionsModal.userName} />
      <UserSubscriptionsModal isOpen={subscriptionsModal.isOpen} onClose={() => setSubscriptionsModal(prev => ({ ...prev, isOpen: false }))} userId={subscriptionsModal.userId} userName={subscriptionsModal.userName} />
      <UserNotificationsModal isOpen={notificationsModal.isOpen} onClose={() => setNotificationsModal(prev => ({ ...prev, isOpen: false }))} userId={notificationsModal.userId} userName={notificationsModal.userName} />
    </div>
  );
}
