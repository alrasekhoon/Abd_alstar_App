'use client';

import { useState, useEffect } from 'react';

type Transaction = {
  id?: number;
  user_id: number;
  mony: string;
  type: 'deposit' | 'withdraw';
  dolar: 'yes' | 'no';
  admin_user: number;
  note: string;
  add_date?: string;
  update_date?: string;
};

type User = {
  id: number;
  name: string;
  phone: string;
};

export default function MoneyManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const API_URL = '/api/proxy/cp_money.php';
  const USERS_API_URL = '/api/proxy/cp_mony_getuser.php';

  // تعريف المستخدم الحالي كمتغير ثابت بدلاً من state
  const currentUser = { id: 1, name: 'Admin' };
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [paidDeferredIds, setPaidDeferredIds] = useState<Set<number>>(new Set());


  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  // تأخير البحث لتجنب طلبات متكررة
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

 const fetchData = async () => {
    try {
      setIsLoading(true);
      const url = `${API_URL}?_t=${new Date().getTime()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store' as RequestCache
      });
      if (!response.ok) throw new Error('فشل في جلب البيانات');
      const result = await response.json();
      setTransactions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const url = `${USERS_API_URL}?_t=${new Date().getTime()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store' as RequestCache
      });
      if (!response.ok) throw new Error('فشل في جلب بيانات الطلاب');
      const result = await response.json();
      setUsers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب بيانات الطلاب');
    }
  };

 const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
    user.phone.includes(debouncedSearchTerm) ||
    user.id.toString().includes(debouncedSearchTerm)
  );

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف المعاملة');
      
      setDeletedIds(prev => new Set(prev).add(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  // ---- الصق الدالة هنا ----
  const handlePayDeferred = async (id: number) => {
    if (!confirm('هل تريد تحويل هذا الرصيد المؤجل إلى مدفوع؟')) return;
    
    const transactionToUpdate = transactions.find(t => t.id === id);
    if (!transactionToUpdate) return;

    try {
      const dataToSend = {
        ...transactionToUpdate,
        note: 'مؤجل وتم دفعه',
        update_date: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error('فشل في تحديث الدفعة');
      
      setPaidDeferredIds(prev => new Set(prev).add(id));
      fetchData(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    }
  };
  // -------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      const amount = editingTransaction.type === 'withdraw' 
        ? `-${Math.abs(parseFloat(editingTransaction.mony))}` 
        : editingTransaction.mony;

      const method = editingTransaction.id ? 'PUT' : 'POST';
      const url = editingTransaction.id ? `${API_URL}?id=${editingTransaction.id}` : API_URL;

      const dataToSend = {
        ...editingTransaction,
        mony: amount,
        admin_user: currentUser.id,
        add_date: new Date().toISOString(),
        update_date: new Date().toISOString()
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error('فشل في حفظ البيانات');

      setEditingTransaction(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    }
  };

  const openAddDepositForm = () => {
    setEditingTransaction({
      user_id: 0,
      mony: '',
      type: 'deposit',
      dolar: 'no',
      admin_user: currentUser.id,
      note: ''
    });
  };

  const openAddWithdrawForm = () => {
    setEditingTransaction({
      user_id: 0,
      mony: '',
      type: 'withdraw',
      dolar: 'no',
      admin_user: currentUser.id,
      note: ''
    });
  };

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction({ ...transaction });
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'غير معروف';
  };

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
       <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">إدارة الدفعات المالية</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
              placeholder="ابحث عن طالب بالاسم أو رقم الهاتف أو الرقم التعريفي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600 mr-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            {searchTerm && (
              <div className="absolute top-full mt-1 right-0 text-sm text-gray-600 bg-white p-2 rounded-lg shadow-md border z-10 w-full max-w-xs">
                {filteredUsers.length === 0 ? (
                  <span className="text-red-500 font-bold">لا توجد نتائج للبحث</span>
                ) : (
                  <span className="font-medium">تم العثور على {filteredUsers.length} طالب</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchData} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition border border-blue-200" title="تحديث البيانات">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <div className="text-sm bg-[#fef08a] border border-[#fde047] text-gray-800 px-6 py-2.5 rounded-xl font-extrabold shadow-sm flex items-center justify-center min-w-[160px]">
              إجمالي المعاملات: {transactions.filter(t => t.type !== 'withdraw').length}
            </div>
          </div>
        </div>

        {editingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingTransaction.id ? 'تعديل المعاملة' : 
                   editingTransaction.type === 'deposit' ? 'إضافة دفعة مالية' : 'سحب مبلغ مالي'}
                </h2>
                <button 
                  onClick={() => setEditingTransaction(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الطالب</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingTransaction.user_id}
                      onChange={(e) => setEditingTransaction({...editingTransaction, user_id: parseInt(e.target.value)})}
                      required
                    >
                      <option value="0">اختر طالب...</option>
                      {filteredUsers.length === 0 && searchTerm ? (
                        <option value="0" disabled>لا توجد نتائج للبحث</option>
                      ) : (
                        filteredUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} - {user.phone} (ID: {user.id})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingTransaction.mony.replace('-', '')}
                      onChange={(e) => setEditingTransaction({...editingTransaction, mony: e.target.value})}
                      placeholder="مثال: 500.00"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingTransaction.dolar}
                      onChange={(e) => setEditingTransaction({
                        ...editingTransaction,
                        dolar: e.target.value as 'yes' | 'no'
                      })}
                      required
                    >
                      <option value="no">ليرة سورية</option>
                      <option value="yes">دولار أمريكي</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingTransaction.note}
                    onChange={(e) => setEditingTransaction({...editingTransaction, note: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    حفظ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead>
              <tr>
                <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f5e97a] border-b border-[#c8b800] w-[16%]">الطالب</th>
                <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f0e060] border-b border-[#c8b800] w-[12%]">المبلغ</th>
                <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f5e97a] border-b border-[#c8b800] w-[12%]">المسؤول</th>
                <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f0e060] border-b border-[#c8b800] w-[20%]">ملاحظات</th>
                <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f5e97a] border-b border-[#c8b800] w-[15%]">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f0e060] border-b border-[#c8b800] w-[25%]">الإجراءات</th>
              </tr>
            </thead>

          <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const isDeleted = deletedIds.has(transaction.id!);
                const isDeferred = (transaction.note?.includes('DEFERRED') || transaction.note?.includes('مؤجل')) && !transaction.note?.includes('تم دفعه');
                const isPaidDeferred = paidDeferredIds.has(transaction.id!) || transaction.note?.includes('تم دفعه');
                // الاعتماد على نوع المعاملة لضمان الدقة
                const isDeposit = transaction.type === 'deposit';

                return (
                  <tr key={transaction.id} className={`transition ${isDeleted ? 'bg-red-50 opacity-60' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium text-gray-900 ${isDeleted ? 'line-through text-gray-400' : ''}`}>
                        {getUserName(transaction.user_id)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold ${isDeleted ? 'line-through text-gray-400' : isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.mony} {transaction.dolar === 'yes' ? '$' : 'ل.س'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{currentUser.name}</div>
                    </td>
                    <td className="px-4 py-4 max-w-xs truncate">
                      <div className={`text-sm ${isDeleted ? 'line-through text-gray-400' : 'text-gray-500'}`} title={transaction.note}>
                        {transaction.note}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {transaction.add_date ? new Date(transaction.add_date).toLocaleDateString('ar-EG') : '--'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {isPaidDeferred ? (
                          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">مؤجل وتم دفعه ✓</span>
                        ) : isDeferred ? (
                          <button onClick={() => transaction.id && handlePayDeferred(transaction.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#f97316] text-white hover:bg-[#ea580c] transition shadow-sm">
                            دفع المؤجل
                          </button>
                        ) : isDeposit ? (
                          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-50 text-green-700 border border-green-200">رصيد نقدي 💵</span>
                        ) : (
                          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200">رصيد مسترد 💸</span>
                        )}
                        
                        {!isDeleted ? (
                          <button onClick={() => transaction.id && handleDelete(transaction.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-red-300 text-red-500 hover:bg-red-50 transition">
                            حذف
                          </button>
                        ) : (
                          <span className="text-xs text-red-400 font-bold">محذوف</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* نسخة الموبايل - بطاقات */}
      {/* نسخة الموبايل - بطاقات */}
        <div className="md:hidden space-y-3 mt-4">
          {transactions.map((transaction) => {
            const isDeleted = deletedIds.has(transaction.id!);
            const isDeferred = (transaction.note?.includes('DEFERRED') || transaction.note?.includes('مؤجل')) && !transaction.note?.includes('تم دفعه');
            const isPaidDeferred = paidDeferredIds.has(transaction.id!) || transaction.note?.includes('تم دفعه');
            const isDeposit = transaction.type === 'deposit';

            return (
              <div key={transaction.id} className={`rounded-2xl border p-4 shadow-sm ${isDeleted ? 'bg-red-50 border-red-200 opacity-60' : 'bg-white border-gray-200'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400 font-bold">#{transaction.id}</span>
                  <span className={`text-sm font-bold ${isDeleted ? 'line-through text-gray-400' : ''}`}>{getUserName(transaction.user_id)}</span>
                </div>
                <div className={`text-2xl font-extrabold text-center my-3 ${isDeleted ? 'line-through text-gray-400' : isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.mony} {transaction.dolar === 'yes' ? '$' : 'ل.س'}
                </div>
                
                <div className="flex justify-between items-center mb-3 gap-2">
                  <div className="flex-1">
                    {isPaidDeferred ? (
                      <span className="block text-center px-2 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 text-blue-800">مؤجل وتم دفعه ✓</span>
                    ) : isDeferred ? (
                      <button onClick={() => transaction.id && handlePayDeferred(transaction.id)} className="w-full py-1.5 text-xs font-bold rounded-lg bg-[#f97316] text-white hover:bg-[#ea580c] transition shadow-sm">
                        دفع المؤجل
                      </button>
                    ) : isDeposit ? (
                      <span className="block text-center px-2 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-800">رصيد نقدي 💵</span>
                    ) : (
                      <span className="block text-center px-2 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-800">رصيد مسترد 💸</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{transaction.add_date ? new Date(transaction.add_date).toLocaleDateString('ar-EG') : '--'}</span>
                </div>
                
                {transaction.note ? <p className={`text-xs mb-3 ${isDeleted ? 'line-through text-gray-400' : 'text-gray-500'}`}>{transaction.note}</p> : null}
                
                <div className="mt-2">
                  {!isDeleted ? (
                    <button
                      onClick={() => transaction.id && handleDelete(transaction.id)}
                      className="w-full py-2 text-xs font-bold rounded-xl bg-white border border-red-300 text-red-500 hover:bg-red-50 transition"
                    >
                      حذف
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 text-xs text-red-400 font-bold border border-red-100 rounded-xl bg-red-50">محذوف</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {transactions.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد معاملات مالية</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة دفعة أو سحب مالي بالنقر على الأزرار أعلاه</p>
          </div>
        )}
      </div>
    </div>
  );
}


