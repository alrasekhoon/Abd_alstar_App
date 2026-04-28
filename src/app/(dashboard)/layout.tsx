import { DashboardProvider } from '@/app/components/DashboardContext'
import Header from '@/app/components/Header'
import Sidebar from '@/app/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
          <Sidebar />
        </div>
      </div>
    </DashboardProvider>
  )
}
