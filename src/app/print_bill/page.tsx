'use client';

import { useState, useEffect } from 'react';


type BillItem = {
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
  name: string;
  phone: string;
  details?: BillDetailItem[];
};

type BillDetailItem = {
  id?: number;
  billId: string;
  m_id: number;
  m_price: number;
  status: string;
  m_name?: string;
};

type MaterialItem = {
  id: number;
  m_name: string;
  mokarar_free:string;
  quiz_free:string
  voice_free:string
};

export default function BillManagement() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [filteredBills, setFilteredBills] = useState<BillItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [editingBill, setEditingBill] = useState<BillItem | null>(null);
  const [newDetail, setNewDetail] = useState<BillDetailItem>({
    billId: '',
    m_id: 0,
    m_price: 0,
    status: 'active'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
 

  const API_URL = 'http://alraskun.atwebpages.com/cp_bills.php';
  const MATERIALS_API_URL = 'http://alraskun.atwebpages.com/cp_bill_material.php';

  useEffect(() => {
    fetchData();
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredBills(bills);
    } else {
      setFilteredBills(bills.filter(bill => bill.status === statusFilter));
    }
  }, [bills, statusFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('فشل في جلب البيانات');
      const result = await response.json();
      setBills(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBillDetails = async (billId: string) => {
    try {
      const response = await fetch(`${API_URL}?id=${billId}`);
      if (!response.ok) throw new Error('فشل في جلب تفاصيل الفاتورة');
      const result = await response.json();
      return result.details || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب التفاصيل');
      return [];
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch(MATERIALS_API_URL);
      if (!response.ok) throw new Error('فشل في جلب المواد');
      const result = await response.json();
      setMaterials(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب المواد');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف الفاتورة');
      
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    try {
      const method = editingBill.id ? 'PUT' : 'POST';
      const url = editingBill.id ? `${API_URL}?id=${editingBill.id}` : API_URL;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingBill),
      });

      if (!response.ok) throw new Error('فشل في حفظ البيانات');

      setEditingBill(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    }
  };

 // const openEditForm = (bill: BillItem) => {
  //  setEditingBill({ ...bill });
  //};

  const updateBillStatus = async (billId: number, newStatus: string) => {
    try {
      const billToUpdate = bills.find(bill => bill.id === billId);
      if (!billToUpdate) return;

      const response = await fetch(`${API_URL}?id=${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...billToUpdate,
          status: newStatus
        }),
      });

      if (!response.ok) throw new Error('فشل في تحديث حالة الفاتورة');

      fetchData();



    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الحالة');
    }
  };

  const addDetail = () => {
    if (!editingBill || !newDetail.m_id || newDetail.m_price <= 0) return;
    
    const material = materials.find(m => m.id === newDetail.m_id);
    const detailToAdd = {
      ...newDetail,
      billId: editingBill.billId,
      m_name: material?.m_name || ''
    };
    
    setEditingBill(prev => ({
      ...prev!,
      details: [...(prev?.details || []), detailToAdd]
    }));
    
    // Update total
    const newTotal = parseFloat(editingBill.total || '0') + newDetail.m_price;
    setEditingBill(prev => ({
      ...prev!,
      total: newTotal.toString()
    }));
    
    // Reset new detail form
    setNewDetail({
      billId: editingBill.billId,
      m_id: 0,
      m_price: 0,
      status: 'active'
    });
  };

  const removeDetail = (index: number) => {
    if (!editingBill || !editingBill.details) return;
    
    const detailToRemove = editingBill.details[index];
    const newDetails = [...editingBill.details];
    newDetails.splice(index, 1);
    
    setEditingBill(prev => ({
      ...prev!,
      details: newDetails,
      total: (parseFloat(prev?.total || '0') - detailToRemove.m_price).toString()
    }));
  };

  const toggleRow = async (billId: number) => {
    // If the row is already expanded, just toggle it
    if (expandedRows[billId]) {
      setExpandedRows(prev => ({ ...prev, [billId]: !prev[billId] }));
      return;
    }

    // If the row is not expanded, fetch details first
    try {
      setIsLoading(true);
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;

      // If details are already loaded, just toggle the row
      if (bill.details) {
        setExpandedRows(prev => ({ ...prev, [billId]: !prev[billId] }));
        return;
      }

      // Fetch details from API
      const details = await fetchBillDetails(bill.billId);
      
      // Update the bill with details
      setBills(prev => prev.map(b => 
        b.id === billId ? { ...b, details } : b
      ));
      
      // Expand the row
      setExpandedRows(prev => ({ ...prev, [billId]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب التفاصيل');
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-800">إدارة الفواتير</h1>
        </div>

        {/* Filter Section */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">فلترة حسب الحالة:</span>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">الكل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="processing">قيد المعالجة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        {/* Modal for Edit */}
        {editingBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  تعديل الفاتورة
                </h2>
                <button 
                  onClick={() => setEditingBill(null)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الفاتورة</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.billId}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حالة الفاتورة</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.status}
                      onChange={(e) => setEditingBill({...editingBill, status: e.target.value})}
                      required
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="processing">قيد المعالجة</option>
                      <option value="completed">مكتملة</option>
                      <option value="cancelled">ملغاة</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">معرف المستخدم</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.user_id}
                      onChange={(e) => setEditingBill({...editingBill, user_id: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع التوصيل</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.delv_type}
                      onChange={(e) => setEditingBill({...editingBill, delv_type: e.target.value})}
                      required
                    >
                      <option value="">اختر نوع التوصيل</option>
                      <option value="standard">توصيل عادي</option>
                      <option value="express">توصيل سريع</option>
                      <option value="pickup">استلام من المتجر</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر التوصيل</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.delv_price}
                      onChange={(e) => setEditingBill({...editingBill, delv_price: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستلم</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.rec_name}
                      onChange={(e) => setEditingBill({...editingBill, rec_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">هاتف المستلم</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.rec_phone}
                      onChange={(e) => setEditingBill({...editingBill, rec_phone: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المجموع</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.total}
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingBill.note}
                    onChange={(e) => setEditingBill({...editingBill, note: e.target.value})}
                  />
                </div>
                
                {/* Bill Details Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">تفاصيل الفاتورة</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={newDetail.m_id}
                        onChange={(e) => setNewDetail({...newDetail, m_id: parseInt(e.target.value)})}
                      >
                        <option value="0">اختر مادة</option>
                        {materials.map(material => (
                          <option key={material.id} value={material.id}>{material.m_name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={newDetail.m_price}
                        onChange={(e) => setNewDetail({...newDetail, m_price: parseFloat(e.target.value)})}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addDetail}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        إضافة مادة
                      </button>
                    </div>
                  </div>
                  
                  {editingBill.details && editingBill.details.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {editingBill.details.map((detail, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{detail.m_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{detail.m_price}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{detail.status}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => removeDetail(index)}
                                  className="text-red-600 hover:text-red-900"
                                >
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
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingBill(null)}
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
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">رقم الفاتورة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">المستلم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">رقم المستلم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">سعر التوصيل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">المجموع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <>
                  <tr 
                    key={bill.id} 
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => bill.id && toggleRow(bill.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 transform transition-transform ${expandedRows[bill.id!] ? 'rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{bill.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bill.name}</div>
                      <div className="text-sm text-gray-500">{bill.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bill.rec_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bill.rec_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bill.delv_price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{bill.total}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full 
                          ${bill.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            bill.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        value={bill.status}
                        onChange={(e) => bill.id && updateBillStatus(bill.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="processing">قيد المعالجة</option>
                        <option value="completed">مكتملة</option>
                        <option value="cancelled">ملغاة</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                              if (bill.id) {
                                handleDelete(bill.id);
                                 }
                            
                          }}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows[bill.id!] && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                            <div>
                              <h4 className="font-medium text-red-500 mb-2">معلومات التوصيل</h4>
                              <div className="space-y-2">
                                <p className="text-sm"><span className="font-medium">نوع التوصيل:</span> {bill.delv_type}</p>
                                <p className="text-sm"><span className="font-medium">اسم المستلم:</span> {bill.rec_name}</p>
                                <p className="text-sm"><span className="font-medium">رقم المستلم:</span> {bill.rec_phone}</p>
                                <p className="text-sm"><span className="font-medium">ملاحظات:</span> {bill.note || 'لا توجد ملاحظات'}</p>
                              </div>
                            </div>
                            
                            <div className="md:col-span-2">
                              <h4 className="font-medium text-red-500 mb-2">تفاصيل الفاتورة</h4>
                              {bill.details && bill.details.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                                        
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {bill.details.map((detail, index) => (
                                        <tr key={index}>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{detail.m_name}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{detail.m_price}</td>
                                
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500">لا توجد تفاصيل متاحة</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBills.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد فواتير</h3>
            <p className="mt-1 text-sm text-gray-500">لا توجد فواتير تطابق معايير الفلترة المحددة</p>
          </div>
        )}
      </div>
    </div>
  );
}