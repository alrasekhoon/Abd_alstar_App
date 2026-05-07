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

  const lastVisitedRef = useRef<Record<string, string>>({})

  const getMenuSections = useCallback(() => {
    const sections = [
      {
        id: 'main',
        name: 'الواجهة الرئيسية',
        items: [
          { name: 'الاعلانات', href: '/adv', roles: ['admin', 'editor'] },
          { name: 'الوظائف', href: '/home_work', roles: ['admin', 'editor'] },
          { name: 'الأخبار', href: '/news', roles: ['admin', 'editor'] },
          { name: 'الاشعارات', href: '/Notification', roles: ['admin', 'editor'] },
          { name: 'الروابط الجامعة', href: '/uni_link', roles: ['admin', 'editor'] },
          { name: 'مواد الجامعة', href: '/uni_material', roles: ['admin', 'editor'] },
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

    // ✅ منطق الصلاحيات المحافظ عليه من الكود الثاني بالكامل
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (userRole === 'admin' || userRole === 'owner') return true;
        if (userPermissions && userPermissions.includes(item.href)) return true;
        return false;
      })
    })).filter(section => section.items.length > 0)
  }, [userRole, userPermissions])

  // ✅ منطق قراءة البيانات المحافظ عليه من الكود الثاني
  useEffect(() => {
    const role = localStorage.getItem('userRole')
    setUserRole(role)
    try {
      const perms = localStorage.getItem('userPermissions')
      if (perms) setUserPermissions(JSON.parse(perms))
    } catch(e) {}
  }, [])

  // ✅ تتبع آخر صفحة مزارة في كل قسم (من الكود الأول)
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
  const activeSection = sections.length > 0
    ? (sections.find(s => s.id === activeSectionId) || sections[0])
    : null
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

        {/* القائمة المنسدلة للهاتف */}
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
                    activeSectionId === section.id
                      ? 'bg-blue-900 text-white font-bold'
                      : 'text-blue-50 hover:bg-blue-600'
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

        {/* الشريط الجانبي الذهبي */}
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

          {/* شريط التنقل الأفقي للهاتف */}
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
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] px-6 text-center">
                <p className="text-[#a89000] font-bold text-sm tracking-widest mb-3 uppercase">الراسخون في القانون</p>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
                  {activeSection?.id === 'main' && 'أهلاً بك في لوحة التحكم'}
                  {activeSection?.id === 'education' && 'إدارة المقررات والمحتوى التعليمي'}
                  {activeSection?.id === 'printing' && 'خدمات الطباعة والتوصيل'}
                  {activeSection?.id === 'financial' && 'إدارة المستخدمين والشؤون المالية'}
                  {activeSection?.id === 'administration' && 'إعدادات النظام والتحكم'}
                </h2>
                <div className="w-16 h-1 rounded-full bg-[#c4a900] mb-6" />
                <p className="text-gray-500 text-base leading-loose max-w-lg">
                  {activeSection?.id === 'main' && 'من هذه الواجهة يمكنك إدارة الإعلانات والإشعارات والروابط الجامعية والمواد المرتبطة بها.'}
                  {activeSection?.id === 'education' && 'من هنا تتحكم في كامل المحتوى التعليمي، من إضافة المواد الدراسية وأنواع الاشتراكات إلى استخراج الأسئلة وإدارة الأصوات والاستفسارات.'}
                  {activeSection?.id === 'printing' && 'تتيح لك هذه الواجهة الإشراف على طلبات الطباعة وعمليات التوصيل والشحن ومتابعة الفواتير الصادرة.'}
                  {activeSection?.id === 'financial' && 'من هذا القسم يمكنك استعراض بيانات المستخدمين، ومتابعة الدفعات المالية، ومراجعة الحسابات وتحليل الجدوى المالية.'}
                  {activeSection?.id === 'administration' && 'هنا تجد أدوات إدارة النظام بالكامل، من ضبط الإعدادات العامة إلى إدارة الصلاحيات ومتابعة الدردشة المباشرة.'}
                </p>
                <p className="text-gray-400 text-sm mt-6">← اختر من القائمة الجانبية للبدء</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
