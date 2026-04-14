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
  <div className="flex h-screen bg-gray-50">
    {/* عرض القائمة الجانبية فقط في صفحة /finance */}
    {pathname === '/finance' && <Sidebar />}

    <div className="flex-1 flex flex-col overflow-hidden">
      {/* عرض الهيدر فقط في صفحة /finance */}
      {pathname === '/finance' && <Header />}
      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>
    </div>
  </div>
)

}
