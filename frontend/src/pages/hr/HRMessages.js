import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI';
import { colors, font } from '../../lib/styles';

function timeAgo(date) {
  if (!date) return '';
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function HRMessages() {
  const { threadId } = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [threads,    setThreads]    = useState([]);
  const [active,     setActive]     = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [reply,      setReply]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [threadLoad, setThreadLoad] = useState(false);
  const [search,     setSearch]     = useState('');
  const msgEndRef = useRef(null);

  const fetchThreads = async () => {
    const { data } = await api.get('/messages/threads');
    setThreads(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchThreads(); }, []);

  useEffect(() => {
    if (threadId) openThread(threadId);
  }, [threadId]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openThread = async (id) => {
    setThreadLoad(true);
    navigate(`/hr/messages/${id}`, { replace: true });
    try {
      const { data } = await api.get(`/messages/threads/${id}`);
      setActive(data.thread);
      setMessages(data.messages || []);
      setThreads(ts => ts.map(t => t.id === id ? { ...t, unread_count: '0' } : t));
    } finally { setThreadLoad(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      await api.post(`/messages/threads/${active.id}/reply`, { body: reply });
      setReply('');
      const { data } = await api.get(`/messages/threads/${active.id}`);
      setMessages(data.messages || []);
      fetchThreads();
    } finally { setSending(false); }
  };

  const filtered = threads.filter(t =>
    !search ||
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.participant_names?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = threads.reduce((n, t) => n + (parseInt(t.unread_count) || 0), 0);

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '20px 36px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/hr')}
              style={{ background: 'none', border: 'none', color: colors.orange, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: font.body, display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Dashboard
            </button>
            <span style={{ color: '#ddd' }}>|</span>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>HR Portal</p>
              <h1 style={{ fontFamily: font.display, fontSize: 24, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>
                Messages {totalUnread > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: colors.orange, borderRadius: 10, padding: '2px 8px', marginLeft: 8, fontFamily: font.body, fontStyle: 'normal' }}>
                    {totalUnread}
                  </span>
                )}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 36px', display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start', height: 'calc(100vh - 120px)' }}>

        {/* Thread list */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Search */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', borderRadius: 10, padding: '8px 12px' }}>
              <span style={{ fontSize: 14, color: colors.faint }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: 13.5, color: colors.dark, fontFamily: font.body }}/>
            </div>
          </div>

          {/* Thread items */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24 }}><Spinner/></div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: colors.dark, marginBottom: 6 }}>No messages yet</p>
                <p style={{ fontSize: 13, color: colors.muted, lineHeight: 1.5 }}>
                  Conversations are automatically created when you approve or reject a booking.
                </p>
              </div>
            ) : filtered.map(t => {
              const unread  = parseInt(t.unread_count) || 0;
              const isOpen  = active?.id === t.id;
              return (
                <div key={t.id} onClick={() => openThread(t.id)}
                  style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                    background: isOpen ? colors.orangeLight : unread > 0 ? '#FFFBF7' : '#fff',
                    borderLeft: isOpen ? `3px solid ${colors.orange}` : '3px solid transparent',
                    transition: 'background 0.1s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <p style={{ fontSize: 13.5, fontWeight: unread > 0 ? 700 : 600,
                      color: isOpen ? colors.orange : colors.dark, flex: 1, marginRight: 8,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.subject || 'Booking conversation'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {unread > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: colors.orange, color: '#fff', borderRadius: 8, padding: '1px 6px' }}>
                          {unread}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: colors.faint }}>{timeAgo(t.last_message_at)}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: colors.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                    {t.participant_names || 'Employee'}
                  </p>
                  {t.last_message && (
                    <p style={{ fontSize: 12, color: colors.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.last_message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Message thread */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {!active ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: colors.muted }}>
              <span style={{ fontSize: 48 }}>💬</span>
              <p style={{ fontSize: 15, fontWeight: 600, color: colors.dark }}>Select a conversation</p>
              <p style={{ fontSize: 13, color: colors.muted }}>Choose a thread from the left to read and reply</p>
            </div>
          ) : threadLoad ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner/></div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '16px 22px', borderBottom: '1px solid #eee', background: '#FAFAFA' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>
                  {active.subject || 'Booking conversation'}
                </h2>
                <p style={{ fontSize: 12.5, color: colors.muted }}>
                  {active.participant_names || 'Conversation'}
                  {active.booking_id && <span style={{ marginLeft: 8, color: colors.orange, fontWeight: 600 }}>· Booking #{active.booking_id.slice(0,8)}</span>}
                </p>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {messages.length === 0 ? (
                  <p style={{ color: colors.muted, fontSize: 13.5, textAlign: 'center', marginTop: 40 }}>No messages in this thread yet.</p>
                ) : messages.map(m => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isMe ? colors.dark : '#F7F5F2',
                        color: isMe ? '#fff' : colors.dark,
                      }}>
                        <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{m.body}</p>
                      </div>
                      <p style={{ fontSize: 11, color: colors.faint, marginTop: 3, paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
                        {m.sender_name} · {timeAgo(m.created_at)}
                      </p>
                    </div>
                  );
                })}
                <div ref={msgEndRef}/>
              </div>

              {/* Reply */}
              <div style={{ padding: '14px 22px', borderTop: '1px solid #eee', background: '#FAFAFA', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type your reply… (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  style={{ flex: 1, border: '1.5px solid #eee', borderRadius: 12, padding: '10px 14px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', resize: 'none', background: '#fff', lineHeight: 1.5 }}/>
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  style={{ background: sending || !reply.trim() ? '#eee' : colors.dark, color: sending || !reply.trim() ? colors.muted : '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: sending || !reply.trim() ? 'default' : 'pointer', fontFamily: font.body, flexShrink: 0, transition: 'background 0.15s' }}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
