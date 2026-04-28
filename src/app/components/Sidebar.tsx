'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDashboard } from './DashboardContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { filteredSections, activeSection, isSidebarOpen, closeSidebar, userRole, handleLogout } = useDashboard()
  const currentSection = filteredSections.find(s => s.id === activeSection)

  return (
    <>
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={closeSidebar} />
      )}
      <aside className={`
        w-64 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col
        fixed top-0 right-0 h-full z-40 shadow-xl
        transition-transform duration-300 ease-in-out
        md:relative md:h-auto md:z-auto md:shadow-sm md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
          <h2 className="font-bold text-sm">{currentSection?.name ?? 'اختر قسماً'}</h2>
          <button onClick={closeSidebar} className="md:hidden">✕</button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {currentSection ? (
            <ul className="space-y-0.5">
              {currentSection.items.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => { if (window.innerWidth < 768) closeSidebar() }}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${pathname === item.href
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-xs text-center mt-10">اختر قسماً من الأعلى</p>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-400 text-center">
            الصلاحية: <span className="font-semibold text-gray-600">{userRole ?? 'غير معروف'}</span>
          </p>
          <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg">
            تسجيل خروج
          </button>
        </div>
      </aside>
    </>
  )
}
