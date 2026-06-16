export default function StatCard({ icon, label, value, color = '#3b82f6', delta }) {
  return (
    <div className="fade-up" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      display: 'flex', flexDirection: 'column', gap: 14,
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow var(--transition), transform var(--transition)',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0,
        }}>
          {icon}
        </div>
        {delta !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 7px',
            borderRadius: 'var(--radius-full)',
            color: delta >= 0 ? '#22c55e' : '#ef4444',
            background: delta >= 0 ? '#f0fdf4' : '#fef2f2',
          }}>
            {delta >= 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <div>
        <div style={{
          fontSize: 26, fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)', lineHeight: 1,
        }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}