import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../lib/api';
import { colors, font } from '../lib/styles';

export default function Nav() {
  const { user, logout } = useAuth();
  const { items: cartItems } = useCart();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [notifs,     setNotifs]     = useState([]);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [msgOpen,    setMsgOpen]    = useState(false);
  const [threads,    setThreads]    = useState([]);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [userOpen,   setUserOpen]   = useState(false);
  const notifRef = useRef(null);
  const msgRef   = useRef(null);
  const userRef  = useRef(null);

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data);
    } catch {}
  };

  const fetchMsgCount = async () => {
    try {
      const { data } = await api.get('/messages/unread-count');
      setUnreadMsgs(data.count || 0);
    } catch {}
  };

  const fetchThreads = async () => {
    try {
      const { data } = await api.get('/messages/threads');
      setThreads(data);
    } catch {}
  };

  // Initial fetch + polling every 30s
  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    fetchMsgCount();
    const interval = setInterval(() => { fetchNotifs(); fetchMsgCount(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (msgRef.current   && !msgRef.current.contains(e.target))   setMsgOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const openMsgDropdown = () => {
    setMsgOpen(o => !o);
    setNotifOpen(false);
    setUserOpen(false);
    if (!msgOpen) fetchThreads();
  };

  const openNotifDropdown = () => {
    setNotifOpen(o => !o);
    setMsgOpen(false);
    setUserOpen(false);
  };

  const unread = notifs.filter(n => !n.read).length;

  // Nav links by role
  const navLinks = {
    hr: [
      { to: '/hr',               label: 'Dashboard'     },
      { to: '/hr/adventures',    label: 'Adventures'    },
      { to: '/hr/employees',     label: 'Employees'     },
      { to: '/hr/marketplace',   label: 'Marketplace'   },
      { to: '/hr/analytics',     label: 'Analytics'     },
      { to: '/hr/integrations',  label: 'Integrations'  },
    ],
    employee: [
      { to: '/home',       label: 'Home'      },
      { to: '/marketplace',label: 'Explore'   },
      { to: '/my-booking', label: 'My Booking'},
      { to: '/allowance',  label: 'Allowance' },
    ],
    vendor: [
      { to: '/vendor',          label: 'Dashboard' },
      { to: '/vendor/packages', label: 'Packages'  },
      { to: '/vendor/bookings', label: 'Bookings'  },
      { to: '/vendor/earnings', label: 'Earnings'  },
    ],
  };

  const links = navLinks[user?.role] || [];
  const isActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to) && to !== '/hr' || location.pathname === to);

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: '#fff', borderBottom: '1px solid #eee', fontFamily: font.body }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', gap: 0 }}>

        {/* Logo */}
        <Link to="/" style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: colors.dark, textDecoration: 'none', marginRight: 32, flexShrink: 0 }}>
          Sabba
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {links.map(({ to, label }) => {
            const active = location.pathname === to || (to.length > 4 && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to} style={{
                fontSize: 13.5, fontWeight: active ? 700 : 500,
                color: active ? colors.orange : colors.mid,
                textDecoration: 'none', padding: '6px 12px', borderRadius: 8,
                background: active ? colors.orangeLight : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.target.style.background = '#F7F5F2'; }}
              onMouseLeave={e => { if (!active) e.target.style.background = 'transparent'; }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {/* Cart (employees only) */}
          {user?.role === 'employee' && (
            <button onClick={() => navigate('/cart')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', color: colors.mid }}
              onMouseEnter={e => e.currentTarget.style.background='#F7F5F2'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {cartItems?.length > 0 && (
                <span style={{ position: 'absolute', top: 3, right: 5, background: colors.orange, color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartItems.length}
                </span>
              )}
            </button>
          )}

          {/* Messages icon */}
          <div ref={msgRef} style={{ position: 'relative' }}>
            <button onClick={openMsgDropdown} style={{ position: 'relative', background: msgOpen ? colors.orangeLight : 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', color: msgOpen ? colors.orange : colors.mid, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!msgOpen) e.currentTarget.style.background='#F7F5F2'; }}
              onMouseLeave={e => { if (!msgOpen) e.currentTarget.style.background = msgOpen ? colors.orangeLight : 'transparent'; }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {unreadMsgs > 0 && (
                <span style={{ position: 'absolute', top: 3, right: 5, background: colors.blue, color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadMsgs > 9 ? '9+' : unreadMsgs}
                </span>
              )}
            </button>

            {msgOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 360, background: '#fff', border: '1px solid #eee', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 300 }}>
                <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Messages</p>
                  <button onClick={() => { navigate('/messages'); setMsgOpen(false); }} style={{ fontSize: 12, color: colors.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: font.body }}>
                    Open inbox →
                  </button>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {threads.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>No messages yet</p>
                      <p style={{ fontSize: 12, color: colors.muted }}>Start a conversation below</p>
                    </div>
                  ) : threads.slice(0, 6).map(t => {
                    const hasUnread = parseInt(t.unread_count) > 0;
                    return (
                      <div key={t.id} onClick={() => { navigate(`/messages/${t.id}`); setMsgOpen(false); }}
                        style={{ padding: '12px 18px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', background: hasUnread ? colors.blueLight : 'transparent', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#F7F5F2'}
                        onMouseLeave={e => e.currentTarget.style.background = hasUnread ? colors.blueLight : 'transparent'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <p style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 600, color: colors.dark }}>{t.subject}</p>
                          <p style={{ fontSize: 10.5, color: colors.faint }}>{new Date(t.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        {t.last_message && (
                          <p style={{ fontSize: 12, color: colors.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <strong>{t.last_message.sender_name?.split(' ')[0]}:</strong> {t.last_message.body}
                          </p>
                        )}
                        {hasUnread && (
                          <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, color: colors.blue, background: colors.blueLight, borderRadius: 4, padding: '1px 6px' }}>
                            {t.unread_count} new
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: '12px 18px', borderTop: '1px solid #eee' }}>
                  <button onClick={() => { navigate('/messages/new'); setMsgOpen(false); }}
                    style={{ width: '100%', background: colors.dark, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                    + New message
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={openNotifDropdown} style={{ position: 'relative', background: notifOpen ? colors.orangeLight : 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', color: notifOpen ? colors.orange : colors.mid, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!notifOpen) e.currentTarget.style.background='#F7F5F2'; }}
              onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.background = notifOpen ? colors.orangeLight : 'transparent'; }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unread > 0 && (
                <span style={{ position: 'absolute', top: 3, right: 5, background: colors.orange, color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 340, background: '#fff', border: '1px solid #eee', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 300 }}>
                <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Notifications {unread > 0 && <span style={{ fontSize: 11, background: colors.orangeLight, color: colors.orange, borderRadius: 6, padding: '2px 7px', marginLeft: 6, fontWeight: 700 }}>{unread} new</span>}</p>
                  {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: colors.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: font.body }}>Mark all read</button>}
                </div>
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>You're all caught up</p>
                      <p style={{ fontSize: 12, color: colors.muted }}>No notifications yet</p>
                    </div>
                  ) : notifs.slice(0, 10).map(n => (
                    <div key={n.id} onClick={() => markRead(n.id)}
                      style={{ padding: '12px 18px', borderBottom: '1px solid #f5f5f5', background: n.read ? 'transparent' : colors.orangeLight, cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#F7F5F2'}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : colors.orangeLight}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: colors.dark }}>{n.title}</p>
                        {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.orange, flexShrink: 0, marginTop: 4 }}/>}
                      </div>
                      <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.4 }}>{n.message}</p>
                      <p style={{ fontSize: 10.5, color: colors.faint, marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <button onClick={() => { setUserOpen(o => !o); setNotifOpen(false); setMsgOpen(false); }}
              style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', marginLeft: 4 }}>
              {initials}
            </button>

            {userOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 300 }}>
                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #eee' }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{user?.full_name}</p>
                  <p style={{ fontSize: 11.5, color: colors.muted, marginTop: 2 }}>{user?.email}</p>
                  <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, color: colors.orange, background: colors.orangeLight, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
                {user?.role === 'employee' && (
                  <button onClick={() => { navigate('/profile'); setUserOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, color: colors.mid, fontFamily: font.body }}
                    onMouseEnter={e => e.currentTarget.style.background='#F7F5F2'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    My profile
                  </button>
                )}
                {user?.role === 'vendor' && (
                  <button onClick={() => { navigate('/vendor/profile'); setUserOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, color: colors.mid, fontFamily: font.body }}
                    onMouseEnter={e => e.currentTarget.style.background='#F7F5F2'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    Vendor profile
                  </button>
                )}
                <button onClick={() => { navigate('/messages'); setUserOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, color: colors.mid, fontFamily: font.body, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background='#F7F5F2'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  Messages
                  {unreadMsgs > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: colors.blue, background: colors.blueLight, borderRadius: 5, padding: '2px 7px' }}>{unreadMsgs}</span>}
                </button>
                <div style={{ borderTop: '1px solid #eee' }}>
                  <button onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, color: colors.red, fontFamily: font.body }}
                    onMouseEnter={e => e.currentTarget.style.background='#F7F5F2'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #eee', padding: '10px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: colors.muted, zIndex: 100, fontFamily: font.body }}>
      <span style={{ fontFamily: font.display, fontSize: 13, fontStyle: 'italic', color: colors.dark }}>Sabba</span>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <Link to="/contact" style={{ color: colors.muted, textDecoration: 'none' }}>Contact</Link>
        <Link to="/faq" style={{ color: colors.muted, textDecoration: 'none' }}>FAQ</Link>
        <Link to="/messages" style={{ color: colors.muted, textDecoration: 'none' }}>Messages</Link>
      </div>
      <span>© 2025 Sabba Platform Ltd</span>
    </div>
  );
}
