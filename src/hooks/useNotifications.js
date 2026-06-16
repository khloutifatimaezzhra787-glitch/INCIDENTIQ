import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

export function useNotifications() {
  const [notifs, setNotifs] = useState([])

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/')
      setNotifs(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, 30000)
    return () => clearInterval(id)
  }, [fetch])

  const markAllRead = async () => {
    await api.put('/api/notifications/lire-tout/').catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
  }

  const markRead = async (id) => {
    await api.put(`/api/notifications/${id}/lire`).catch(() => {})
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }

  return { notifs, unreadCount: notifs.filter(n => !n.lu).length, markAllRead, markRead, refetch: fetch }
}
