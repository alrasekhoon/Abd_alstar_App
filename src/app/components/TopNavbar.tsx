'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { SECTIONS_DATA } from './menuData'

export default function TopNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])

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
      if (perms) {
        setUserPermissions(JSON.parse(perms))
      }
    } catch (e) {
      // تم إضافة هذا السطر لتجنب أخطاء ESLint وللمساعدة في التشخيص
      console.error("Error parsing permissions in TopNavbar:", e);
    }
  }, [])

  const menuSections = getFilteredSections()

  // تحديد القسم النشط بناءً على الرابط الحالي
  const activeSectionId = menuSections.find(sec => 
    sec.items.some(item => item.href === pathname)
  )?.id || menuSections[0]?.id

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  return (
    <header className="bg-gray-900 text-white w-full shadow-md z-50">
      <div className="flex justify-between items-center px-4 py-3">
        {/* اللوجو أو اسم النظام */}
        <div className="font-bold text-xl whitespace-nowrap hidden md:block">
          الراسخون في القانون
        </div>

        {/* الروابط الأفقية مع إمكانية التمرير للموبايل */}
        <nav className="flex-1 overflow-x-auto mx-4 no-scrollbar">
          <ul className="flex gap-2 min-w-max">
            {menuSections.map((section) => (
              <li key={section.id}>
                <Link
                  // عند الضغط على القسم، يتم توجيهك لأول صفحة في هذا القسم
                  href={section.items[0]?.href || '#'}
                  className={`block px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm font-medium ${
                    activeSectionId === section.id 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {section.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* زر تسجيل الخروج ومعلومات المستخدم */}
        <div className="flex items-center gap-4">
           <span className="text-xs text-gray-400 hidden md:block border-l border-gray-600 pl-4">
             {userRole || 'غير معروف'}
           </span>
           <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap"
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  )
}
