'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// هنا تضع كل البيانات (الرئيسية والفرعية)
// القائمة العلوية ستأخذ العناوين الرئيسية، والجانبية ستأخذ العناصر الفرعية
const ALL_SECTIONS = [
  { 
    mainTitle: 'الواجهة الرئيسية', 
    items: [
      { name: 'الإعلانات', href: '/adv' }, 
      { name: 'الإشعارات', href: '/Notification' }
    ] 
  },
  { 
    mainTitle: 'إدارة المقررات', 
    items: [
      { name: 'أنواع الاشتراكات', href: '/ashtrak' },
      // أضف باقي الروابط الفرعية لإدارة المقررات هنا
    ] 
  }
  // يمكنك إضافة أقسام رئيسية أخرى هنا مثل "إدارة المستخدمين"
]

export default function Sidebar() {
  const pathname = usePathname()

  // 1. البحث عن القسم الرئيسي النشط بناءً على الرابط الحالي
  // يبحث في كل قسم، إذا وجد أن أحد روابطه الفرعية يطابق الرابط الحالي، يعتبره القسم النشط
  const activeSection = ALL_SECTIONS.find(section => 
    section.items.some(item => pathname.startsWith(item.href))
  )

  // 2. إذا لم يجد قسماً (مثلاً المستخدم في الصفحة الرئيسية /)، نعرض القسم الأول كافتراضي
  const itemsToShow = activeSection ? activeSection.items : ALL_SECTIONS[0].items
  const sectionTitle = activeSection ? activeSection.mainTitle : ALL_SECTIONS[0].mainTitle

  return (
    <aside className="w-64 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* عنوان القسم الرئيسي النشط حالياً */}
      <div className="p-4 font-bold border-b text-blue-600 bg-gray-50">
        {sectionTitle}
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <ul className="space-y-1">
          {itemsToShow.map((item) => {
            // التحقق مما إذا كان هذا الرابط الفرعي هو المفتوح حالياً لتلوينه
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`block p-2 rounded-md text-sm transition-colors duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
