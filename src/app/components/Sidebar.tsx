'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string>('main')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // ✅ إصلاح #3: تتبع آخر صفحة تم زيارتها في كل قسم
  const lastVisitedRef = useRef<Record<string, string>>({})

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
          // ✅ إصلاح #1: حذف "إدارة واجهة الموقع"
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

  // ✅ إصلاح #3: تحديث آخر صفحة مزارة عند تغيير المسار
  useEffect(() => {
    const sections = getMenuSections()
    for (const section of sections) {
      if (section.items.some(item => item.href === pathname)) {
        setActiveSectionId(section.id)
        lastVisitedRef.current[section.id] = pathname
        break
      }
    }
  }, [pathname, getMenuSections])

  // عند الضغط على قسم: فقط تغيير القسم النشط دون تنقل تلقائي
  const handleSectionChange = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId)
    setIsMobileMenuOpen(false)
  }, [])

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
  const isCurrentPageInActiveSection = activeSection?.items.some(item => item.href === pathname)

  return (
    <div className="flex flex-col h-screen text-right font-sans bg-gray-100" dir="rtl">
      
      {/* --- الشريط العلوي --- */}
      <header className="bg-blue-600 text-white shadow-md z-50 relative">
        <div className="flex items-center justify-between px-6 py-3">
          
          <div className="flex items-center space-x-6 space-x-reverse w-full md:w-auto">
            <button 
              className="md:hidden text-2xl ml-4 p-1 text-white hover:text-blue-200 transition-colors" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
            
            <nav className="hidden md:flex space-x-2 space-x-reverse">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    activeSectionId === section.id
                      ? 'bg-blue-800 text-white shadow-inner'
                      : 'hover:bg-blue-500 text-blue-50'
                  }`}
                >
                  {section.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ✅ إصلاح #2: القائمة المنسدلة للهاتف - عرض محدود من جهة اليمين */}
        {isMobileMenuOpen && (
          <>
            <div 
              className="md:hidden fixed inset-0 z-40 bg-black/50" 
              style={{ top: '56px' }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            <div className="md:hidden absolute top-full right-0 w-72 max-w-[85vw] bg-blue-700 shadow-xl flex flex-col z-50 border border-blue-800 rounded-bl-xl pb-4">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`text-right px-6 py-3 border-b border-blue-600 transition-colors ${
                    activeSectionId === section.id ? 'bg-blue-900 text-white font-bold' : 'text-blue-50 hover:bg-blue-600'
                  }`}
                >
                  {section.name}
                </button>
              ))}
              
              <div className="mt-4 px-6">
                <div className="text-sm text-blue-200 mb-3">
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
        
        {/* ✅ إصلاح #4: الشريط الجانبي بعرض ديناميكي حسب أطول عنصر */}
        {activeSection && activeSection.items.length > 0 && (
          <aside className="w-fit min-w-[10rem] bg-[#c4a900] shadow-xl border-l border-[#a89000] z-40 hidden md:flex flex-col flex-shrink-0">
            <div className="p-5 border-b border-[#a89000] bg-[#b39a00] flex-shrink-0">
              <h2 className="text-lg font-extrabold text-black whitespace-nowrap">{activeSection.name}</h2>
              <p className="text-xs text-black/70 mt-1 whitespace-nowrap">اختر من القائمة أدناه</p>
            </div>
            
            <nav className="p-3 flex-1 overflow-y-auto min-h-0">
              <ul className="space-y-1.5">
                {activeSection.items.map(item => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`block px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                        pathname === item.href
                          ? 'bg-white/40 text-black font-extrabold border-r-4 border-black'
                          : 'text-black hover:bg-white/20 font-medium'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-4 border-t border-[#a89000] bg-[#b39a00] flex-shrink-0">
              <div className="text-sm text-black mb-3 text-center whitespace-nowrap">
                الصلاحيات: <span className="font-bold text-black">{userRole || 'غير معروف'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm whitespace-nowrap"
              >
                تسجيل خروج
              </button>
            </div>
          </aside>
        )}

        {/* مساحة عرض محتوى الصفحات */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {activeSection && activeSection.items.length > 0 && (
            <div className="md:hidden bg-[#c4a900] border-b border-[#a89000] shadow-sm overflow-x-auto whitespace-nowrap p-3 flex-shrink-0">
              {activeSection.items.map(item => (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={`inline-block px-4 py-2 mx-1 rounded-full text-sm font-bold transition-colors ${
                    pathname === item.href 
                      ? 'bg-white/50 text-black shadow-md'
                      : 'bg-transparent text-black border border-black/20 hover:bg-white/20'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6">
            {isCurrentPageInActiveSection ? (
              children
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] px-4 py-8">
                {/* أيقونة وعنوان القسم */}
                <div className="w-16 h-16 mb-4 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-1">{activeSection?.name}</h2>
                <p className="text-gray-400 text-sm mb-8">اختر أحد الخيارات أدناه للبدء</p>

                {/* بطاقات القائمة الفرعية */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                  {activeSection?.items.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex flex-col items-center justify-center gap-2 bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      {/* رقم ترتيبي كأيقونة */}
                      <div className="w-10 h-10 rounded-xl bg-[#c4a900]/20 group-hover:bg-blue-600 flex items-center justify-center transition-colors duration-200">
                        <span className="text-[#a89000] group-hover:text-white font-bold text-sm transition-colors duration-200">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-gray-700 group-hover:text-blue-700 font-semibold text-sm text-center leading-snug transition-colors duration-200">
                        {item.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
