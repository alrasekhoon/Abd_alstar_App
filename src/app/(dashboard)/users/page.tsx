'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import debounce from 'lodash.debounce';

type User = {
  id: number;
  name: string;
  phone: string;
  pass1: string;
  email: string;
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
};

type Subscription = {
  id: number;
  userid: number;
  materialid: number;
  type1: string;
  price1: string;
  material_name: string;
  material_code: string;
};

type Payment = {
  id: number;
  user_id: number;
  mony1: string;
  type1: string;
  pay_type: string;
  pay: number;
  note: string;
};

type Bill = {
  id?: number;
  billId: string;
  user_id: number;
  delv_type: string;
  delv_price: string;
  rec_name: string;
  rec_phone: string;
  note: string;
  total: string;
  status: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [subscriptions, setSubscriptions] = useState<Record<number, Subscription[]>>({});
  const [loadingSubscriptions, setLoadingSubscriptions] = useState<Record<number, boolean>>({});
  const [expandedTab, setExpandedTab] = useState<Record<number, string>>({});
  const [payments, setPayments] = useState<Record<number, Payment[]>>({});
  const [loadingPayments, setLoadingPayments] = useState<Record<number, boolean>>({});
  const [bills, setBills] = useState<Record<number, Bill[]>>({});
  const [loadingBills, setLoadingBills] = useState<Record<number, boolean>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState('الكل');
  const [editingUserType, setEditingUserType] = useState<number | null>(null);

  const API_URL = '/api/proxy/cp_users.php';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const response = await fetch(`${API_URL}?refresh=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) throw new Error('فشل في جلب بيانات المستخدمين');
      const result = await response.json();
      setUsers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSubscriptions = async (userId: number) => {
    try {
      setLoadingSubscriptions(prev => ({ ...prev, [userId]: true }));
      const timestamp = Date.now();
      const response = await fetch(`/api/proxy/cp_subscriptions.php?userid=${userId}&refresh=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) throw new Error('فشل في جلب اشتراكات المستخدم');
      const result = await response.json();
      setSubscriptions(prev => ({ ...prev, [userId]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الاشتراكات');
    } finally {
      setLoadingSubscriptions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const fetchUserPayments = async (userId: number) => {
    try {
      setLoadingPayments(prev => ({ ...prev, [userId]: true }));
      const timestamp = Date.now();
      const response = await fetch(`/api/proxy/cp_payments.php?userid=${userId}&refresh=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) throw new Error('فشل في جلب دفعات المستخدم');
      const result = await response.json();
      setPayments(prev => ({ ...prev, [userId]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الدفعات');
    } finally {
      setLoadingPayments(prev => ({ ...prev, [userId]: false }));
    }
  };

  const fetchUserBills = async (userId: number) => {
    try {
      setLoadingBills(prev => ({ ...prev, [userId]: true }));
      const timestamp = Date.now();
      const response = await fetch(`/api/proxy/cp_user_show_bill.php?userid=${userId}&refresh=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) throw new Error('فشل في جلب فواتير المستخدم');
      const result = await response.json();
      setBills(prev => ({ ...prev, [userId]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الفواتير');
    } finally {
      setLoadingBills(prev => ({ ...prev, [userId]: false }));
    }
  };

  const toggleExpandTab = (userId: number, tab: string) => {
    setExpandedTab(prev => 
      prev[userId] === tab 
        ? { ...prev, [userId]: '' } 
        : { ...prev, [userId]: tab }
    );
    
    if (tab === 'subscriptions' && !subscriptions[userId]) {
      fetchUserSubscriptions(userId);
    } else if (tab === 'payments' && !payments[userId]) {
      fetchUserPayments(userId);
    } else if (tab === 'bills' && !bills[userId]) {
      fetchUserBills(userId);
    }
  };

  const showUserDetailsModal = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const updateUserType = async (userId: number, newUserType: string) => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_URL}?id=${userId}&refresh=${timestamp}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store',
        body: JSON.stringify({ user_type: newUserType }),
      });
      
      if (!response.ok) throw new Error('فشل في تحديث نوع المستخدم');
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, user_type: newUserType } : user
        )
      );
      
      setEditingUserType(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // تطبيق فلترة البحث
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) || 
        user.phone.includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.uni_number?.toLowerCase().includes(term)
      );
    }
    
    // تطبيق فلترة نوع المستخدم
    if (userTypeFilter !== 'الكل') {
      filtered = filtered.filter(user => user.user_type === userTypeFilter);
    }
    
    return filtered;
  }, [users, searchTerm, userTypeFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => 
    Math.ceil(filteredUsers.length / itemsPerPage), 
    [filteredUsers.length, itemsPerPage]
  );

  const toggleBlock = useCallback(async (userId: number, currentBlock: number) => {
    const newBlock = currentBlock === 1 ? 0 : 1;
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_URL}?id=${userId}&refresh=${timestamp}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store',
        body: JSON.stringify({ block: newBlock }),
      });
      
      if (!response.ok) throw new Error('فشل في تحديث حالة المستخدم');
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, block: newBlock } : user
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    }
  }, []);

  const handleSearch = debounce((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, 300);

  // إحصائيات أنواع المستخدمين
  const userTypeStats = useMemo(() => {
    const stats = {
      'غير موثوق': 0,
      'موثوق': 0,
      'vip': 0,
      'آخر': 0
    };
    
    users.forEach(user => {
      if (user.user_type === 'غير موثوق') {
        stats['غير موثوق']++;
      } else if (user.user_type === 'موثوق') {
        stats['موثوق']++;
      } else if (user.user_type === 'vip') {
        stats['vip']++;
      } else {
        stats['آخر']++;
      }
    });
    
    return stats;
  }, [users]);

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
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <div className="text-sm text-gray-600">
            إجمالي المستخدمين: {filteredUsers.length}
          </div>
        </div>

        {/* إحصائيات أنواع المستخدمين */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-800 font-bold text-xl">{userTypeStats['غير موثوق']}</div>
            <div className="text-blue-600 text-sm">غير موثوق</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-800 font-bold text-xl">{userTypeStats['موثوق']}</div>
            <div className="text-green-600 text-sm">موثوق</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-800 font-bold text-xl">{userTypeStats['vip']}</div>
            <div className="text-purple-600 text-sm">VIP</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-gray-800 font-bold text-xl">{userTypeStats['آخر']}</div>
            <div className="text-gray-600 text-sm">آخر</div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          
          <div className="relative flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">فلترة حسب رقم الهاتف او لأسم</label>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 p-2.5"
              placeholder="ابحث بالاسم، الهاتف، البريد أو الرقم الجامعي..."
              onChange={(e) => handleSearch(e.target.value)}
              defaultValue={searchTerm}
            />
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">فلترة حسب النوع</label>
            <select
              value={userTypeFilter}
              onChange={(e) => {
                setUserTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <option value="الكل">الكل</option>
              <option value="غير موثوق">غير موثوق</option>
              <option value="موثوق">موثوق</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الهاتف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الحظر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">العمليات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <>
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.uni_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserType === user.id ? (
                        <select
                          value={user.user_type || ''}
                          onChange={(e) => updateUserType(user.id, e.target.value)}
                          onBlur={() => setEditingUserType(null)}
                          className="text-sm border border-gray-300 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        >
                          <option value="">اختر النوع</option>
                          <option value="غير موثوق">غير موثوق</option>
                          <option value="موثوق">موثوق</option>
                          <option value="vip">VIP</option>
                        </select>
                      ) : (
                        <div 
                          className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 p-1 rounded"
                          onClick={() => setEditingUserType(user.id)}
                          title="انقر للتعديل"
                        >
                          {user.user_type || 'غير محدد'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleBlock(user.id, user.block)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.block === 1 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.block === 1 ? 'محظور' : 'نشط'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        onClick={() => showUserDetailsModal(user)}
                        className="p-1 rounded-full hover:bg-gray-200 transition"
                        aria-label="عرض التفاصيل"
                        title="التفاصيل"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => setEditingUserType(user.id)}
                        className="p-1 rounded-full hover:bg-gray-200 transition"
                        aria-label="تعديل نوع المستخدم"
                        title="تعديل النوع"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => toggleExpandTab(user.id, 'subscriptions')}
                        className={`p-1 rounded-full hover:bg-gray-200 transition ${
                          expandedTab[user.id] === 'subscriptions' ? 'bg-blue-100 text-blue-600' : ''
                        }`}
                        aria-label="عرض الاشتراكات"
                        title="الاشتراكات"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => toggleExpandTab(user.id, 'payments')}
                        className={`p-1 rounded-full hover:bg-gray-200 transition ${
                          expandedTab[user.id] === 'payments' ? 'bg-green-100 text-green-600' : ''
                        }`}
                        aria-label="عرض الدفعات"
                        title="الدفعات"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => toggleExpandTab(user.id, 'bills')}
                        className={`p-1 rounded-full hover:bg-gray-200 transition ${
                          expandedTab[user.id] === 'bills' ? 'bg-purple-100 text-purple-600' : ''
                        }`}
                        aria-label="عرض الفواتير"
                        title="الفواتير"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {/* Subscription Details Row */}
                  {expandedTab[user.id] === 'subscriptions' && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        {loadingSubscriptions[user.id] ? (
                          <div className="flex justify-center py-2">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="overflow-hidden transition-all duration-300">
                            <h3 className="font-medium text-gray-700 mb-2">اشتراكات المستخدم:</h3>
                            {subscriptions[user.id]?.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>                        
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المادة</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {subscriptions[user.id].map(sub => (
                                      <tr key={sub.id}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{sub.materialid}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{sub.type1}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{sub.price1}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">لا يوجد اشتراكات لهذا المستخدم</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}

                  {/* Payment Details Row */}
                  {expandedTab[user.id] === 'payments' && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        {loadingPayments[user.id] ? (
                          <div className="flex justify-center py-2">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="overflow-hidden transition-all duration-300">
                            <h3 className="font-medium text-gray-700 mb-2">دفعات المستخدم:</h3>
                            {payments[user.id]?.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">العملة</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">طريقة الدفع</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">ملاحظات</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {payments[user.id].map(payment => (
                                      <tr key={payment.id}>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          {payment.pay === 0 ? (
                                            <span className="text-sm font-medium text-green-600">دفع</span>
                                          ) : (
                                            <span className="text-sm font-medium text-red-600">سحب</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{payment.mony1}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{payment.type1}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{payment.pay_type}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate" title={payment.note}>
                                          {payment.note || 'لا يوجد'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">لا يوجد دفعات لهذا المستخدم</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  
                  {/* Bill Details Row */}
                  {expandedTab[user.id] === 'bills' && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        {loadingBills[user.id] ? (
                          <div className="flex justify-center py-2">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="overflow-hidden transition-all duration-300">
                            <h3 className="font-medium text-gray-700 mb-2">فواتير المستخدم:</h3>
                            {bills[user.id]?.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">رقم الفاتورة</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">نوع التوصيل</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">سعر التوصيل</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المستلم</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">هاتف المستلم</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المجموع</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {bills[user.id].map(bill => (
                                      <tr key={bill.id || bill.billId}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{bill.id}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{bill.delv_type}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{bill.delv_price}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{bill.rec_name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{bill.rec_phone}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{bill.total}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          <span className={`px-2 py-1 text-xs rounded-full ${
                                            bill.status === 'completed' 
                                              ? 'bg-green-100 text-green-800' 
                                              : bill.status === 'pending'
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {bill.status === 'completed' ? 'مكتمل' : bill.status === 'pending' ? 'قيد الانتظار' : 'ملغى'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">لا يوجد فواتير لهذا المستخدم</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">تفاصيل المستخدم #{selectedUser.id}</h3>
                    <p className="text-sm text-gray-500 mt-1">آخر تحديث: {new Date().toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => setShowUserDetails(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* العمود الأول - المعلومات الشخصية */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg border-b pb-2">المعلومات الشخصية</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">الاسم الأول</label>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {selectedUser.f_name || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">الاسم الأخير</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.last_name || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">اسم المستخدم</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">النوع</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {selectedUser.gender || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">نوع المستخدم</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {selectedUser.user_type || 'غير محدد'}
                      </p>
                    </div>
                  </div>

                  {/* العمود الثاني - معلومات الاتصال */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg border-b pb-2">معلومات الاتصال</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                      <p className="mt-1 text-sm text-gray-900 break-all">
                        {selectedUser.email || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">رقم الهاتف</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.phone || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">المدينة</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.city || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">العنوان</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.address || 'غير محدد'}
                      </p>
                    </div>
                  </div>

                  {/* العمود الثالث - المعلومات الأكاديمية والإضافية */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg border-b pb-2">معلومات إضافية</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">الرقم الجامعي</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.uni_number || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">السنة</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.year1 || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">حالة الحساب</label>
                      <p className="mt-1 text-sm">
                        <span className={`px-2 py-1 rounded-full ${
                          selectedUser.block === 1 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedUser.block === 1 ? 'محظور' : 'نشط'}
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">حالة المستخدم</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {selectedUser.status || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">كود التفعيل</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.auth || 'غير محدد'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* الملاحظات */}
                <div className="mt-8">
                  <h4 className="font-semibold text-lg border-b pb-2 mb-4">الملاحظات</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-line">
                      {selectedUser.note || 'لا توجد ملاحظات'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              عرض <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> إلى{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
              </span> من{' '}
              <span className="font-medium">{filteredUsers.length}</span> نتائج
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50"
              >
                السابق
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded-md text-sm font-medium ${
                      currentPage === pageNum ? 'bg-blue-500 text-white' : ''
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-3 py-1">...</span>
              )}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا يوجد مستخدمين</h3>
            <p className="mt-1 text-sm text-gray-500">لا توجد نتائج تطابق بحثك</p>
          </div>
        )}
      </div>
    </div>
  );
}