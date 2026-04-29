// src/app/(dashboard)/layout.tsx

import Sidebar from '../components/Sidebar' // تأكد من عدد النقاط حسب مكان الملف
import Header from '../components/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      
      {/* 1. القائمة العلوية تظهر هنا في الأعلى لكل صفحات اللوحة */}
      <Header /> 

      <div className="flex-1 flex overflow-hidden">
        
        {/* 2. القائمة الجانبية تظهر هنا على اليمين */}
        <Sidebar /> 
        
        {/* 3. محتوى الصفحة المتغير */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
