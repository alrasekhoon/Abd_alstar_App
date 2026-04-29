'use client'

import Sidebar from '../components/Sidebar'
import TopNavbar from '../components/TopNavbar' // أضفنا القائمة العلوية هنا
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      
      {/* 1. القائمة العلوية الأفقية تظهر فوق كل شيء */}
      <TopNavbar />

      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. القائمة الجانبية العمودية */}
        <Sidebar />

        {/* 3. محتوى الصفحة */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>

      </div>
    </div>
  )
}
