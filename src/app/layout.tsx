import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // هنا قمنا بجعل الـ Sidebar يحيط بكل المحتوى لكي يتحكم بالشريط العلوي والجانبي معاً
    <Sidebar>
      <Header />
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {children}
      </main>
    </Sidebar>
  )
}
