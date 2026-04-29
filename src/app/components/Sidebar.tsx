'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { SECTIONS_DATA } from './menuData'

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // تصفية الأقسام حسب الصلاحيات
  const getFilteredSections = useCallback(() => {
    return SECTIONS_DATA.map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (userRole === 'admin' || userRole === 'owner') return true;
        if (userPermissions?.includes(item.href)) return true;
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
    } catch (e) {
      console.error("Error parsing permissions:", e);
    }
  }, [])

  const menuSections = getFilteredSections()

  // عند تحميل الصفحة، توسيع القسم الذي يحتوي على الرابط الحالي
  useEffect(() => {
    if (menuSections.length > 0) {
      const active = menuSections.find(sec =>
        sec.items.some(item => item.href === pathname)
      )
      if (active && !expandedSections.includes(active.id)) {
        setExpandedSections(prev => [...prev, active.id])
      }
    }
  }, [pathname, menuSections])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const expandAll = () => {
    setExpandedSections(menuSections.map(sec => sec.id))
  }

  const collapseAll = () => {
    setExpandedSections([])
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeMobile = () => {
    if (window.innerWidth < 768) setIsSidebarOpen(false)
  }

  return (
    <>
      {/* زر فتح القائمة في الهواتف */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-xl"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* طبقة التعتيم للموبايل */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* القائمة الجانبية */}
      <aside className={`
        w-64 bg-white border-l border-gray-200 h-full flex flex-col
        fixed right-0 md:relative z-40
        transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* العنوان وأزرار التحكم */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-3">القائمة الرئيسية</h2>
          <div className="flex gap-2 text-sm">
            <button
              onClick={expandAll}
              className="text-blue-600 hover:underline"
            >
              توسيع الكل
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-blue-600 hover:underline"
            >
              طي الكل
            </button>
          </div>
        </div>

        {/* قائمة الأقسام الشجرية */}
        <nav className="flex-1 overflow-y-auto p-4">
          {menuSections.map(section => {
            const isExpanded = expandedSections.includes(section.id)
            return (
              <div key={section.id} className="mb-3">
                {/* رأس القسم قابل للنقر للتوسيع/الطي */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex justify-between items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold text-sm"
                >
                  <span>{section.name}</span>
                  <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    ›
                  </span>
                </button>

                {/* العناصر الفرعية (تظهر إذا كان القسم موسعاً) */}
                {isExpanded && (
                  <ul className="mr-4 mt-1 space-y-1 border-r-2 border-gray-100 pr-3">
                    {section.items.map(item => {
                      const isActive = pathname === item.href
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={closeMobile}
                            className={`block p-2 rounded-lg text-sm transition-all ${
                              isActive
                                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            {item.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
