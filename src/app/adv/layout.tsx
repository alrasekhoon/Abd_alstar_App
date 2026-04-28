'use client'

import Sidebar from '../components/Sidebar'
import TopNavbar from '../components/TopNavbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 text-right" dir="rtl">
      
      {/* القائمة العلوية */}
      <TopNavbar />

      <div className="flex flex-1 overflow-hidden">
        
        {/* القائمة الجانبية */}
        <Sidebar />

        {/* محتوى الصفحة */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>

      </div>
    </div>
  )
}
