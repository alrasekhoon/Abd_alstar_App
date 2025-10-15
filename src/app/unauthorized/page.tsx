'use client'

import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          غير مصرح بالوصول
        </h2>
        <p className="mt-2 text-gray-600">
          ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.
        </p>
        <div className="mt-4">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  )
}