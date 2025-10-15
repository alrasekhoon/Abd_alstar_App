'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({})
  const router = useRouter()

  useEffect(() => {
    // الحصول على دور المستخدم من localStorage
    const role = localStorage.getItem('userRole')
    setUserRole(role)
    
    // جلب حالة القائمة من localStorage
    const savedState = localStorage.getItem('sidebarState')
    if (savedState) {
      setExpandedSections(JSON.parse(savedState))
    } else {
      // حالة افتراضية إذا لم توجد بيانات محفوظة
      const menuSections = getMenuSections()
      const initialExpanded: {[key: string]: boolean} = {}
      menuSections.forEach(section => {
        initialExpanded[section.id] = false
      })
      setExpandedSections(initialExpanded)
    }
  }, [])

  // تعريف القائمة مع تجميع العناصر
  const getMenuSections = () => {
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
          { name: 'مواد الجامعة', href: '/uni_material', roles: ['admin', 'editor'] }
        ]
      },
      
      {
        id: 'education',
        name: 'المقررات',
        items: [
          { name: 'انواع الاشتراكات', href: '/ashtrak', roles: ['admin', 'editor'] },
          { name: 'المواد الدراسية', href: '/material', roles: ['admin', 'editor'] },
          { name: 'إستخراج الاسئلة', href: '/quiz', roles: ['admin', 'editor'] },
          { name: 'الأصوات', href: '/voice', roles: ['admin', 'editor'] }
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
          { name: 'الدفعات المالية', href: '/mony1', roles: ['admin'] }
        ]
      },
      {
        id: 'administration',
        name: 'إدارة النظام',
        items: [
          
          { name: 'الإعدادات', href: '/settings', roles: ['admin'] },
          { name: 'ادارة لوحة التحكم', href: '/UserManagement', roles: ['admin'] }
        ]
      }
    ]

    // تصفية العناصر بناءً على الصلاحيات
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.roles.includes(userRole || '') || 
        (userRole === null && item.roles.includes('viewer'))
      )
    })).filter(section => section.items.length > 0) // إزالة الأقسام الفارغة
  }

  const toggleSection = (sectionId: string) => {
    const newState = {
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId]
    }
    setExpandedSections(newState)
    // حفظ الحالة في localStorage
    localStorage.setItem('sidebarState', JSON.stringify(newState))
  }

  const menuSections = getMenuSections()

   const handleLogout = () => {
    // إزالة token من localStorage
    localStorage.removeItem('authToken')
    // توجيه المستخدم إلى صفحة تسجيل الدخول
    router.push('/login')
  }

 return (
  <div className="w-64 bg-gray-800 text-white h-full fixed right-0 flex flex-col">
    <div className="p-4 text-xl font-bold border-b border-gray-700">
      <div>
        <h1>القائمة الرئيسية</h1>
      </div>
    </div>
    
    {/* زر توسيع/تقليص الكل */}
    <div className="p-2 border-b border-gray-600">
      <button
        onClick={() => {
          const allExpanded = Object.values(expandedSections).every(Boolean)
          const newState: {[key: string]: boolean} = {}
          menuSections.forEach(section => {
            newState[section.id] = !allExpanded
          })
          setExpandedSections(newState)
          localStorage.setItem('sidebarState', JSON.stringify(newState))
        }}
        className="w-full text-sm p-2 bg-gray-700 rounded hover:bg-gray-600 text-white transition-colors"
      >
        {Object.values(expandedSections).every(Boolean) ? 'تقليص الكل' : 'توسيع الكل'}
      </button>
    </div>

    <nav className="p-4 flex-1 overflow-y-auto">
      <ul className="space-y-2">
        {menuSections.map((section) => (
          <li key={section.id} className="pb-2">
            {/* عنوان القسم الرئيسي */}
            <div
              onClick={() => toggleSection(section.id)}
              className="w-full flex justify-between items-center p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-all cursor-pointer select-none mb-2"
            >
              <span className="font-bold text-lg text-gray-800">{section.name}</span>
              <svg
                className={`w-5 h-5 transform transition-transform text-gray-500 ${
                  expandedSections[section.id] ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {/* عناصر القسم الفرعية */}
            {expandedSections[section.id] && (
              <ul className="space-y-2 bg-gray-50 rounded-lg p-3 shadow-inner">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`block p-3 rounded-lg transition-all text-gray-700 hover:bg-white hover:shadow-sm hover:text-blue-600 ${
                        pathname === item.href ? 'bg-white shadow-sm text-blue-600 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>

    {/* قسم الصلاحيات وزر تسجيل الخروج */}
    <div className="p-3 border-t border-gray-600 space-y-3">
      <div className="text-sm">الصلاحيات: {userRole || 'غير معروف'}</div>
      
      {/* زر تسجيل الخروج */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm font-medium"
      >
        تسجيل خروج
      </button>
    </div>
  </div>
)
}