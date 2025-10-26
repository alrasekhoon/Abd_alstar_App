'use client';

import { useState, useEffect } from 'react';

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
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [newTransaction, setNewTransaction] = useState({
    mony: '',
    type: 'deposit' as 'deposit' | 'withdraw',
    note: ''
  });

  const API_URL = '/api/proxy/user_transactions.php';

  // جلب البيانات - مع منع الـ Cache
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // إضافة timestamp لمنع الـ cache
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

      console.log('🔍 البيانات المستلمة:', {
        success: result.success,
        transactionsCount: result.transactions?.length,
        rseedCount: result.rseed?.length,
        summary: result.summary,
        fullData: result
      });

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
  };

  useEffect(() => {
    if (isOpen && userId) {
      console.log('🔄 جلب البيانات للمستخدم:', userId);
      fetchData();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    console.log('📊 تحديث transactions:', {
      count: transactions.length,
      items: transactions.map(t => ({ id: t.id, mony: t.mony })),
      total: transactions.reduce((sum, t) => sum + Number(t.mony), 0)
    });
  }, [transactions]);

  // إضافة دفعة جديدة
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
      
      console.log('➕ إضافة دفعة جديدة:', requestBody);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      console.log('✅ نتيجة الإضافة:', result);
      
      if (!response.ok) {
        throw new Error(`خطأ في السيرفر: ${response.status} ${response.statusText}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في إضافة الدفعة');
      }

      // إعادة تحميل البيانات فوراً بعد الإضافة
      await fetchData();
      
      setNewTransaction({
        mony: '',
        type: 'deposit',
        note: ''
      });
      
    } catch (err) {
      console.error('❌ خطأ في الإضافة:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة');
    } finally {
      setIsAdding(false);
    }
  };

  // حذف دفعة
  // حذف دفعة - باستخدام query parameters
const handleDeleteTransaction = async (transactionId: number) => {
  if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
    return;
  }

  try {
    setError('');
    
    // إرسال البيانات في query parameters بدلاً من body
    const response = await fetch(`${API_URL}?id=${transactionId}&user_id=${userId}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`خطأ في السيرفر: ${response.status} ${response.statusText}`);
    }
    
    if (!result.success) {
      throw new Error(result.error || 'فشل في حذف الدفعة');
    }

    await fetchData();
    
  } catch (err) {
    setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* رأس المودال */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">إدارة الدفعات المالية</h2>
            <p className="text-gray-600 mt-1">
              للمستخدم: <span className="font-semibold">{userName}</span>
              {user && ` - الهاتف: ${user.phone}`}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* محتوى المودال */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* معلومات التحديث */}
          {transactions.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">
                  آخر تحديث: {new Date().toLocaleTimeString()}
                </span>
                <button 
                  onClick={fetchData}
                  className="text-sm bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded text-blue-800 transition-colors"
                >
                  تحديث البيانات
                </button>
              </div>
            </div>
          )}

          {/* ملخص الحساب */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-green-600 font-bold text-2xl">
                  {summary.total_deposit.toLocaleString()}
                </div>
                <div className="text-green-800 font-medium">إجمالي الإيداعات</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-red-600 font-bold text-2xl">
                  {summary.total_withdraw.toLocaleString()}
                </div>
                <div className="text-red-800 font-medium">إجمالي السحوبات</div>
              </div>
              <div className={`border rounded-lg p-4 text-center ${
                summary.balance >= 0 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className={`font-bold text-2xl ${
                  summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {summary.balance.toLocaleString()}
                </div>
                <div className={summary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}>
                  الرصيد الحالي
                </div>
              </div>
            </div>
          )}

          {/* نموذج إضافة دفعة جديدة */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">إضافة دفعة جديدة</h3>
            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newTransaction.mony}
                  onChange={(e) => setNewTransaction(prev => ({
                    ...prev,
                    mony: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction(prev => ({
                    ...prev,
                    type: e.target.value as 'deposit' | 'withdraw'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="deposit">إيداع</option>
                  <option value="withdraw">سحب</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة</label>
                <input
                  type="text"
                  value={newTransaction.note}
                  onChange={(e) => setNewTransaction(prev => ({
                    ...prev,
                    note: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ملاحظة حول العملية"
                />
              </div>
              
              <div className="md:col-span-4">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isAdding ? 'جاري الإضافة...' : 'إضافة الدفعة'}
                </button>
              </div>
            </form>
          </div>

          {/* قائمة الدفعات */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">سجل الدفعات</h3>
              {transactions.length > 0 && (
                <div className="bg-blue-50 px-3 py-1 rounded-full">
                  <span className="text-blue-700 text-sm font-medium">
                    عدد الدفعات: {transactions.length}
                  </span>
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                <p>{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">جاري تحميل البيانات...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v1m6-10h2m-10 0h2m5 15h2m-10 0h2" />
                </svg>
                <p className="text-lg">لا توجد دفعات مالية</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-500">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">المبلغ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">النوع</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">ملاحظة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction, index) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                            <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                              {Number(transaction.mony).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'deposit' 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {transaction.type === 'deposit' ? 'إيداع' : 'سحب'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 text-center max-w-xs">
                            <div className="truncate" title={transaction.note || ''}>
                              {transaction.note || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <button
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg border border-red-200 transition-colors duration-200"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* تذييل المودال */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}