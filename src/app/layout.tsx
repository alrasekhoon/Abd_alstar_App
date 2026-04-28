import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'الراسخون في القانون',
  description: 'لوحة التحكم',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      {/* هنا قمنا بإزالة أي Header أو Sidebar لكي لا تتكرر */}
      <body className={`${inter.className} bg-gray-50`}>
        {children}
      </body>
    </html>
  )
}
