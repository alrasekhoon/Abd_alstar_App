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

  // تحديث القسم النشط بناءً على الرابط الحالي عند تحميل الصفحة
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

  if (pathname === '/login') {
    return (
      <div className="min-h-screen font-sans bg-gray-50" dir="rtl">
        {children}
      </div>
    )
  }

  const sections = getMenuSections()
  const activeSection = sections.length > 0 ? (sections.find(s => s.id === activeSectionId) || sections[0]) : null

  // التحقق مما إذا كان الرابط الحالي (محتوى الصفحة) ينتمي للقسم المفتوح في الأعلى
  const isCurrentPageInActiveSection = activeSection?.items.some(item => item.href === pathname)

  return (
    <div className="flex flex-col h-screen text-right font-sans bg-gray-100" dir="rtl">
      
      {/* --- الشريط العلوي --- */}
      <header className="bg-[#1f2937] text-white shadow-md z-50 relative">
        <div className="flex items-center justify-between px-6 py-3">
          
          <div className="flex items-center space-x-6 space-x-reverse w-full md:w-auto">
            {/* زر القائمة للهواتف */}
            <button 
              className="md:hidden text-2xl ml-4 p-1" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
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

        {/* قائمة الهواتف المنسدلة (ستارة متصلة بالشريط العلوي) */}
        {isMobileMenuOpen && (
          <>
            {/* طبقة شفافة للإغلاق عند النقر في الخارج */}
            <div 
              className="md:hidden fixed inset-0 z-40 bg-black/50" 
              style={{ top: '56px' }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* القائمة التي تتدلى من الأعلى */}
            <div className="md:hidden absolute top-full left-0 right-0 w-full bg-[#1f2937] shadow-xl flex flex-col z-50 border-t border-gray-700 pb-4">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSectionId(section.id)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`text-right px-6 py-3 border-b border-gray-800 transition-colors ${
                    activeSectionId === section.id ? 'bg-blue-600 text-white font-bold' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {section.name}
                </button>
              ))}
              
              <div className="mt-4 px-6">
                <div className="text-sm text-gray-400 mb-3">
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
          </>
        )}
      </header>

      {/* --- منطقة المحتوى السفلية --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* الشريط الجانبي في شاشة الحاسوب */}
        {activeSection && activeSection.items.length > 0 && (
          <aside className="w-64 bg-white shadow-xl border-l border-gray-200 z-40 hidden md:flex flex-col flex-shrink-0">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <h2 className="text-lg font-extrabold text-gray-800">{activeSection.name}</h2>
              <p className="text-xs text-gray-500 mt-1">اختر من القائمة أدناه</p>
            </div>
            
            <nav className="p-3 flex-1 overflow-y-auto min-h-0">
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

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
          
          {/* شريط الأقسام الفرعية يظهر فقط على الهواتف */}
          {activeSection && activeSection.items.length > 0 && (
            <div className="md:hidden bg-white border-b shadow-sm overflow-x-auto whitespace-nowrap p-3 flex-shrink-0">
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

          {/* محتوى الصفحة الفعلي أو رسالة الترحيب */}
          <div className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6">
            {isCurrentPageInActiveSection ? (
              children
            ) : (
              // رسالة الترحيب التي تظهر عند التنقل بين الأقسام الرئيسية
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center px-4">
                <div className="w-20 h-20 mb-6 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center shadow-inner">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  قسم {activeSection?.name}
                </h3>
                <p className="text-gray-500 text-lg max-w-md leading-relaxed">
                  الرجاء اختيار إحدى القوائم للبدء بالعمل وعرض المحتوى.
                </p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
