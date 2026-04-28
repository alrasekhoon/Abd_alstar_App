'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // للهواتف

  // 1. جلب بيانات المستخدم والصلاحيات عند التحميل
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    try {
      const perms = localStorage.getItem('userPermissions');
      if (perms) setUserPermissions(JSON.parse(perms));
    } catch(e) {}
  }, []);

  // 2. مصفوفة القوائم مع فلترة الصلاحيات (من الكود الخاص بك)
  const getMenuSections = useCallback(() => {
    const sections = [
      {
        id: 'main',
        name: 'الواجهة الرئيسية',
        items: [
          { name: 'الاعلانات', href: '/dashboard/adv', roles: ['admin', 'editor'] },
          { name: 'الاشعارات', href: '/dashboard/Notification', roles: ['admin', 'editor'] },
          { name: 'الروابط الجامعة', href: '/dashboard/uni_link', roles: ['admin', 'editor'] },
          { name: 'مواد الجامعة', href: '/dashboard/uni_material', roles: ['admin', 'editor'] },
          { name: 'إدارة واجهة الموقع', href: 'https://alrasekhooninlaw.com/admin.html', roles: ['admin', 'editor'] },
        ]
      },
      {
        id: 'education',
        name: 'إدارة المقررات',
        items: [
          { name: 'انواع الاشتراكات', href: '/dashboard/ashtrak', roles: ['admin', 'editor'] },
          { name: 'المواد الدراسية', href: '/dashboard/material', roles: ['admin', 'editor'] },
          { name: 'إستخراج الاسئلة', href: '/dashboard/quiz', roles: ['admin', 'editor'] },
          { name: 'الأصوات', href: '/dashboard/voice', roles: ['admin', 'editor'] },
          { name: 'استفسارات الاختبارات', href: '/dashboard/quiz_questions', roles: ['admin', 'editor'] }
        ]
      },
      {
        id: 'printing',
        name: 'الطباعة والتوصيل',
        items: [
          { name: 'الطباعة', href: '/dashboard/print', roles: ['admin', 'printer'] },
          { name: 'التوصيل والشحن', href: '/dashboard/delv', roles: ['admin', 'printer'] },
          { name: 'الفواتير', href: '/dashboard/print_bill', roles: ['admin', 'printer'] }
        ]
      },
      {
        id: 'financial',
        name: 'المستخدمين والمالية',
        items: [
          { name: 'المستخدمين', href: '/dashboard/users', roles: ['admin'] },
          { name: 'الدفعات المالية', href: '/dashboard/mony1', roles: ['admin'] },
          { name: 'إدارة المستخدمين', href: '/dashboard/new_user', roles: ['admin'] },
          { name: 'مراجعة وتوثيق الحسابات', href: '/dashboard/verify_users', roles: ['admin'] },
          { name: 'الجدوى المالية', href: '/dashboard/finance', roles: ['admin'] }
        ]
      },
      {
        id: 'administration',
        name: 'إدارة النظام',
        items: [
          { name: 'الإعدادات', href: '/dashboard/settings', roles: ['admin'] },
          { name: 'ادارة لوحة التحكم', href: '/dashboard/UserManagement', roles: ['admin'] },
          { name: 'الدردشة المباشرة', href: '/dashboard/support_chat', roles: ['admin', 'editor'] }
        ]
      }
    ];

    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (userRole === 'admin' || userRole === 'owner') return true;
        if (userPermissions && userPermissions.includes(item.href)) return true;
        return false;
      })
    })).filter(section => section.items.length > 0);
  }, [userRole, userPermissions]);

  const menuSections = getMenuSections();

  // 3. التحديد التلقائي للقسم النشط بناءً على الرابط الحالي
  useEffect(() => {
    if (menuSections.length > 0) {
      const currentSection = menuSections.find(sec => 
        sec.items.some(item => pathname.startsWith(item.href) && item.href !== '/dashboard')
      );
      if (currentSection) {
        setActiveSectionId(currentSection.id);
      } else if (!activeSectionId) {
        setActiveSectionId(menuSections[0].id); // الافتراضي
      }
    }
  }, [pathname, menuSections, activeSectionId]);

  // دوال التحكم
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleLinkClick = () => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // القسم المحدد حالياً
  const activeSection = menuSections.find(sec => sec.id === activeSectionId);

  return (
    <div className="flex flex-col h-screen bg-gray-50 w-full" dir="rtl">
      
      {/* زر فتح القائمة الجانبية للهواتف */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-50 bg-[#111827] text-white p-2 rounded-lg shadow-lg"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* === الشريط العلوي (القوائم الرئيسية) === */}
      <header className="flex-shrink-0 bg-[#1f2937] text-white shadow-md z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 md:pl-6 md:pr-16">
          <div className="font-bold text-xl text-right">الراسخون في القانون</div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 whitespace-nowrap scrollbar-hide">
            {menuSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                  activeSectionId === section.id 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* === حاوية المحتوى السفلي === */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* طبقة التعتيم الخلفية للهواتف */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* === القائمة الجانبية (القوائم الفرعية) === */}
        <aside className={`
          w-64 bg-[#111827] text-white flex flex-col justify-between z-40 flex-shrink-0 h-full
          absolute md:relative right-0 top-0 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
           <nav className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-gray-400 mb-4 font-bold border-b border-gray-700 pb-2">
                {activeSection?.name || 'القوائم الفرعية'}
              </p>
              <ul className="space-y-2">
                {activeSection?.items.map((item) => (
                  <li key={item.name}>
                    {item.href.startsWith('http') ? (
                       <a href={item.href} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg transition-all text-sm text-gray-300 hover:bg-slate-800 hover:text-white">
                         {item.name} ↗
                       </a>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`block p-3 rounded-lg transition-all text-sm ${
                          pathname === item.href 
                            ? 'bg-blue-600 text-white shadow-sm border-r-4 border-white' 
                            : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
           </nav>
           
           <div className="p-4 border-t border-slate-700 space-y-3 bg-[#1f2937]">
             <div className="text-sm text-center text-gray-300">الصلاحيات: {userRole || 'غير معروف'}</div>
             <button 
               onClick={handleLogout}
               className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
             >
               تسجيل خروج
             </button>
           </div>
        </aside>

        {/* === محتوى الصفحة المتغير === */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white w-full">
          {children}
        </main>

      </div>
    </div>
  );
}
