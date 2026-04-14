'use client';

import { useState, useEffect, useCallback } from 'react';

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

type ApiResponse = {
  success: boolean;
  users?: User[];
  pagination?: PaginationInfo;
  error?: string;
};

export default function VerifyUsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const API_URL = '/api/proxy/cp_news_new.php';

  // Debounce للبحث
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async (page: number = 1, search: string = '') => {
    try {
      if (page === 1) setIsLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50', // Fetch more on sidebar for easier scrolling
        user_type: 'غير موثوق', // فلتر الطلاب الغير موثوقين فقط
        ...(search && { search })
      });

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
      
      if (!response.ok) throw new Error(`فشل في جلب البيانات: ${response.status}`);
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) throw new Error(result.error || 'حدث خطأ غير متوقع');
      
      if (result.users) {
        if (page === 1) {
          setUsers(result.users);
        } else {
          setUsers(prev => [...prev, ...(result.users || [])]);
        }
        setPagination(result.pagination || null);
        
        // Update selected user info safely if it changed remotely
        if (selectedUser) {
          const stillExists = (page === 1 ? result.users : [...users, ...result.users]).find(u => u.id === selectedUser.id);
          if (stillExists) setSelectedUser(stillExists);
          else setSelectedUser(null);
        }
      } else {
        if (page === 1) {
          setUsers([]);
          setSelectedUser(null);
        }
        setPagination(null);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      if (page === 1) setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser, users]);

  useEffect(() => {
    fetchUsers(1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const loadMore = () => {
    if (pagination && pagination.currentPage < pagination.totalPages) {
      fetchUsers(pagination.currentPage + 1, debouncedSearch);
    }
  };

  const handleVerify = async (user: User) => {
    if (!confirm(`هل أنت متأكد من توثيق حساب الطالب (${user.name})؟`)) return;
    try {
      setIsActionLoading(true);
      
      // Update User Type
      const updateRes = await fetch(`${API_URL}?id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_type: 'موثوق' }),
      });
      
      const updateResult = await updateRes.json();
      if (!updateResult.success) throw new Error(updateResult.error || 'فشل في عملية التوثيق');

      // إرسال إشعار فوري وتلقائي
      await fetch('/api/proxy/cp_notifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title: 'توثيق الحساب',
          body: 'مرحباً، يسعدنا إعلامك بأنه تم توثيق حسابك في المنصة بنجاح. يمكنك الآن الاستفادة من كافة الخدمات.',
          url1: '',
          note1: ''
        }),
      });

      alert('تم توثيق الحساب وإرسال الإشعار بنجاح!');
      setSelectedUser(null);
      fetchUsers(1, debouncedSearch);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBlock = async (user: User) => {
    if (!confirm(`هل أنت متأكد من حظر الطالب (${user.name})؟`)) return;
    try {
      setIsActionLoading(true);
      const updateRes = await fetch(`${API_URL}?id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block: 1 }),
      });
      
      const updateResult = await updateRes.json();
      if (!updateResult.success) throw new Error(updateResult.error || 'فشل في الحظر');
      
      alert('تم حظر الطالب بنجاح!');
      // Update the local state instead of resetting selection if we just blocked
      setSelectedUser({ ...user, block: 1 });
      fetchUsers(1, debouncedSearch);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedUser || !rejectReason.trim()) return;
    try {
      setIsActionLoading(true);

      // فقط إرسال إشعار الرفض دون تغيير الحالة
      await fetch('/api/proxy/cp_notifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          title: 'تحديث بخصوص توثيق حسابك',
          body: `ملاحظة إدارية بخصوص توثيق حسابك:\n${rejectReason}\nيرجى تحديث بياناتك والمحاولة مجدداً.`,
          url1: '',
          note1: ''
        }),
      });

      alert('تم رفض التوثيق وإرسال الإشعار بنجاح!');
      setIsRejectModalOpen(false);
      setRejectReason('');
      setSelectedUser(null);
      fetchUsers(1, debouncedSearch);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-[90rem] h-[calc(100vh-80px)] flex flex-col font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">مراجعة الطلاب <span className="text-amber-500 font-light">الغير موثوقين</span></h1>
          <p className="text-slate-500 mt-2 font-medium">إدارة وتوثيق حسابات الطلاب بنظام حماية واحترافية متقدم</p>
        </div>
        <div className="bg-slate-900 text-amber-400 border border-slate-800 px-6 py-3 rounded-2xl font-bold shadow-xl shadow-slate-900/10 flex items-center gap-4 transition-transform hover:scale-105">
          <div className="flex bg-amber-400/10 p-2 rounded-xl">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
             </svg>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">الطلاب المعلقين</span>
            <span className="text-lg leading-none block">{pagination?.totalUsers || 0} طالباً</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden pb-4">
        {/* القائمة الجانبية */}
        <div className="w-full md:w-[380px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden h-[40vh] md:h-full shrink-0">
          {/* شريط البحث سريع الوصول */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
            <div className="relative group">
              <input
                type="text"
                placeholder="ابحث هنا مستخدما الاسم او الهاتف..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-5 py-3.5 pr-12 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none transition-all bg-white text-slate-800 placeholder-slate-400 font-medium shadow-sm group-hover:border-slate-200"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute right-4 top-3.5 text-slate-300 transition-colors group-focus-within:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* قائمة الطلاب */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 relative bg-slate-50/30">
            {isLoading && users.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
              </div>
            ) : error ? (
              <div className="text-center p-4 text-red-500 font-medium bg-red-50 rounded-xl">{error}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center text-slate-400">
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-bold text-slate-600 text-lg">اللوحة نظيفة تماماً</p>
                <p className="text-sm mt-1">تمت مراجعة حسابات جميع الطلاب</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border relative overflow-hidden group ${
                    selectedUser?.id === user.id 
                      ? 'bg-slate-900 border-slate-800 shadow-xl shadow-slate-900/10 scale-[1.02] z-10' 
                      : 'bg-white border-slate-100 hover:border-amber-300 hover:shadow-md'
                  }`}
                >
                  {selectedUser?.id === user.id && (
                     <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-amber-300 to-amber-500 rounded-r-2xl"></div>
                  )}
                  <div className="flex justify-between items-center pr-3">
                    <div className="flex-1 overflow-hidden">
                      <div className={`font-bold text-[15px] truncate transition-colors ${selectedUser?.id === user.id ? 'text-white' : 'text-slate-800 group-hover:text-amber-700'}`}>{user.name}</div>
                      <div className={`text-xs mt-1.5 font-mono tracking-widest ${selectedUser?.id === user.id ? 'text-amber-400/80' : 'text-slate-400'}`}>{user.phone}</div>
                    </div>
                    {user.block === 1 && (
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ml-2 shrink-0 uppercase tracking-widest border ${selectedUser?.id === user.id ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100'}`}>محظور</span>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {pagination && pagination.currentPage < pagination.totalPages && !isLoading && (
              <button 
                onClick={loadMore}
                className="w-full py-4 mt-6 text-sm text-slate-700 font-bold bg-white hover:bg-slate-900 hover:border-slate-900 hover:text-amber-400 border-2 border-slate-200 rounded-2xl transition-all shadow-sm"
              >
                تحميل المزيد ( المتبقي {(pagination.totalUsers - users.length)} )
              </button>
            )}
          </div>
        </div>

        {/* المربع الرئيسي */}
        <div className="w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-[50vh] md:h-full flex flex-col relative overflow-hidden">
          {!selectedUser ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <div className="bg-white p-8 rounded-full shadow-sm border border-slate-100 mb-6 relative">
                 <div className="absolute inset-0 bg-amber-400/10 rounded-full animate-pulse"></div>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                 </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-600">اختر طالباً للبدء في المراجعة</h2>
              <p className="text-slate-400 mt-2">يجب اتخاذ قرار التوثيق أو الحظر لكل طالب بعناية.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              
              {/* Header */}
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-900 rounded-[2rem] p-6 shadow-xl shadow-slate-900/10 gap-6 border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="h-20 w-20 bg-gradient-to-br from-slate-800 to-black ring-4 ring-amber-400/20 rounded-2xl flex items-center justify-center text-amber-500 text-3xl font-black shadow-inner shrink-0">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">{selectedUser.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">ID: {selectedUser.id}</span>
                      <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/20 shadow-inner">حالة الحساب: غير موثوق</span>
                      {selectedUser.block === 1 && (
                        <span className="text-xs font-bold bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center gap-1.5 shadow-inner">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                          محظور مؤقتاً
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 w-full xl:w-auto relative z-10 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                  <button
                    onClick={() => handleBlock(selectedUser)}
                    disabled={isActionLoading || selectedUser.block === 1}
                    className="flex-1 xl:flex-none border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 px-5 py-3 rounded-xl transition-all font-bold disabled:opacity-30 flex justify-center items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    حظر
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isActionLoading}
                    className="flex-1 xl:flex-none border-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500 px-5 py-3 rounded-xl transition-all font-bold disabled:opacity-30 flex justify-center items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    رفض وإشعار
                  </button>
                  <button
                    onClick={() => handleVerify(selectedUser)}
                    disabled={isActionLoading}
                    className="flex-1 xl:flex-none bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 hover:from-amber-300 hover:to-amber-500 shadow-xl shadow-amber-500/20 px-8 py-3 rounded-xl transition-all font-extrabold disabled:opacity-50 flex justify-center items-center gap-2 transform hover:scale-[1.02]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    قبول وتوثيق وإرسال إشعار
                  </button>
                </div>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* 1 */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:border-amber-200 transition-all group">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">معلومات التواصل</h3>
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 mb-1.5">الاسم الكامل المطابق</span>
                      <span className="text-slate-800 font-bold text-base">{selectedUser.f_name} {selectedUser.last_name || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 mb-1.5">الهاتف المحمول</span>
                      <span className="text-slate-900 font-mono text-lg font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-block" dir="ltr">{selectedUser.phone}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 mb-1.5">الجنس / اللقب</span>
                      <span className="text-slate-600 font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-block">{selectedUser.gender || '-'} / {selectedUser.title || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 2 */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:border-amber-200 transition-all group">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">الدراسة الأكاديمية</h3>
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 mb-1.5">الجامعة والكليّة</span>
                      <span className="text-slate-800 font-bold text-base">{selectedUser.university || 'غير محدد'}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 mb-1.5">الرقم الجامعي</span>
                      <span className="text-slate-800 font-mono font-bold tracking-widest bg-slate-50 px-3 py-1 border border-slate-100 rounded-lg inline-block">{selectedUser.uni_number || 'غير متوفر'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-400 mb-1.5">تاريخ الإنشاء</span>
                        <span className="text-slate-600 font-bold text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 block">{formatDate(selectedUser.created_at || selectedUser.date1)}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-400 mb-1.5">السنة الدراسية</span>
                        <span className="text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg text-sm font-black block">{selectedUser.year1 || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:border-amber-200 transition-all group">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">العنوان والملاحظات</h3>
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 mb-1.5">المدينة</span>
                      <span className="text-slate-800 font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-block">{selectedUser.city || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 mb-1.5">عنوان مفصل / توصيل</span>
                      <span className="text-slate-700 leading-relaxed block bg-slate-50 p-3 border border-slate-100 rounded-xl">{selectedUser.address || '-'}</span>
                    </div>
                    {selectedUser.note && (
                      <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl mt-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1 h-full bg-red-400"></div>
                        <span className="block text-[10px] font-black uppercase text-red-400 tracking-wider mb-1.5">ملاحظات المشرف:</span>
                        <span className="text-red-900 text-sm font-bold">{selectedUser.note}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:border-amber-200 transition-all group">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">مصادقات التطبيق (OTP)</h3>
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl"></div>
                       <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl"></div>
                      <span className="block text-[11px] font-bold text-amber-500/70 uppercase tracking-widest mb-3 relative z-10">رمز التفعيل (الـ OTP)</span>
                      <span className="text-4xl font-black tracking-[0.25em] text-white block my-1 relative z-10">
                        {selectedUser.auth || '000000'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-2 block relative z-10">استخدم هذا الرمز لتوثيق ملكية الطالب</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 mb-1.5">المعرف الفريد (Device UUID)</span>
                      <span className="text-slate-500 text-xs font-mono break-all bg-slate-50 border border-slate-100 p-2 rounded-xl block">{selectedUser.device_uuid || '-'}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* مودال الرفض والإشعار */}
      {isRejectModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRejectModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">رفض التوثيق وإرسال إشعار</h3>
                <p className="text-sm text-slate-500 mt-1">يُرجى كتابة سبب الرفض لتوجيه الطالب ({selectedUser.name})</p>
              </div>
            </div>
            <div className="p-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">سبب الرفض (سيصل للطالب):</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-4 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none min-h-[120px]"
                placeholder="مثال: يرجى كتابة الاسم الثلاثي باللغة العربية بدلاً من الإنجليزية، وتعديل صورة البطاقة..."
              ></textarea>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={handleRejectSubmit}
                disabled={isActionLoading || !rejectReason.trim()}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50"
              >
                تحديث وارسال الإشعار
              </button>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
