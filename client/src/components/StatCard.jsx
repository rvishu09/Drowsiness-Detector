export default function StatCard({ label, value, color = '#1D9E75', icon }) {
  return (
    <div style={{
      background: '#0f1117', border: '1px solid #1e2a1e',
      borderRadius: '12px', padding: '1.25rem 1.5rem',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <span style={{ fontSize: '13px', color: '#666' }}>{icon} {label}</span>
      <span style={{ fontSize: '28px', fontWeight: 700, color }}>
        {value ?? '—'}
      </span>
    </div>
  );
}