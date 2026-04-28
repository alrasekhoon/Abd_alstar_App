'use client'

import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
     <div className="flex h-screen">
       <div className="flex-1 flex flex-col overflow-hidden">
         {/* عرض الهيدر فقط في صفحة /news */}
         {pathname === '/new_user' && <Header />}
         <main className="flex-1 overflow-y-auto p-4">
           {children}
         </main>
       </div>
       {/* عرض القائمة الجانبية فقط في صفحة /news */}
       {pathname === '/new_user' && <Sidebar />}
     </div>
   )
}