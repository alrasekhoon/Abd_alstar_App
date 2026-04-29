'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS_DATA = [
  { title: 'الواجهة الرئيسية', items: [{ name: 'الإعلانات', href: '/adv' }, { name: 'الاشعارات', href: '/Notification' }] },
  { title: 'إدارة المقررات', items: [{ name: 'انواع الاشتراكات', href: '/ashtrak' }] }
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-64 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 font-bold border-b text-blue-600">القائمة الرئيسية</div>
      <nav className="flex-1 p-4 space-y-6">
        {SECTIONS_DATA.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{section.title}</h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={`block p-2 rounded-md text-sm ${pathname === item.href ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
