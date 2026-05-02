'use client';

import { useState, useEffect, useCallback } from 'react';

type Transaction = {
  id: number;
  user_id: number;
  mony: string;
  type: 'deposit' | 'withdraw';
  note: string;
};

type User = {
  name: string;
  phone: string;
  gender?: string;
};

type Summary = {
  total_deposit: number;
  total_withdraw: number;
  balance: number;
};

interface UserTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

export default function UserTransactionsModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName 
}: UserTransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);
  const [paidTransactions, setPaidTransactions] = useState<number[]>([]); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  
  // حالات الرصيد المؤجل (بالثواني للتجريب)
  const [isDeferred, setIsDeferred] = useState(false);
  const [deferSeconds, setDeferSeconds] = useState('60'); // المهلة بالثواني
  const [repeatSeconds, setRepeatSeconds] = useState('25'); // تكرار التذكير بالثواني
  const [noReminder, setNoReminder] = useState(false);

  const [quickNotification, setQuickNotification] = useState({
    isOpen: false,
    title: '',
    body: ''
  });
  
  const [newTransaction, setNewTransaction] = useState({
    mony: '',
    type: 'deposit' as 'deposit' | 'withdraw',
    note: ''
  });

  const API_URL = '/api/proxy/user_transactions.php';

  // دالة المخاطبة بناءً على الجنس
  const getGreeting = useCallback(() => {
    const firstName = userName.split(' ')[0] || '';
    return user?.gender === 'أنثى' ? `العزيزة ${firstName}` : `العزيز ${firstName}`;
  }, [userName, user?.gender]);

  useEffect(() => {
    if (isOpen && userId) {
      const storedDeleted = localStorage.getItem(`deleted_trans_${userId}`);
      if (storedDeleted) setDeletedTransactions(JSON.parse(storedDeleted));
      
      const storedPaid = localStorage.getItem(`paid_trans_${userId}`);
      if (storedPaid) setPaidTransactions(JSON.parse(storedPaid));
    }
  }, [isOpen, userId]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_URL}?user_id=${userId}&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store' as RequestCache
      });
      
      if (!response.ok) throw new Error(`فشل في جلب البيانات: ${response.status}`);
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'حدث خطأ غير متوقع');

      setUser(result.user || null);
      setTransactions(result.rseed || result.transactions || []);
      setSummary(result.summary || { total_deposit: 0, total_withdraw: 0, balance: 0 });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) fetchData();
  }, [isOpen, userId, fetchData]);

  // إرسال إشعار تلقائي كل 25 ثانية للدفعات المؤجلة (للتجريب)
  useEffect(() => {
    if (!isOpen || transactions.length === 0) return;

    const interval = setInterval(() => {
      const deferredItems = transactions.filter(t => 
        t.note && t.note.startsWith('DEFERRED|') && !paidTransactions.includes(t.id)
      );

      if (deferredItems.length > 0) {
        deferredItems.forEach(async (item) => {
          try {
            const parts = item.note.split('|');
            const deadlineSec = parts[1] || '60';
            const hasNoReminder = parts[3] === 'NONE';
            
            if (hasNoReminder) return; // تخطي إذا كان التذكير معطلاً

            const amount = Number(item.mony).toLocaleString();
            
            await fetch('/api/proxy/cp_notifications.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                title: 'تذكير عاجل: سداد رصيد مؤجل',
                body: `${getGreeting()}،\nنود تذكيرك بضرورة سداد الرصيد المؤجل بقيمة (${amount} ل.س). المهلة المحددة هي (${deadlineSec} ثواني)، يرجى السداد لتجنب انقطاع الخدمة.`,
                url1: '',
                note1: ''
              }),
            });
            console.log(`تم إرسال إشعار تلقائي للدفعة ${item.id}`);
          } catch (e) {
            console.error('فشل إرسال الإشعار التلقائي', e);
          }
        });
      }
    }, 25000); // 25 ثانية

    return () => clearInterval(interval);
  }, [isOpen, transactions, paidTransactions, userId, getGreeting]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.mony) {
      setError('المبلغ مطلوب');
      return;
    }

    try {
      setIsAdding(true);
      setError('');
      
      let finalNote = newTransaction.note;
      if (isDeferred && newTransaction.type === 'deposit') {
        const reminderFlag = noReminder ? 'NONE' : 'ACTIVE';
        // صيغة الملاحظة: DEFERRED|المهلة|التكرار|حالة_التذكير|الملاحظة_الأصلية
        finalNote = `DEFERRED|${deferSeconds}|${repeatSeconds}|${reminderFlag}|${newTransaction.note}`;
      }
      
      const requestBody = {
        user_id: userId,
        mony: newTransaction.mony,
        type: newTransaction.type,
        note: finalNote
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store' as RequestCache,
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(`خطأ في السيرفر: ${response.status}`);
      if (!result.success) throw new Error(result.error || 'فشل في إضافة الدفعة');

      await fetchData();
      setShowAddForm(false);
      
      if (requestBody.type === 'deposit') {
        if (isDeferred) {
          setQuickNotification({
            isOpen: true,
            title: 'رصيد مؤجل',
            body: `${getGreeting()}،\nتم إضافة رصيد مؤجل بقيمة (${Number(requestBody.mony).toLocaleString()} ل.س.).\nيرجى السداد خلال المدة المذكورة (${deferSeconds} ثواني) لتجنب توقف الحساب.`
          });
        } else {
          setQuickNotification({
            isOpen: true,
            title: 'إشعار مالي',
            body: `${getGreeting()}،\nتمت إضافة رصيد بقيمة (${Number(requestBody.mony).toLocaleString()} ل.س.) إلى حسابك بنجاح.\nيُرجى الاشتراك فوراً لضمان الحصول على الخدمة وفقاً للأسعار الحالية قبل أي تعديل محتمل.\nنسعد دائماً بخدمتكم، ونتمنى لكم دوام التوفيق.`
          });
        }
      }

      setNewTransaction({ mony: '', type: 'deposit', note: '' });
      setIsDeferred(false);
      setDeferSeconds('60');
      setRepeatSeconds('25');
      setNoReminder(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
    const transToDelete = transactions.find(t => t.id === transactionId);

    try {
      setError('');
      const response = await fetch(`${API_URL}?id=${transactionId}&user_id=${userId}`, {
        method: 'DELETE',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        cache: 'no-store' as RequestCache
      });

      const result = await response.json();
      if (!response.ok) throw new Error(`خطأ في السيرفر: ${response.status}`);
      if (!result.success) throw new Error(result.error || 'فشل في حذف الدفعة');

      if (transToDelete) {
        const newDeleted = [...deletedTransactions, transToDelete];
        setDeletedTransactions(newDeleted);
        localStorage.setItem(`deleted_trans_${userId}`, JSON.stringify(newDeleted));
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleMarkAsPaid = async (transactionId: number) => {
    try {
      const updatedPaid = [...paidTransactions, transactionId];
      setPaidTransactions(updatedPaid);
      localStorage.setItem(`paid_trans_${userId}`, JSON.stringify(updatedPaid));
      
      // محاولة الإرسال للسيرفر لتحديث الحالة إذا أمكن
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transactionId, user_id: userId, status: 'paid' })
      });
    } catch (e) {
      console.log('تم التحديث محلياً', e);
    }
  };

  const handleSendQuickNotification = async () => {
    try {
      setError('');
      setIsSendingNotif(true);
      const response = await fetch('/api/proxy/cp_notifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: quickNotification.title,
          body: quickNotification.body,
          url1: '',
          note1: ''
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('تم إرسال الإشعار للطالب بنجاح!');
        setQuickNotification({ isOpen: false, title: '', body: '' });
      } else {
        throw new Error(result.error || 'فشل في إرسال الإشعار');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء الإرسال');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const parseNote = (note: string, id: number) => {
    if (!note) return { isDeferred: false, actualNote: '-' };
    if (note.startsWith('DEFERRED|')) {
      const parts = note.split('|');
      const isPaid = paidTransactions.includes(id);
      return { 
        isDeferred: !isPaid, 
        isPaid: isPaid,
        deadline: parts[1] || '0', 
        repeat: parts[2] || '0',
        actualNote: parts[4] || '-' 
      };
    }
    return { isDeferred: false, actualNote: note };
  };

  // حساب دقيق للمشتريات والرصيد المسترد
  const explicitWithdrawals = transactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + Number(t.mony), 0);
  const totalDeposits = summary ? summary.total_deposit : 0;
  const currentBalance = summary ? summary.balance : 0;
  const semesterPurchases = Math.max(0, totalDeposits - explicitWithdrawals - currentBalance);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden relative z-10 flex flex-col">
        
        {/* الهيدر */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 bg-gray-50 flex-wrap gap-4 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">إدارة الدفعات المالية</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1 font-medium">
              {userName} - ID: {userId} {user && `| الهاتف: ${user.phone}`}
            </p>
          </div>

          {/* الإحصائيات العلوية */}
          {summary && !isLoading && !error && (
            <div className="flex gap-2 md:gap-4 bg-white px-3 md:px-5 py-2 md:py-3 rounded-xl border border-gray-200 shadow-sm text-xs md:text-sm w-full lg:w-auto overflow-x-auto">
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-bold text-gray-500 uppercase text-[10px] md:text-xs">الرصيد الحالي</span>
                <span className={`font-extrabold text-base md:text-lg ${currentBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {currentBalance.toLocaleString()}
                </span>
              </div>
              <div className="w-px bg-gray-200 shrink-0"></div>
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-bold text-gray-500 uppercase text-[10px] md:text-xs">مشتريات الفصل</span>
                <span className="font-extrabold text-purple-600 text-base md:text-lg">{semesterPurchases.toLocaleString()}</span>
              </div>
              <div className="w-px bg-gray-200 shrink-0"></div>
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-bold text-gray-500 uppercase text-[10px] md:text-xs">إجمالي الإيداع</span>
                <span className="font-extrabold text-green-600 text-base md:text-lg">{totalDeposits.toLocaleString()}</span>
              </div>
              <div className="w-px bg-gray-200 shrink-0"></div>
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-bold text-gray-500 uppercase text-[10px] md:text-xs">الرصيد المسترد</span>
                <span className="font-extrabold text-red-600 text-base md:text-lg">{explicitWithdrawals.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex-1 md:flex-none justify-center bg-gray-100 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl font-bold hover:bg-gray-200 transition shadow-sm flex items-center gap-1.5 text-xs md:text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="hidden md:inline">سجل المحذوفات</span>
              <span className="md:hidden">المحذوفات</span>
              {deletedTransactions.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">{deletedTransactions.length}</span>
              )}
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-3 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5 text-xs md:text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              إضافة دفعة
            </button>
            <button onClick={onClose} className="hidden md:flex text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-200 transition border border-transparent hover:border-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* محتوى النافذة الرئيسي */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-50 md:bg-white">
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg text-sm" role="alert">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {/* نموذج الإضافة المحسن */}
          {showAddForm && (
            <div className="mb-8 p-5 md:p-7 border border-blue-200 rounded-2xl bg-white shadow-xl shadow-blue-900/5 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6 border-b border-blue-100 pb-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-extrabold text-blue-900 tracking-tight">تفاصيل الدفعة الجديدة</h3>
              </div>

              <form onSubmit={handleAddTransaction} className="flex flex-col gap-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* الحقل 1: المبلغ */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">المبلغ (ل.س)</label>
                    <input type="number" step="0.01" required value={newTransaction.mony} onChange={(e) => setNewTransaction(prev => ({ ...prev, mony: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-extrabold text-blue-800 text-xl shadow-inner transition-all outline-none" placeholder="مثال: 50000" />
                  </div>
                  
                  {/* الحقل 2: نوع العملية */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">نوع العملية</label>
                    <select value={newTransaction.type} onChange={(e) => {
                        setNewTransaction(prev => ({ ...prev, type: e.target.value as 'deposit' | 'withdraw' }));
                        if (e.target.value === 'withdraw') setIsDeferred(false);
                      }} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 shadow-inner cursor-pointer text-lg outline-none"
                    >
                      <option value="deposit">إيداع (إضافة رصيد)</option>
                      <option value="withdraw">سحب (رصيد مسترد)</option>
                    </select>
                  </div>
                </div>

                {/* تصميم جديد لبطاقة الرصيد المؤجل */}
                {newTransaction.type === 'deposit' && (
                  <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${isDeferred ? 'border-orange-400 shadow-md' : 'border-gray-200 bg-gray-50'}`}>
                    {/* رأس البطاقة - زر التبديل */}
                    <label className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${isDeferred ? 'bg-orange-50' : 'hover:bg-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isDeferred ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className={`block font-extrabold text-lg ${isDeferred ? 'text-orange-800' : 'text-gray-700'}`}>رصيد مؤجل السداد</span>
                          <span className="text-xs font-bold text-gray-500 mt-0.5">تفعيل هذا الخيار لجدولة تذكيرات تلقائية للطالب</span>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isDeferred} onChange={(e) => setIsDeferred(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </div>
                    </label>

                    {/* إعدادات البطاقة */}
                    {isDeferred && (
                      <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-orange-100">
                        <div className="relative group">
                          <label className="block text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">تحديد المهلة (ثواني للتجريب)</label>
                          <div className="relative flex items-center">
                            <input type="number" min="1" value={deferSeconds} onChange={(e) => setDeferSeconds(e.target.value)} disabled={noReminder} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-lg font-extrabold rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 block p-3 pr-10 transition-all disabled:opacity-50 outline-none" />
                            <span className="absolute right-3 text-orange-500 font-bold select-none text-xl">⏳</span>
                          </div>
                        </div>
                        
                        <div className="relative group">
                          <label className="block text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">تكرار التذكير كل (ثواني)</label>
                          <div className="relative flex items-center">
                            <input type="number" min="1" value={repeatSeconds} onChange={(e) => setRepeatSeconds(e.target.value)} disabled={noReminder} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-lg font-extrabold rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 block p-3 pr-10 transition-all disabled:opacity-50 outline-none" />
                            <span className="absolute right-3 text-orange-500 font-bold select-none text-xl">🔄</span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end">
                          <label className={`flex items-center justify-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${noReminder ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={noReminder} onChange={(e) => setNoReminder(e.target.checked)} className="w-5 h-5 text-gray-600 rounded focus:ring-gray-500 cursor-pointer" />
                            <span className={`font-extrabold text-sm ${noReminder ? 'text-gray-700' : 'text-gray-500'}`}>بدون تذكير (إلغاء)</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* الحقل 3: الملاحظات (تم نقله للأسفل) */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">ملاحظات (اختياري)</label>
                  <textarea rows={2} value={newTransaction.note} onChange={(e) => setNewTransaction(prev => ({ ...prev, note: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium shadow-inner resize-none outline-none" placeholder="اكتب ملاحظات تفصيلية حول هذه الدفعة هنا..." />
                </div>
                
                <div className="flex gap-3 pt-3 border-t border-gray-100 mt-2">
                  <button type="submit" disabled={isAdding} className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-[0.98]">
                    {isAdding ? 'جاري التنفيذ...' : 'تنفيذ وحفظ الدفعة'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 md:flex-none bg-white border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-sm transform active:scale-[0.98]">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* شريط تحديث البيانات المنفصل */}
          {!isLoading && transactions.length > 0 && !showAddForm && (
            <div className="flex justify-between items-center mb-5 bg-white md:bg-gray-50 p-3 md:px-5 md:py-3 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs md:text-sm font-bold text-gray-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 hidden md:block" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
              </span>
              <button onClick={fetchData} className="text-xs md:text-sm bg-white border border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-gray-700 font-bold py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                تحديث السجل
              </button>
            </div>
          )}

          {/* محتوى الدفعات */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 bg-white md:bg-gray-50/50 rounded-2xl border border-gray-200 md:border-dashed">
              <p className="text-gray-500 font-bold">لا توجد دفعات مالية</p>
            </div>
          ) : (
            <>
              {/* نسخة الحاسوب - جدول */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                <table className="w-full text-right divide-y divide-gray-200 table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800 w-12">#</th>
                      <th className="px-4 py-4 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">المبلغ</th>
                      <th className="px-4 py-4 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">النوع</th>
                      <th className="px-4 py-4 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">ملاحظة / حالة</th>
                      <th className="px-4 py-4 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => {
                      const { isDeferred, isPaid, deadline, repeat, actualNote } = parseNote(transaction.note, transaction.id);
                      
                      return (
                        <tr key={`desk-${transaction.id}`} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-4 text-sm font-extrabold text-gray-400">{index + 1}</td>
                          <td className="px-4 py-4 text-sm font-extrabold">
                            <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                              {Number(transaction.mony).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                              transaction.type === 'deposit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {transaction.type === 'deposit' ? 'إيداع' : 'رصيد مسترد'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-600">
                            <div className="truncate max-w-[200px]" title={actualNote}>{actualNote}</div>
                            {isDeferred && (
                              <div className="mt-1 text-[10px] text-orange-700 font-extrabold bg-orange-100 inline-block px-2 py-1 rounded border border-orange-200 shadow-sm">
                                ⏳ مؤجل لـ {deadline} ث (تذكير كل {repeat} ث)
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 flex gap-2 items-center">
                            {isDeferred && (
                              <button onClick={() => handleMarkAsPaid(transaction.id)} className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm">
                                رصيد مؤجل
                              </button>
                            )}
                            {isPaid && (
                              <span className="bg-blue-50 text-blue-800 text-xs px-3 py-1.5 rounded-lg font-bold border border-blue-200 shadow-sm">
                                ✓ مدفوع
                              </span>
                            )}
                            <button onClick={() => handleDeleteTransaction(transaction.id)} className="text-red-500 hover:text-white border border-red-500 hover:bg-red-500 px-3 py-1.5 rounded-lg transition shadow-sm text-xs font-bold">
                              حذف
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* نسخة الموبايل - بطاقات احترافية */}
              <div className="md:hidden flex flex-col gap-4">
                {transactions.map((transaction, index) => {
                  const { isDeferred, isPaid, deadline, repeat, actualNote } = parseNote(transaction.note, transaction.id);
                  
                  return (
                    <div key={`mob-${transaction.id}`} className={`bg-white p-5 rounded-2xl shadow-sm border relative overflow-hidden ${isDeferred ? 'border-orange-200' : 'border-gray-100'}`}>
                      {isDeferred && <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-400"></div>}
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500 font-bold text-xs bg-gray-100 px-2.5 py-1 rounded-lg">#{index + 1}</span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${transaction.type === 'deposit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {transaction.type === 'deposit' ? 'إيداع رصيد' : 'رصيد مسترد'}
                        </span>
                      </div>
                      
                      <div className="text-center mb-5">
                        <div className={`text-3xl font-extrabold tracking-tight ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(transaction.mony).toLocaleString()} <span className="text-sm font-bold text-gray-500">ل.س</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3.5 mb-5 border border-gray-100">
                        <span className="text-gray-400 block text-[10px] font-bold mb-1 uppercase tracking-wide">الملاحظة</span>
                        <span className="font-medium text-gray-800 text-sm block leading-relaxed">{actualNote}</span>
                        {isDeferred && (
                          <div className="mt-3 inline-block text-[11px] font-extrabold text-orange-700 bg-orange-100 px-2.5 py-1.5 rounded-lg border border-orange-200 shadow-sm">
                            ⏳ مهلة: {deadline} ث | تذكير: كل {repeat} ث
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {isDeferred && (
                          <button onClick={() => handleMarkAsPaid(transaction.id)} className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white py-3 rounded-xl text-sm font-bold shadow-md transition transform active:scale-95">
                            الضغط للتحويل لـ مدفوع
                          </button>
                        )}
                        {isPaid && (
                          <div className="flex-1 bg-blue-50 text-blue-800 py-3 rounded-xl text-sm font-bold text-center border border-blue-200 shadow-sm">
                            ✓ رصيد مدفوع
                          </div>
                        )}
                        <button onClick={() => handleDeleteTransaction(transaction.id)} className={`border-2 border-red-100 text-red-600 bg-white hover:bg-red-50 py-3 rounded-xl text-sm font-bold transition ${isDeferred ? 'w-[80px] shrink-0' : 'flex-1'}`}>
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* الفوتر */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-white md:bg-gray-50 rounded-b-xl shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none relative z-20">
          <button onClick={onClose} className="w-full md:w-auto px-6 py-3 md:py-2.5 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 shadow-sm transition">
            إغلاق النافذة
          </button>
        </div>
      </div>

      {/* الدرج الجانبي للمحذوفات */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="bg-red-50 p-5 md:p-6 border-b border-red-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-red-900 tracking-tight">سجل المحذوفات</h3>
              <p className="text-[10px] md:text-xs font-bold text-red-600 mt-1">الدفعات المحذوفة للقراءة فقط</p>
            </div>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="bg-white text-gray-500 hover:text-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <label className="block text-[10px] md:text-xs font-bold text-gray-500 mb-2 uppercase">تصفية حسب الفصل (ميزة مستقبلية)</label>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="w-full px-3 py-2 md:py-2.5 bg-white border border-gray-300 rounded-xl text-xs md:text-sm font-bold text-gray-700 focus:ring-2 focus:ring-red-200 outline-none transition shadow-sm cursor-pointer">
            <option value="">جميع الفصول</option><option value="F23">F23</option><option value="S24">S24</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {deletedTransactions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 font-bold text-sm">سجل المحذوفات فارغ</p>
            </div>
          ) : (
            deletedTransactions.map((transaction, index) => {
              const { actualNote } = parseNote(transaction.note, transaction.id);
              return (
                <div key={`del-${transaction.id}-${index}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-red-400"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-extrabold text-gray-900 line-through decoration-red-400 decoration-2 text-sm md:text-base">
                        {Number(transaction.mony).toLocaleString()} ل.س
                      </h4>
                      <span className="text-[10px] md:text-xs font-medium text-gray-500 mt-1 inline-block truncate max-w-[180px]">
                        {actualNote}
                      </span>
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-lg border ${transaction.type === 'deposit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {transaction.type === 'deposit' ? 'إيداع' : 'رصيد مسترد'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {isDrawerOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[65] transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>}

      {/* مودال الإشعار السريع */}
      {quickNotification.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[80]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative z-10 m-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-5 border-b pb-3">إرسال إشعار للطالب</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">عنوان الإشعار</label>
                <input type="text" value={quickNotification.title} onChange={(e) => setQuickNotification(prev => ({ ...prev, title: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">محتوى الإشعار</label>
                <textarea value={quickNotification.body} onChange={(e) => setQuickNotification(prev => ({ ...prev, body: e.target.value }))} rows={6} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm leading-relaxed" />
              </div>
            </div>
            <div className="flex flex-col-reverse md:flex-row justify-end mt-6 gap-3">
              <button onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })} className="w-full md:w-auto px-5 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-bold text-sm">
                تخطي الإرسال
              </button>
              <button onClick={handleSendQuickNotification} disabled={isSendingNotif || !quickNotification.title || !quickNotification.body} className="w-full md:w-auto px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 font-bold text-sm shadow-sm flex items-center justify-center gap-2">
                {isSendingNotif ? 'جاري الإرسال...' : 'إرسال الإشعار'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
