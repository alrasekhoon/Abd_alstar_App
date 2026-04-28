'use client'
import { useDashboard } from './DashboardContext'

export default function Header() {
  const { filteredSections, activeSection, setActiveSection, toggleSidebar, isSidebarOpen } = useDashboard()

  return (
    <header className="bg-gray-900 text-white shadow-md sticky top-0 z-20">
      <div className="flex items-center gap-3 h-14 px-4 border-b border-gray-700/60">
        <button onClick={toggleSidebar} className="md:hidden p-2 rounded-lg hover:bg-gray-700">
          {isSidebarOpen ? '✕' : '☰'}
        </button>
        <span className="font-bold text-base">لوحة التحكم</span>
      </div>
      <nav className="flex gap-1 px-3 py-2 overflow-x-auto">
        {filteredSections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${section.id === activeSection
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
          >
            {section.name}
          </button>
        ))}
      </nav>
    </header>
  )
}
