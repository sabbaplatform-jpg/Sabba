import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, Button, Avatar, EmptyState } from '../components/UI';
import { colors, font } from '../lib/styles';

// ── Messages Inbox ────────────────────────────────────────────
export default function Messages() {
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
  const [showNew,    setShowNew]    = useState(false);
  const msgEndRef = useRef(null);

  const fetchThreads = async () => {
    try {
      const { data } = await api.get('/messages/threads');
      setThreads(data);
    } finally { setLoading(false); }
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
    navigate(`/messages/${id}`, { replace: true });
    try {
      const { data } = await api.get(`/messages/threads/${id}`);
      setActive(data.thread);
      setMessages(data.messages);
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
      setMessages(data.messages);
      fetchThreads();
    } finally { setSending(false); }
  };

  const otherParticipants = active?.participants?.filter(p => p.id !== user?.id) || [];

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '20px 40px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Inbox</p>
            <h1 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Messages</h1>
          </div>
          <Button onClick={() => setShowNew(true)}>+ New message</Button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 40px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, height: 'calc(100vh - 160px)' }}>

        {/* Thread list */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>All threads</p>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? <Spinner/> : threads.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>No messages yet</p>
                <p style={{ fontSize: 12, color: colors.muted }}>Start a new conversation</p>
              </div>
            ) : threads.map(t => {
              const isActive = active?.id === t.id;
              const hasUnread = parseInt(t.unread_count) > 0;
              return (
                <div key={t.id} onClick={() => openThread(t.id)} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', background: isActive ? colors.orangeLight : hasUnread ? '#FEFAF8' : 'transparent', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F7F5F2'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = hasUnread ? '#FEFAF8' : 'transparent'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 600, color: isActive ? colors.orange : colors.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{t.subject}</p>
                    <p style={{ fontSize: 10, color: colors.faint, flexShrink: 0 }}>{new Date(t.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 12, color: colors.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {t.last_message ? `${t.last_message.sender_name?.split(' ')[0]}: ${t.last_message.body}` : 'No messages yet'}
                    </p>
                    {hasUnread && <span style={{ flexShrink: 0, width: 18, height: 18, background: colors.blue, color: '#fff', borderRadius: '50%', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 6 }}>{t.unread_count}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thread view */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!active ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Select a conversation</p>
              <p style={{ fontSize: 13.5, color: colors.muted }}>or start a new one</p>
              <Button onClick={() => setShowNew(true)}>+ New message</Button>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #eee' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>{active.subject}</p>
                <p style={{ fontSize: 12, color: colors.muted }}>
                  With: {otherParticipants.map(p => p.name).join(', ')}
                  {active.thread_type === 'booking' && ' · Booking thread'}
                </p>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {threadLoad ? <Spinner/> : messages.map(m => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: isMe ? `linear-gradient(135deg, ${colors.orange}, #f5a066)` : '#F7F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isMe ? '#fff' : colors.dark, flexShrink: 0 }}>
                        {m.sender_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{ background: isMe ? colors.dark : '#F7F5F2', color: isMe ? '#fff' : colors.dark, padding: '10px 14px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', fontSize: 13.5, lineHeight: 1.5 }}>
                          {m.body}
                        </div>
                        <p style={{ fontSize: 10.5, color: colors.faint, marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                          {m.sender_name?.split(' ')[0]} · {new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEndRef}/>
              </div>

              {/* Reply box */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
                  rows={2} style={{ flex: 1, border: '1.5px solid #eee', borderRadius: 12, padding: '10px 14px', fontSize: 13.5, color: colors.dark, resize: 'none', fontFamily: font.body, outline: 'none' }}/>
                <Button onClick={sendReply} disabled={sending || !reply.trim()} style={{ flexShrink: 0, padding: '10px 16px' }}>
                  {sending ? '…' : 'Send'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNew && <NewMessageModal onClose={() => setShowNew(false)} onSent={(id) => { setShowNew(false); fetchThreads(); if (id) openThread(id); }} userId={user?.id}/>}
    </div>
  );
}

// ── New message modal ─────────────────────────────────────────
function NewMessageModal({ onClose, onSent, userId }) {
  const [users,    setUsers]    = useState([]);
  const [selected, setSelected] = useState([]);
  const [subject,  setSubject]  = useState('');
  const [body,     setBody]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => { api.get('/messages/users').then(r => setUsers(r.data)).catch(() => {}); }, []);

  const toggleUser = (uid) => setSelected(s => s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid]);

  const send = async () => {
    if (!selected.length) { setError('Select at least one recipient'); return; }
    if (!subject.trim())  { setError('Subject is required'); return; }
    if (!body.trim())     { setError('Message body is required'); return; }
    setSending(true); setError('');
    try {
      const { data } = await api.post('/messages/threads', { subject, body, participant_ids: selected });
      onSent(data.thread_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send'); setSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: colors.dark }}>New message</p>
          <button onClick={onClose} style={{ background: '#F7F5F2', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: colors.muted }}>✕</button>
        </div>

        {/* Recipients */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>To</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px', border: '1.5px solid #eee', borderRadius: 10, minHeight: 42 }}>
            {selected.map(uid => {
              const u = users.find(x => x.id === uid);
              return u ? (
                <span key={uid} style={{ display: 'flex', alignItems: 'center', gap: 4, background: colors.dark, color: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600 }}>
                  {u.full_name}
                  <button onClick={() => toggleUser(uid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                </span>
              ) : null;
            })}
          </div>
          <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #eee', borderRadius: 10, marginTop: 6 }}>
            {users.map(u => (
              <div key={u.id} onClick={() => toggleUser(u.id)} style={{ padding: '9px 12px', cursor: 'pointer', background: selected.includes(u.id) ? colors.orangeLight : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f5' }}
                onMouseEnter={e => { if (!selected.includes(u.id)) e.currentTarget.style.background='#F7F5F2'; }}
                onMouseLeave={e => { if (!selected.includes(u.id)) e.currentTarget.style.background='transparent'; }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{u.full_name}</p>
                  <p style={{ fontSize: 11, color: colors.muted, textTransform: 'capitalize' }}>{u.role}</p>
                </div>
                {selected.includes(u.id) && <span style={{ fontSize: 14, color: colors.orange }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Subject</p>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's this about?"
            style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
        </div>

        {/* Body */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Message</p>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message…" rows={5}
            style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, resize: 'vertical', outline: 'none' }}/>
        </div>

        {error && <p style={{ fontSize: 13, color: colors.red, fontWeight: 600, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={send} disabled={sending}>{sending ? 'Sending…' : 'Send message'}</Button>
        </div>
      </div>
    </div>
  );
}
