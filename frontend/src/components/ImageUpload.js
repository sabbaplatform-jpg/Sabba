import { useState, useRef } from 'react';
import api from '../lib/api';
import { colors, font } from '../lib/styles';

export function ImageUpload({ label, value, onChange, bucket = 'avatars', folder = '', round = false, height = 120 }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const inputRef                  = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (folder) formData.append('folder', folder);

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}

      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: round ? height : '100%', height,
          borderRadius: round ? '50%' : 12,
          border: `2px dashed ${uploading ? colors.orange : colors.border}`,
          background: value ? 'transparent' : colors.bgSoft || '#f9f8f6',
          cursor: 'pointer', overflow: 'hidden', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { if (!value) e.currentTarget.style.borderColor = colors.orange; }}
        onMouseLeave={e => { if (!value) e.currentTarget.style.borderColor = colors.border; }}
      >
        {value ? (
          <>
            <img src={value} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}>Change</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 16 }}>
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, border: `3px solid ${colors.border}`, borderTop: `3px solid ${colors.orange}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>Uploading…</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.mid }}>Click to upload</p>
                <p style={{ fontSize: 11.5, color: colors.faint, marginTop: 2 }}>JPG, PNG up to 5MB</p>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p style={{ fontSize: 12, color: colors.red, fontWeight: 600 }}>{error}</p>}

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }}/>
    </div>
  );
}
