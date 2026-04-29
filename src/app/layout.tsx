import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// التعديل هنا: استخدمنا نقطة واحدة (.) بدلاً من نقطتين (..)
import Sidebar from './components/Sidebar'
import Header from './components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'لوحة التحكم',
  description: 'لوحة تحكم التطبيق',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <div className="flex flex-col h-screen bg-gray-100">
          
          {/* القائمة العلوية الرئيسية */}
          <Header />

          <div className="flex-1 flex overflow-hidden">
            
            {/* القائمة الجانبية الفرعية */}
            <Sidebar />
            
            {/* محتوى الصفحات */}
            <main className="flex-1 overflow-y-auto p-4">
              {children}
            </main>

          </div>
        </div>
      </body>
    </html>
  )
}
