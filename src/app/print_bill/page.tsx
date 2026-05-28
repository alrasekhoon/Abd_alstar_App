

'use client';

import React, { useState, useEffect, Fragment } from 'react';

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
  address: string;
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
  m_code: string;
  mokarar_free: string;
  quiz_free: string;
  voice_free: string;
};

type SubscriptionData = {
  userid: number;
  materialid: number;
  materialName: string;
  subscriptionTypes: {
    mokarar: boolean;
    quiz: boolean;
    voice: boolean;
  };
};

export default function BillManagement() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [filteredBills, setFilteredBills] = useState<BillItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [realMaterials, setRealMaterials] = useState<any[]>([]); // مواد Tmaterial من cp_material.php
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
  // حالة modal الاشتراكات المجانية
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    userid: 0,
    materialid: 0,
    materialName: '',
    subscriptionTypes: {
      mokarar: false,
      quiz: false,
      voice: false
    }
  });

  // حالات الدفعات المالية
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    user_id: 0,
    mony: '',
    type: 'deposit',
    dolar: 'no',
    note: ''
  });

// حالات الإشعارات
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifData, setNotifData] = useState({
    user_id: 0,
    title: '',
    body: '',
    url1: '',
    note1: ''
  });
  const [selectedUserName, setSelectedUserName] = useState('');

  // بيانات التحويل البنكي (قابلة للتعديل)
  const [bankAccounts, setBankAccounts] = useState('1- \n2- ');
  const [isBankSettingsOpen, setIsBankSettingsOpen] = useState(false);

  // رقم المندوب
  const [deliveryAgentPhone, setDeliveryAgentPhone] = useState('09999999');

  // مودال تأكيد الإشعار عند تغيير الحالة
  const [statusChangeModal, setStatusChangeModal] = useState<{
    open: boolean;
    bill: BillItem | null;
    newStatus: string;
    notifTitle: string;
    notifBody: string;
    trackingNumber: string;
    deliveryDate: string;
    deliveryTime: string;
    notifVariant: 'delivery' | 'shipping';
  }>({
    open: false,
    bill: null,
    newStatus: '',
    notifTitle: '',
    notifBody: '',
    trackingNumber: '',
    deliveryDate: '',
    deliveryTime: '11:00',
    notifVariant: 'delivery'
  });


