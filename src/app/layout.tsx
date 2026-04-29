import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
        {/* اترك هذا الملف يعرض المحتوى فقط، والتصميم سيكون في الملفات الفرعية */}
        {children}
      </body>
    </html>
  )
}
