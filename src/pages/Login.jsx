import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'

const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
const gmailError = 'Utilisez une adresse Gmail valide, ex: nom@gmail.com'

function loginErrorMessage(err) {
  const status = err.response?.status
  const detail = err.response?.data?.detail

  if (status === 400) return detail || gmailError
  if (status === 401) return 'Adresse Gmail ou mot de passe incorrect'
  if (status === 403) return 'Ce compte est desactive'
  if (!err.response) return 'Serveur inaccessible. Verifiez que le backend est lance.'
  return detail || 'Connexion impossible'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!gmailPattern.test(normalizedEmail)) {
      setError(gmailError)
      return
    }

    if (!password) {
      setError('Mot de passe obligatoire')
      return
    }

    setLoading(true)
    setError('')
    try {
      await login(normalizedEmail, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(loginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-app)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(15,107,79,0.12), transparent 42%, rgba(212,175,55,0.16))',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: '32%',
          background: 'linear-gradient(180deg, transparent, rgba(255,253,246,0.72))',
        }} />
      </div>

      <div className="fade-up" style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--green), var(--yellow))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 8px 20px rgba(15,107,79,0.24)',
          }}>
            <Zap size={22} color="#fff" fill="#fff" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22, fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.02em',
          }}>
            IncidentIQ
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Connectez-vous a votre espace
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
              Email Gmail
            </label>
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="nom@gmail.com"
              autoComplete="email"
              inputMode="email"
              required
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)', fontSize: 13,
                outline: 'none', transition: 'border-color var(--transition)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Mot de passe"
                autoComplete="current-password"
                required
                style={{
                  width: '100%', padding: '10px 38px 10px 12px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)', fontSize: 13,
                  outline: 'none', transition: 'border-color var(--transition)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button type="button" onClick={() => setShowPwd(p => !p)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', padding: 2,
              }}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--red-soft)', border: '1px solid var(--red)',
              color: 'var(--red)', fontSize: 13,
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px',
            background: loading ? 'var(--border)' : 'var(--blue)',
            color: '#fff', borderRadius: 'var(--radius-md)',
            fontWeight: 700, fontSize: 14,
            fontFamily: 'var(--font-display)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition)',
            marginTop: 4,
            boxShadow: loading ? 'none' : '0 4px 12px rgba(15,107,79,0.28)',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--blue-dark)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--blue)' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 600 }}>
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
