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
  
  // حالات الرصيد المؤجل
  const [isDeferred, setIsDeferred] = useState(false);
  const [deferDays, setDeferDays] = useState('7');
  const [deferHours, setDeferHours] = useState('5');
  const [noReminder, setNoReminder] = useState(false);

  const [quickNotification, setQuickNotification] = useState({
    isOpen: false,
    title: '',
    body: ''
  });
  
  const [newTransaction, setNewTransaction] = useState({
    mony: '',
    type: '' as 'deposit' | 'withdraw' | '', // أضفنا القيمة الفارغة هنا
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

  // إرسال إشعار تلقائي كل 25 ثانية للدفعات المؤجلة
  useEffect(() => {
    if (!isOpen || transactions.length === 0) return;

    const deferredItems = transactions.filter(t => 
      t.note && t.note.startsWith('DEFERRED|') && !paidTransactions.includes(t.id)
    );

    if (deferredItems.length === 0) return;

    const intervals = deferredItems.map((item) => {
      const parts = item.note.split('|');
      const days = parts[1] || '7';
      const reminderDays = Number(parts[2] || '1');
      const hasNoReminder = parts[3] === 'NONE';

      if (hasNoReminder) return null;

      // تحويل الأيام إلى ميلي ثانية
      const intervalMs = reminderDays * 24 * 60 * 60 * 1000;

      return setInterval(async () => {
        try {
          const amount = Number(item.mony).toLocaleString();
          await fetch('/api/proxy/cp_notifications.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              title: 'تذكير: سداد رصيد مؤجل',
              body: `${getGreeting()}،\nنود تذكيرك بضرورة سداد الرصيد المؤجل بقيمة (${amount} ل.س) المتبقي من مدة السماح (${days} أيام)، لتجنب انقطاع الخدمة.`,
              url1: '',
              note1: ''
            }),
          });
        } catch (e) {
          console.error('فشل إرسال الإشعار التلقائي', e);
        }
      }, intervalMs);
    });

    return () => intervals.forEach(i => i && clearInterval(i));
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
        finalNote = `DEFERRED|${deferDays}|${deferHours}|${reminderFlag}|${newTransaction.note}`;
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
      setNewTransaction({ mony: '', type: '' as 'deposit' | 'withdraw' | '', note: '' });
      setIsDeferred(false);
      setDeferDays('7');
      setDeferHours('5');
      setNoReminder(false);
      
      if (requestBody.type === 'deposit') {
        if (isDeferred) {
          setQuickNotification({
            isOpen: true,
            title: 'رصيد مؤجل',
            body: `${getGreeting()}،\nتم إضافة رصيد مؤجل بقيمة (${Number(requestBody.mony).toLocaleString()} ل.س.).\nيرجى السداد خلال المدة المذكورة (${deferDays} أيام) لتجنب توقف الحساب.`
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
      setDeferDays('7');
      setDeferHours('5');
      setNoReminder(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة');
    } finally {
      setIsAdding(false);
    }
  };

  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

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

      // إبقاء الصف مع تعطيمه
      setDeletedIds(prev => new Set(prev).add(transactionId));

      // مزامنة مع الكود الثاني
      await fetch(`/api/proxy/cp_money.php?id=${transactionId}`, {
        method: 'DELETE',
      });

      if (transToDelete) {
        const newDeleted = [...deletedTransactions, transToDelete];
        setDeletedTransactions(newDeleted);
        localStorage.setItem(`deleted_trans_${userId}`, JSON.stringify(newDeleted));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleMarkAsPaid = async (transactionId: number) => {
    try {
      const updatedPaid = [...paidTransactions, transactionId];
      setPaidTransactions(updatedPaid);
      localStorage.setItem(`paid_trans_${userId}`, JSON.stringify(updatedPaid));
      
      const transaction = transactions.find(t => t.id === transactionId);
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: transactionId, 
          user_id: userId, 
          status: 'paid',
          note: 'مؤجل وتم دفعه'
        })
      });

      // مزامنة مع الكود الثاني
      await fetch('/api/proxy/cp_money.php?id=' + transactionId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transaction,
          note: 'مؤجل وتم دفعه',
          update_date: new Date().toISOString()
        })
      });

      await fetchData();
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
        days: parts[1] || '0', 
        hours: parts[2] || '0',
        actualNote: parts[4] || '-' 
      };
    }
    return { isDeferred: false, actualNote: note };
  };

  // حساب مشتريات الفصل
  const semesterPurchases = summary ? (summary.total_deposit - summary.total_withdraw - summary.balance) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden relative z-10 flex flex-col">
        
        {/* الهيدر */}
        <div className="flex flex-row items-center p-4 md:p-6 border-b border-gray-200 bg-gray-50 gap-3 shrink-0 overflow-x-auto">
          <div className="text-right order-first"> 
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">إدارة الدفعات المالية</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1 font-medium">
              <span className="block">{userName}</span>
