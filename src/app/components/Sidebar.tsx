'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()

  const getMenuSections = useCallback(() => {
    const sections = [
      {
        id: 'main', name: 'الواجهة الرئيسية',
        items: [
          { name: 'الاعلانات', href: '/adv', roles: ['admin', 'editor'] },
          { name: 'الاشعارات', href: '/Notification', roles: ['admin', 'editor'] },
          { name: 'الروابط الجامعة', href: '/uni_link', roles: ['admin', 'editor'] },
          { name: 'مواد الجامعة', href: '/uni_material', roles: ['admin', 'editor'] },
          { name: 'إدارة واجهة الموقع', href: 'https://alrasekhooninlaw.com/admin.html', roles: ['admin', 'editor'] },
        ]
      },
      {
        id: 'education', name: 'إدارة المقررات',
        items: [
          { name: 'انواع الاشتراكات', href: '/ashtrak', roles: ['admin', 'editor'] },
          { name: 'المواد الدراسية', href: '/material', roles: ['admin', 'editor'] },
          { name: 'إستخراج الاسئلة', href: '/quiz', roles: ['admin', 'editor'] },
          { name: 'الأصوات', href: '/voice', roles: ['admin', 'editor'] },
          { name: 'استفسارات الاختبارات', href: '/quiz_questions', roles: ['admin', 'editor'] }
        ]
      },
      {
        id: 'printing', name: 'الطباعة والتوصيل',
        items: [
          { name: 'الطباعة', href: '/print', roles: ['admin', 'printer'] },
          { name: 'التوصيل والشحن', href: '/delv', roles: ['admin', 'printer'] },
          { name: 'الفواتير', href: '/print_bill', roles: ['admin', 'printer'] }
        ]
      },
      {
        id: 'financial', name: 'المستخدمين والمالية',
        items: [
          { name: 'المستخدمين', href: '/users', roles: ['admin'] },
          { name: 'الدفعات المالية', href: '/mony1', roles: ['admin'] },
          { name: 'إدارة المستخدمين', href: '/new_user', roles: ['admin'] },
          { name: 'مراجعة وتوثيق الحسابات', href: '/verify_users', roles: ['admin'] },
          { name: 'الجدوى المالية', href: '/finance', roles: ['admin'] }
        ]
      },
      {
        id: 'administration', name: 'إدارة النظام',
        items: [
          { name: 'الإعدادات', href: '/settings', roles: ['admin'] },
          { name: 'ادارة لوحة التحكم', href: '/UserManagement', roles: ['admin'] },
          { name: 'الدردشة المباشرة', href: '/support_chat', roles: ['admin', 'editor'] }
        ]
      }
    ]

    return sections.map(section => ({
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
    } catch(e) {}
  }, [])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const handleLinkClick = () => {
    if (window.innerWidth < 768) setIsSidebarOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  const menuSections = getMenuSections()

  // هذا السطر يحدد القسم الرئيسي بناءً على الصفحة الحالية
  const activeSection = menuSections.find(section => 
    section.items.some(item => pathname === item.href)
  )

  // إذا لم يجد قسم، لا يعرض القائمة الجانبية
  if (!activeSection) return null;

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        {isSidebarOpen ? '✕' : 'قائمة'}
      </button>

      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className={`
        w-64 bg-white border-l border-gray-200 h-full flex flex-col transition-transform duration-300 ease-in-out
        fixed right-0 md:relative z-40
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 text-lg font-bold border-b border-gray-100 bg-gray-50 flex justify-between items-center text-blue-700">
          <h2>{activeSection.name}</h2>
          <button onClick={toggleSidebar} className="md:hidden text-gray-500">✕</button>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {activeSection.items.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`block p-3 rounded-lg transition-all text-sm font-medium ${
                    pathname === item.href 
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="text-xs text-gray-500 flex justify-between items-center">
            <span>الصلاحية:</span>
            <span className="font-bold text-gray-700">{userRole || 'غير معروف'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm font-bold"
          >
            تسجيل خروج
          </button>
        </div>
      </div>
    </>
  )
}
