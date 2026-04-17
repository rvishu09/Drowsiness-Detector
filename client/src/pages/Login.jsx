import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { toast } from 'react-toastify';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.user, res.data.token);
      toast.success('Welcome back, ' + res.data.user.name);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Sign In</h2>
        <p style={styles.sub}>Welcome back to DrowsyGuard</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="Email" name="email" type="email"
            value={form.email} onChange={handleChange} />
          <Field label="Password" name="password" type="password"
            value={form.password} onChange={handleChange} />

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>Register</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, name, type, value, onChange }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={styles.label}>{label}</label>
      <input
        name={name} type={type} value={value}
        onChange={onChange} required
        style={styles.input}
        placeholder={`Enter your ${label.toLowerCase()}`}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 60px)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#0a0e0a',
  },
  card: {
    background: '#0f1117', border: '1px solid #1e2a1e',
    borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '400px',
  },
  title: { color: '#fff', fontSize: '22px', fontWeight: 600, marginBottom: '6px' },
  sub: { color: '#666', fontSize: '14px', marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column' },
  label: { display: 'block', color: '#888', fontSize: '13px', marginBottom: '6px' },
  input: {
    width: '100%', padding: '10px 14px', background: '#1a1f1a',
    border: '1px solid #2a3a2a', borderRadius: '8px',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },
  btn: {
    marginTop: '0.5rem', padding: '11px', background: '#1D9E75',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '15px', fontWeight: 600, cursor: 'pointer',
  },
  footer: { color: '#666', fontSize: '13px', textAlign: 'center', marginTop: '1.5rem' },
  link: { color: '#1D9E75', textDecoration: 'none' },
};