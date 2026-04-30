'use client'
 
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // حالة التحقق من الصلاحيات
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  const getMenuSections = useCallback(() => {
    const sections = [
      {
        id: 'main',
        name: 'الواجهة الرئيسية',
        icon: <span className="text-xl">📊</span>,
        items: [
          { name: 'الاعلانات', href: '/adv', roles: ['admin', 'editor'] },
          { name: 'الاشعارات', href: '/Notification', roles: ['admin', 'editor'] },
          { name: 'الروابط الجامعة', href: '/uni_link', roles: ['admin', 'editor'] },
          { name: 'مواد الجامعة', href: '/uni_material', roles: ['admin', 'editor'] },
        ]
      },
      {
        id: 'education',
        name: 'إدارة المقررات',
        icon: <span className="text-xl">📚</span>,
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
        icon: <span className="text-xl">🖨️</span>,
        items: [
          { name: 'الطباعة', href: '/print', roles: ['admin', 'printer'] },
          { name: 'التوصيل والشحن', href: '/delv', roles: ['admin', 'printer'] },
          { name: 'الفواتير', href: '/print_bill', roles: ['admin', 'printer'] }
        ]
      },
      {
        id: 'financial',
        name: 'المستخدمين والمالية',
        icon: <span className="text-xl">👥</span>,
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
        icon: <span className="text-xl">⚙️</span>,
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
    const token = localStorage.getItem('authToken')
    setUserRole(role)

    try {
      const perms = localStorage.getItem('userPermissions')
      if (perms) setUserPermissions(JSON.parse(perms))
    } catch(e) {}

    const checkAuth = () => {
      if (!token && pathname !== '/login') {
        router.replace('/login')
        return
      }

      if (token && role && pathname !== '/login' && pathname !== '/') {
        const allAllowedLinks = getMenuSections().flatMap(section => section.items.map(item => item.href));
        if (allAllowedLinks.length > 0 && !allAllowedLinks.includes(pathname)) {
           router.replace('/') 
           return
        }
      }
      setIsAuthChecking(false)
    }

    checkAuth()

    const savedState = localStorage.getItem('sidebarState')
    if (savedState) {
      setExpandedSections(JSON.parse(savedState))
    } else {
      setExpandedSections({ main: true })
    }
  }, [pathname, router, getMenuSections])

  useEffect(() => {
    if (isAuthChecking) return;
    const sections = getMenuSections()
    const activeSection = sections.find(s => s.items.some(item => item.href === pathname))
    if (activeSection) {
      setExpandedSections(prev => ({ ...prev, [activeSection.id]: true }))
    }
  }, [pathname, getMenuSections, isAuthChecking])

  const toggleSection = (sectionId: string) => {
    const newState = { ...expandedSections, [sectionId]: !expandedSections[sectionId] }
    setExpandedSections(newState)
    localStorage.setItem('sidebarState', JSON.stringify(newState))
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  if (isAuthChecking && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-5xl animate-pulse drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">⚖️</div>
      </div>
    )
  }

  if (pathname === '/login') {
    return <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">{children}</div>
  }

  const menuSections = getMenuSections()

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-right" dir="rtl">
      
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-slate-900 shadow-2xl border-l border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        
        <div className="h-20 flex items-center justify-between px-6 bg-slate-950/50 border-b border-amber-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-200 to-amber-500 leading-none">
                الراسخون
              </h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest mt-1 block">لوحة الإدارة</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors text-xl font-bold">
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuSections.map((section) => {
            const isExpanded = expandedSections[section.id]
            const hasActiveItem = section.items.some(item => item.href === pathname)

            return (
              <div key={section.id} className="bg-slate-800/40 rounded-xl overflow-hidden border border-slate-700/50">
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between p-4 transition-colors select-none
                    ${hasActiveItem ? 'bg-slate-800/80 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <div className="flex items-center gap-3 font-bold">
                    <span className={`${hasActiveItem ? 'text-amber-500' : 'text-slate-500 opacity-70'}`}>{section.icon}</span>
                    {section.name}
                  </div>
                  <span className={`text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180 text-amber-500' : 'text-slate-500'}`}>
                    ▼
                  </span>
                </button>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul className="px-4 pb-4 pt-1 space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                            className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                              ${isActive 
                                ? 'bg-amber-500/10 text-amber-400 border-r-2 border-amber-500' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                              }
                            `}
                          >
                            {item.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-amber-500 font-bold">
              {userRole ? userRole.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-200">صلاحية الحساب</span>
              <span className="text-xs text-amber-500 uppercase tracking-wider">{userRole || 'Loading...'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2.5 rounded-xl transition-colors text-sm font-bold"
          >
            <span>🚪</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100">
        
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h1 className="font-bold text-slate-800">الراسخون</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xl font-bold"
          >
            ☰
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children ? children : (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">⚖️</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">أهلاً بك في لوحة التحكم</h2>
              <p className="text-slate-500 leading-relaxed">
                يرجى اختيار أحد الأقسام من القائمة الجانبية للبدء في إدارة المنصة والمقررات.
              </p>
            </div>
          )}
        </main>
      </div>
      
    </div>
  )
}
