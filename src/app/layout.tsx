import type { Metadata } from 'next'
import { Inter } from 'next/font/google' // نصيحة: للغة العربية قد تفضل استخدام خطوط مثل Cairo أو Tajawal
import './globals.css'

// استيراد المكونات الجديدة التي ستنشئها (سنضعها كتعليق مؤقتاً لتجنب الأخطاء)
// import TopNavbar from '@/components/TopNavbar'
// import SideNavbar from '@/components/SideNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'الراسخون في القانون', // قمت بتحديث العنوان بناءً على صورتك
  description: 'لوحة التحكم',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      {/* 1. قمنا بإزالة md:mr-64 
        2. استخدمنا flex-col و h-screen لملء الشاشة بالكامل وتقسيمها عمودياً
      */}
      <body className={`${inter.className} flex flex-col h-screen bg-gray-50 text-slate-800`}>
        
        {/* === الشريط العلوي (القوائم الرئيسية) === */}
        <header className="flex-shrink-0 h-16 bg-[#1f2937] text-white shadow-md z-20">
          <div className="flex items-center justify-between h-full px-6">
            <div className="font-bold text-xl">الراسخون في القانون</div>
            
            {/* ضع مكون القائمة العلوية هنا */}
            {/* <TopNavbar /> */}
            <div className="hidden md:flex gap-4">
              {/* مثال مؤقت */}
              <button className="px-3 py-2 bg-slate-700 rounded-md">الواجهة الرئيسية</button>
              <button className="px-3 py-2 hover:bg-slate-700 rounded-md">إدارة المقررات</button>
            </div>
          </div>
        </header>

        {/* === حاوية المحتوى السفلي (القائمة الجانبية + محتوى الصفحة) === */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* === القائمة الجانبية (القوائم الفرعية) === */}
          <aside className="w-64 bg-[#111827] text-white overflow-y-auto hidden md:block z-10 flex-shrink-0">
             {/* ضع مكون القائمة الجانبية هنا */}
             {/* <SideNavbar /> */}
             <div className="p-4">
                <p className="text-sm text-gray-400 mb-4">القوائم الفرعية</p>
                <ul className="space-y-2">
                  <li className="p-2 bg-slate-800 rounded">أدوات المدير</li>
                  <li className="p-2 hover:bg-slate-800 rounded">خيار فرعي آخر</li>
                </ul>
             </div>
          </aside>

          {/* === محتوى الصفحة المتغير (children) === */}
          <main className="flex-1 overflow-y-auto p-6 bg-white">
            {children}
          </main>

        </div>
      </body>
    </html>
  )
}