<span className="block">ID: {userId}</span>
{user && <span className="block">الهاتف: {user.phone}</span>}
            </p>
          </div>

          {/* الإحصائيات العلوية المحسنة */}
          {summary && !isLoading && !error && (
            <div className="grid grid-cols-2 md:flex md:flex-row-reverse gap-2 md:gap-3 w-full lg:w-auto md:mx-auto">
              {/* بطاقة الرصيد الحالي */}
              <div className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl border shadow-sm ${summary.balance < 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <span className={`text-[11px] font-bold mb-1 ${summary.balance < 0 ? 'text-red-500' : 'text-blue-500'}`}>الرصيد الحالي</span>
                <span className={`font-extrabold text-lg md:text-xl leading-none ${summary.balance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {summary.balance < 0 ? '⚠️' : '💰'} {summary.balance.toLocaleString()}
                </span>
              </div>
              {/* بطاقة مشتريات الفصل */}
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border shadow-sm bg-purple-50 border-purple-200">
                <span className="text-[11px] font-bold mb-1 text-purple-500">مشتريات الفصل</span>
                <span className="font-extrabold text-lg md:text-xl leading-none text-purple-600">🛒 {semesterPurchases.toLocaleString()}</span>
              </div>
              {/* بطاقة إجمالي الإيداع */}
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border shadow-sm bg-green-50 border-green-200">
                <span className="text-[11px] font-bold mb-1 text-green-500">إجمالي الإيداع</span>
                <span className="font-extrabold text-lg md:text-xl leading-none text-green-600">⬆️ {summary.total_deposit.toLocaleString()}</span>
              </div>
              {/* بطاقة الرصيد المسترد */}
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border shadow-sm bg-red-50 border-red-200">
                <span className="text-[11px] font-bold mb-1 text-red-500">الرصيد المسترد</span>
                <span className="font-extrabold text-lg md:text-xl leading-none text-red-600">⬇️ {summary.total_withdraw.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full md:w-auto justify-end items-end mr-auto pl-2">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex-none justify-center bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition shadow-sm flex items-center gap-2 text-sm"
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
            <div className="flex-1 md:flex-none flex items-center gap-2">
              <button
  onClick={() => setShowAddForm(true)}
  className="justify-center bg-blue-600 text-white px-3 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5 text-xs md:text-sm h-[42px]"
>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                إضافة دفعة
              </button>
              <button 
  onClick={fetchData} 
  disabled={isLoading} 
  title="تحديث البيانات"
  className="flex items-center justify-center bg-blue-50 text-blue-600 w-[42px] h-[42px] rounded-xl border border-blue-100 hover:bg-blue-100 transition shadow-sm disabled:opacity-50 shrink-0"
>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 md:h-6 md:w-6 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-200 mx-1"></div>
            <button onClick={onClose} className="hidden md:flex text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-full transition border border-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>


        {/* محتوى النافذة */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-50 md:bg-white relative">
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg text-sm" role="alert">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {/* نموذج الإضافة - Overlay عائم فوق الجدول */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-4">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => {
  setShowAddForm(false);
  setNewTransaction({ mony: '', type: '' as 'deposit' | 'withdraw' | '', note: '' });
  setIsDeferred(false);
  setDeferDays('7');
  setDeferHours('5');
  setNoReminder(false);
}}></div>
              <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-blue-200 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-100 bg-blue-50">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-extrabold text-blue-900 tracking-tight flex-1">تفاصيل الدفعة الجديدة</h3>
                  <button type="button" onClick={() => {
  setShowAddForm(false);
  setNewTransaction({ mony: '', type: '' as 'deposit' | 'withdraw' | '', note: '' });
  setIsDeferred(false);
  setDeferDays('7');
  setDeferHours('5');
  setNoReminder(false);
}} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">

                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

              <form onSubmit={handleAddTransaction} className="flex flex-col gap-3 p-4 max-w-2xl mx-auto w-full">

  {/* 1. المبلغ */}
  <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 focus-within:border-blue-400 focus-within:shadow-lg focus-within:shadow-blue-500/10 transition-all duration-300">
    <label className="text-slate-400 text-[10px] font-extrabold tracking-widest uppercase mb-2 block">
      💰 المبلغ
    </label>
    <div className="flex items-center gap-3">
      <input
        type="number" step="0.01" min="0" required
        value={newTransaction.mony}
        onChange={(e) => setNewTransaction(prev => ({ ...prev, mony: e.target.value }))}
        className="flex-1 bg-transparent text-4xl font-black text-slate-800 outline-none placeholder-slate-200"
        placeholder="0"
      />
      <span className="text-slate-400 font-extrabold text-sm bg-slate-100 px-3 py-1.5 rounded-xl select-none">
        ل.س
      </span>
    </div>
  </div>

  {/* 2. نوع العملية */}
  <div className="grid grid-cols-2 gap-3">
    <div
      onClick={() => setNewTransaction(prev => ({ ...prev, type: 'deposit' }))}
      className={`py-4 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 border-2 select-none ${
        newTransaction.type === 'deposit'
          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/25'
          : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400'
      }`}
    >
      <span className="text-2xl">{newTransaction.type === 'deposit' ? '✅' : '⬇️'}</span>
      <span>إيداع رصيد</span>
    </div>

    <div
      onClick={() => {
        setNewTransaction(prev => ({ ...prev, type: 'withdraw' }));
        setIsDeferred(false);
      }}
      className={`py-4 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 border-2 select-none ${
        newTransaction.type === 'withdraw'
          ? 'bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-500/25'
          : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400'
      }`}
    >
      <span className="text-2xl">{newTransaction.type === 'withdraw' ? '✅' : '⬆️'}</span>
      <span>سحب رصيد</span>
    </div>
  </div>

  {/* تنبيه اختيار النوع */}
  {!newTransaction.type && (
    <p className="text-center text-xs text-slate-400 font-bold animate-pulse">
      ↑ اختر نوع العملية أولاً
    </p>
  )}

  {/* 3. التأجيل */}
  {newTransaction.type === 'deposit' && (
    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
      isDeferred ? 'border-indigo-400 bg-indigo-50/50 shadow-lg shadow-indigo-500/10' : 'border-slate-100 bg-white'
    }`}>
      <div
        onClick={() => setIsDeferred(!isDeferred)}
        className="flex items-center justify-between p-4 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
            isDeferred ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300' : 'bg-slate-100 text-slate-400'
          }`}>
            ⏱
          </div>
          <div>
            <p className={`font-extrabold text-sm ${isDeferred ? 'text-indigo-800' : 'text-slate-600'}`}>رصيد مؤجل السداد</p>
            <p className="text-[10px] text-slate-400 font-bold">جدولة التنبيهات والمهلة</p>
          </div>
        </div>
        <div className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-all duration-300 ${
          isDeferred ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
        }`}>
          <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
        </div>
      </div>

      {isDeferred && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="h-px bg-indigo-100"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl border-2 border-indigo-100 p-2.5 flex items-center gap-2 focus-within:border-indigo-400 transition-all">
              <span className="text-lg shrink-0">📅</span>
              <div className="flex-1 min-w-0">
                <label className="block text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider">المهلة</label>
                <div className="flex items-center gap-1">
                  <input type="number" min="1" value={deferDays} onChange={(e) => setDeferDays(e.target.value)} disabled={noReminder} className="w-full bg-transparent font-extrabold text-indigo-900 outline-none text-sm disabled:opacity-40" />
                  <span className="text-[9px] text-indigo-400 font-bold shrink-0">يوم</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border-2 border-indigo-100 p-2.5 flex items-center gap-2 focus-within:border-indigo-400 transition-all">
              <span className="text-lg shrink-0">🔔</span>
              <div className="flex-1 min-w-0">
                <label className="block text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider">تذكير كل (أيام)</label>
                <div className="flex items-center gap-1">
                  <input type="number" min="1" value={deferHours} onChange={(e) => setDeferHours(e.target.value)} disabled={noReminder} className="w-full bg-transparent font-extrabold text-indigo-900 outline-none text-sm disabled:opacity-40" />
                  <span className="text-[9px] text-indigo-400 font-bold shrink-0">يوم</span>
                </div>
              </div>
            </div>
            <div
              onClick={() => setNoReminder(!noReminder)}
              className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
                noReminder ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
              }`}
            >
              <span className="text-lg">{noReminder ? '🔕' : '🔔'}</span>
              <span className="text-[9px] font-extrabold text-center">{noReminder ? 'لا تذكير' : 'تعطيل'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

  {/* 4. الملاحظات */}

  <div className="relative group">
    <span className="absolute top-3.5 right-4 text-slate-300 group-focus-within:text-blue-400 transition-colors text-lg pointer-events-none">✎</span>
    <textarea
      rows={2}
      value={newTransaction.note}
      onChange={(e) => setNewTransaction(prev => ({ ...prev, note: e.target.value }))}
      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pr-11 pl-4 text-sm font-medium text-slate-700 outline-none resize-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-300"
      placeholder="ملاحظات إضافية..."
    />
  </div>

                     {/* إعدادات الرصيد المؤجل - القسم السفلي محذوف وأصبح بجانب الزر */}
                  {newTransaction.type === 'deposit' && isDeferred && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 shadow-sm hidden">
                      <p className="text-xs font-extrabold text-orange-700 mb-3 uppercase tracking-wide">⚙️ إعدادات الرصيد المؤجل</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* المهلة */}
                        <div className="bg-white rounded-xl p-3 border border-orange-100 shadow-sm">
                          <label className="block text-[10px] font-extrabold text-orange-600 mb-2 uppercase">المهلة</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="1" value={deferDays} onChange={(e) => setDeferDays(e.target.value)} disabled={noReminder} className="w-full py-2 px-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 font-extrabold text-orange-900 text-base disabled:opacity-40 outline-none text-center" />
                            <span className="text-xs font-bold text-orange-500 shrink-0">يوم</span>
                          </div>
                        </div>
                        {/* التذكير */}
                        <div className="bg-white rounded-xl p-3 border border-orange-100 shadow-sm">
                          <label className="block text-[10px] font-extrabold text-orange-600 mb-2 uppercase">التذكير كل</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="1" value={deferHours} onChange={(e) => setDeferHours(e.target.value)} disabled={noReminder} className="w-full py-2 px-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 font-extrabold text-orange-900 text-base disabled:opacity-40 outline-none text-center" />
                            <span className="text-xs font-bold text-orange-500 shrink-0">سا</span>
                          </div>
                        </div>
                        {/* إلغاء التذكير */}
                        <div className="col-span-2 bg-white rounded-xl p-3 border border-orange-100 shadow-sm flex items-center">
                          <div
                            onClick={() => setNoReminder(!noReminder)}
                            className={`flex items-center gap-3 cursor-pointer w-full select-none`}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${noReminder ? 'bg-gray-500 border-gray-500' : 'border-gray-300'}`}>
                              {noReminder && <div className="w-3 h-3 rounded-full bg-white"></div>}
                            </div>
                            <span className="font-extrabold text-sm text-gray-700">إلغاء التذكير التلقائي</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button type="submit" disabled={isAdding || !newTransaction.type} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-base hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-[0.98]">
                      {isAdding ? 'جاري التنفيذ...' : 'تنفيذ وحفظ الدفعة'}
                    </button>
                    <button type="button" onClick={() => {
                      setShowAddForm(false);
                      setNewTransaction({ mony: '', type: '' as 'deposit' | 'withdraw' | '', note: '' });
                      setIsDeferred(false);
                      setDeferDays('7');
                      setDeferHours('5');
                      setNoReminder(false);
                    }} className="flex-1 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold text-base hover:bg-gray-50 transition-all shadow-sm transform active:scale-[0.98]">
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
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
                      <th className="px-4 py-4 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">التاريخ</th>
                      <th className="px-4 py-4 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">ملاحظة / حالة</th>
                      <th className="px-4 py-4 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => {
                      const { isDeferred, isPaid, days, hours, actualNote } = parseNote(transaction.note, transaction.id);
                      
                      return (
                                               <tr key={`desk-${transaction.id}`} className={`transition ${deletedIds.has(transaction.id) ? 'bg-red-50 opacity-60' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-4 text-sm font-extrabold text-gray-400">{index + 1}</td>
                          <td className="px-4 py-4 text-sm font-extrabold">
                            <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                              {Number(transaction.mony).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {transaction.id ? new Date().toLocaleDateString('ar-EG') : '--'}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-600">
                            <div className="truncate max-w-[200px]" title={actualNote}>{actualNote}</div>
                            {isDeferred && (
                              <div className="mt-1 text-[10px] text-orange-700 font-extrabold bg-orange-100 inline-block px-2 py-1 rounded border border-orange-200">
                                ⏳ مؤجل لـ {days} أيام (تذكير كل {hours} سا)
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 items-center">
                              <div className="w-32 flex-shrink-0">
                                {isPaid ? (
                                  <span className="block text-center py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">مؤجل وتم دفعه ✓</span>
                                ) : isDeferred ? (
                                  <button onClick={() => handleMarkAsPaid(transaction.id)} className="w-full py-1.5 text-xs font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition shadow-sm">
                                    دفع المؤجل
                                  </button>
                                ) : transaction.type === 'deposit' ? (
                                  <span className="block text-center py-1.5 text-xs font-bold rounded-lg bg-green-50 text-green-700 border border-green-200">رصيد نقدي 💵</span>
                                ) : (
                                  <span className="block text-center py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200">رصيد مسترد 💸</span>
                                )}
                              </div>
                              <div className="w-16 flex-shrink-0">
                                <button onClick={() => handleDeleteTransaction(transaction.id)} className="w-full py-1.5 text-xs font-bold rounded-lg bg-white border border-red-300 text-red-500 hover:bg-red-50 transition text-center">
                                  حذف
                                </button>
                              </div>
                            </div>
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
                  const { isDeferred, isPaid, days, hours, actualNote } = parseNote(transaction.note, transaction.id);
                  
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
                          <div className="mt-3 inline-block text-[11px] font-extrabold text-orange-700 bg-orange-100 px-2.5 py-1.5 rounded-lg border border-orange-200">
                            ⏳ مهلة: {days} أيام | تذكير: كل {hours} ساعة
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 w-full items-stretch">
                        <div className="w-20 shrink-0">
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="w-full py-2.5 border-2 border-red-200 text-red-600 bg-white hover:bg-red-50 rounded-xl text-sm font-bold transition text-center"
                          >
                            حذف
                          </button>
                        </div>
                        <div className="flex-1">
                          {isPaid ? (
                            <div className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-2.5 rounded-xl text-sm font-bold text-center select-none">
                              مؤجل وتم دفعه ✓
                            </div>
                          ) : isDeferred ? (
                            <button
                              onClick={() => handleMarkAsPaid(transaction.id)}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
                            >
                              دفع المؤجل
                            </button>
                          ) : transaction.type === 'deposit' ? (
                            <div className="w-full bg-green-50 text-green-700 border border-green-200 py-2.5 rounded-xl text-sm font-bold text-center select-none">
                              رصيد نقدي 💵
                            </div>
                          ) : (
                            <div className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-bold text-center select-none">
                              رصيد مسترد 💸
                            </div>
                          )}
                        </div>
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



