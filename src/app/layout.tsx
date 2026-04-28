import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from './components/Sidebar' 
import TopNavbar from './components/TopNavbar' 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'الراسخون في القانون',
  description: 'لوحة تحكم الراسخون في القانون',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.className} bg-gray-50 flex flex-col h-screen overflow-hidden`}>
        
        {/* 1. القائمة العلوية الأفقية */}
        <TopNavbar />

        {/* 2. المنطقة السفلية (تحتوي على القائمة الجانبية ومحتوى الصفحة) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* القائمة الجانبية (عمودية) */}
          <Sidebar />

          {/* محتوى الصفحة المتغير */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
          
        </div>
      </body>
    </html>
  )
}
