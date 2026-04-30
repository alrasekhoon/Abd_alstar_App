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
        icon: '🏠',
        name: 'الواجهة الرئيسية',
        items: [
          { name: 'الاعلانات', href: '/adv' },
          { name: 'الاشعارات', href: '/Notification' },
          { name: 'الروابط الجامعة', href: '/uni_link' },
          { name: 'مواد الجامعة', href: '/uni_material' },
          { name: 'إدارة واجهة الموقع', href: 'https://alrasekhooninlaw.com/admin.html', external: true },
        ],
      },
      {
        id: 'education',
        icon: '📚',
        name: 'إدارة المقررات',
        items: [
          { name: 'انواع الاشتراكات', href: '/ashtrak' },
          { name: 'المواد الدراسية', href: '/material' },
          { name: 'إستخراج الاسئلة', href: '/quiz' },
          { name: 'الأصوات', href: '/voice' },
          { name: 'استفسارات الاختبارات', href: '/quiz_questions' },
        ],
      },
      {
        id: 'printing',
        icon: '🖨️',
        name: 'الطباعة والتوصيل',
        items: [
          { name: 'الطباعة', href: '/print' },
          { name: 'التوصيل والشحن', href: '/delv' },
          { name: 'الفواتير', href: '/print_bill' },
        ],
      },
      {
        id: 'financial',
        icon: '💰',
        name: 'المستخدمين والمالية',
        items: [
          { name: 'المستخدمين', href: '/users' },
          { name: 'الدفعات المالية', href: '/mony1' },
          { name: 'إدارة المستخدمين', href: '/new_user' },
          { name: 'مراجعة وتوثيق الحسابات', href: '/verify_users' },
          { name: 'الجدوى المالية', href: '/finance' },
        ],
      },
      {
        id: 'administration',
        icon: '⚙️',
        name: 'إدارة النظام',
        items: [
          { name: 'الإعدادات', href: '/settings' },
          { name: 'ادارة لوحة التحكم', href: '/UserManagement' },
          { name: 'الدردشة المباشرة', href: '/support_chat' },
        ],
      },
    ]

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (userRole === 'admin' || userRole === 'owner') return true
          if (userPermissions && userPermissions.includes(item.href)) return true
          return false
        }),
      }))
      .filter((section) => section.items.length > 0)
  }, [userRole, userPermissions])

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    setUserRole(role)
    try {
      const perms = localStorage.getItem('userPermissions')
      if (perms) setUserPermissions(JSON.parse(perms))
    } catch (e) {}
  }, [])

  // تحديث القسم النشط بناءً على المسار الحالي
  useEffect(() => {
    const sections = getMenuSections()
    for (const section of sections) {
      if (section.items.some((item) => item.href === pathname)) {
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
    localStorage.removeItem('userRole')
    localStorage.removeItem('userPermissions')
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
  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0]
  const isCurrentPageInActiveSection = activeSection?.items.some((item) => item.href === pathname)

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100" dir="rtl">

      {/* ========== الشريط العلوي ========== */}
      <header className="bg-gray-900 text-white shadow-lg z-50 flex-shrink-0">
        <div className="flex items-center justify-between px-4 h-14">

          {/* شعار الموقع */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#c4a900] flex items-center justify-center text-black font-extrabold text-sm">
              ر
            </div>
            <span className="hidden sm:block text-sm font-bold text-[#c4a900] whitespace-nowrap">
              الراسخون في القانون
            </span>
          </div>

          {/* أزرار الأقسام الرئيسية */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
                  ${activeSectionId === section.id
                    ? 'bg-[#c4a900] text-black shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <span>{section.icon}</span>
                <span>{section.name}</span>
              </button>
            ))}
          </nav>

          {/* يمين: صلاحية + خروج + زر الهاتف */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              <span>{userRole || 'غير معروف'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:block bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              خروج
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white text-xl p-1"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* قائمة الهاتف المنسدلة */}
        {isMobileMenuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              style={{ top: '56px' }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="md:hidden absolute top-full right-0 w-72 max-w-[90vw] bg-gray-900 border border-gray-700 rounded-bl-xl shadow-2xl z-50 pb-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`
                    w-full flex items-center gap-3 text-right px-5 py-3.5 border-b border-gray-800 transition-colors
                    ${activeSectionId === section.id
                      ? 'bg-[#c4a900] text-black font-bold'
                      : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                >
                  <span>{section.icon}</span>
                  <span className="text-sm">{section.name}</span>
                </button>
              ))}
              <div className="px-5 mt-4 space-y-2">
                <div className="text-xs text-gray-400">
                  الصلاحية: <span className="text-white font-semibold">{userRole || 'غير معروف'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm font-medium transition-colors"
                >
                  تسجيل خروج
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ========== المنطقة السفلية ========== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== الشريط الجانبي (سطح المكتب فقط) ===== */}
        {activeSection && activeSection.items.length > 0 && (
          <aside className="hidden md:flex flex-col w-52 flex-shrink-0 bg-white border-l border-gray-200 shadow-sm">

            {/* عنوان القسم */}
            <div className="px-4 py-3 bg-[#c4a900] flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeSection.icon}</span>
                <div>
                  <h2 className="text-sm font-extrabold text-black leading-tight">{activeSection.name}</h2>
                  <p className="text-xs text-black/60 mt-0.5">{activeSection.items.length} عناصر</p>
                </div>
              </div>
            </div>

            {/* روابط القسم */}
            <nav className="flex-1 overflow-y-auto py-2 px-2">
              <ul className="space-y-0.5">
                {activeSection.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        target={(item as any).external ? '_blank' : undefined}
                        rel={(item as any).external ? 'noopener noreferrer' : undefined}
                        className={`
                          flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all
                          ${isActive
                            ? 'bg-[#c4a900] text-black font-bold shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
                        )}
                        <span>{item.name}</span>
                        {(item as any).external && (
                          <span className="text-xs opacity-50 mr-auto">↗</span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>
        )}

        {/* ===== منطقة المحتوى ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* شريط الهاتف الأفقي للصفحات الفرعية */}
          {activeSection && activeSection.items.length > 0 && (
            <div className="md:hidden bg-[#c4a900] border-b border-[#a89000] overflow-x-auto whitespace-nowrap px-3 py-2 flex gap-2 flex-shrink-0">
              {activeSection.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    inline-block px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex-shrink-0
                    ${pathname === item.href
                      ? 'bg-black text-[#c4a900]'
                      : 'bg-black/10 text-black hover:bg-black/20'
                    }
                  `}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}

          {/* المحتوى الرئيسي */}
          <div className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6">
            {isCurrentPageInActiveSection ? (
              children
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] px-6 text-center">
                <div className="text-5xl mb-4">{activeSection?.icon}</div>
                <p className="text-[#c4a900] font-bold text-xs tracking-widest mb-2 uppercase">
                  الراسخون في القانون
                </p>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-3">
                  {activeSection?.id === 'main' && 'أهلاً بك في لوحة التحكم'}
                  {activeSection?.id === 'education' && 'إدارة المقررات والمحتوى التعليمي'}
                  {activeSection?.id === 'printing' && 'خدمات الطباعة والتوصيل'}
                  {activeSection?.id === 'financial' && 'إدارة المستخدمين والشؤون المالية'}
                  {activeSection?.id === 'administration' && 'إعدادات النظام والتحكم'}
                </h2>
                <div className="w-12 h-1 rounded-full bg-[#c4a900] mb-4" />
                <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                  {activeSection?.id === 'main' && 'من هنا تدير الإعلانات والإشعارات والروابط الجامعية والمواد المرتبطة بها.'}
                  {activeSection?.id === 'education' && 'تحكم في المحتوى التعليمي من مواد دراسية وأنواع اشتراكات وأسئلة وأصوات.'}
                  {activeSection?.id === 'printing' && 'أشرف على طلبات الطباعة والتوصيل ومتابعة الفواتير الصادرة.'}
                  {activeSection?.id === 'financial' && 'استعرض بيانات المستخدمين والدفعات المالية وراجع الحسابات وحلل الجدوى المالية.'}
                  {activeSection?.id === 'administration' && 'اضبط إعدادات النظام وصلاحيات لوحة التحكم وتابع الدردشة المباشرة.'}
                </p>
                <p className="text-gray-400 text-xs mt-5">← اختر من القائمة الجانبية للبدء</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
