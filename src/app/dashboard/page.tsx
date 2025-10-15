'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken')
      const role = localStorage.getItem('userRole')
      
      if (!token) {
        router.push('/login')
      } else {
        setUserRole(role)
      }
    }

    checkAuth()
    
    window.addEventListener('storage', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
    }
  }, [router])

  return (
    <div className="mr-64 p-6"> {/* تأكد من أن الهامش يتوافق مع عرض السايدبار */}
      <h1 className="text-2xl font-bold mb-4">الراسخون في القانون</h1>
      <p>لوحة التحكم لتطبيق الراسخون في القانون</p>
      {userRole === 'admin' && (
        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <h2 className="font-bold text-blue-800">أدوات المدير</h2>
          <p className="text-blue-700">لديك صلاحيات كاملة في النظام</p>
        </div>
      )}
    </div>
  )
}