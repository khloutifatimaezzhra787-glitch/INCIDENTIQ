import { useNavigate } from 'react-router-dom'
import Badge from './Badge'
import { Clock, User } from 'lucide-react'

export default function IncidentCard({ incident }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/incidents/${incident.id}`)}
      className="fade-in"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'transform var(--transition), box-shadow var(--transition)',
        boxShadow: 'var(--shadow-sm)',
        borderLeft: '3px solid var(--accent)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          #{incident.id}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Badge statut={incident.statut} />
          <Badge priorite={incident.priorite} />
        </div>
      </div>

      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 15, fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 8,
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {incident.titre}
      </h3>

      {incident.description && (
        <p style={{
          fontSize: 13, color: 'var(--text-secondary)',
          lineHeight: 1.5, marginBottom: 14,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {incident.description}
        </p>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginTop: 'auto',
        paddingTop: 12, borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 12 }}>
          <User size={12} />
          {incident.assigne
            ? `${incident.assigne.prenom} ${incident.assigne.nom}`
            : 'Non assigné'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 12 }}>
          <Clock size={12} />
          {new Date(incident.created_at).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  )
}