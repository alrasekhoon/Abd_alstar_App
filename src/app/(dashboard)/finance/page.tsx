'use client';

import { useState, useEffect } from 'react';

type FinanceStats = {
  users: {
    total: number;
    active_subscribers: number;
  };
  subscriptions: {
    count: number;
    value_local: number;
    value_usd: number;
  };
  prints: {
    count: number;
    value_local: number;
    value_usd: number;
  };
  deposits: {
    value_local: number;
    value_usd: number;
  };
  summary: {
    total_revenue_local: number;
    total_revenue_usd: number;
  };
};

export default function FinanceDashboard() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: currency }).format(val);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const url = `/api/proxy/cp_finance_dashboard.php?refresh=${timestamp}`;

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('فشل في جلب الإحصائيات');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.error || 'خطأ من الخادم');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-lg font-bold text-gray-800">جاري تحميل إحصائيات الجدوى المالية...</p>
      </div>
    </div>
  );

  if (error || !stats) return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded shadow-sm text-right">
        <h3 className="text-xl font-bold text-red-800 mb-2">تعذر تحميل الإحصائيات</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          المحاولة مرة أخرى
        </button>
      </div>
    </div>
  );

  const totalRev = stats.summary.total_revenue_local;
  const subsPct = totalRev > 0 ? (stats.subscriptions.value_local / totalRev) * 100 : 0;
  const printsPct = totalRev > 0 ? (stats.prints.value_local / totalRev) * 100 : 0;

  const usersConversion = stats.users.total > 0 ? (stats.users.active_subscribers / stats.users.total) * 100 : 0;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">الجدوى المالية وملخص المبيعات</h1>
          <p className="text-gray-500 mt-2">لوحة إحصائيات شاملة   </p>
        </div>
        <button
          onClick={fetchData}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition"
          title="تحديث البيانات"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Main Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Revenues */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 shadow-xl text-white border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-gray-400 font-medium mb-1">صافي مبيعات المنصة (مجموع المشحون والمباع)</h2>
          <div className="text-4xl font-bold text-amber-500 mb-2 truncate" dir="ltr">
            {formatCurrency(stats.summary.total_revenue_local, 'SYP')}
          </div>
          <div className="text-amber-200 text-sm opacity-80" dir="ltr">
            ≈ {formatCurrency(stats.summary.total_revenue_usd, 'USD')}
          </div>
        </div>

        {/* Total Deposits */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-gray-600 font-medium">اجمالي المقبوضات</h2>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2 mt-4" dir="ltr">
            {formatCurrency(stats.deposits.value_local, 'SYP')}
          </div>
          <div className="text-gray-500 text-sm" dir="ltr">
            ≈ {formatCurrency(stats.deposits.value_usd, 'USD')}
          </div>
        </div>

        {/* Users Summary */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-gray-600 font-medium">إحصائيات المستخدمين</h2>
          </div>

          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-sm text-gray-500">إجمالي المسجلين</div>
              <div className="text-2xl font-bold text-gray-900">{stats.users.total.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">منهم دفعوا أو اشتركوا</div>
              <div className="text-2xl font-bold text-blue-600">{stats.users.active_subscribers.toLocaleString()}</div>
            </div>
          </div>

          {/* Conversion Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${usersConversion}%` }}></div>
          </div>
          <div className="text-xs text-center text-gray-500 mt-2">معدل التحويل (Conversion): {usersConversion.toFixed(1)}%</div>
        </div>
      </div>

      {/* Breakdowns Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Material Subscriptions Stats */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              مشتركو المواد الرقمية
            </h3>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
              {stats.subscriptions.count.toLocaleString()} طلب
            </span>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500">قيمة المبيعات الإجمالية</span>
              <span className="text-2xl font-bold text-indigo-700" dir="ltr">{formatCurrency(stats.subscriptions.value_local, 'SYP')}</span>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">القيمة بالدولار الأمريكي</span>
                <span className="text-sm font-semibold text-gray-800" dir="ltr">{formatCurrency(stats.subscriptions.value_usd, 'USD')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prints and Bills Stats */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              مبيعات المطبوعات والتوصيل
            </h3>
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full">
              {stats.prints.count.toLocaleString()} فاتورة
            </span>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500">القيمة الإجمالية المُفوترة</span>
              <span className="text-2xl font-bold text-teal-700" dir="ltr">{formatCurrency(stats.prints.value_local, 'SYP')}</span>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">القيمة بالدولار الأمريكي</span>
                <span className="text-sm font-semibold text-gray-800" dir="ltr">{formatCurrency(stats.prints.value_usd, 'USD')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Revenue Distribution Visual Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          توزيع الإيرادات (المواد الرقمية مقابل المطبوعات)
        </h3>

        {totalRev > 0 ? (
          <>
            <div className="flex h-6 rounded-full overflow-hidden shadow-inner mb-4">
              <div className="bg-indigo-500 flex justify-center items-center text-xs text-white" style={{ width: `${subsPct}%` }}>
                {subsPct > 5 && `${subsPct.toFixed(1)}%`}
              </div>
              <div className="bg-teal-500 flex justify-center items-center text-xs text-white" style={{ width: `${printsPct}%` }}>
                {printsPct > 5 && `${printsPct.toFixed(1)}%`}
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                مواد رقمية واشتراكات
              </div>
              <div className="flex items-center gap-2">
                المطبوعات والفواتير
                <span className="w-3 h-3 rounded-full bg-teal-500"></span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-gray-400">لا توجد إيرادات كافية لعرض التوزيع البياني بعد.</div>
        )}
      </div>

    </div>
  );
}
