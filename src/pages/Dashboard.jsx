import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, CheckCircle, Zap, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import api from '../api/client'
import { formatDate } from '../utils/helpers'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/incidents/?limit=200')
      .then(r => setIncidents(r.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: incidents.length,
    en_attente: incidents.filter(i => i.statut === 'en_attente').length,
    ouvert: incidents.filter(i => i.statut === 'ouvert').length,
    en_cours: incidents.filter(i => i.statut === 'en_cours').length,
    resolu: incidents.filter(i => i.statut === 'resolu').length,
    critique: incidents.filter(i => i.priorite === 'critique').length,
  }

  const byPriorite = [
    { name: 'Faible', value: incidents.filter(i => i.priorite === 'faible').length },
    { name: 'Moyenne', value: incidents.filter(i => i.priorite === 'moyenne').length },
    { name: 'Haute', value: incidents.filter(i => i.priorite === 'haute').length },
    { name: 'Critique', value: incidents.filter(i => i.priorite === 'critique').length },
  ]

  const byStatut = [
    { name: 'En attente', value: stats.en_attente },
    { name: 'Ouvert', value: stats.ouvert },
    { name: 'En cours', value: stats.en_cours },
    { name: 'Résolu', value: stats.resolu },
  ]

  const recent = incidents.slice(0, 6)

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  }

  const tooltipStyle = {
    contentStyle: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      fontSize: 12,
      color: 'var(--text-primary)',
    },
    cursor: { fill: 'var(--bg-hover)' },
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
      </div>
      <div className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Tableau de bord
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>Vue d'ensemble de vos incidents</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatCard icon={<AlertTriangle size={18} />} label="Total" value={stats.total} color="#3b82f6" />
        <StatCard icon={<Clock size={18} />} label="En attente" value={stats.en_attente} color="#d4af37" />
        <StatCard icon={<Zap size={18} />} label="Ouverts" value={stats.ouvert} color="#3b82f6" />
        <StatCard icon={<Clock size={18} />} label="En cours" value={stats.en_cours} color="#f59e0b" />
        <StatCard icon={<CheckCircle size={18} />} label="Résolus" value={stats.resolu} color="#22c55e" />
        <StatCard icon={<TrendingUp size={18} />} label="Critiques" value={stats.critique} color="#ef4444" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              Incidents par statut
            </h3>
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byStatut} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="var(--blue)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              Répartition par priorité
            </h3>
          </div>
          <div style={{ padding: '8px 20px 20px' }}>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={byPriorite} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {byPriorite.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent table */}
      <div style={cardStyle}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            Incidents récents
          </h3>
          <button onClick={() => navigate('/incidents')} style={{
            fontSize: 12, color: 'var(--blue)', fontWeight: 600,
            background: 'transparent',
          }}>
            Voir tout →
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                {['N°', 'Titre', 'Statut', 'Priorité', 'Date'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Aucun incident
                  </td>
                </tr>
              ) : recent.map((inc, idx) => (
                <tr key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  style={{
                    borderTop: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background var(--transition)',
                    animationDelay: `${idx * 0.05}s`,
                  }}
                  className="fade-up"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>#{inc.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.titre}
                  </td>
                  <td style={{ padding: '12px 16px' }}><Badge statut={inc.statut} /></td>
                  <td style={{ padding: '12px 16px' }}><Badge priorite={inc.priorite} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(inc.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
