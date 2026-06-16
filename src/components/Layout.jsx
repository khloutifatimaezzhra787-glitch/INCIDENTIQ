import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const sidebarWidth = isMobile
    ? 0
    : collapsed
      ? 'var(--sidebar-collapsed-w)'
      : 'var(--sidebar-w)'

  const sidebarPx = isMobile ? 0 : collapsed ? 64 : 240

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div style={{
        marginLeft: sidebarPx,
        transition: 'margin-left var(--transition)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Navbar
          onMenuClick={() => isMobile ? setMobileOpen(true) : setCollapsed(c => !c)}
          sidebarWidth={sidebarPx}
        />

        <main style={{
          marginTop: 'var(--navbar-h)',
          padding: isMobile ? '16px' : '24px',
          flex: 1,
          maxWidth: '100%',
          overflowX: 'hidden',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}