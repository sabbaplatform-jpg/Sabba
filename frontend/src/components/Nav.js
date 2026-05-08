import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors, font } from '../lib/styles';
import api from '../lib/api';

const navMap = {
  hr: [
    { to: '/hr',                label: 'Dashboard'    },
    { to: '/hr/employees',      label: 'Employees'    },
    { to: '/hr/adventures',     label: 'Adventures'   },
    { to: '/hr/marketplace',    label: 'Marketplace'  },
    { to: '/hr/analytics',      label: 'Analytics'    },
    { to: '/hr/integrations',   label: 'Integrations' },
  ],
  employee: [
    { to: '/home',        label: 'Home'       },
    { to: '/marketplace', label: 'Explore'    },
    { to: '/my-booking',  label: 'My Booking' },
    { to: '/profile',     label: 'Profile'    },
  ],
  vendor: [
    { to: '/vendor',           label: 'Dashboard'   },
    { to: '/vendor/packages',  label: 'Packages'    },
    { to: '/vendor/bookings',  label: 'Bookings'    },
    { to: '/vendor/earnings',  label: 'Earnings'    },
    { to: '/vendor/profile',   label: 'Profile'     },
  ],
};

export default function Nav({ loading }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifsRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
    }
  }, [user, location.pathname]);

  useEffect(() => {
    function handleClick(e) {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const unread = notifications.filter(n => !n.read).length;
  const initials = user.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  return (
    <>
      {/* Loading bar */}
      {loading && <div className="loader-bar"/>}

      <header style={{
        background: 'rgba(240,238,235,0.85)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: font.display, fontSize: 22, color: colors.dark, letterSpacing: '-0.5px', fontWeight: 400 }}>
              <strong style={{ fontWeight: 700 }}>Sabba</strong>
            </span>
          </Link>

          <nav style={{ display: 'flex', gap: 2 }}>
            {(navMap[user.role] || []).map(item => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to} className="nav-link" style={{
                  padding: '6px 13px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 13.5, fontWeight: active ? 700 : 500,
                  color: active ? colors.orange : colors.mid,
                  background: active ? colors.orangeLight : 'transparent',
                }}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Notifications */}
          <div ref={notifsRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifs(v => !v)} style={{
              width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'background 0.15s',
            }}>
              <svg width="16" height="16" fill="none" stroke={colors.mid} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread > 0 && (
                <div className="notif-dot" style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8,
                  borderRadius: '50%', background: colors.orange, border: '2px solid #f0eeeb' }}/>
              )}
            </button>

            {showNotifs && (
              <div style={{ position: 'absolute', right: 0, top: 46, width: 340, background: '#fff',
                border: '1px solid rgba(0,0,0,0.1)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.15)', zIndex: 200 }}>
                <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Notifications</span>
                  {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: colors.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: font.body }}>Mark all read</button>}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: colors.muted, fontSize: 13.5 }}>No notifications</div>
                  ) : notifications.map(n => (
                    <div key={n.id} onClick={() => markRead(n.id)} style={{
                      padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.05)',
                      background: n.read ? 'transparent' : 'rgba(224,108,42,0.04)',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(224,108,42,0.04)'}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? colors.border : colors.orange, marginTop: 5, flexShrink: 0 }}/>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 2 }}>{n.title}</p>
                          <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.4 }}>{n.message}</p>
                          <p style={{ fontSize: 11, color: colors.faint, marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'background 0.15s',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 7,
                background: 'linear-gradient(135deg, #e06c2a, #f5a66d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{initials}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{user.full_name?.split(' ')[0]}</span>
              <svg width="12" height="12" fill="none" stroke={colors.muted} strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {showUserMenu && (
              <div style={{ position: 'absolute', right: 0, top: 46, width: 200, background: '#fff',
                border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, boxShadow: '0 12px 36px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>{user.full_name}</p>
                  <p style={{ fontSize: 11.5, color: colors.muted, marginTop: 2 }}>{user.role.toUpperCase()}</p>
                </div>
                {[
                  user.role === 'employee' && { label: 'My Profile', to: '/profile' },
                  user.role === 'vendor' && { label: 'Vendor Profile', to: '/vendor/profile' },
                ].filter(Boolean).map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setShowUserMenu(false)} style={{ display: 'block', padding: '11px 16px', fontSize: 13.5, fontWeight: 500, color: colors.dark, textDecoration: 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {item.label}
                  </Link>
                ))}
                <button onClick={() => { logout(); navigate('/login'); setShowUserMenu(false); }} style={{
                  width: '100%', textAlign: 'left', padding: '11px 16px', fontSize: 13.5,
                  fontWeight: 500, color: colors.red, background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: font.body, borderTop: '1px solid rgba(0,0,0,0.06)',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = colors.redLight}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
