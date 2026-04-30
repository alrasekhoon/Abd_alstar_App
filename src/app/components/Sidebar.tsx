'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string>('main')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getMenuSections = useCallback(() => {
    const sections = [
      {
        id: 'main',
        name: 'الواجهة الرئيسية',
        items: [
          { name: 'الاعلانات', href: '/adv', roles: ['admin', 'editor'] },
          { name: 'الاشعارات', href: '/Notification', roles: ['admin', 'editor'] },
          { name: 'الروابط الجامعة', href: '/uni_link', roles: ['admin', 'editor'] },
          { name: 'مواد الجامعة', href: '/uni_material', roles: ['admin', 'editor'] },
          { name: 'إدارة واجهة الموقع', href: 'https://alrasekhooninlaw.com/admin.html', roles: ['admin', 'editor'] },
        ]
      },
      {
        id: 'education',
        name: 'إدارة المقررات',
        items: [
          { name: 'انواع الاشتراكات', href: '/ashtrak', roles: ['admin', 'editor'] },
          { name: 'المواد الدراسية', href: '/material', roles: ['admin', 'editor'] },
          { name: 'إستخراج الاسئلة', href: '/quiz', roles: ['admin', 'editor'] },
          { name: 'الأصوات', href: '/voice', roles: ['admin', 'editor'] },
          { name: 'استفسارات الاختبارات', href: '/quiz_questions', roles: ['admin', 'editor'] }
        ]
      },
      {
        id: 'printing',
        name: 'الطباعة والتوصيل',
        items: [
          { name: 'الطباعة', href: '/print', roles: ['admin', 'printer'] },
          { name: 'التوصيل والشحن', href: '/delv', roles: ['admin', 'printer'] },
          { name: 'الفواتير', href: '/print_bill', roles: ['admin', 'printer'] }
        ]
      },
      {
        id: 'financial',
        name: 'المستخدمين والمالية',
        items: [
          { name: 'المستخدمين', href: '/users', roles: ['admin'] },
          { name: 'الدفعات المالية', href: '/mony1', roles: ['admin'] },
          { name: 'إدارة المستخدمين', href: '/new_user', roles: ['admin'] },
          { name: 'مراجعة وتوثيق الحسابات', href: '/verify_users', roles: ['admin'] },
          { name: 'الجدوى المالية', href: '/finance', roles: ['admin'] }
        ]
      },
      {
        id: 'administration',
        name: 'إدارة النظام',
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
    const role = localStorage.getItem('userRole')
    setUserRole(role)

    try {
      const perms = localStorage.getItem('userPermissions')
      if (perms) setUserPermissions(JSON.parse(perms))
    } catch(e) {}
  }, [])

  useEffect(() => {
    const sections = getMenuSections()
    for (const section of sections) {
      if (section.items.some(item => item.href === pathname)) {
        setActiveSectionId(section.id)
        break
      }
    }
  }, [pathname, getMenuSections])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  const sections = getMenuSections()
  const activeSection = sections.length > 0 ? (sections.find(s => s.id === activeSectionId) || sections[0]) : null

  return (
    <div className="flex flex-col h-screen text-right font-sans bg-gray-100" dir="rtl">
      
      {/* --- الشريط العلوي (القوائم الرئيسية فقط) --- */}
      <header className="bg-[#1f2937] text-white shadow-md z-50">
        <div className="flex items-center justify-between px-6 py-3">
          
          <div className="flex items-center space-x-6 space-x-reverse w-full md:w-auto">
            {/* زر القائمة للهواتف */}
            <button 
              className="md:hidden text-2xl ml-4" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              ☰
            </button>
            
            {/* أزرار الأقسام الرئيسية (تظهر في الشاشات الكبيرة) */}
            <nav className="hidden md:flex space-x-2 space-x-reverse">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    activeSectionId === section.id
                      ? 'bg-blue-600 text-white shadow-inner'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {section.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* قائمة الهواتف المنسدلة */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-800 px-4 py-3 border-t border-gray-700 flex flex-col space-y-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSectionId(section.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`text-right px-4 py-2 rounded-md ${
                  activeSectionId === section.id ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                {section.name}
              </button>
            ))}
            
            {/* تسجيل الخروج والصلاحيات للموبايل فقط */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-300 mb-2">
                الصلاحيات: <span className="font-bold text-white">{userRole || 'غير معروف'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                تسجيل خروج
              </button>
            </div>
          </div>
        )}
      </header>

      {/* --- منطقة المحتوى السفلية --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* الشريط الجانبي (القوائم الفرعية + زر الخروج) */}
        {activeSection && activeSection.items.length > 0 && (
          <aside className="w-64 bg-white shadow-xl border-l border-gray-200 z-40 flex flex-col hidden md:flex">
            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-extrabold text-gray-800">{activeSection.name}</h2>
              <p className="text-xs text-gray-500 mt-1">اختر من القائمة أدناه</p>
            </div>
            
            <nav className="p-3 flex-1 overflow-y-auto">
              <ul className="space-y-1.5">
                {activeSection.items.map(item => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
                        pathname === item.href
                          ? 'bg-blue-50 text-blue-700 font-bold border-r-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* تم نقل زر الخروج والصلاحيات إلى هنا (أسفل القائمة الجانبية) */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 mt-auto">
              <div className="text-sm text-gray-600 mb-3 text-center">
                الصلاحيات: <span className="font-bold text-gray-900">{userRole || 'غير معروف'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm"
              >
                تسجيل خروج
              </button>
            </div>
          </aside>
        )}

        {/* مساحة عرض محتوى الصفحات */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* شريط تمرير فرعي يظهر فقط على الهواتف */}
          {activeSection && activeSection.items.length > 0 && (
            <div className="md:hidden bg-white border-b shadow-sm overflow-x-auto whitespace-nowrap p-3">
              {activeSection.items.map(item => (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={`inline-block px-4 py-2 mx-1 rounded-full text-sm font-medium transition-colors ${
                    pathname === item.href 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}

          {/* محتوى الصفحة الفعلي */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          
        </div>
      </div>
    </div>
  )
}
