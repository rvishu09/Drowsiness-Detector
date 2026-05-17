import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, LineElement, PointElement,
  LinearScale, CategoryScale, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import StatCard from '../components/StatCard';
import { getSessions } from '../services/api';

ChartJS.register(
  LineElement, PointElement, LinearScale,
  CategoryScale, ArcElement, Tooltip, Legend, Filler
);

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSessions = () => {
    setLoading(true);
    setError('');
    getSessions()
      .then(r => setSessions(r.data))
      .catch(err => {
        console.error(err);
        setError('Failed to load sessions. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const totalAlerts = sessions.reduce((a, s) => a + (s.alertCount || 0), 0);
  const avgPeak = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.peakScore || 0), 0) / sessions.length)
    : 0;

  const totalDuration = sessions.reduce((a, s) => {
    if (s.startTime && s.endTime) {
      return a + (new Date(s.endTime) - new Date(s.startTime));
    }
    return a;
  }, 0);
  const totalMins = Math.round(totalDuration / 60000);

  // Line chart — most recent 10 sessions, oldest first for a left→right trend
  const chartSessions = [...sessions].reverse().slice(-10);

  const lineData = {
    labels: chartSessions.map(s =>
      new Date(s.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Peak Fatigue Score',
      data: chartSessions.map(s => s.peakScore || 0),
      borderColor: '#1D9E75',
      backgroundColor: 'rgba(29,158,117,0.08)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#1D9E75',
      pointRadius: 4,
    }],
  };

  // Doughnut data
  const safeCount     = sessions.filter(s => (s.peakScore || 0) < 30).length;
  const moderateCount = sessions.filter(s => (s.peakScore || 0) >= 30 && (s.peakScore || 0) < 60).length;
  const highCount     = sessions.filter(s => (s.peakScore || 0) >= 60).length;

  const doughnutData = {
    labels: ['Safe', 'Moderate', 'High Risk'],
    datasets: [{
      data: [safeCount, moderateCount, highCount],
      backgroundColor: ['#1D9E75', '#BA7517', '#A32D2D'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: '#888' } } },
    scales: {
      x: { ticks: { color: '#666' }, grid: { color: '#1e2a1e' } },
      y: { ticks: { color: '#666' }, grid: { color: '#1e2a1e' }, min: 0, max: 100 },
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Fatigue Dashboard</h1>
            <p style={styles.sub}>Overview of all your detection sessions</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={fetchSessions} style={styles.refreshBtn} disabled={loading}>
              {loading ? '⟳ Loading...' : '⟳ Refresh'}
            </button>
            <Link to="/detection" style={styles.startBtn}>
              Start Detection →
            </Link>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={styles.errorBox}>
            {error}
            <button onClick={fetchSessions} style={styles.retryBtn}>Retry</button>
          </div>
        )}

        {/* Stat cards */}
        <div style={styles.grid4}>
          <StatCard label="Total Sessions"    value={sessions.length} icon="📋" />
          <StatCard label="Total Alerts"      value={totalAlerts}     icon="🚨" color="#A32D2D" />
          <StatCard label="Avg Peak Score"    value={sessions.length ? avgPeak : '—'} icon="📊"
            color={avgPeak >= 60 ? '#A32D2D' : avgPeak >= 30 ? '#BA7517' : '#1D9E75'} />
          <StatCard label="Total Drive (min)" value={totalMins || '—'} icon="🕐" color="#5DCAA5" />
        </div>

        {/* Charts */}
        {loading ? (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            Loading session data...
          </div>
        ) : sessions.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📋</div>
            <p style={{ color: '#888', marginBottom: '0.5rem', fontSize: '16px', fontWeight: 500 }}>
              No sessions yet
            </p>
            <p style={{ color: '#555', marginBottom: '1.5rem', fontSize: '14px' }}>
              Complete your first detection to see your fatigue history here.
            </p>
            <Link to="/detection" style={styles.startBtn}>Go to Detection</Link>
          </div>
        ) : (
          <>
            {/* Responsive chart grid */}
            <div style={styles.grid2}>
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Fatigue Score Over Time</h3>
                <Line data={lineData} options={chartOptions} />
              </div>
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Risk Distribution</h3>
                <div style={{ maxWidth: '240px', margin: '0 auto' }}>
                  <Doughnut
                    data={doughnutData}
                    options={{ plugins: { legend: { labels: { color: '#888' } } } }}
                  />
                </div>
                {/* Risk legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                  {[['#1D9E75', 'Safe', safeCount], ['#BA7517', 'Moderate', moderateCount], ['#A32D2D', 'High', highCount]]
                    .map(([color, label, count]) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ color, fontWeight: 700, fontSize: '20px' }}>{count}</div>
                        <div style={{ color: '#555', fontSize: '11px' }}>{label}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Session history table */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>
                Session History
                <span style={{ color: '#444', fontSize: '12px', fontWeight: 400, marginLeft: '8px' }}>
                  (most recent {sessions.length})
                </span>
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Date', 'Start Time', 'Duration', 'Peak Score', 'Alerts', 'Risk'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => {
                      const start    = new Date(s.startTime);
                      const duration = s.endTime
                        ? Math.round((new Date(s.endTime) - start) / 60000) + ' min'
                        : '—';
                      const peak  = s.peakScore || 0;
                      const color = peak >= 60 ? '#A32D2D' : peak >= 30 ? '#BA7517' : '#1D9E75';
                      const risk  = peak >= 60 ? 'High' : peak >= 30 ? 'Moderate' : 'Safe';
                      return (
                        <tr key={i} style={styles.tr}>
                          <td style={styles.td}>{start.toLocaleDateString()}</td>
                          <td style={styles.td}>{start.toLocaleTimeString()}</td>
                          <td style={styles.td}>{duration}</td>
                          <td style={styles.td}><strong style={{ color }}>{peak}</strong></td>
                          <td style={styles.td}>{s.alertCount || 0}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, background: color + '22', color }}>
                              {risk}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:       { background: '#0a0e0a', minHeight: 'calc(100vh - 60px)', padding: '2rem 1rem' },
  container:  { maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' },
  title:      { color: '#fff', fontSize: '22px', fontWeight: 600, margin: 0 },
  sub:        { color: '#666', fontSize: '14px', marginTop: '4px' },
  startBtn:   { background: '#1D9E75', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 },
  refreshBtn: { background: 'transparent', color: '#888', padding: '10px 16px', borderRadius: '8px', border: '1px solid #2a3a2a', fontSize: '14px', cursor: 'pointer' },
  errorBox:   { background: '#7f1d1d22', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '12px 16px', color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  retryBtn:   { background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' },
  grid4:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  grid2:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' },
  chartCard:  { background: '#0f1117', border: '1px solid #1e2a1e', borderRadius: '12px', padding: '1.5rem' },
  chartTitle: { color: '#ccc', fontSize: '14px', fontWeight: 500, marginBottom: '1rem', marginTop: 0 },
  loadingBox: { color: '#555', textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  spinner:    { width: '28px', height: '28px', border: '3px solid #1e2a1e', borderTop: '3px solid #1D9E75', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyBox:   { textAlign: 'center', padding: '3rem', background: '#0f1117', border: '1px solid #1e2a1e', borderRadius: '12px' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { color: '#555', fontSize: '12px', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #1e2a1e', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  tr:         { borderBottom: '1px solid #111' },
  td:         { color: '#aaa', fontSize: '13px', padding: '10px 12px', whiteSpace: 'nowrap' },
  badge:      { padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 },
};