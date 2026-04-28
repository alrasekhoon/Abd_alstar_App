export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 text-slate-800 w-full">
      
      {/* === الشريط العلوي (القوائم الرئيسية) === */}
      <header className="flex-shrink-0 h-16 bg-[#1f2937] text-white shadow-md z-20">
        <div className="flex items-center justify-between h-full px-6">
          <div className="font-bold text-xl">الراسخون في القانون</div>
          <div className="hidden md:flex gap-4">
            {/* أزرار تجريبية */}
            <button className="px-3 py-2 bg-slate-700 rounded-md">الواجهة الرئيسية</button>
            <button className="px-3 py-2 hover:bg-slate-700 rounded-md">إدارة المقررات</button>
          </div>
        </div>
      </header>

      {/* === حاوية المحتوى السفلي === */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* === القائمة الجانبية (القوائم الفرعية) === */}
        <aside className="w-64 bg-[#111827] text-white overflow-y-auto hidden md:flex flex-col justify-between z-10 flex-shrink-0">
           <div className="p-4">
              <p className="text-sm text-gray-400 mb-4">القوائم الفرعية</p>
              <ul className="space-y-2">
                <li className="p-2 bg-slate-800 rounded">أدوات المدير</li>
                <li className="p-2 hover:bg-slate-800 rounded">خيار فرعي آخر</li>
              </ul>
           </div>
           
           {/* زر تسجيل الخروج في الأسفل */}
           <div className="p-4 border-t border-slate-700">
             <div className="text-xs text-center text-gray-400 mb-2">الصلاحيات: admin</div>
             <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors">
               تسجيل خروج
             </button>
           </div>
        </aside>

        {/* === محتوى الصفحة المتغير === */}
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          {children}
        </main>

      </div>
    </div>
  )
}
