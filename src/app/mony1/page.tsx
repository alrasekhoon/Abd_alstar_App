const handlePayDeferred = async (id: number) => {
    if (!confirm('هل تريد تحويل هذا الرصيد المؤجل إلى مدفوع؟')) return;
    
    // البحث عن بيانات الدفعة كاملة
    const transactionToUpdate = transactions.find(t => t.id === id);
    if (!transactionToUpdate) return;

    try {
      // تجهيز البيانات كاملة للإرسال مع تعديل الملاحظة فقط
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
      fetchData(); // تحديث الجدول فوراً
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    }
  };

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة الدفعات المالية</h1>
          <div className="text-sm bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg font-bold">
            إجمالي المعاملات: {transactions.length}
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
          </div>
          
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              {filteredUsers.length === 0 ? (
                <span className="text-red-500">لا توجد نتائج للبحث</span>
              ) : (
                <span>تم العثور على {filteredUsers.length} طالب</span>
              )}
            </div>
          )}
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f5e97a] border-b border-[#c8b800]">الطالب</th>
                <th className="px-6 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f0e060] border-b border-[#c8b800]">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f5e97a] border-b border-[#c8b800]">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f0e060] border-b border-[#c8b800]">المسؤول</th>
                <th className="px-6 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f5e97a] border-b border-[#c8b800]">ملاحظات</th>
                <th className="px-6 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f0e060] border-b border-[#c8b800]">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-extrabold text-gray-800 uppercase tracking-wider bg-[#f5e97a] border-b border-[#c8b800]">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const isDeleted = deletedIds.has(transaction.id!);
                const isDeferred = (transaction.note?.includes('DEFERRED') || transaction.note?.includes('مؤجل')) && !transaction.note?.includes('تم دفعه');
const isPaidDeferred = paidDeferredIds.has(transaction.id!) || transaction.note?.includes('تم دفعه');
                const isDeposit = parseFloat(transaction.mony) >= 0;

                return (
                  <tr key={transaction.id} className={`transition ${isDeleted ? 'bg-red-50 opacity-60' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium text-gray-900 ${isDeleted ? 'line-through text-gray-400' : ''}`}>
                        {getUserName(transaction.user_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold ${isDeleted ? 'line-through text-gray-400' : isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.mony} {transaction.dolar === 'yes' ? '$' : 'ل.س'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPaidDeferred ? (
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">مؤجل وتم دفعه ✓</span>
                      ) : isDeferred ? (
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-orange-100 text-orange-800">رصيد مؤجل ⏳</span>
                      ) : isDeposit ? (
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">رصيد نقدي 💵</span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800">رصيد مسترد 💸</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{currentUser.name}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className={`text-sm ${isDeleted ? 'line-through text-gray-400' : 'text-gray-500'}`}>{transaction.note}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {transaction.add_date ? new Date(transaction.add_date).toLocaleString() : '--'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {isDeleted ? (
                        <span className="text-xs text-red-400 font-bold">محذوف</span>
                      ) : (
                        <div className="flex gap-2">
                          {isDeferred && !isPaidDeferred && (
                            <button
                              onClick={() => transaction.id && handlePayDeferred(transaction.id)}
                              className="px-2 py-1 text-xs font-bold rounded-lg bg-orange-50 border border-orange-300 text-orange-600 hover:bg-orange-100 transition"
                            >
                              دفع المؤجل
                            </button>
                          )}
                          <button
                            onClick={() => transaction.id && handleDelete(transaction.id)}
                            className="px-2 py-1 text-xs font-bold rounded-lg bg-white border border-red-300 text-red-600 hover:bg-red-50 transition"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* نسخة الموبايل - بطاقات */}
        <div className="md:hidden space-y-3 mt-4">
          {transactions.map((transaction) => {
            const isDeleted = deletedIds.has(transaction.id!);
            const isDeferred = transaction.note?.includes('مؤجل') && !transaction.note?.includes('تم دفعه');
            const isPaidDeferred = paidDeferredIds.has(transaction.id!) || transaction.note?.includes('مؤجل وتم دفعه');
            const isDeposit = parseFloat(transaction.mony) >= 0;

            return (
              <div key={transaction.id} className={`rounded-2xl border p-4 shadow-sm ${isDeleted ? 'bg-red-50 border-red-200 opacity-60' : 'bg-white border-gray-200'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400 font-bold">#{transaction.id}</span>
                  <span className={`text-sm font-bold ${isDeleted ? 'line-through text-gray-400' : ''}`}>{getUserName(transaction.user_id)}</span>
                </div>
                <div className={`text-2xl font-extrabold text-center my-3 ${isDeleted ? 'line-through text-gray-400' : isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.mony} {transaction.dolar === 'yes' ? '$' : 'ل.س'}
                </div>
                <div className="flex justify-between items-center mb-2">
                  {isPaidDeferred ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">مؤجل وتم دفعه ✓</span>
                  ) : isDeferred ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">رصيد مؤجل ⏳</span>
                  ) : isDeposit ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">رصيد نقدي 💵</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">رصيد مسترد 💸</span>
                  )}
                  <span className="text-xs text-gray-400">{transaction.add_date ? new Date(transaction.add_date).toLocaleDateString('ar-EG') : '--'}</span>
                </div>
                {transaction.note ? <p className={`text-xs mb-3 ${isDeleted ? 'line-through text-gray-400' : 'text-gray-500'}`}>{transaction.note}</p> : null}
                {isDeleted ? (
                  <div className="text-center text-xs text-red-400 font-bold py-1">محذوف</div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    {isDeferred && !isPaidDeferred && (
                      <button
                        onClick={() => transaction.id && handlePayDeferred(transaction.id)}
                        className="flex-1 py-2 text-xs font-bold rounded-xl bg-orange-50 border border-orange-300 text-orange-600 hover:bg-orange-100 transition"
                      >
                        دفع المؤجل
                      </button>
                    )}
                    <button
                      onClick={() => transaction.id && handleDelete(transaction.id)}
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-white border border-red-300 text-red-600 hover:bg-red-50 transition"
                    >
                      حذف
                    </button>
                  </div>
                )}
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


