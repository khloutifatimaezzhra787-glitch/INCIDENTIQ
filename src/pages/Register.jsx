import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../api/client'

const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
const gmailError = 'Utilisez une adresse Gmail valide, ex: nom@gmail.com'

function registerErrorMessage(err) {
  const status = err.response?.status
  const detail = err.response?.data?.detail

  if (status === 400) return detail || 'Inscription invalide'
  if (status === 422) return 'Verifiez les champs du formulaire'
  if (!err.response) return 'Serveur inaccessible. Verifiez que le backend est lance.'
  return detail || "Erreur lors de l'inscription"
}

export default function Register() {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const update = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const validateForm = () => {
    const nom = form.nom.trim()
    const prenom = form.prenom.trim()
    const email = form.email.trim().toLowerCase()

    if (!prenom || !nom) return 'Prenom et nom obligatoires'
    if (!gmailPattern.test(email)) return gmailError
    if (form.mot_de_passe.length < 8) return 'Le mot de passe doit contenir au moins 8 caracteres'
    if (form.mot_de_passe !== form.confirm) return 'Les mots de passe ne correspondent pas'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email.trim().toLowerCase(),
      mot_de_passe: form.mot_de_passe,
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/register', payload)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(registerErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: 13,
    outline: 'none', transition: 'border-color var(--transition)',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-app)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(15,107,79,0.12), transparent 42%, rgba(212,175,55,0.16))',
        }} />
      </div>

      <div className="fade-up" style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--green), var(--yellow))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 8px 20px rgba(15,107,79,0.24)',
          }}>
            <Zap size={22} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Creer un compte
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Rejoignez IncidentIQ
          </p>
        </div>

        {success ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, padding: '24px 0', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--green-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--green)',
            }}>
              <CheckCircle size={26} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Compte cree !</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Redirection vers la connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Prenom *</label>
                <input required value={form.prenom} onChange={update('prenom')} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Nom *</label>
                <input required value={form.nom} onChange={update('nom')} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Email Gmail *</label>
              <input required type="email" value={form.email} onChange={update('email')} placeholder="nom@gmail.com" autoComplete="email" inputMode="email" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Mot de passe *</label>
              <div style={{ position: 'relative' }}>
                <input
                  required type={showPwd ? 'text' : 'password'}
                  value={form.mot_de_passe} onChange={update('mot_de_passe')}
                  placeholder="Min. 8 caracteres"
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 38 }}
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

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Confirmer *</label>
              <input
                required type="password"
                value={form.confirm} onChange={update('confirm')}
                placeholder="Repeter le mot de passe"
                autoComplete="new-password"
                style={{
                  ...inputStyle,
                  borderColor: form.confirm && form.confirm !== form.mot_de_passe ? 'var(--red)' : 'var(--border)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = form.confirm !== form.mot_de_passe ? 'var(--red)' : 'var(--border)'}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13,
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
              marginTop: 2,
              boxShadow: loading ? 'none' : '0 4px 12px rgba(15,107,79,0.28)',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--blue-dark)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--blue)' }}
            >
              {loading ? 'Creation...' : 'Creer mon compte'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
          Deja un compte ?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
