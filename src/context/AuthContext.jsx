import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  loading: true
})

const clearStoredSession = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  delete api.defaults.headers.common['Authorization']
}

const toUserData = (data, fallbackEmail = '') => ({
  id: data.id ?? data.user_id,
  role: data.role,
  email: data.email || fallbackEmail,
  nom: data.nom,
  prenom: data.prenom,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token')
      const saved = localStorage.getItem('user')

      if (!token) {
        clearStoredSession()
        setUser(null)
        setLoading(false)
        return
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      if (saved) {
        try {
          setUser(JSON.parse(saved))
        } catch (err) {
          console.error('[AuthContext] Failed to parse saved user:', err)
          localStorage.removeItem('user')
        }
      }

      try {
        const { data } = await api.get('/api/auth/me')
        const userData = toUserData(data)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
      } catch (err) {
        clearStoredSession()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase()
    clearStoredSession()

    const form = new URLSearchParams()
    form.append('username', normalizedEmail)
    form.append('password', password)

    const { data } = await api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    localStorage.setItem('token', data.access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`

    const userData = toUserData(data, normalizedEmail)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)

    return userData
  }

  const logout = () => {
    clearStoredSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
