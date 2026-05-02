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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  
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
      
      if (!response.ok) {
        throw new Error(`فشل في جلب البيانات: ${response.status}`);
      }
      
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'حدث خطأ غير متوقع');
      }

      setUser(result.user || null);
      setTransactions(result.rseed || result.transactions || []);
      setSummary(result.summary || {
        total_deposit: 0,
        total_withdraw: 0,
        balance: 0
      });
      
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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTransaction.mony) {
      setError('المبلغ مطلوب');
      return;
    }

    try {
      setIsAdding(true);
      setError('');
      
      const requestBody = {
        user_id: userId,
        mony: newTransaction.mony,
        type: newTransaction.type,
        note: newTransaction.note
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
      
      if (!response.ok) {
        throw new Error(`خطأ في السيرفر: ${response.status} ${response.statusText}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في إضافة الدفعة');
      }

      await fetchData();
      setShowAddForm(false);
      
      if (requestBody.type === 'deposit') {
        setQuickNotification({
          isOpen: true,
          title: 'إشعار مالي',
          body: `تمت إضافة رصيد بقيمة (${Number(requestBody.mony).toLocaleString()} ل.س.) إلى حسابكم بنجاح.\nيُرجى الاشتراك فوراً لضمان حصولكم على الخدمة وفقاً للأسعار الحالية قبل أي تعديل محتمل.\nنسعد دائماً بخدمتكم، ونتمنى لكم دوام التوفيق.`
        });
      }

      setNewTransaction({
        mony: '',
        type: 'deposit',
        note: ''
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      return;
    }

    const transToDelete = transactions.find(t => t.id === transactionId);

    try {
      setError('');
      
      const response = await fetch(`${API_URL}?id=${transactionId}&user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store' as RequestCache
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`خطأ في السيرفر: ${response.status} ${response.statusText}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في حذف الدفعة');
      }

      // إضافة الدفعة إلى قائمة المحذوفات محلياً
      if (transToDelete) {
        setDeletedTransactions(prev => [...prev, transToDelete]);
      }

      await fetchData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      {/* التعتيم الخاص بالنافذة الأساسية */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col">
        
        {/* الهيدر */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 flex-wrap gap-4 rounded-t-xl shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">إدارة الدفعات المالية</h2>
            <p className="text-gray-600 mt-1 font-medium">
              {userName} - ID: {userId} {user && `| الهاتف: ${user.phone}`}
            </p>
          </div>

          {/* الإحصائيات العلوية */}
          {summary && !isLoading && !error && (
            <div className="flex gap-4 bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm text-sm">
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-500 uppercase text-xs">الرصيد الحالي</span>
                <span className={`font-extrabold text-lg ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {summary.balance.toLocaleString()}
                </span>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-500 uppercase text-xs">إجمالي الإيداع</span>
                <span className="font-extrabold text-green-600 text-lg">{summary.total_deposit.toLocaleString()}</span>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-500 uppercase text-xs">إجمالي السحب</span>
                <span className="font-extrabold text-red-600 text-lg">{summary.total_withdraw.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              سجل المحذوفات
              {deletedTransactions.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">{deletedTransactions.length}</span>
              )}
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              إضافة دفعة
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-200 transition border border-transparent hover:border-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* محتوى النافذة (قابل للتمرير) */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* رسائل الخطأ والتحديث */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg" role="alert">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {transactions.length > 0 && !isLoading && (
            <div className="mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex justify-between items-center shadow-sm">
              <span className="text-blue-700 font-bold text-sm">
                آخر تحديث للبيانات: {new Date().toLocaleTimeString('ar-EG')}
              </span>
              <button 
                onClick={fetchData}
                className="text-xs bg-white hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-800 font-bold transition-colors shadow-sm"
              >
                تحديث الآن
              </button>
            </div>
          )}

          {/* نموذج الإضافة */}
          {showAddForm && (
            <div className="mb-6 p-6 border border-blue-200 rounded-xl bg-blue-50/50 shadow-sm">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
                تفاصيل الدفعة الجديدة
              </h3>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ (ل.س)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newTransaction.mony}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, mony: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-extrabold text-blue-800"
                    placeholder="مثال: 50000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">نوع العملية</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as 'deposit' | 'withdraw' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold cursor-pointer"
                  >
                    <option value="deposit">إيداع (إضافة رصيد)</option>
                    <option value="withdraw">سحب (خصم رصيد)</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظة (اختياري)</label>
                  <input
                    type="text"
                    value={newTransaction.note}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    placeholder="اكتب ملاحظة حول هذه الدفعة..."
                  />
                </div>
                
                <div className="md:col-span-4 flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                  >
                    {isAdding ? 'جاري التنفيذ...' : 'تنفيذ وحفظ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition shadow-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* محتوى الدفعات */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-lg font-bold text-gray-700">جاري تحميل الدفعات...</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v1m6-10h2m-10 0h2m5 15h2m-10 0h2" />
              </svg>
              <h3 className="text-xl font-extrabold text-gray-800">لا توجد دفعات مالية</h3>
              <p className="text-gray-500 mt-2 font-medium">لم يتم العثور على أي حركات مالية لهذا المستخدم</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
              <table className="w-full text-right divide-y divide-gray-200 table-auto">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800 w-12">#</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">النوع</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f0e060] text-gray-800">ملاحظة</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold border-b border-[#c8b800] bg-[#f5e97a] text-gray-800">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-extrabold text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-extrabold">
                        <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                          {Number(transaction.mony).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          transaction.type === 'deposit' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {transaction.type === 'deposit' ? 'إيداع' : 'سحب'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-600 max-w-xs">
                        <div className="truncate" title={transaction.note || ''}>
                          {transaction.note || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-500 hover:text-white border border-red-500 hover:bg-red-500 px-3 py-1.5 rounded-lg transition shadow-sm flex items-center justify-center gap-1"
                          title="حذف الدفعة"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* الفوتر */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 shadow-sm transition"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* الدرج الجانبي للمحذوفات (Side Drawer) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-red-900 tracking-tight">سجل المحذوفات</h3>
              <p className="text-xs font-bold text-red-600 mt-1">الدفعات المحذوفة للقراءة فقط</p>
            </div>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="bg-white text-gray-500 hover:text-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">تصفية حسب الفصل (ميزة مستقبلية)</label>
          <select 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-red-200 outline-none transition shadow-sm cursor-pointer"
          >
            <option value="">جميع الفصول</option>
            <option value="F23">F23 (خريف 2023)</option>
            <option value="S24">S24 (ربيع 2024)</option>
            <option value="F24">F24 (خريف 2024)</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {deletedTransactions.length === 0 ? (
            <div className="text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <p className="text-gray-500 font-bold">سجل المحذوفات فارغ</p>
            </div>
          ) : (
            deletedTransactions.map((transaction, index) => (
              <div key={`del-${transaction.id}-${index}`} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-red-400"></div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-extrabold text-gray-900 line-through decoration-red-400 decoration-2">
                      {Number(transaction.mony).toLocaleString()} ل.س
                    </h4>
                    <span className="text-xs font-medium text-gray-500 mt-1 inline-block truncate max-w-[200px]">
                      ملاحظة: {transaction.note || '-'}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                    transaction.type === 'deposit' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {transaction.type === 'deposit' ? 'إيداع' : 'سحب'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* تعتيم الخلفية للدرج الجانبي */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[65] transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}

      {quickNotification.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[80]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative z-10">
            <h3 className="text-xl font-bold text-gray-800 mb-4">إرسال إشعار للطالب</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الإشعار</label>
                <input
                  type="text"
                  value={quickNotification.title}
                  onChange={(e) => setQuickNotification(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الإشعار</label>
                <textarea
                  value={quickNotification.body}
                  onChange={(e) => setQuickNotification(prev => ({ ...prev, body: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3 gap-2">
              <button
                onClick={() => setQuickNotification({ isOpen: false, title: '', body: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold"
              >
                تخطي / إلغاء
              </button>
              <button
                onClick={handleSendQuickNotification}
                disabled={isSendingNotif || !quickNotification.title || !quickNotification.body}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-bold"
              >
                {isSendingNotif ? 'جاري الإرسال...' : 'إرسال الإشعار'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
