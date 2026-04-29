'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TopNavbar() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole'))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  return (
    <header className="bg-gray-900 text-white w-full shadow-md z-50">
      <div className="flex justify-between items-center px-4 py-3">
        {/* اسم النظام */}
        <div className="font-bold text-xl whitespace-nowrap">
          الراسخون في القانون
        </div>

        {/* معلومات المستخدم وأزرار التحكم */}
        <div className="flex items-center gap-4">
          {/* زر أدوات المدير يظهر فقط للمشرف */}
          {userRole === 'admin' && (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1.5 rounded text-sm font-medium"
            >
              أدوات المدير
            </button>
          )}
          <span className="text-xs text-gray-400 border-l border-gray-600 pl-4">
            {userRole || 'غير معروف'}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm"
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  )
}
