const config = {
  statut: {
    en_attente: { label: 'En attente', color: '#a16207', bg: '#fef3c7' },
    ouvert:   { label: 'Ouvert',   color: '#3b82f6', bg: '#eff6ff' },
    en_cours: { label: 'En cours', color: '#f59e0b', bg: '#fffbeb' },
    resolu:   { label: 'Résolu',   color: '#22c55e', bg: '#f0fdf4' },
    ferme:    { label: 'Fermé',    color: '#94a3b8', bg: '#f1f5f9' },
    annule:   { label: 'Annulé',   color: '#94a3b8', bg: '#f1f5f9' },
  },
  priorite: {
    faible:   { label: 'Faible',   color: '#22c55e', bg: '#f0fdf4' },
    moyenne:  { label: 'Moyenne',  color: '#3b82f6', bg: '#eff6ff' },
    haute:    { label: 'Haute',    color: '#f59e0b', bg: '#fffbeb' },
    critique: { label: 'Critique', color: '#ef4444', bg: '#fef2f2' },
  }
}

export default function Badge({ statut, priorite, size = 'sm' }) {
  const type = statut ? 'statut' : 'priorite'
  const key = statut || priorite
  const item = config[type][key] || { label: key, color: '#94a3b8', bg: '#f1f5f9' }
  const fontSize = size === 'sm' ? 11 : 12
  const padding = size === 'sm' ? '2px 8px' : '4px 10px'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding, borderRadius: 'var(--radius-full)',
      fontSize, fontWeight: 600, letterSpacing: '0.02em',
      color: item.color, background: item.bg,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
      {item.label}
    </span>
  )
}
