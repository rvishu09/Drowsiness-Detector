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

  useEffect(() => {
    getSessions()
      .then(r => setSessions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
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

  // Line chart data
  const lineData = {
    labels: sessions.map(s => new Date(s.startTime).toLocaleDateString()),
    datasets: [{
      label: 'Peak Fatigue Score',
      data: sessions.map(s => s.peakScore || 0),
      borderColor: '#1D9E75',
      backgroundColor: 'rgba(29,158,117,0.08)',
      tension: 0.4, fill: true,
      pointBackgroundColor: '#1D9E75',
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
          <Link to="/detection" style={styles.startBtn}>
            Start Detection →
          </Link>
        </div>

        {/* Stat cards */}
        <div style={styles.grid4}>
          <StatCard label="Total Sessions" value={sessions.length} icon="📋" />
          <StatCard label="Total Alerts"   value={totalAlerts}     icon="🚨" color="#A32D2D" />
          <StatCard label="Avg Peak Score" value={avgPeak}         icon="📊" color={avgPeak >= 60 ? '#A32D2D' : avgPeak >= 30 ? '#BA7517' : '#1D9E75'} />
          <StatCard label="Total Drive (min)" value={totalMins}    icon="🕐" color="#5DCAA5" />
        </div>

        {/* Charts */}
        {loading ? (
          <div style={styles.loadingBox}>Loading session data...</div>
        ) : sessions.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={{ color: '#666', marginBottom: '1rem' }}>No sessions yet. Start your first detection!</p>
            <Link to="/detection" style={styles.startBtn}>Go to Detection</Link>
          </div>
        ) : (
          <>
            <div style={styles.grid2}>
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Fatigue Score Over Time</h3>
                <Line data={lineData} options={chartOptions} />
              </div>
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Risk Distribution</h3>
                <Doughnut data={doughnutData}
                  options={{ plugins: { legend: { labels: { color: '#888' } } } }} />
              </div>
            </div>

            {/* Session history table */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Session History</h3>
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
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:       { background: '#0a0e0a', minHeight: 'calc(100vh - 60px)', padding: '2rem 1rem' },
  container:  { maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:      { color: '#fff', fontSize: '22px', fontWeight: 600, margin: 0 },
  sub:        { color: '#666', fontSize: '14px', marginTop: '4px' },
  startBtn:   { background: '#1D9E75', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 },
  grid4:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  chartCard:  { background: '#0f1117', border: '1px solid #1e2a1e', borderRadius: '12px', padding: '1.5rem' },
  chartTitle: { color: '#ccc', fontSize: '14px', fontWeight: 500, marginBottom: '1rem' },
  loadingBox: { color: '#666', textAlign: 'center', padding: '3rem' },
  emptyBox:   { textAlign: 'center', padding: '3rem', background: '#0f1117', border: '1px solid #1e2a1e', borderRadius: '12px' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { color: '#555', fontSize: '12px', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #1e2a1e', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr:         { borderBottom: '1px solid #111' },
  td:         { color: '#aaa', fontSize: '13px', padding: '10px 12px' },
  badge:      { padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 },
};