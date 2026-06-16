import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, Users,
  Tag, FileBarChart, LogOut, Zap, ChevronLeft
} from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin','technicien','client'] },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents', roles: ['admin','technicien','client'] },
  { to: '/rapports', icon: FileBarChart, label: 'Rapports', roles: ['admin','technicien','client'] },
  { to: '/categories', icon: Tag, label: 'Catégories', roles: ['admin'] },
  { to: '/users', icon: Users, label: 'Utilisateurs', roles: ['admin'] },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const getInitials = () => {
    const parts = (user?.email || '').split('@')[0].split('.')
    return parts.map(p => p[0]?.toUpperCase()).join('').slice(0, 2)
  }

  const sidebarStyle = {
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    width: collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
    background: 'var(--sidebar-bg)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width var(--transition), transform var(--transition)',
    zIndex: 200,
    overflowX: 'hidden',
    borderRight: '1px solid var(--sidebar-border)',
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 199,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
          }}
          className="fade-in"
        />
      )}

      <aside style={{
        ...sidebarStyle,
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }}
        className="sidebar-container"
      >
        {/* Header */}
        <div style={{
          height: 'var(--navbar-h)',
          display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 14px' : '0 16px',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--sidebar-border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(59,130,246,0.4)',
            }}>
              <Zap size={15} color="#fff" fill="#fff" />
            </div>
            {!collapsed && (
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800, fontSize: 16,
                color: 'var(--sidebar-title)', letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}>
                IncidentIQ
              </span>
            )}
          </div>
          {!collapsed && (
            <button onClick={onToggle} style={{
              width: 26, height: 26, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sidebar-text)',
              transition: 'background var(--transition), color var(--transition)',
              flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)' }}
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {!collapsed && (
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--sidebar-label)',
              padding: '0 8px 8px', marginBottom: 2,
            }}>
              Menu
            </div>
          )}
          {nav.filter(item => item.roles.includes(user?.role)).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onMobileClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '9px 10px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 2,
                color: isActive ? '#fff' : 'var(--sidebar-text)',
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                transition: 'all var(--transition)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textDecoration: 'none',
                boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.35)' : 'none',
                position: 'relative',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes('rgb(59')) {
                  e.currentTarget.style.background = 'var(--sidebar-hover)'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.background.includes('rgb(59')) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--sidebar-text)'
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={17} style={{ flexShrink: 0, color: isActive ? '#fff' : 'var(--sidebar-text)' }} />
                  {!collapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '8px 8px 12px',
          borderTop: '1px solid var(--sidebar-border)',
          flexShrink: 0,
        }}>
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', marginBottom: 4,
              background: 'var(--sidebar-user-bg)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
                flexShrink: 0,
              }}>
                {getInitials()}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text-active)', textTransform: 'capitalize' }}>{user?.role}</div>
                <div style={{ fontSize: 11, color: 'var(--sidebar-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: collapsed ? '10px 0' : '9px 10px',
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10, borderRadius: 'var(--radius-md)',
              color: 'var(--sidebar-text)', fontSize: 13,
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)' }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>
      </aside>
    </>
  )
}
