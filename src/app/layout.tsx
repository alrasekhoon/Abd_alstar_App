import './globals.css'
import { cookies } from 'next/headers'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const isLoggedIn = !!cookieStore.get('authToken')?.value

  return (
    <html lang="ar" dir="rtl">
      <body>
        {isLoggedIn ? (
          <Sidebar>
            <Header />
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {children}
            </main>
          </Sidebar>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  )
}
