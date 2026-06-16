import axios from 'axios'

const api = axios.create({ baseURL: '', timeout: 15000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    // Log les erreurs pour le débogage
    const url = err.config?.url || ''
    const status = err.response?.status
    
    if (status === 401) {
      console.warn('[API Interceptor] 401 Error for:', url)
      
      // Seul authentifier les requêtes d'authentification
      const isAuthRequest = url.includes('/api/auth/login') || url.includes('/api/auth/register')
      
      // Si c'est une requête non-auth ET qu'on n'a pas de token du tout, rediriger
      if (!isAuthRequest) {
        const hasToken = !!localStorage.getItem('token')
        if (!hasToken) {
          // Pas de token du tout = vraie déconnexion
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        // Si on a un token mais 401, c'est probablement:
        // - Token expiré (géré par refresh si implémenté)
        // - Permission insuffisante
        // - Endpoint optionnel qui échoue
        // => On ne redirige pas, on laisse l'erreur se propager
      }
    }
    
    return Promise.reject(err)
  }
)

export default api
