import { useEffect, useState } from 'react'
import { Plus, X, UserCheck, UserX } from 'lucide-react'
import api from '../api/client'
import { formatDate, getInitials } from '../utils/helpers'

const ROLES = ['client', 'technicien', 'admin']
const roleColor = { admin: '#ef4444', technicien: '#f59e0b', client: '#3b82f6' }
const roleBg = { admin: '#fef2f2', technicien: '#fffbeb', client: '#eff6ff' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', role: 'client' })
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = () => {
    api.get('/api/users/').then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/api/users/', form)
      setShowModal(false)
      setForm({ nom: '', prenom: '', email: '', mot_de_passe: '', role: 'client' })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (u) => {
    await api.put(`/api/users/${u.id}`, { actif: !u.actif }).catch(() => {})
    fetchUsers()
  }

  const inputStyle = {
    padding: '9px 12px', background: 'var(--bg-input)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    transition: 'border-color var(--transition)', width: '100%',
  }

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Utilisateurs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', background: 'var(--blue)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13,
          boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
          transition: 'background var(--transition)', flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-dark)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--blue)'}
        >
          <Plus size={15} /> Nouvel utilisateur
        </button>
      </div>

      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Créé le', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} style={{ padding: '12px 16px' }}>
                      <div className="skeleton" style={{ height: 14, width: j === 0 ? 140 : 80, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              )) : users.map((u, idx) => (
                <tr key={u.id} className="fade-up"
                  style={{
                    borderTop: '1px solid var(--border)',
                    transition: 'background var(--transition)',
                    opacity: u.actif ? 1 : 0.55,
                    animationDelay: `${idx * 0.04}s`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: `${roleColor[u.role]}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: roleColor[u.role], flexShrink: 0,
                      }}>
                        {getInitials(u.prenom, u.nom)}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {u.prenom} {u.nom}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                      color: roleColor[u.role], background: roleBg[u.role],
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      fontSize: 11, fontWeight: 600,
                      color: u.actif ? '#22c55e' : 'var(--text-muted)',
                      background: u.actif ? '#f0fdf4' : 'var(--bg-hover)',
                    }}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(u.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleActive(u)} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                      background: u.actif ? '#fef2f2' : '#f0fdf4',
                      color: u.actif ? '#ef4444' : '#22c55e',
                      fontSize: 11, fontWeight: 600,
                      transition: 'all var(--transition)',
                      whiteSpace: 'nowrap',
                    }}>
                      {u.actif ? <><UserX size={12} /> Désactiver</> : <><UserCheck size={12} /> Activer</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fade-in" style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="fade-up" style={{
            width: '100%', maxWidth: 440,
            background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Nouvel utilisateur</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Prénom *</label>
                  <input required value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Nom *</label>
                  <input required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Email *</label>
                <input required type="text" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Mot de passe *</label>
                <input required type="password" value={form.mot_de_passe} onChange={e => setForm(f => ({ ...f, mot_de_passe: e.target.value }))} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Rôle</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '9px 16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)',
                  fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600,
                }}>Annuler</button>
                <button type="submit" disabled={submitting} style={{
                  padding: '9px 20px', background: 'var(--blue)', color: '#fff',
                  borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700,
                  opacity: submitting ? 0.7 : 1, transition: 'all var(--transition)',
                }}>
                  {submitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