const API_URL = '/api/proxy/cp_bills.php';
  const MATERIALS_API_URL = '/api/proxy/cp_bill_material.php';

  // دالة تحديد الخطاب حسب الجنس واستخراج الاسم الأول
  const getGreeting = (bill: BillItem) => {
    const firstName = (bill.name || bill.rec_name || '').split(' ')[0];
    // تحديد الجنس: إذا كان الاسم ينتهي بـ "ة" فالأرجح أنثى
    const isFemale = firstName.endsWith('ة') || firstName.endsWith('ى') || firstName.endsWith('اء');
    return `${isFemale ? 'العزيزة' : 'العزيز'} ${firstName}`;
  };

  // قاموس الحالات: الاسم العربي، اللون، الأيقونة
  const STATUS_MAP: Record<string, { label: string; color: string; rowBg: string; icon: string }> = {
    pending:          { label: 'بانتظار السداد',       color: 'bg-yellow-100 text-yellow-800 border-yellow-300',   rowBg: 'bg-yellow-50/40',   icon: '⏳' },
    paid:             { label: 'تم السداد',            color: 'bg-emerald-100 text-emerald-800 border-emerald-300', rowBg: 'bg-emerald-50/40',  icon: '💳' },
    printing:         { label: 'قيد الطباعة',          color: 'bg-blue-100 text-blue-800 border-blue-300',         rowBg: 'bg-blue-50/40',     icon: '🖨️' },
    packing:          { label: 'قيد التجهيز للإرسال',  color: 'bg-purple-100 text-purple-800 border-purple-300',   rowBg: 'bg-purple-50/40',   icon: '📦' },
    waiting_pickup:   { label: 'بانتظار الاستلام',     color: 'bg-orange-100 text-orange-800 border-orange-300',   rowBg: 'bg-orange-50/40',   icon: '🚚' },
    completed:        { label: 'مكتمل',                color: 'bg-green-100 text-green-800 border-green-300',       rowBg: 'bg-green-50/40',    icon: '✅' },
    cancelled:        { label: 'ملغي',                 color: 'bg-red-100 text-red-800 border-red-300',             rowBg: 'bg-red-50/40',      icon: '❌' },
    processing:       { label: 'قيد المعالجة',         color: 'bg-indigo-100 text-indigo-800 border-indigo-300',   rowBg: 'bg-indigo-50/40',   icon: '⚙️' },
  };

  // دالة توليد نص الإشعار حسب الحالة
  const generateNotifForStatus = (
    bill: BillItem,
    newStatus: string,
    variant: 'delivery' | 'shipping' = 'delivery',
    extra: { trackingNumber?: string; deliveryDate?: string; deliveryTime?: string } = {}
  ): { title: string; body: string } => {
    const greeting = getGreeting(bill);
    const tomorrow = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    })();
    const tomorrowDay = new Date(); tomorrowDay.setDate(tomorrowDay.getDate() + 1);
    const dayName = tomorrowDay.toLocaleDateString('ar-SA', { weekday: 'long' });
    const dateStr = tomorrowDay.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    switch (newStatus) {
      case 'paid':
        return {
          title: 'تأكيد استلام الدفعة 💳',
          body: `${greeting}، تم استلام الدفعة المالية بنجاح.\nلقد تمت جدولة طلبكم وإدراجه ضمن خطة الطباعة وفقاً للترتيب المعتمد، سنقوم بإشعاركم فور البدء الفعلي بالتنفيذ، علماً الوقت المتوقع للتنفيذ من يوم عمل إلى أربعة أيام.`
        };
      case 'printing':
        return {
          title: 'طلبك قيد الطباعة الآن!',
          body: `${greeting}، نود إعلامك بأن مطبوعاتك قيد التنفيذ والطباعة حالياً.\nسيصلك إشعار جديد بمجرد الانتهاء من التجهيز والتغليف النهائي، علماً بأن الوقت المتوقع للانتهاء من الطباعة يتراوح من ثلاث ساعات عمل إلى يوم عمل.`
        };
      case 'packing':
        if (variant === 'shipping') {
          return {
            title: 'اكتمال الطباعة',
            body: `${greeting}، اكتملت عملية الطباعة بنجاح.\nيجري الآن تغليف الطلب وتجهيزه ليتم جدولته وتسليمه لشركة الشحن المختصة، علماً بأن الوقت المتوقع للتجهيز والتسليم لشركة الشحن يتراوح من 6 ساعات عمل إلى يوم عمل.`
          };
        }
        return {
          title: 'اكتمال الطباعة',
          body: `${greeting}، اكتملت عملية الطباعة بنجاح.\nيجري الآن تغليف الطلب وتجهيزه ليتم جدولته وتسليمه إلى الجهة المعنية بالتوصيل، علماً بأن الوقت المتوقع للتجهيز والتسليم للمندوب يتراوح من 6 ساعات عمل إلى يوم عمل.`
        };
      case 'waiting_pickup':
        return {
          title: 'المندوب بانتظارك!',
          body: `${greeting}، تم تجهيز وتغليف مطبوعاتك بنجاح.\nنرجو التواجد شخصياً أو من ينوب عنك في الاستلام في [${bill.address || 'العنوان'}]، وذلك يوم ${extra.deliveryDate ? extra.deliveryDate : dayName} الموافق ${extra.deliveryDate ? extra.deliveryDate : dateStr} في تمام الساعة ${extra.deliveryTime || '11:00'} صباحاً لاستلام الطلب من مندوب التوصيل.\nللتواصل مع المندوب ${deliveryAgentPhone} لتجنب أي تأخير.`
        };
      case 'completed':
        if (variant === 'shipping') {
          return {
            title: 'طلبك في طريقه إليك!',
            body: `${greeting}، نود إعلامك بأنه قد تم تسليم طرد المطبوعات الخاص بك بنجاح إلى شركة الشحن.\nيمكنك تتبع الشحنة باستخدام رقم الشحن: ${extra.trackingNumber || '[رقم التتبع]'}، علماً بأن الوقت المتوقع لوصول الشحنة إليك يتراوح من يومي عمل إلى خمسة أيام.\nشكراً لثقتك بنا، نتمنى أن نكون قد وُفقنا في خدمتك، ونسأل الله لك التوفيق والنجاح الدائم في مسيرتك الدراسية.`
          };
        }
        return {
          title: 'تم تسليم طلبك بنجاح!',
          body: `${greeting}، تم تسليم طلب المطبوعات الخاص بك بنجاح.\nشكراً لثقتك بنا، نتمنى أن نكون قد وُفقنا في خدمتك، ونسأل الله لك التوفيق والنجاح الدائم في مسيرتك الدراسية.`
        };
      case 'cancelled':
        return {
          title: 'إلغاء الطلب',
          body: `نعتذر لإبلاغكم بأنه قد تم إلغاء الطلب الخاص بكم.\nفي حال وجود أي استفسار، يرجى مراجعة فريق الدعم الفني.\nنأمل أن تتاح لنا فرصة خدمتكم مستقبلاً.`
        };
      case 'pending':
        return {
          title: 'استلام طلب المطبوعات',
          body: `تم استلام طلب مطبوعاتك بنجاح، يُرجى إتمام عملية السداد على أحد الحسابات التالية لنتمكن من البدء في تجهيز طلبك فوراً:\n${bankAccounts}`
        };
      default:
        return { title: 'تحديث بخصوص طلب الطباعة', body: `فاتورتك رقم ${bill.id} قيد التحضير...` };
    }
  };


  useEffect(() => {
    fetchData();
    fetchMaterials();
    fetchRealMaterials(); // جلب مواد Tmaterial
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
      const timestamp = Date.now();
      const url = `${API_URL}?refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

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
      const timestamp = Date.now();
      const url = `${API_URL}?id=${billId}&refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

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
      const timestamp = Date.now();
      const url = `${MATERIALS_API_URL}?refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) throw new Error('فشل في جلب المواد');
      const result = await response.json();
      setMaterials(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب المواد');
    }
  };

  const fetchRealMaterials = async () => {
    try {
      const timestamp = Date.now();
      const url = `/api/proxy/cp_material.php?refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) throw new Error('فشل في جلب مواد Tmaterial');
      const result = await response.json();

      // التأكد من أن النتيجة array - البيانات في result.data
      if (result.data && Array.isArray(result.data)) {
        setRealMaterials(result.data);
        console.log('Loaded real materials:', result.data.length);
      } else {
        console.error('cp_material.php did not return data array:', result);
        setRealMaterials([]);
      }
    } catch (err) {
      console.error('Error fetching real materials:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب مواد Tmaterial');
      setRealMaterials([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    try {
      const timestamp = Date.now();
      const url = `${API_URL}?id=${id}&refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
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
      const timestamp = Date.now();
      const url = editingBill.id ? `${API_URL}?id=${editingBill.id}&refresh=${timestamp}` : `${API_URL}?refresh=${timestamp}`;

      const response = await fetch(url, {
        method,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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

const updateBillStatus = async (billId: number, newStatus: string) => {
    try {
      const billToUpdate = bills.find(bill => bill.id === billId);
      if (!billToUpdate) return;

      const timestamp = Date.now();
      const url = `${API_URL}?id=${billId}&refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          ...billToUpdate,
          status: newStatus
        }),
      });

      if (!response.ok) throw new Error('فشل في تحديث حالة الفاتورة');

      fetchData();

      // بعد الحفظ: فتح مودال تأكيد الإشعار (إن وجد نص إشعار للحالة)
      const statusesWithNotif = ['paid','printing','packing','waiting_pickup','completed','cancelled'];
      if (statusesWithNotif.includes(newStatus)) {
        const isShipping = billToUpdate.delv_type === 'shipping' || billToUpdate.delv_type === 'express';
        const variant: 'delivery' | 'shipping' = isShipping ? 'shipping' : 'delivery';
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const dayName = tomorrow.toLocaleDateString('ar-SA', { weekday: 'long' });
        const dateStr = tomorrow.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
        const notif = generateNotifForStatus(billToUpdate, newStatus, variant);
        setStatusChangeModal({
          open: true,
          bill: billToUpdate,
          newStatus,
          notifTitle: notif.title,
          notifBody: notif.body,
          trackingNumber: '',
          deliveryDate: `${dayName} ${dateStr}`,
          deliveryTime: '11:00',
          notifVariant: variant
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الحالة');
    }
  };

  // إرسال الإشعار من مودال تأكيد الحالة
  const handleStatusNotifSend = async () => {
    if (!statusChangeModal.bill) return;
    try {
      setIsLoading(true);
      const response = await fetch('/api/proxy/cp_notifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: statusChangeModal.bill.user_id,
          title: statusChangeModal.notifTitle,
          body: statusChangeModal.notifBody,
          url1: '',
          note1: ''
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'فشل إرسال الإشعار');
      alert('تم إرسال الإشعار بنجاح!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
      setStatusChangeModal(prev => ({ ...prev, open: false }));
    }
  };
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

  // دوال معالجة الاشتراكات المجانية
  const openSubscriptionModal = (materialid: number, materialName: string, userId: number) => {
    setSubscriptionData({
      userid: userId,
      materialid: materialid,
      materialName: materialName,
      subscriptionTypes: {
        mokarar: false,
        quiz: false,
        voice: false
      }
    });
    setIsSubscriptionModalOpen(true);
  };

  const closeSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false);
    setSubscriptionData({
      userid: 0,
      materialid: 0,
      materialName: '',
      subscriptionTypes: {
        mokarar: false,
        quiz: false,
        voice: false
      }
    });
  };

  const handleSubscriptionSubmit = async () => {
    // التحقق من البيانات
    if (!subscriptionData.userid || subscriptionData.userid <= 0) {
      alert('معرف المستخدم غير صحيح');
      return;
    }

    const { mokarar, quiz, voice } = subscriptionData.subscriptionTypes;
    if (!mokarar && !quiz && !voice) {
      alert('يرجى اختيار نوع واحد على الأقل من الاشتراكات');
      return;
    }

    try {
      setIsLoading(true);

      // التحقق من أن realMaterials هو array
      if (!Array.isArray(realMaterials) || realMaterials.length === 0) {
        alert('لم يتم تحميل بيانات المواد بعد. يرجى المحاولة مرة أخرى');
        setIsLoading(false);
        return;
      }

      // البحث عن معرف المادة من Tmaterial باستخدام اسم المادة
      const realMaterial = realMaterials.find(m => m.material_name === subscriptionData.materialName);
      if (!realMaterial || !realMaterial.id) {
        alert('لم يتم العثور على المادة في Tmaterial');
        return;
      }

      // إنشاء قائمة بأنواع الاشتراكات المحددة
      const types: string[] = [];
      if (mokarar) types.push('مقرر');
      if (quiz) types.push('اسئلة');
      if (voice) types.push('صوت');

      // إرسال طلب لكل نوع اشتراك
      for (const type of types) {
        const timestamp = Date.now();
        const response = await fetch(`/api/proxy/add_subscribe.php?refresh=${timestamp}`, {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({
            userid: subscriptionData.userid,
            materialid: realMaterial.id,
            type: type,
            price: 0
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `فشل في إضافة اشتراك ${type}`);
        }
      }

      alert(`تم إضافة ${types.length} اشتراك مجاني بنجاح للمستخدم ${subscriptionData.userid}`);
      closeSubscriptionModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة الاشتراك';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // دوال الدفعة المالية
  const openPaymentModal = (bill: BillItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setPaymentData({
      user_id: bill.user_id,
      mony: '',
      type: 'deposit',
      dolar: 'no',
      note: `دفعة بخصوص الفاتورة رقم ${bill.id}`
    });
    setSelectedUserName(bill.name || bill.rec_name);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => setIsPaymentModalOpen(false);

  const handlePaymentSubmit = async () => {
    if (!paymentData.mony || parseFloat(paymentData.mony) <= 0) {
      alert('الرجاء إدخال مبلغ صحيح');
      return;
    }
    try {
      setIsLoading(true);
      const payload = {
        ...paymentData,
        admin_user: 1 
      };
      const response = await fetch('/api/proxy/cp_money.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'فشل إضافة الدفعة');
      alert('تمت إضافة الدفعة بنجاح!');
      closePaymentModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

// دوال الإشعارات
  const openNotifModal = (bill: BillItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isShipping = bill.delv_type === 'shipping' || bill.delv_type === 'express';
    const variant: 'delivery' | 'shipping' = isShipping ? 'shipping' : 'delivery';
    const notif = generateNotifForStatus(bill, bill.status, variant);
    setNotifData({
      user_id: bill.user_id,
      title: notif.title,
      body: notif.body,
      url1: '',
      note1: ''
    });
    setSelectedUserName(bill.name || bill.rec_name);
    setIsNotifModalOpen(true);
  };


  const closeNotifModal = () => setIsNotifModalOpen(false);

  const handleNotifSubmit = async () => {
    if (!notifData.title || !notifData.body) {
      alert('الرجاء تعبئة العنوان والمحتوى');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch('/api/proxy/cp_notifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifData)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'فشل إرسال الإشعار');
      alert('تم إرسال الإشعار بنجاح!');
      closeNotifModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
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

  // --- Summary Calculations ---
const billsStats = {
    total: bills.length,
    pending: bills.filter(b => b.status === 'pending').length,
    paid: bills.filter(b => b.status === 'paid').length,
    printing: bills.filter(b => b.status === 'printing').length,
    packing: bills.filter(b => b.status === 'packing').length,
    waiting_pickup: bills.filter(b => b.status === 'waiting_pickup').length,
    processing: bills.filter(b => b.status === 'processing').length,
    completed: bills.filter(b => b.status === 'completed').length,
    cancelled: bills.filter(b => b.status === 'cancelled').length,
  };

  const materialsToPrint: Record<string, number> = {};
  bills.filter(b => b.status === 'processing').forEach(bill => {
    if (bill.details) {
      bill.details.forEach(detail => {
        if (detail.m_name) {
          materialsToPrint[detail.m_name] = (materialsToPrint[detail.m_name] || 0) + 1;
        }
      });
    }
  });

  const materialsToPrintArray = Object.entries(materialsToPrint).map(([name, count]) => ({
    name, count
  })).sort((a, b) => b.count - a.count);
  // ----------------------------

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">إدارة الفواتير</h1>
        </div>

        {/* Dashboard Summary Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-700 mb-4">ملخص الإحصائيات</h2>
          
{/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg mb-1">📋</div>
              <div className="text-blue-500 text-xs font-bold mb-1">الإجمالي</div>
              <div className="text-2xl font-bold text-blue-800">{billsStats.total}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg mb-1">⏳</div>
              <div className="text-yellow-700 text-xs font-bold mb-1">بانتظار السداد</div>
              <div className="text-2xl font-bold text-yellow-800">{billsStats.pending}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg mb-1">💳</div>
              <div className="text-emerald-700 text-xs font-bold mb-1">تم السداد</div>
              <div className="text-2xl font-bold text-emerald-800">{billsStats.paid}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg mb-1">🖨️</div>
              <div className="text-blue-700 text-xs font-bold mb-1">قيد الطباعة</div>
              <div className="text-2xl font-bold text-blue-800">{billsStats.printing}</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg mb-1">📦</div>
              <div className="text-purple-700 text-xs font-bold mb-1">قيد التجهيز</div>
              <div className="text-2xl font-bold text-purple-800">{billsStats.packing}</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg mb-1">🚚</div>
              <div className="text-orange-700 text-xs font-bold mb-1">بانتظار الاستلام</div>
              <div className="text-2xl font-bold text-orange-800">{billsStats.waiting_pickup}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg mb-1">✅</div>
              <div className="text-green-700 text-xs font-bold mb-1">مكتملة</div>
              <div className="text-2xl font-bold text-green-800">{billsStats.completed}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg mb-1">❌</div>
              <div className="text-red-600 text-xs font-bold mb-1">ملغاة</div>
              <div className="text-2xl font-bold text-red-800">{billsStats.cancelled}</div>
            </div>
          </div>

          {/* Materials needed to print */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 rounded-t-lg flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                المواد المطلوب طباعتها (للفواتير قيد المعالجة)
              </h3>
              <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {materialsToPrintArray.length} مواد مختلفة
              </span>
            </div>
            <div className="p-0 overflow-x-auto max-h-60 overflow-y-auto">
              {materialsToPrintArray.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النسخ المطلوبة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {materialsToPrintArray.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          <span className="font-bold text-gray-800">{item.count}</span> نسخة
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  لا توجد فواتير قيد المعالجة تتطلب طباعة في الوقت الحالي.
                </div>
              )}
            </div>
          </div>
        </div>

{/* إعدادات التحويل البنكي ورقم المندوب */}
        <div className="mb-4">
          <button
            onClick={() => setIsBankSettingsOpen(prev => !prev)}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl border border-gray-200 transition mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            إعدادات بيانات التحويل ورقم المندوب
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isBankSettingsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
          {isBankSettingsOpen && (
            <div className="bg-amber-50 border border-[#c4a900]/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">بيانات حسابات التحويل البنكي</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 transition-all text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                  value={bankAccounts}
                  onChange={(e) => setBankAccounts(e.target.value)}
                  placeholder="1- اسم البنك / رقم الحساب&#10;2- اسم البنك / رقم الحساب"
                />
                <p className="text-xs text-gray-500 mt-1">تُرسل هذه البيانات تلقائياً في إشعار طلب السداد</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم هاتف مندوب التوصيل</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 transition-all text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                  value={deliveryAgentPhone}
                  onChange={(e) => setDeliveryAgentPhone(e.target.value)}
                  placeholder="مثال: 0999999999"
                />
                <p className="text-xs text-gray-500 mt-1">يُدرج تلقائياً في إشعار بانتظار الاستلام</p>
              </div>
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-gray-700">فلترة حسب الحالة:</span>
            <select
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900] transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">الكل</option>
              <option value="pending">⏳ بانتظار السداد</option>
              <option value="paid">💳 تم السداد</option>
              <option value="printing">🖨️ قيد الطباعة</option>
              <option value="packing">📦 قيد التجهيز للإرسال</option>
              <option value="waiting_pickup">🚚 بانتظار الاستلام</option>
              <option value="processing">⚙️ قيد المعالجة</option>
              <option value="completed">✅ مكتمل</option>
              <option value="cancelled">❌ ملغي</option>
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
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900] transition-all"
                      value={editingBill.status}
                      onChange={(e) => setEditingBill({ ...editingBill, status: e.target.value })}
                      required
                    >
                      <option value="pending">⏳ بانتظار السداد</option>
                      <option value="paid">💳 تم السداد</option>
                      <option value="printing">🖨️ قيد الطباعة</option>
                      <option value="packing">📦 قيد التجهيز للإرسال</option>
                      <option value="waiting_pickup">🚚 بانتظار الاستلام</option>
                      <option value="processing">⚙️ قيد المعالجة</option>
                      <option value="completed">✅ مكتمل</option>
                      <option value="cancelled">❌ ملغي</option>
                    </select>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">معرف المستخدم</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.user_id}
                      onChange={(e) => setEditingBill({ ...editingBill, user_id: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع التوصيل</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.delv_type}
                      onChange={(e) => setEditingBill({ ...editingBill, delv_type: e.target.value })}
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
                      onChange={(e) => setEditingBill({ ...editingBill, delv_price: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستلم</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.rec_name}
                      onChange={(e) => setEditingBill({ ...editingBill, rec_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">هاتف المستلم</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingBill.rec_phone}
                      onChange={(e) => setEditingBill({ ...editingBill, rec_phone: e.target.value })}
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
                    onChange={(e) => setEditingBill({ ...editingBill, note: e.target.value })}
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
                        onChange={(e) => setNewDetail({ ...newDetail, m_id: parseInt(e.target.value) })}
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
                        onChange={(e) => setNewDetail({ ...newDetail, m_price: parseFloat(e.target.value) })}
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
                <Fragment key={bill.id}>
                  <tr
                    className={`transition cursor-pointer ${STATUS_MAP[bill.status]?.rowBg || 'bg-white'} hover:brightness-95`}
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
                        className={`px-2 py-1 text-xs font-bold rounded-xl border ${STATUS_MAP[bill.status]?.color || 'bg-gray-100 text-gray-700 border-gray-300'}`}
                        value={bill.status}
                        onChange={(e) => bill.id && updateBillStatus(bill.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">⏳ بانتظار السداد</option>
                        <option value="paid">💳 تم السداد</option>
                        <option value="printing">🖨️ قيد الطباعة</option>
                        <option value="packing">📦 قيد التجهيز للإرسال</option>
                        <option value="waiting_pickup">🚚 بانتظار الاستلام</option>
                        <option value="processing">⚙️ قيد المعالجة</option>
                        <option value="completed">✅ مكتمل</option>
                        <option value="cancelled">❌ ملغي</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">

                        <button
                          onClick={(e) => openPaymentModal(bill, e)}
                          className="text-green-600 hover:text-green-900 flex items-center bg-green-50 hover:bg-green-100 px-2 py-1 rounded"
                          title="إضافة دفعة مالية"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          دفعة
                        </button>
                        
                        <button
                          onClick={(e) => openNotifModal(bill, e)}
                          className="text-blue-600 hover:text-blue-900 flex items-center bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                          title="إرسال إشعار"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          إشعار
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            if (bill.id) {
                              handleDelete(bill.id);
                            }

                          }}
                          className="text-red-600 hover:text-red-900 flex items-center px-1"
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
                                <p className="text-sm"><span className="font-medium">العنوان:</span> {bill.address}</p>

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
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {bill.details.map((detail, index) => (
                                        <tr key={index}>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{index + 1}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{detail.m_name}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{detail.m_price}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (detail.m_id && bill.user_id) {
                                                  openSubscriptionModal(detail.m_id, detail.m_name || '', bill.user_id);
                                                }
                                              }}
                                              className="text-green-600 hover:text-green-900 flex items-center text-xs"
                                              title="إضافة اشتراك مجاني للطالب"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                              </svg>
                                              اشتراك مجاني
                                            </button>
                                          </td>
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
                </Fragment>
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

      {/* Modal الاشتراكات المجانية */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">إضافة اشتراك مجاني</h2>
              <button
                onClick={closeSubscriptionModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* عرض معلومات الاشتراك */}
              <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                <div>
                  <p className="text-sm text-gray-600">اسم المادة:</p>
                  <p className="text-lg font-bold text-blue-800">{subscriptionData.materialName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">معرف المستخدم:</p>
                  <p className="text-lg font-bold text-blue-800">{subscriptionData.userid}</p>
                </div>
              </div>

              {/* اختيار أنواع الاشتراكات */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">أنواع الاشتراكات *</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={subscriptionData.subscriptionTypes.mokarar}
                      onChange={(e) => setSubscriptionData({
                        ...subscriptionData,
                        subscriptionTypes: {
                          ...subscriptionData.subscriptionTypes,
                          mokarar: e.target.checked
                        }
                      })}
                    />
                    <span className="mr-2 text-sm text-gray-700">مقرر</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={subscriptionData.subscriptionTypes.quiz}
                      onChange={(e) => setSubscriptionData({
                        ...subscriptionData,
                        subscriptionTypes: {
                          ...subscriptionData.subscriptionTypes,
                          quiz: e.target.checked
                        }
                      })}
                    />
                    <span className="mr-2 text-sm text-gray-700">اسئلة</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={subscriptionData.subscriptionTypes.voice}
                      onChange={(e) => setSubscriptionData({
                        ...subscriptionData,
                        subscriptionTypes: {
                          ...subscriptionData.subscriptionTypes,
                          voice: e.target.checked
                        }
                      })}
                    />
                    <span className="mr-2 text-sm text-gray-700">صوت</span>
                  </label>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeSubscriptionModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSubscriptionSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {isLoading ? 'جاري الإضافة...' : 'إضافة اشتراك'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal إضافة الدفعة المالية */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">إضافة دفعة مالية</h2>
              <button
                onClick={closePaymentModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg text-sm text-gray-700">
                إضافة دفعة للعميل: <span className="font-bold">{selectedUserName}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  value={paymentData.mony}
                  onChange={(e) => setPaymentData({ ...paymentData, mony: e.target.value })}
                  placeholder="أدخل المبلغ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    value={paymentData.type}
                    onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value })}
                  >
                    <option value="deposit">إيداع (دفعة مقدمة)</option>
                    <option value="withdraw">سحب</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    value={paymentData.dolar}
                    onChange={(e) => setPaymentData({ ...paymentData, dolar: e.target.value })}
                  >
                    <option value="no">محلي (سوري)</option>
                    <option value="yes">دولار أمريكي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الملاحظات / البيان</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  value={paymentData.note}
                  onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handlePaymentSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري الحفظ...' : 'حفظ الدفعة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Modal تأكيد إرسال الإشعار عند تغيير الحالة */}
      {statusChangeModal.open && statusChangeModal.bill && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden">
            <div className="bg-blue-100 text-blue-900 px-6 py-4 flex items-center justify-between border-b border-blue-200">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <span className="font-extrabold text-base">هل تريد إرسال إشعار للطالب؟</span>
              </div>
              <button onClick={() => setStatusChangeModal(prev => ({ ...prev, open: false }))} className="text-blue-700 hover:text-blue-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* اختيار نوع الإشعار لحالتي packing و completed */}
              {(statusChangeModal.newStatus === 'packing' || statusChangeModal.newStatus === 'completed') && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">نوع التوصيل:</span>
                  <button
                    onClick={() => {
                      const notif = generateNotifForStatus(statusChangeModal.bill!, statusChangeModal.newStatus, 'delivery');
                      setStatusChangeModal(prev => ({ ...prev, notifVariant: 'delivery', notifTitle: notif.title, notifBody: notif.body }));
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-sm border transition ${statusChangeModal.notifVariant === 'delivery' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                  >🚚 توصيل</button>
                  <button
                    onClick={() => {
                      const notif = generateNotifForStatus(statusChangeModal.bill!, statusChangeModal.newStatus, 'shipping');
                      setStatusChangeModal(prev => ({ ...prev, notifVariant: 'shipping', notifTitle: notif.title, notifBody: notif.body }));
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-sm border transition ${statusChangeModal.notifVariant === 'shipping' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                  >📦 شحن</button>
                </div>
              )}
              {/* رقم التتبع لحالة completed شحن */}
              {statusChangeModal.newStatus === 'completed' && statusChangeModal.notifVariant === 'shipping' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم التتبع</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                    value={statusChangeModal.trackingNumber}
                    onChange={(e) => {
                      const tn = e.target.value;
                      setStatusChangeModal(prev => {
                        const notif = generateNotifForStatus(prev.bill!, prev.newStatus, prev.notifVariant, { trackingNumber: tn });
                        return { ...prev, trackingNumber: tn, notifBody: notif.body };
                      });
                    }}
                    placeholder="أدخل رقم تتبع الشحنة"
                  />
                </div>
              )}
              {/* تعديل تاريخ ووقت التسليم لحالة waiting_pickup */}
              {statusChangeModal.newStatus === 'waiting_pickup' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">اليوم والتاريخ</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                      value={statusChangeModal.deliveryDate}
                      onChange={(e) => {
                        const dd = e.target.value;
                        setStatusChangeModal(prev => {
                          const notif = generateNotifForStatus(prev.bill!, prev.newStatus, prev.notifVariant, { deliveryDate: dd, deliveryTime: prev.deliveryTime });
                          return { ...prev, deliveryDate: dd, notifBody: notif.body };
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">الساعة</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                      value={statusChangeModal.deliveryTime}
                      onChange={(e) => {
                        const dt = e.target.value;
                        setStatusChangeModal(prev => {
                          const notif = generateNotifForStatus(prev.bill!, prev.newStatus, prev.notifVariant, { deliveryDate: prev.deliveryDate, deliveryTime: dt });
                          return { ...prev, deliveryTime: dt, notifBody: notif.body };
                        });
                      }}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">عنوان الإشعار</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                  value={statusChangeModal.notifTitle}
                  onChange={(e) => setStatusChangeModal(prev => ({ ...prev, notifTitle: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">نص الإشعار (قابل للتعديل)</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
                  value={statusChangeModal.notifBody}
                  onChange={(e) => setStatusChangeModal(prev => ({ ...prev, notifBody: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setStatusChangeModal(prev => ({ ...prev, open: false }))}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2"
                >
                  تخطي
                </button>
                <button
                  onClick={handleStatusNotifSend}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  {isLoading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal إرسال الإشعار */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">إرسال إشعار للمستخدم</h2>
              <button
                onClick={closeNotifModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                إرسال إشعار للعميل: <span className="font-bold">{selectedUserName}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الإشعار *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={notifData.title}
                  onChange={(e) => setNotifData({ ...notifData, title: e.target.value })}
                  placeholder="مثال: تم شحن طلبك"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الإشعار (الرسالة) *</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={notifData.body}
                  onChange={(e) => setNotifData({ ...notifData, body: e.target.value })}
                  placeholder="نص الرسالة المرسلة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رابط مرفق (اختياري)</label>
                <input
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-left"
                  value={notifData.url1}
                  onChange={(e) => setNotifData({ ...notifData, url1: e.target.value })}
                  dir="ltr"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeNotifModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleNotifSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

