'use client'

import {
  createContext, useContext, useState,
  useEffect, useMemo, ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { menuSections, MenuSection } from '@/lib/menuSections'

interface DashboardContextType {
  activeSection: string
  setActiveSection: (id: string) => void
  filteredSections: MenuSection[]
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  userRole: string | null
  handleLogout: () => void
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection]     = useState('main')
  const [userRole, setUserRole]               = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false)

  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole'))
    try {
      const perms = localStorage.getItem('userPermissions')
      if (perms) setUserPermissions(JSON.parse(perms))
    } catch (_) {}
  }, [])

  useEffect(() => {
    const found = menuSections.find(s =>
      s.items.some(item => item.href === pathname)
    )
    if (found) setActiveSection(found.id)
  }, [pathname])

  const filteredSections = useMemo(() =>
    menuSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          if (userRole === 'admin' || userRole === 'owner') return true
          if (userPermissions.includes(item.href)) return true
          return false
        }),
      }))
      .filter(s => s.items.length > 0),
    [userRole, userPermissions]
  )

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  return (
    <DashboardContext.Provider value={{
      activeSection,
      setActiveSection,
      filteredSections,
      isSidebarOpen,
      toggleSidebar: () => setIsSidebarOpen(p => !p),
      closeSidebar:  () => setIsSidebarOpen(false),
      userRole,
      handleLogout,
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard يجب أن يُستخدم داخل DashboardProvider')
  return ctx
}
