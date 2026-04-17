export default function FatigueGauge({ score = 0, risk = { level: 'Safe', color: '#1D9E75' } }) {
  const clamp = Math.min(100, Math.max(0, score));

  return (
    <div style={{
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      border: `1px solid ${risk.color}44`,
      borderRadius: '12px', padding: '1rem 1.5rem',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      minWidth: '160px',
    }}>
      {/* Circular gauge */}
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r="40" fill="none"
          stroke="#1e2a1e" strokeWidth="10" />
        {/* Progress */}
        <circle cx="50" cy="50" r="40" fill="none"
          stroke={risk.color} strokeWidth="10"
          strokeDasharray={`${(clamp / 100) * 251.2} 251.2`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.4s ease' }}
        />
        {/* Score text */}
        <text x="50" y="46" textAnchor="middle"
          fill="#fff" fontSize="20" fontWeight="700">
          {clamp}
        </text>
        <text x="50" y="62" textAnchor="middle"
          fill="#888" fontSize="10">
          /100
        </text>
      </svg>

      {/* Risk badge */}
      <span style={{
        background: risk.color + '22', color: risk.color,
        padding: '3px 12px', borderRadius: '20px',
        fontSize: '12px', fontWeight: 600,
      }}>
        {risk.level}
      </span>

      <span style={{ color: '#555', fontSize: '11px' }}>Fatigue Score</span>
    </div>
  );
}