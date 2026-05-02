'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // الرصيد المؤجل بالأيام
  const [isDeferred, setIsDeferred] = useState(false);
  const [deferDays, setDeferDays] = useState('3');
  const [repeatDays, setRepeatDays] = useState('1');
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

  // دالة المخاطبة بناءً على الجنس - مصلحة
  const getGreeting = useCallback((targetUser?: User | null) => {
    const u = targetUser ?? user;
    const firstName = userName.split(' ')[0] || '';
    if (u?.gender === 'أنثى') return `العزيزة ${firstName}`;
    if (u?.gender === 'ذكر') return `العزيز ${firstName}`;
    return `العزيز/ة ${firstName}`;
  }, [userName, user]);

  useEffect(() => {
    if (isOpen && userId) {
      const storedDeleted = localStorage.getItem(`deleted_trans_${userId}`);
      if (storedDeleted) setDeletedTransactions(JSON.parse(storedDeleted));
      const storedPaid = localStorage.getItem(`paid_trans_${userId}`);
      if (storedPaid) setPaidTransactions(JSON.parse(storedPaid));
    }
  }, [isOpen, userId]);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
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
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) fetchData();
  }, [isOpen, userId, fetchData]);

  // إشعار تلقائي للدفعات المؤجلة (بالأيام - محوّل لثواني للاختبار)
  useEffect(() => {
    if (!isOpen || transactions.length === 0) return;

    const interval = setInterval(() => {
      const deferredItems = transactions.filter(t =>
        t.note && t.note.startsWith('DEFERRED|') && !paidTransactions.includes(t.id)
      );

      if (deferredItems.length === 0) return;

      deferredItems.forEach(async (item) => {
        try {
          const parts = item.note.split('|');
          const hasNoReminder = parts[3] === 'NONE';
          if (hasNoReminder) return;

          const amount = Number(item.mony).toLocaleString();
          const deadlineDays = parts[1] || '3';
          const currentUser = user;

          await fetch('/api/proxy/cp_notifications.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              title: 'تذكير: سداد رصيد مؤجل',
              body: `${getGreeting(currentUser)}،\nنود تذكيرك بضرورة سداد الرصيد المؤجل بقيمة (${amount} ل.س). المهلة المحددة هي (${deadlineDays} أيام)، يرجى السداد لتجنب انقطاع الخدمة.`,
              url1: '',
              note1: ''
            }),
          });
        } catch (e) {
          console.error('فشل إرسال الإشعار التلقائي', e);
        }
      });
    }, 86400000); // كل يوم

    return () => clearInterval(interval);
  }, [isOpen, transactions, paidTransactions, userId, user, getGreeting]);

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
        finalNote = `DEFERRED|${deferDays}|${repeatDays}|${reminderFlag}|${newTransaction.note}`;
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

      const greeting = getGreeting();
      const amount = Number(requestBody.mony).toLocaleString();

      if (requestBody.type === 'deposit') {
        if (isDeferred) {
          setQuickNotification({
            isOpen: true,
            title: 'رصيد مؤجل السداد',
            body: `${greeting}،\nتم إضافة رصيد مؤجل بقيمة (${amount} ل.س.).\nيرجى السداد خلال (${deferDays} أيام) لتجنب توقف الحساب.`
          });
        } else {
          setQuickNotification({
            isOpen: true,
            title: 'إشعار مالي',
            body: `${greeting}،\nتمت إضافة رصيد بقيمة (${amount} ل.س.) إلى حسابك بنجاح.\nيُرجى الاشتراك فوراً لضمان الحصول على الخدمة وفقاً للأسعار الحالية.\nنسعد دائماً بخدمتكم.`
          });
        }
      }

      setNewTransaction({ mony: '', type: 'deposit', note: '' });
      setIsDeferred(false);
      setDeferDays('3');
      setRepeatDays('1');
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
        alert('تم إرسال الإشعار بنجاح!');
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
    if (!note) return { isDeferred: false, isPaid: false, actualNote: '-' };
    if (note.startsWith('DEFERRED|')) {
      const parts = note.split('|');
      const isPaid = paidTransactions.includes(id);
      return {
        isDeferred: !isPaid,
        isPaid,
        deadline: parts[1] || '0',
        repeat: parts[2] || '0',
        actualNote: parts[4] || '-'
      };
    }
    return { isDeferred: false, isPaid: false, actualNote: note };
  };

  const explicitWithdrawals = transactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + Number(t.mony), 0);
  const totalDeposits = summary ? summary.total_deposit : 0;
  const currentBalance = summary ? summary.balance : 0;
  const semesterPurchases = Math.max(0, totalDeposits - explicitWithdrawals - currentBalance);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden relative z-10 flex flex-col border border-gray-100">

        {/* ===== الهيدر ===== */}
        <div className="shrink-0 bg-white border-b border-gray-100">
          {/* الصف الأول: العنوان + إغلاق */}
          <div className="flex justify-between items-center px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-gray-900">إدارة الدفعات المالية</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {userName} · ID: {userId}
                  {user?.phone && <span dir="ltr"> · {user.phone}</span>}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* الصف الثاني: الإحصائيات */}
          {summary && !isLoading && !error && (
            <div className="grid grid-cols-4 gap-px bg-gray-100 border-t border-b border-gray-100 mx-0">
              {[
                { label: 'الرصيد الحالي', value: currentBalance.toLocaleString(), color: currentBalance >= 0 ? 'text-blue-600' : 'text-orange-600', bg: 'bg-blue-50' },
                { label: 'مشتريات الفصل', value: semesterPurchases.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'إجمالي الإيداع', value: totalDeposits.toLocaleString(), color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'الرصيد المسترد', value: explicitWithdrawals.toLocaleString(), color: 'text-red-600', bg: 'bg-red-50' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.bg} px-3 py-3 text-center`}>
                  <p className={`text-base md:text-lg font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* الصف الثالث: الأزرار */}
          <div className="flex gap-2 px-5 py-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition border border-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              المحذوفات
              {deletedTransactions.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{deletedTransactions.length}</span>
              )}
            </button>

            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition border border-gray-200 disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'جاري...' : 'تحديث'}
            </button>

            <button
              onClick={() => setShowAddForm(v => !v)}
              className="mr-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {showAddForm ? 'إخفاء النموذج' : 'إضافة دفعة'}
            </button>
          </div>
        </div>

        {/* ===== المحتوى الرئيسي ===== */}
        <div className="flex-1 overflow-y-auto bg-gray-50">

          {/* رسالة الخطأ */}
          {error && (
            <div className="m-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          {/* ===== نموذج الإضافة ===== */}
          {showAddForm && (
            <div className="m-4 bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-5 py-4 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-200" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                <h3 className="font-extrabold text-white text-base">تفاصيل الدفعة الجديدة</h3>
              </div>

              <form onSubmit={handleAddTransaction} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* المبلغ */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">المبلغ (ل.س) *</label>
                    <input
                      type="number" step="0.01" required
                      value={newTransaction.mony}
                      onChange={e => setNewTransaction(p => ({ ...p, mony: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-extrabold text-blue-700 text-xl outline-none transition"
                      placeholder="50000"
                    />
                  </div>
                  {/* النوع */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">نوع العملية</label>
                    <select
                      value={newTransaction.type}
                      onChange={e => {
                        setNewTransaction(p => ({ ...p, type: e.target.value as 'deposit' | 'withdraw' }));
                        if (e.target.value === 'withdraw') setIsDeferred(false);
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 outline-none cursor-pointer transition"
                    >
                      <option value="deposit">إيداع (إضافة رصيد)</option>
                      <option value="withdraw">سحب (رصيد مسترد)</option>
                    </select>
                  </div>
                </div>

                {/* الملاحظات */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">ملاحظات (اختياري)</label>
                  <textarea
                    rows={2}
                    value={newTransaction.note}
                    onChange={e => setNewTransaction(p => ({ ...p, note: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium resize-none outline-none transition"
                    placeholder="ملاحظات تفصيلية..."
                  />
                </div>

                {/* بطاقة الرصيد المؤجل */}
                {newTransaction.type === 'deposit' && (
                  <div className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${isDeferred ? 'border-orange-300' : 'border-gray-200'}`}>
                    <label className={`flex items-center justify-between px-4 py-3.5 cursor-pointer select-none ${isDeferred ? 'bg-orange-50' : 'bg-gray-50 hover:bg-gray-100'} transition`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDeferred ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className={`block font-bold text-sm ${isDeferred ? 'text-orange-800' : 'text-gray-700'}`}>رصيد مؤجل السداد</span>
                          <span className="text-xs text-gray-400">تفعيل لجدولة تذكيرات تلقائية</span>
                        </div>
                      </div>
                      <div className="relative">
                        <input type="checkbox" checked={isDeferred} onChange={e => setIsDeferred(e.target.checked)} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                      </div>
                    </label>

                    {isDeferred && (
                      <div className="px-4 pb-4 pt-3 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-orange-100">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">مدة السداد (أيام)</label>
                          <input
                            type="number" min="1"
                            value={deferDays}
                            onChange={e => setDeferDays(e.target.value)}
                            disabled={noReminder}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-extrabold text-lg rounded-xl p-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none disabled:opacity-50 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">تكرار التذكير (أيام)</label>
                          <input
                            type="number" min="1"
                            value={repeatDays}
                            onChange={e => setRepeatDays(e.target.value)}
                            disabled={noReminder}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-extrabold text-lg rounded-xl p-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none disabled:opacity-50 transition"
                          />
                        </div>
                        <div className="flex items-end">
                          <label className={`w-full flex items-center justify-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition ${noReminder ? 'bg-gray-100 border-gray-300 text-gray-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={noReminder} onChange={e => setNoReminder(e.target.checked)} className="w-4 h-4 rounded" />
                            <span className="font-bold text-sm">بدون تذكير</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit" disabled={isAdding}
                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                      <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>جاري التنفيذ...</>
                    ) : 'تنفيذ وحفظ'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 md:flex-none bg-white border-2 border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===== قائمة الدفعات ===== */}
          <div className="p-4">
            {isLoading ? (
              /* skeleton loader ثابت الحجم */
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="hidden md:block">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-100 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-6 shrink-0" />
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                      <div className="h-4 bg-gray-200 rounded flex-1" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </div>
                  ))}
                </div>
                <div className="md:hidden space-y-3 p-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" /></svg>
                <p className="text-gray-400 font-bold text-sm">لا توجد دفعات مالية</p>
              </div>
            ) : (
              <>
                {/* جدول الحاسوب - ثابت عند التحديث */}
                <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative">
                  {isRefreshing && (
                    <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl">
                      <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  )}
                  <table className="w-full text-right">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-xs font-extrabold bg-[#f5e97a] border-b border-[#c8b800] text-gray-800 w-12">#</th>
                        <th className="px-4 py-3 text-xs font-extrabold bg-[#f0e060] border-b border-[#c8b800] text-gray-800">المبلغ</th>
                        <th className="px-4 py-3 text-xs font-extrabold bg-[#f5e97a] border-b border-[#c8b800] text-gray-800">النوع</th>
                        <th className="px-4 py-3 text-xs font-extrabold bg-[#f0e060] border-b border-[#c8b800] text-gray-800">ملاحظة / حالة</th>
                        <th className="px-4 py-3 text-xs font-extrabold bg-[#f5e97a] border-b border-[#c8b800] text-gray-800 w-40">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((t, i) => {
                        const { isDeferred: isDef, isPaid, deadline, repeat, actualNote } = parseNote(t.note, t.id);
                        return (
                          <tr key={t.id} className={`transition ${isDef ? 'bg-orange-50/40 hover:bg-orange-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-4 py-3.5 text-sm font-bold text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3.5">
                              <span className={`text-base font-extrabold ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                {Number(t.mony).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-400 mr-1">ل.س</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                t.type === 'deposit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${t.type === 'deposit' ? 'bg-green-500' : 'bg-red-500'}`} />
                                {t.type === 'deposit' ? 'إيداع' : 'مسترد'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-sm text-gray-700 font-medium truncate max-w-[180px]" title={actualNote}>{actualNote}</p>
                              {isDef && (
                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
                                  ⏳ مؤجل {deadline} ي · تذكير كل {repeat} ي
                                </span>
                              )}
                              {isPaid && (
                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                  ✓ مدفوع
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                {isDef && (
                                  <button
                                    onClick={() => handleMarkAsPaid(t.id)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold transition shadow-sm"
                                  >
                                    تأكيد الدفع
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTransaction(t.id)}
                                  className="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 px-2.5 py-1.5 rounded-lg transition text-xs font-bold"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* بطاقات الموبايل */}
                <div className="md:hidden space-y-3 relative">
                  {isRefreshing && (
                    <div className="absolute inset-0 bg-gray-50/80 z-10 flex items-center justify-center rounded-xl">
                      <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  )}
                  {transactions.map((t, i) => {
                    const { isDeferred: isDef, isPaid, deadline, repeat, actualNote } = parseNote(t.note, t.id);
                    return (
                      <div key={t.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${isDef ? 'border-orange-200' : 'border-gray-100'}`}>
                        {isDef && <div className="h-1 w-full bg-orange-400" />}

                        <div className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">#{i + 1}</span>
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              t.type === 'deposit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${t.type === 'deposit' ? 'bg-green-500' : 'bg-red-500'}`} />
                              {t.type === 'deposit' ? 'إيداع' : 'مسترد'}
                            </span>
                          </div>

                          <div className="text-center mb-4">
                            <span className={`text-3xl font-extrabold ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                              {Number(t.mony).toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 font-medium mr-1">ل.س</span>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
                            <p className="text-xs text-gray-400 font-bold mb-1">الملاحظة</p>
                            <p className="text-sm text-gray-800 font-medium leading-relaxed">{actualNote}</p>
                            {isDef && (
                              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-lg border border-orange-200">
                                ⏳ مؤجل {deadline} ي · تذكير كل {repeat} ي
                              </div>
                            )}
                            {isPaid && (
                              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                                ✓ تم الدفع
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {isDef && (
                              <button onClick={() => handleMarkAsPaid(t.id)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-bold transition shadow-sm active:scale-95">
                                تأكيد الدفع
                              </button>
                            )}
                            <button onClick={() => handleDeleteTransaction(t.id)} className={`border border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-bold transition ${isDef ? 'w-20 shrink-0' : 'flex-1'}`}>
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== الفوتر ===== */}
        <div className="shrink-0 flex justify-end px-5 py-3 border-t border-gray-100 bg-white">
          <button onClick={onClose} className="w-full md:w-auto px-6 py-2.5 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl transition shadow-sm text-sm">
            إغلاق
          </button>
        </div>
      </div>

      {/* ===== الدرج الجانبي للمحذوفات ===== */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[65]" onClick={() => setIsDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>
      )}
      <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="bg-red-600 px-5 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <div>
              <h3 className="font-extrabold text-white">سجل المحذوفات</h3>
              <p className="text-xs text-red-200">{deletedTransactions.length} دفعة محذوفة</p>
            </div>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-700 hover:bg-red-800 text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer">
            <option value="">جميع الفصول</option>
            <option value="F23">F23</option>
            <option value="S24">S24</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {deletedTransactions.length === 0 ? (
            <div className="text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <p className="text-gray-400 font-bold text-sm">السجل فارغ</p>
            </div>
          ) : (
            deletedTransactions.map((t, i) => {
              const { actualNote } = parseNote(t.note, t.id);
              return (
                <div key={`del-${t.id}-${i}`} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-extrabold line-through decoration-red-400 decoration-2 ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(t.mony).toLocaleString()} ل.س
                      </p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{actualNote}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${t.type === 'deposit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {t.type === 'deposit' ? 'إيداع' : 'مسترد'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== مودال الإشعار السريع ===== */}
      {quickNotification.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[80]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
            <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-200" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
                <h3 className="font-extrabold text-white">إرسال إشعار للطالب</h3>
              </div>
              <button onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">عنوان الإشعار</label>
                <input
                  type="text"
                  value={quickNotification.title}
                  onChange={e => setQuickNotification(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">محتوى الإشعار</label>
                <textarea
                  value={quickNotification.body}
                  onChange={e => setQuickNotification(p => ({ ...p, body: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm leading-relaxed outline-none resize-none transition"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSendQuickNotification}
                  disabled={isSendingNotif || !quickNotification.title || !quickNotification.body}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isSendingNotif ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>إرسال...</>
                  ) : 'إرسال الإشعار'}
                </button>
                <button onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition text-sm">
                  تخطي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
