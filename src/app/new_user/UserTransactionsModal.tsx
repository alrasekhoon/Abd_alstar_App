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
  const [paidTransactions, setPaidTransactions] = useState<number[]>([]); // لحفظ الدفعات التي تم سدادها محلياً
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
  const [deferSeconds, setDeferSeconds] = useState('60');

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

  // استرجاع المحذوفات والمدفوعات من LocalStorage عند فتح النافذة
  useEffect(() => {
    if (isOpen && userId) {
      const storedDeleted = localStorage.getItem(`deleted_trans_${userId}`);
      if (storedDeleted) {
        setDeletedTransactions(JSON.parse(storedDeleted));
      }
      
      const storedPaid = localStorage.getItem(`paid_trans_${userId}`);
      if (storedPaid) {
        setPaidTransactions(JSON.parse(storedPaid));
      }
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
    if (isOpen && userId) {
      fetchData();
    }
  }, [isOpen, userId, fetchData]);

  // إرسال إشعار تلقائي كل 25 ثانية للدفعات المؤجلة
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
            const seconds = parts[1] || 'غير محدد';
            const amount = Number(item.mony).toLocaleString();

            await fetch('/api/proxy/cp_notifications.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                title: 'تذكير: سداد رصيد مؤجل',
                body: `عزيزي الطالب، يرجى تذكيركم بضرورة سداد الرصيد المؤجل بقيمة (${amount} ل.س) خلال المدة المحددة (${seconds} ثانية) لتجنب انقطاع الخدمة.`,
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
    }, 25000);

    return () => clearInterval(interval);
  }, [isOpen, transactions, paidTransactions, userId]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.mony) {
      setError('المبلغ مطلوب');
      return;
    }

    try {
      setIsAdding(true);
      setError('');
      
      // معالجة الملاحظة إذا كان الرصيد مؤجلاً
      let finalNote = newTransaction.note;
      if (isDeferred && newTransaction.type === 'deposit') {
        finalNote = `DEFERRED|${deferSeconds}|${newTransaction.note}`;
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
            body: `عزيزي الطالب، تم إضافة رصيد مؤجل بقيمة (${Number(requestBody.mony).toLocaleString()} ل.س.).\nيرجى السداد خلال المدة المذكورة (${deferSeconds} ثانية) لتجنب توقف الحساب.`
          });
        } else {
          setQuickNotification({
            isOpen: true,
            title: 'إشعار مالي',
            body: `تمت إضافة رصيد بقيمة (${Number(requestBody.mony).toLocaleString()} ل.س.) إلى حسابكم بنجاح.\nيُرجى الاشتراك فوراً لضمان حصولكم على الخدمة وفقاً للأسعار الحالية قبل أي تعديل محتمل.\nنسعد دائماً بخدمتكم، ونتمنى لكم دوام التوفيق.`
          });
        }
      }

      setNewTransaction({ mony: '', type: 'deposit', note: '' });
      setIsDeferred(false);
      setDeferSeconds('60');
      
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

      // الاحتفاظ بالدفعة في المحذوفات محلياً
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
      // تحديث محلي فوري (تحسباً لعدم دعم السيرفر لتحديث الملاحظات)
      const updatedPaid = [...paidTransactions, transactionId];
      setPaidTransactions(updatedPaid);
      localStorage.setItem(`paid_trans_${userId}`, JSON.stringify(updatedPaid));
      
      // محاولة التحديث على السيرفر إذا كان الـ API يدعم الـ PUT
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transactionId, user_id: userId, status: 'paid' })
      });
      
    } catch (e) {
      console.log('تم التحديث محلياً فقط', e);
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
        seconds: parts[1], 
        actualNote: parts[2] || '-' 
      };
    }
    return { isDeferred: false, actualNote: note };
  };

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
            <div className="flex gap-2 md:gap-4 bg-white px-3 md:px-5 py-2 md:py-3 rounded-xl border border-gray-200 shadow-sm text-xs md:text-sm w-full md:w-auto overflow-x-auto">
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-bold text-gray-500 uppercase text-[10px] md:text-xs">الرصيد الحالي</span>
                <span className={`font-extrabold text-base md:text-lg ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {summary.balance.toLocaleString()}
                </span>
              </div>
              <div className="w-px bg-gray-200 shrink-0"></div>
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-bold text-gray-500 uppercase text-[10px] md:text-xs">إجمالي الإيداع</span>
                <span className="font-extrabold text-green-600 text-base md:text-lg">{summary.total_deposit.toLocaleString()}</span>
              </div>
              <div className="w-px bg-gray-200 shrink-0"></div>
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-bold text-gray-500 uppercase text-[10px] md:text-xs">إجمالي السحب</span>
                <span className="font-extrabold text-red-600 text-base md:text-lg">{summary.total_withdraw.toLocaleString()}</span>
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

        {/* محتوى النافذة */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-50 md:bg-white">
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg text-sm" role="alert">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {/* نموذج الإضافة */}
          {showAddForm && (
            <div className="mb-6 p-4 md:p-6 border border-blue-200 rounded-xl bg-white md:bg-blue-50/50 shadow-sm">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
                تفاصيل الدفعة الجديدة
              </h3>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ (ل.س)</label>
                  <input type="number" step="0.01" required value={newTransaction.mony} onChange={(e) => setNewTransaction(prev => ({ ...prev, mony: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-blue-800" placeholder="مثال: 50000" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">نوع العملية</label>
                  <select value={newTransaction.type} onChange={(e) => {
                      setNewTransaction(prev => ({ ...prev, type: e.target.value as 'deposit' | 'withdraw' }));
                      if (e.target.value === 'withdraw') setIsDeferred(false);
                    }} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="deposit">إيداع (إضافة رصيد)</option>
                    <option value="withdraw">سحب (خصم رصيد)</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظة (اختياري)</label>
                  <input type="text" value={newTransaction.note} onChange={(e) => setNewTransaction(prev => ({ ...prev, note: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium" placeholder="اكتب ملاحظة حول هذه الدفعة..." />
                </div>

                {newTransaction.type === 'deposit' && (
                  <div className="md:col-span-4 bg-orange-50 border border-orange-200 p-3 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isDeferred} onChange={(e) => setIsDeferred(e.target.checked)} className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" />
                      <span className="font-bold text-orange-800">تعيين كرصيد مؤجل</span>
                    </label>
                    
                    {isDeferred && (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-sm font-medium text-orange-700">مدة التأجيل:</span>
                        <input type="number" value={deferSeconds} onChange={(e) => setDeferSeconds(e.target.value)} className="w-24 px-2 py-1 border border-orange-300 rounded text-center font-bold" placeholder="ثواني" />
                        <span className="text-sm font-medium text-orange-700">ثانية</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="md:col-span-4 flex gap-2 mt-2">
                  <button type="submit" disabled={isAdding} className="flex-1 md:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50">
                    {isAdding ? 'جاري التنفيذ...' : 'تنفيذ وحفظ'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 md:flex-none bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition shadow-sm">
                    إلغاء
                  </button>
                </div>
              </form>
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
                      <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800 w-12">#</th>
                      <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">المبلغ</th>
                      <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">النوع</th>
                      <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">ملاحظة / حالة</th>
                      <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => {
                      const { isDeferred, isPaid, seconds, actualNote } = parseNote(transaction.note, transaction.id);
                      
                      return (
                        <tr key={`desk-${transaction.id}`} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm font-extrabold text-gray-400">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-extrabold">
                            <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                              {Number(transaction.mony).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                              transaction.type === 'deposit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {transaction.type === 'deposit' ? 'إيداع' : 'سحب'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-600">
                            <div className="truncate max-w-[200px]" title={actualNote}>{actualNote}</div>
                            {isDeferred && (
                              <div className="mt-1 text-[10px] text-orange-600 font-bold bg-orange-50 inline-block px-2 py-0.5 rounded border border-orange-200">
                                مؤجل لـ {seconds} ثانية
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 flex gap-2 items-center">
                            {isDeferred && (
                              <button onClick={() => handleMarkAsPaid(transaction.id)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm">
                                رصيد مؤجل
                              </button>
                            )}
                            {isPaid && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-lg font-bold border border-blue-200">
                                مدفوع
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
              <div className="md:hidden flex flex-col gap-3">
                {transactions.map((transaction, index) => {
                  const { isDeferred, isPaid, seconds, actualNote } = parseNote(transaction.note, transaction.id);
                  
                  return (
                    <div key={`mob-${transaction.id}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-400 font-bold text-xs bg-gray-50 px-2 py-1 rounded-md border border-gray-100">#{index + 1}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${transaction.type === 'deposit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {transaction.type === 'deposit' ? 'إيداع رصيد' : 'سحب رصيد'}
                        </span>
                      </div>
                      
                      <div className="text-center mb-4">
                        <div className={`text-2xl font-extrabold ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(transaction.mony).toLocaleString()} <span className="text-sm font-bold text-gray-500">ل.س</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                        <span className="text-gray-400 block text-[10px] font-bold mb-1">الملاحظة</span>
                        <span className="font-medium text-gray-800 text-sm block">{actualNote}</span>
                        {isDeferred && (
                          <span className="mt-2 inline-block text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded border border-orange-200">
                            مؤجل لمدة {seconds} ثانية
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {isDeferred && (
                          <button onClick={() => handleMarkAsPaid(transaction.id)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm transition">
                            تحويل لمدفوع
                          </button>
                        )}
                        {isPaid && (
                          <div className="flex-1 bg-blue-50 text-blue-800 py-2.5 rounded-xl text-sm font-bold text-center border border-blue-200">
                            رصيد مدفوع
                          </div>
                        )}
                        <button onClick={() => handleDeleteTransaction(transaction.id)} className="flex-1 border-2 border-red-100 text-red-600 bg-white hover:bg-red-50 py-2.5 rounded-xl text-sm font-bold transition">
                          حذف الدفعة
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
        <div className="flex justify-end p-4 border-t border-gray-200 bg-white md:bg-gray-50 rounded-b-xl shrink-0">
          <button onClick={onClose} className="w-full md:w-auto px-6 py-3 md:py-2.5 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 shadow-sm transition">
            إغلاق النافذة
          </button>
        </div>
      </div>

      {/* الدرج الجانبي للمحذوفات (Side Drawer) */}
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
                      {transaction.type === 'deposit' ? 'إيداع' : 'سحب'}
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
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">إرسال إشعار للطالب</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">عنوان الإشعار</label>
                <input type="text" value={quickNotification.title} onChange={(e) => setQuickNotification(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">محتوى الإشعار</label>
                <textarea value={quickNotification.body} onChange={(e) => setQuickNotification(prev => ({ ...prev, body: e.target.value }))} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-sm leading-relaxed" />
              </div>
            </div>
            <div className="flex flex-col-reverse md:flex-row justify-end mt-6 gap-2 md:gap-3">
              <button onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })} className="w-full md:w-auto px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold text-sm">
                تخطي الإرسال
              </button>
              <button onClick={handleSendQuickNotification} disabled={isSendingNotif || !quickNotification.title || !quickNotification.body} className="w-full md:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-bold text-sm shadow-sm">
                {isSendingNotif ? 'جاري الإرسال...' : 'إرسال الإشعار'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
