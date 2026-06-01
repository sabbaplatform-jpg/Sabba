import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, EmptyState, Button, Input } from '../../components/UI';
import { colors, font, gradients } from '../../lib/styles';

// ── Constants ────────────────────────────────────────────
const LEVEL_NAMES  = ['', 'Explorer','Adventurer','Trailblazer','Pioneer','Legend'];
const LEVEL_COLORS = ['', '#6B7280','#3B82F6','#10B981','#F59E0B','#EF4444'];
const LEVEL_ICONS  = ['', '🧭','🏕️','🥾','🚀','👑'];

// ── Helpers ──────────────────────────────────────────────
function timeAgo(date) {
  const secs = Math.floor((new Date() - new Date(date)) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs/86400)}d ago`;
  return new Date(date).toLocaleDateString('en-GB', {day:'numeric',month:'short'});
}

function Avatar({ name, avatar, size=38, level=1 }) {
  const initials = (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const bg = LEVEL_COLORS[Math.min(level,5)] || colors.orange;
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden',
        background: bg, display:'flex', alignItems:'center', justifyContent:'center',
        border:`2px solid ${bg}` }}>
        {avatar
          ? <img src={avatar} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : <span style={{color:'#fff',fontWeight:700,fontSize:size*0.35,fontFamily:font.body}}>{initials}</span>
        }
      </div>
      {level >= 2 && (
        <div style={{ position:'absolute', bottom:-2, right:-2, fontSize:size*0.3,
          background:'#fff', borderRadius:'50%', width:size*0.42, height:size*0.42,
          display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.15)' }}>
          {LEVEL_ICONS[Math.min(level,5)]}
        </div>
      )}
    </div>
  );
}

function LevelBadge({ level }) {
  const l = Math.min(level || 1, 5);
  return (
    <span style={{ fontSize:10, fontWeight:700, color:LEVEL_COLORS[l],
      background:LEVEL_COLORS[l]+'18', borderRadius:5, padding:'2px 6px',
      letterSpacing:'0.04em' }}>
      {LEVEL_ICONS[l]} {LEVEL_NAMES[l]}
    </span>
  );
}

// ── Image Uploader Component ─────────────────────────────
function ImageUploader({ imageUrl, setImageUrl }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }

    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'community');
      fd.append('folder', 'posts');
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(data.url);
    } catch (err) {
      setError('Upload failed — try again');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {!imageUrl ? (
        <div>
          <input ref={fileRef} type="file" accept="image/*"
            onChange={handleFile} style={{ display:'none' }}/>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ background:'#F7F5F2', border:'1.5px dashed #ddd', borderRadius:10,
              padding:'10px 16px', fontSize:13, color: uploading ? colors.muted : colors.mid,
              fontFamily:font.body, cursor: uploading ? 'default' : 'pointer',
              display:'flex', alignItems:'center', gap:8, width:'100%',
              justifyContent:'center', fontWeight:600 }}>
            <span style={{ fontSize:18 }}>📸</span>
            {uploading ? 'Uploading…' : 'Add a photo'}
          </button>
          {error && <p style={{ fontSize:12, color:colors.red, marginTop:4, fontWeight:600 }}>{error}</p>}
        </div>
      ) : (
        <div style={{ position:'relative' }}>
          <img src={imageUrl} alt="preview"
            style={{ width:'100%', maxHeight:240, objectFit:'cover',
              borderRadius:10, display:'block' }}/>
          <button type="button" onClick={() => setImageUrl('')}
            style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.55)',
              color:'#fff', border:'none', borderRadius:'50%', width:28, height:28,
              fontSize:14, cursor:'pointer', fontFamily:font.body, display:'flex',
              alignItems:'center', justifyContent:'center' }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ── Post Composer ─────────────────────────────────────────
function PostComposer({ profile, onPost }) {
  const [open,       setOpen]       = useState(false);
  const [content,    setContent]    = useState('');
  const [imageUrl,   setImageUrl]   = useState('');
  const [visibility, setVisibility] = useState('global');
  const [posting,    setPosting]    = useState(false);
  const [error,      setError]      = useState('');
  const textRef = useRef();
  const fileRef = useRef();

  const handlePost = async () => {
    if (!content.trim()) { setError('Write something first'); return; }
    setPosting(true);
    try {
      const { data } = await api.post('/community/posts', { content, image_url: imageUrl||null, visibility });
      onPost(data);
      setContent(''); setImageUrl(''); setOpen(false); setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post');
    } finally { setPosting(false); }
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:16, padding:'16px 20px', marginBottom:20 }}>
      {!open ? (
        <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'text' }}
          onClick={() => { setOpen(true); setTimeout(()=>textRef.current?.focus(),50); }}>
          <Avatar name={profile?.full_name} avatar={profile?.avatar_url} level={profile?.level}/>
          <div style={{ flex:1, background:'#F7F5F2', borderRadius:22, padding:'10px 18px',
            fontSize:13.5, color:colors.muted, fontFamily:font.body }}>
            Share your adventure story…
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
            <Avatar name={profile?.full_name} avatar={profile?.avatar_url} level={profile?.level}/>
            <textarea ref={textRef} value={content} onChange={e=>{setContent(e.target.value);setError('');}}
              placeholder="Share your adventure story, tips, or photos with the community…"
              style={{ flex:1, border:'none', outline:'none', resize:'none', fontSize:14.5,
                color:colors.dark, fontFamily:font.body, lineHeight:1.6, minHeight:80,
                background:'transparent' }}/>
          </div>

          {/* Image upload */}
          <ImageUploader imageUrl={imageUrl} setImageUrl={setImageUrl}/>

          {/* Visibility */}
          <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
            <span style={{ fontSize:12, color:colors.muted, fontWeight:600 }}>Visible to:</span>
            {[
              { v:'global',  label:'🌍 Everyone on Sabba' },
              { v:'company', label:'🏢 My company only' },
            ].map(opt => (
              <button key={opt.v} onClick={()=>setVisibility(opt.v)}
                style={{ padding:'5px 12px', borderRadius:16,
                  border:`1.5px solid ${visibility===opt.v ? colors.orange : '#eee'}`,
                  background: visibility===opt.v ? colors.orangeLight : '#fff',
                  color: visibility===opt.v ? colors.orange : colors.mid,
                  fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:font.body }}>
                {opt.label}
              </button>
            ))}
          </div>

          {error && <p style={{fontSize:12.5,color:colors.red,fontWeight:600,marginBottom:8}}>{error}</p>}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={()=>{setOpen(false);setContent('');setImageUrl('');setError('');}}
              style={{ background:'none', border:'1px solid #eee', borderRadius:10,
                padding:'8px 18px', fontSize:13, cursor:'pointer', fontFamily:font.body,
                color:colors.mid, fontWeight:600 }}>
              Cancel
            </button>
            <button onClick={handlePost} disabled={posting || !content.trim()}
              style={{ background: posting||!content.trim() ? '#eee' : colors.orange,
                color: posting||!content.trim() ? colors.muted : '#fff',
                border:'none', borderRadius:10, padding:'8px 20px',
                fontSize:13, fontWeight:700, cursor: posting||!content.trim() ? 'default' : 'pointer',
                fontFamily:font.body }}>
              {posting ? 'Posting…' : '✈️ Share post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Comment section ───────────────────────────────────────
function Comments({ postId, count, profile }) {
  const [open,     setOpen]     = useState(false);
  const [comments, setComments] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [posting,  setPosting]  = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(`/community/posts/${postId}/comments`);
    setComments(data); setLoading(false);
  };

  const toggle = () => {
    if (!open) load();
    setOpen(o => !o);
  };

  const submit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/community/posts/${postId}/comments`, { content: text });
      setComments(c => [...c, data]); setText('');
    } finally { setPosting(false); }
  };

  return (
    <div>
      <button onClick={toggle}
        style={{ background:'none', border:'none', color:colors.muted,
          fontSize:13, cursor:'pointer', fontFamily:font.body, fontWeight:600,
          padding:0, display:'flex', alignItems:'center', gap:5 }}>
        💬 {count > 0 ? `${count} comment${count!==1?'s':''}` : 'Comment'}
      </button>
      {open && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F7F5F2' }}>
          {loading ? <Spinner/> : comments.map(c => (
            <div key={c.id} style={{ display:'flex', gap:10, marginBottom:12 }}>
              <Avatar name={c.author_name} avatar={c.author_avatar} level={c.author_level} size={30}/>
              <div style={{ flex:1 }}>
                <div style={{ background:'#F7F5F2', borderRadius:12, padding:'8px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:colors.dark }}>{c.author_name}</span>
                    <LevelBadge level={c.author_level}/>
                    <span style={{ fontSize:11.5, color:colors.muted }}>{c.author_company}</span>
                  </div>
                  <p style={{ fontSize:13.5, color:colors.mid, lineHeight:1.5 }}>{c.content}</p>
                </div>
                <p style={{ fontSize:11, color:colors.faint, marginTop:3, paddingLeft:6 }}>{timeAgo(c.created_at)}</p>
              </div>
            </div>
          ))}
          {/* Comment input */}
          <div style={{ display:'flex', gap:10, alignItems:'flex-end', marginTop:8 }}>
            <Avatar name={profile?.full_name} avatar={profile?.avatar_url} level={profile?.level} size={30}/>
            <div style={{ flex:1, display:'flex', gap:8 }}>
              <input value={text} onChange={e=>setText(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&submit()}
                placeholder="Write a comment…"
                style={{ flex:1, border:'1.5px solid #eee', borderRadius:22,
                  padding:'8px 16px', fontSize:13.5, color:colors.dark,
                  fontFamily:font.body, outline:'none' }}/>
              <button onClick={submit} disabled={posting||!text.trim()}
                style={{ background:posting||!text.trim() ? '#eee' : colors.orange,
                  color:posting||!text.trim() ? colors.muted : '#fff',
                  border:'none', borderRadius:22, padding:'8px 16px',
                  fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:font.body,
                  flexShrink:0 }}>
                {posting ? '…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Post Card ────────────────────────────────────────────
function PostCard({ post, myProfile, onDelete, navigate }) {
  const [liked,      setLiked]      = useState(post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [liking,     setLiking]     = useState(false);
  const isOwn = myProfile?.user_id === post.user_id;

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await api.post(`/community/posts/${post.id}/like`);
      setLiked(data.liked);
      setLikesCount(c => data.liked ? c+1 : c-1);
    } finally { setLiking(false); }
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:16,
      marginBottom:16, overflow:'hidden' }}>
      {/* Post image */}
      {post.image_url && (
        <img src={post.image_url} alt="post"
          style={{ width:'100%', maxHeight:360, objectFit:'cover', display:'block' }}/>
      )}

      <div style={{ padding:'16px 20px' }}>
        {/* Author row */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}
            onClick={() => post.user_id && navigate(`/community/profile/${post.user_id}`)}>
            <Avatar name={post.author_name} avatar={post.author_avatar} level={post.author_level}/>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:14, fontWeight:700, color:colors.dark }}>{post.author_name}</span>
                <LevelBadge level={post.author_level}/>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:colors.muted }}>{post.author_company}</span>
                {post.author_job_title && (
                  <>
                    <span style={{ color:colors.faint }}>·</span>
                    <span style={{ fontSize:12, color:colors.faint }}>{post.author_job_title}</span>
                  </>
                )}
                <span style={{ color:colors.faint }}>·</span>
                <span style={{ fontSize:12, color:colors.faint }}>{timeAgo(post.created_at)}</span>
                {post.visibility === 'company' && (
                  <span style={{ fontSize:10, background:'#F7F5F2', color:colors.muted,
                    borderRadius:4, padding:'1px 6px', fontWeight:600 }}>🏢 Company</span>
                )}
              </div>
            </div>
          </div>
          {isOwn && (
            <button onClick={() => onDelete(post.id)}
              style={{ background:'none', border:'none', color:colors.faint,
                cursor:'pointer', fontSize:13, fontFamily:font.body, padding:'2px 6px' }}>
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <p style={{ fontSize:14.5, color:colors.mid, lineHeight:1.7, marginBottom:16,
          whiteSpace:'pre-wrap' }}>
          {post.content}
        </p>

        {/* Actions */}
        <div style={{ display:'flex', alignItems:'center', gap:16, paddingTop:12,
          borderTop:'1px solid #F7F5F2' }}>
          <button onClick={toggleLike} disabled={liking}
            style={{ background:'none', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, fontFamily:font.body,
              color: liked ? colors.orange : colors.muted,
              fontSize:13, fontWeight: liked ? 700 : 500, padding:0 }}>
            <span style={{ fontSize:16 }}>{liked ? '❤️' : '🤍'}</span>
            {likesCount > 0 && <span>{likesCount}</span>}
            <span>{liked ? 'Liked' : 'Like'}</span>
          </button>
          <Comments postId={post.id} count={post.comments_count} profile={myProfile}/>
        </div>
      </div>
    </div>
  );
}

// ── Matched Travellers Section ────────────────────────────
function MatchedTravellers({ matches, navigate }) {
  if (!matches.length) return null;
  return (
    <div style={{ background:'linear-gradient(135deg, #1A2E44, #243d58)',
      borderRadius:16, padding:'20px 24px', marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <span style={{ fontSize:18 }}>✈️</span>
        <p style={{ fontSize:13, fontWeight:700, color:'#fff', textTransform:'uppercase',
          letterSpacing:'0.08em' }}>Your travel matches</p>
      </div>
      <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.5)', marginBottom:16 }}>
        People heading to the same destination around your dates
      </p>
      <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }}>
        {matches.map((m, i) => (
          <div key={i} style={{ background:'rgba(255,255,255,0.08)', borderRadius:14,
            padding:'14px 16px', minWidth:200, flexShrink:0, cursor:'pointer',
            border:'1px solid rgba(255,255,255,0.1)', transition:'background 0.15s' }}
            onClick={() => m.matched_user_id && navigate(`/community/profile/${m.matched_user_id}`)}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <Avatar name={m.matched_name} avatar={m.matched_avatar} level={m.matched_level} size={40}/>
              <div>
                <p style={{ fontSize:13.5, fontWeight:700, color:'#fff' }}>{m.matched_name}</p>
                <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.5)' }}>{m.matched_company}</p>
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:8, padding:'8px 10px', marginBottom:8 }}>
              <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>
                📍 {m.destination}
              </p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
                {m.departure_date ? new Date(m.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'Dates TBC'}
              </p>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={e => { e.stopPropagation(); navigate(`/messages/new?to=${m.matched_user_id}&name=${encodeURIComponent(m.matched_name)}`); }}
                style={{ flex:1, background:colors.orange, color:'#fff', border:'none',
                  borderRadius:8, padding:'6px', fontSize:11.5, fontWeight:700,
                  cursor:'pointer', fontFamily:font.body }}>
                💬 Message
              </button>
              <button onClick={e => { e.stopPropagation(); m.matched_user_id && navigate(`/community/profile/${m.matched_user_id}`); }}
                style={{ flex:1, background:'rgba(255,255,255,0.1)', color:'#fff', border:'none',
                  borderRadius:8, padding:'6px', fontSize:11.5, fontWeight:700,
                  cursor:'pointer', fontFamily:font.body }}>
                View profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Platinum Sponsored Sidebar ───────────────────────────
function PlatinumSidebar({ navigate }) {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    api.get('/community/platinum').then(r => setListings(r.data || [])).catch(() => {});
  }, []);

  if (!listings.length) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <p style={{ fontSize:9.5, fontWeight:700, color:colors.faint,
        textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:2 }}>
        ⭐ Platinum
      </p>
      {listings.map(l => (
        <div key={l.id} onClick={() => navigate(`/package/${l.package_id}`)}
          style={{ background:'#fff', border:'1.5px solid #F0C060', borderRadius:14,
            overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 12px rgba(201,136,42,0.12)',
            transition:'transform 0.15s, box-shadow 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(201,136,42,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 12px rgba(201,136,42,0.12)'; }}>

          {/* Package image */}
          <div style={{ height:110, background:'linear-gradient(135deg,#C9882A,#e8a84a)',
            position:'relative', overflow:'hidden' }}>
            {l.image_url
              ? <img src={l.image_url} alt={l.package_title}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ width:'100%', height:'100%', display:'flex',
                  alignItems:'center', justifyContent:'center', fontSize:36 }}>
                  {l.emoji || '🌍'}
                </div>
            }
            <div style={{ position:'absolute', top:6, left:6,
              background:'#C9882A', borderRadius:5, padding:'2px 7px' }}>
              <span style={{ fontSize:9, fontWeight:800, color:'#fff',
                letterSpacing:'0.06em' }}>⭐ PLATINUM</span>
            </div>
          </div>

          {/* Details */}
          <div style={{ padding:'10px 12px' }}>
            <p style={{ fontSize:12, fontWeight:700, color:colors.dark,
              lineHeight:1.3, marginBottom:3 }}>
              {l.package_title}
            </p>
            <p style={{ fontSize:11, color:colors.muted, marginBottom:6 }}>
              {l.destination} · {l.duration}
            </p>
            <p style={{ fontSize:13, fontWeight:700, color:'#C9882A' }}>
              £{Number(l.price_gbp).toLocaleString()}
            </p>
            <p style={{ fontSize:10.5, color:colors.faint, marginTop:2 }}>
              from £{Math.ceil(l.price_gbp/12)}/mo payroll
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Community Feed ───────────────────────────────────
export function CommunityFeed() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [profile,   setProfile]   = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [matches,   setMatches]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/community/profile/me'),
      api.get('/community/feed?page=1'),
      api.get('/community/matches'),
    ]).then(([p, f, m]) => {
      setProfile(p.data);
      setPosts(f.data || []);
      setMatches(m.data || []);
      setHasMore((f.data || []).length === 20);
    }).catch(err => console.error('Community load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const { data } = await api.get(`/community/feed?page=${nextPage}`);
    setPosts(prev => [...prev, ...data]);
    setPage(nextPage);
    setHasMore(data.length === 20);
    setLoadingMore(false);
  };

  const handleNewPost = (post) => setPosts(prev => [post, ...prev]);
  const handleDelete  = async (id) => {
    await api.delete(`/community/posts/${id}`);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return (
    <div style={{ fontFamily:font.body, background:'#F7F5F2', minHeight:'100vh', paddingBottom:80 }}>
      <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 20px' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background:'#fff', borderRadius:16, marginBottom:16, overflow:'hidden' }}>
            <div style={{ height:200, background:'linear-gradient(90deg,#f0ede9 25%,#e8e4df 50%,#f0ede9 75%)',
              animation:'shimmer 1.5s infinite', backgroundSize:'200% 100%' }}/>
            <div style={{ padding:'16px 20px' }}>
              <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'#f0ede9' }}/>
                <div style={{ flex:1 }}>
                  <div style={{ height:14, background:'#f0ede9', borderRadius:6, width:'40%', marginBottom:6 }}/>
                  <div style={{ height:11, background:'#f0ede9', borderRadius:6, width:'25%' }}/>
                </div>
              </div>
              <div style={{ height:13, background:'#f0ede9', borderRadius:6, marginBottom:6 }}/>
              <div style={{ height:13, background:'#f0ede9', borderRadius:6, width:'75%' }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:font.body, background:'#F7F5F2', minHeight:'100vh', paddingBottom:80 }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #1A2E44 0%, #243d58 100%)', padding:'28px 40px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div>
              <p style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.45)',
                textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                Sabba Community
              </p>
              <h1 style={{ fontFamily:font.display, fontSize:32, color:'#fff',
                fontWeight:700, fontStyle:'italic', marginBottom:6 }}>
                Adventure Stories
              </h1>
              <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                Share your adventures · Connect with fellow travellers · Earn points
              </p>
            </div>
            {profile && (
              <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer',
                background:'rgba(255,255,255,0.1)', borderRadius:22,
                padding:'8px 16px 8px 10px', border:'1px solid rgba(255,255,255,0.15)' }}
                onClick={() => navigate('/community/profile/me')}>
                <Avatar name={profile.full_name} avatar={profile.avatar_url} level={profile.level} size={32}/>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#fff', lineHeight:1, marginBottom:3 }}>
                    {profile.full_name?.split(' ')[0]}
                  </p>
                  <LevelBadge level={profile.level}/>
                </div>
              </div>
            )}
          </div>

          {/* Points explainer + rules */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {/* Earn points */}
            <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:14,
              padding:'16px 18px', border:'1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#f5a66d',
                textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                ⭐ Earn Sabba Points
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {[
                  ['📝 Post with photo', '20 pts'],
                  ['✏️ Text post', '10 pts'],
                  ['💬 Comment', '5 pts'],
                  ['❤️ Like received', '2 pts'],
                  ['✈️ Message a match', '30 pts'],
                ].map(([action, pts]) => (
                  <div key={action} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>{action}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:'#f5a66d' }}>{pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community rules */}
            <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:14,
              padding:'16px 18px', border:'1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#f5a66d',
                textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                📋 Community Rules
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[
                  'Share genuine adventure stories and travel tips',
                  'Be respectful — this is a professional community',
                  'No spam, self-promotion or offensive content',
                  'Daily points cap applies — scales with your level',
                  'Violations may result in account suspension',
                ].map((rule, i) => (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2, flexShrink:0 }}>
                      {i+1}.
                    </span>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 20px',
        display:'grid', gridTemplateColumns:'200px 1fr 200px', gap:24, alignItems:'start' }}>

        {/* Left platinum sidebar */}
        <div>
          <PlatinumSidebar navigate={navigate}/>
        </div>

        {/* Main feed column */}
        <div>
          {/* Matched travellers */}
          <MatchedTravellers matches={matches} navigate={navigate}/>

          {/* Post composer */}
          {profile && <PostComposer profile={profile} onPost={handleNewPost}/>}

        {/* Feed */}
          {posts.length === 0 ? (
            <div style={{ background:'#fff', borderRadius:16, padding:48, textAlign:'center',
              border:'1px solid #eee' }}>
              <p style={{ fontSize:36, marginBottom:12 }}>✈️</p>
              <p style={{ fontSize:16, fontWeight:700, color:colors.dark, marginBottom:8 }}>
                Be the first to share your adventure
              </p>
              <p style={{ fontSize:13.5, color:colors.muted, lineHeight:1.6 }}>
                Share your travel stories, tips and photos with the Sabba community.
              </p>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <PostCard key={post.id} post={post} myProfile={profile}
                  onDelete={handleDelete} navigate={navigate}/>
              ))}
              {hasMore && (
                <div style={{ textAlign:'center', marginTop:20 }}>
                  <button onClick={loadMore} disabled={loadingMore}
                    style={{ background:'#fff', border:'1px solid #eee', borderRadius:10,
                      padding:'10px 28px', fontSize:13.5, fontWeight:600, cursor:'pointer',
                      color:colors.mid, fontFamily:font.body }}>
                    {loadingMore ? 'Loading…' : 'Load more posts'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right platinum sidebar */}
        <div>
          <PlatinumSidebar navigate={navigate}/>
        </div>
      </div>
    </div>
  );
}

