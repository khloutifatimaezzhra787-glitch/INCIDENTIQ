import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../hooks/useNotifications'

export default function Navbar({ onMenuClick, sidebarWidth }) {
  const { theme, toggleTheme } = useTheme()
  const { notifs, unreadCount, markAllRead, markRead } = useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const openNotification = async (notif) => {
    if (!notif.lu) await markRead(notif.id)
    setOpen(false)
    if (notif.incident_id) navigate(`/incidents/${notif.incident_id}`)
  }

  return (
    <header style={{
      position: 'fixed',
      top: 0, right: 0,
      left: sidebarWidth,
      height: 'var(--navbar-h)',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 100,
      transition: 'left var(--transition)',
      boxShadow: 'var(--shadow-xs)',
    }}>
      <button
        onClick={onMenuClick}
        style={{
          width: 34, height: 34, borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          transition: 'all var(--transition)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        <Menu size={18} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={toggleTheme}
          style={{
            width: 34, height: 34, borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(p => !p)}
            style={{
              width: 34, height: 34, borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', transition: 'all var(--transition)',
              position: 'relative',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -3,
                right: -5,
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                borderRadius: 999,
                background: 'var(--red)',
                color: '#fff',
                border: '2px solid var(--bg-card)',
                fontSize: 10,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                boxShadow: '0 4px 10px rgba(239,68,68,0.35)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="fade-up" style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 300, background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 300, overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)' }}>Notifications</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {unreadCount > 0 ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}` : 'Aucune nouvelle notification'}
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
                    Tout lire
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Aucune notification
                  </div>
                ) : notifs.slice(0, 10).map(n => (
                  <button key={n.id} onClick={() => openNotification(n)} style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: n.lu ? 'transparent' : 'linear-gradient(90deg, var(--blue-soft), rgba(212,175,55,0.12))',
                    borderBottom: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: 10,
                    cursor: n.incident_id ? 'pointer' : 'default',
                  }}>
                    <span style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      marginTop: 5,
                      background: n.lu ? 'var(--border)' : 'var(--red)',
                      boxShadow: n.lu ? 'none' : '0 0 0 3px rgba(239,68,68,0.14)',
                    }} />
                    <span>
                      <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.45, fontWeight: n.lu ? 500 : 800, display: 'block' }}>
                        {n.message}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        {new Date(n.created_at).toLocaleString('fr-FR')}
                        {n.incident_id ? ` · Incident #${n.incident_id}` : ''}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
