import './globals.css'
import Sidebar from './components/Sidebar' 
import TopNavbar from './components/TopNavbar' 

export const metadata = {
  title: 'الراسخون في القانون - لوحة التحكم',
  description: 'لوحة تحكم إدارة الراسخون في القانون',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 flex flex-col h-screen overflow-hidden">
        {/* الشريط العلوي */}
        <TopNavbar />
        
        <div className="flex flex-1 overflow-hidden">
          {/* القائمة الجانبية */}
          <Sidebar />
          
          {/* محتوى الصفحة المتغير */}
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