// ── Community Profile Page ────────────────────────────────
export function CommunityProfile() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isMe      = id === 'me';
  const [profile, setProfile] = useState(null);
  const [posts,   setPosts]   = useState([]);
  const [editing, setEditing] = useState(false);
  const [bio,     setBio]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = isMe ? '/community/profile/me' : `/community/profile/${id}`;
    Promise.all([
      api.get(endpoint),
      api.get('/community/feed'),
    ]).then(([p, f]) => {
      const profileData = p.data;
      setProfile(profileData);
      setBio(profileData.bio || '');
      const userId = profileData.user_id;
      if (userId) {
        setPosts((f.data || []).filter(post => post.user_id === userId));
      }
    }).catch(err => {
      console.error('Profile load error:', err);
    }).finally(() => setLoading(false));
  }, [id]);

  const saveProfile = async () => {
    await api.put('/community/profile', { bio, opt_out: profile.opt_out });
    setProfile(p => ({ ...p, bio }));
    setEditing(false);
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner/></div>;
  if (!profile) return <div style={{padding:60,textAlign:'center',color:colors.muted,fontFamily:font.body}}>Profile not found</div>;

  const level = Math.min(profile.level || 1, 5);
  const LEVEL_THRESHOLDS = [0,0,500,1500,4000,10000];

  return (
    <div style={{ fontFamily:font.body, background:'#F7F5F2', minHeight:'100vh', paddingBottom:80 }}>
      {/* Back */}
      <div style={{ background:'#fff', borderBottom:'1px solid #eee', padding:'12px 40px' }}>
        <button onClick={() => navigate('/community')}
          style={{ background:'none', border:'none', color:colors.orange,
            fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:font.body,
            display:'flex', alignItems:'center', gap:6 }}>
          ← Community
        </button>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 20px' }}>

        {/* Profile card */}
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:20,
          overflow:'hidden', marginBottom:24 }}>
          {/* Banner */}
          <div style={{ height:100,
            background:`linear-gradient(135deg, ${LEVEL_COLORS[level]}33, ${LEVEL_COLORS[level]}11)`,
            position:'relative' }}>
            <div style={{ position:'absolute', bottom:-28, left:24 }}>
              <Avatar name={profile.full_name} avatar={profile.avatar_url} level={level} size={72}/>
            </div>
          </div>

          <div style={{ padding:'36px 24px 24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <h2 style={{ fontSize:22, fontWeight:700, color:colors.dark, marginBottom:4 }}>
                  {profile.full_name}
                </h2>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <LevelBadge level={level}/>
                  {profile.job_title && (
                    <span style={{ fontSize:12.5, color:colors.muted }}>{profile.job_title}</span>
                  )}
                  <span style={{ fontSize:12.5, color:colors.muted }}>{profile.company_name}</span>
                  {profile.adventure_type && (
                    <span style={{ fontSize:12, color:colors.faint, textTransform:'capitalize',
                      background:'#F7F5F2', borderRadius:5, padding:'2px 8px' }}>
                      {profile.adventure_type}
                    </span>
                  )}
                </div>
              </div>
              {isMe && (
                <button onClick={() => setEditing(e => !e)}
                  style={{ background:'#F7F5F2', border:'none', borderRadius:10,
                    padding:'7px 14px', fontSize:12.5, fontWeight:700, cursor:'pointer',
                    color:colors.mid, fontFamily:font.body }}>
                  {editing ? 'Cancel' : 'Edit profile'}
                </button>
              )}
              {!isMe && (
                <button onClick={() => navigate(`/messages/new?to=${profile.user_id}&name=${encodeURIComponent(profile.full_name)}`)}
                  style={{ background:colors.orange, color:'#fff', border:'none',
                    borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:700,
                    cursor:'pointer', fontFamily:font.body }}>
                  💬 Message
                </button>
              )}
            </div>

            {/* Level progress bar */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:colors.faint, fontWeight:600 }}>
                  Level {level} · {LEVEL_NAMES[level]}
                </span>
                {level < 5 && (
                  <span style={{ fontSize:11, color:colors.faint }}>
                    {profile.sabba_points?.toLocaleString()} / {LEVEL_THRESHOLDS[level+1]?.toLocaleString()} pts to Level {level+1}
                  </span>
                )}
              </div>
              <div style={{ height:4, background:'#eee', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:2,
                  background:LEVEL_COLORS[level],
                  width: level>=5 ? '100%' : `${Math.min(100, ((profile.sabba_points||0) - LEVEL_THRESHOLDS[level]) / (LEVEL_THRESHOLDS[level+1] - LEVEL_THRESHOLDS[level]) * 100)}%`,
                  transition:'width 0.5s ease' }}/>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
              {[
                { label:'Posts',       value: profile.post_count || 0 },
                { label:'Sabba Points', value: (profile.sabba_points||0).toLocaleString() },
                { label:'Level',       value: `${LEVEL_ICONS[level]} ${LEVEL_NAMES[level]}` },
              ].map((s,i) => (
                <div key={i} style={{ background:'#F7F5F2', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                  <p style={{ fontSize:18, fontWeight:700, color:colors.dark, lineHeight:1 }}>{s.value}</p>
                  <p style={{ fontSize:11, color:colors.faint, marginTop:4, fontWeight:600 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            {editing ? (
              <div>
                <textarea value={bio} onChange={e=>setBio(e.target.value)}
                  placeholder="Tell the community about your adventure style…"
                  style={{ width:'100%', border:'1.5px solid #eee', borderRadius:10,
                    padding:'10px 14px', fontSize:13.5, color:colors.dark,
                    fontFamily:font.body, outline:'none', resize:'vertical',
                    minHeight:80, boxSizing:'border-box', lineHeight:1.6 }}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:colors.muted }}>
                    <input type="checkbox" checked={profile.opt_out||false}
                      onChange={e => setProfile(p => ({...p, opt_out:e.target.checked}))}/>
                    Opt out of travel matching
                  </label>
                  <Button onClick={saveProfile} small>Save profile</Button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize:14, color:profile.bio ? colors.mid : colors.faint,
                lineHeight:1.7, fontStyle:profile.bio ? 'normal' : 'italic' }}>
                {profile.bio || (isMe ? 'Add a bio to tell the community about yourself…' : 'No bio yet.')}
              </p>
            )}
          </div>
        </div>

        {/* Posts */}
        <p style={{ fontSize:11, fontWeight:700, color:colors.faint,
          textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>
          Posts · {posts.length}
        </p>
        {posts.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:16, padding:32, textAlign:'center', border:'1px solid #eee' }}>
            <p style={{ fontSize:14, color:colors.muted }}>
              {isMe ? 'Share your first adventure story!' : 'No posts yet.'}
            </p>
          </div>
        ) : posts.map(post => (
          <PostCard key={post.id} post={post} myProfile={profile}
            onDelete={async (id) => {
              await api.delete(`/community/posts/${id}`);
              setPosts(prev => prev.filter(p => p.id !== id));
            }} navigate={navigate}/>
        ))}
      </div>
    </div>
  );
}
