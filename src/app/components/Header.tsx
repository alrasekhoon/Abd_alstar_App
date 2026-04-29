'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole'))
    try {
      const perms = localStorage.getItem('userPermissions')
      if (perms) setUserPermissions(JSON.parse(perms))
    } catch(e) {}
  }, [])

  // جلب القوائم الرئيسية فقط
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

  const mainMenus = getMenuSections()

  return (
    <header className="bg-gray-800 shadow-md border-b border-gray-700 z-10 w-full overflow-x-auto">
      <nav className="flex items-center p-3 min-w-max gap-3">
        <div className="text-white font-bold text-xl px-4 ml-4 border-l border-gray-600">
          لوحة التحكم
        </div>
        {mainMenus.map((menu) => {
          // معرفة القسم المفتوح حالياً لتلوينه
          const isActive = menu.items.some(item => pathname === item.href)
          
          return (
            <Link
              key={menu.id}
              href={menu.items[0].href} // عند الضغط، ينقلك لأول عنصر في القسم
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {menu.name}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
