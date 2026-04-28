'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { SECTIONS_DATA } from './menuData'

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const getFilteredSections = useCallback(() => {
    return SECTIONS_DATA.map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (userRole === 'admin' || userRole === 'owner') return true;
        if (userPermissions && userPermissions.includes(item.href)) return true;
        return false;
      })
    })).filter(section => section.items.length > 0)
  }, [userRole, userPermissions])

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole'))
    try {
      const perms = localStorage.getItem('userPermissions')
      if (perms) setUserPermissions(JSON.parse(perms))
    } catch(e) {
      // تم إضافة هذا السطر لحل مشكلة ESLint في Vercel
      console.error("Error parsing permissions:", e);
    }
  }, [])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  const menuSections = getFilteredSections()

  // استنتاج القسم النشط لعرض محتوياته في القائمة الجانبية
  const activeSection = menuSections.find(sec => 
    sec.items.some(item => item.href === pathname)
  ) || menuSections[0] // افتراضياً عرض أول قسم إذا لم يطابق الرابط شيئاً

  if (!activeSection) return null; // في حال عدم وجود أي صلاحيات

  return (
    <>
      {/* زر فتح القائمة في الهواتف (أسفل اليمين لسهولة الوصول بعيداً عن القائمة العلوية) */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-xl"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* طبقة التعتيم الخلفية للهواتف */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* القائمة الجانبية */}
      <aside className={`
        w-64 bg-white border-l border-gray-200 h-full flex flex-col transition-transform duration-300 ease-in-out
        fixed right-0 md:relative z-40
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        
        {/* عنوان القسم النشط */}
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">{activeSection.name}</h2>
          <button onClick={toggleSidebar} className="md:hidden text-gray-500">✕</button>
        </div>

        {/* الروابط الفرعية */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {activeSection.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`block p-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600 font-semibold' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
