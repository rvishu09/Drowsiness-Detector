import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: '60px',
      background: '#0f1117', borderBottom: '1px solid #1e2a1e',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{
        color: '#1D9E75', fontWeight: 700, fontSize: '18px',
        textDecoration: 'none', letterSpacing: '0.5px',
      }}>
        👁 DrowsyGuard
      </Link>

      {/* Nav links */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
            Dashboard
          </NavLink>
          <NavLink to="/detection" active={location.pathname === '/detection'}>
            Start Detection
          </NavLink>
          <span style={{ color: '#555', fontSize: '13px' }}>
            Hi, {user.name}
          </span>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid #333',
            color: '#aaa', padding: '6px 14px', borderRadius: '6px',
            cursor: 'pointer', fontSize: '13px',
          }}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      color: active ? '#1D9E75' : '#888',
      textDecoration: 'none', fontSize: '14px', fontWeight: active ? 500 : 400,
      borderBottom: active ? '2px solid #1D9E75' : '2px solid transparent',
      paddingBottom: '2px', transition: 'color 0.2s',
    }}>
      {children}
    </Link>
  );
}