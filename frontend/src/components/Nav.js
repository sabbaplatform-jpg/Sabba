import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors, font } from '../lib/styles';

const navMap = {
  hr:       [{ to: '/hr',              label: 'Dashboard'   }, { to: '/marketplace', label: 'Marketplace' }],
  employee: [{ to: '/home',            label: 'Home'        }, { to: '/marketplace', label: 'Explore'     }, { to: '/my-booking', label: 'My Booking' }],
  vendor:   [{ to: '/vendor',          label: 'Dashboard'   }, { to: '/vendor/packages', label: 'My Packages' }, { to: '/vendor/bookings', label: 'Bookings' }],
};

export default function Nav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user) return null;

  const initials = user.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  return (
    <header style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`,
      padding: '0 40px', height: 64, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #e06c2a, #f5a66d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, fontFamily: font.display, fontStyle: 'italic' }}>S</span>
          </div>
          <span style={{ fontFamily: font.display, fontSize: 20, color: colors.dark, letterSpacing: '-0.3px' }}>sabba</span>
        </Link>
        <nav style={{ display: 'flex', gap: 2 }}>
          {(navMap[user.role] || []).map(item => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <Link key={item.to} to={item.to} style={{
                padding: '6px 13px', borderRadius: 6, textDecoration: 'none',
                fontSize: 13.5, fontWeight: active ? 600 : 400,
                color: active ? colors.orange : colors.mid,
                background: active ? colors.orangeLight : 'transparent',
                transition: 'all 0.12s',
              }}>{item.label}</Link>
            );
          })}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: colors.faint, fontWeight: 500 }}>{user.role.toUpperCase()}</span>
        <div style={{ width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
          background: 'linear-gradient(135deg, #e06c2a, #f5a66d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { logout(); navigate('/login'); }}
          title="Click to logout">
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{initials}</span>
        </div>
      </div>
    </header>
  );
}
