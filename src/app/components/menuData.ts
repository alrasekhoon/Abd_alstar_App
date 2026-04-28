export const SECTIONS_DATA = [
  {
    id: 'main',
    name: 'الواجهة الرئيسية',
    items: [
      { name: 'الاعلانات', href: '/adv', roles: ['admin', 'editor'] },
      { name: 'الاشعارات', href: '/Notification', roles: ['admin', 'editor'] },
      { name: 'الروابط الجامعة', href: '/uni_link', roles: ['admin', 'editor'] },
      { name: 'مواد الجامعة', href: '/uni_material', roles: ['admin', 'editor'] },
      { name: 'إدارة واجهة الموقع', href: 'https://alrasekhooninlaw.com/admin.html', roles: ['admin', 'editor'] },
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
];
