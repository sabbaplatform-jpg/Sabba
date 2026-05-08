export const colors = {
  orange:      '#e06c2a',
  orangeHover: '#c95d1e',
  orangeLight: 'rgba(224,108,42,0.08)',
  orangePale:  'rgba(224,108,42,0.15)',
  dark:        '#111010',
  mid:         '#3d3a36',
  muted:       '#7a7570',
  faint:       '#a8a39d',
  border:      'rgba(0,0,0,0.08)',
  borderStrong:'rgba(0,0,0,0.12)',
  bg:          '#ffffff',         // White background
  bgSoft:      '#f9f8f6',         // Soft white for cards/sections
  bgCard:      '#ffffff',
  bgCardHover: '#fdfcfb',
  white:       '#ffffff',
  green:       '#1a7a4a',
  greenLight:  'rgba(26,122,74,0.08)',
  amber:       '#b45309',
  amberLight:  'rgba(180,83,9,0.08)',
  blue:        '#2b4fd8',
  blueLight:   'rgba(43,79,216,0.08)',
  red:         '#c0392b',
  redLight:    'rgba(192,57,43,0.08)',
};

export const font = {
  display: "'DM Serif Display', serif",
  body:    "'DM Sans', 'Helvetica Neue', sans-serif",
};

export const card = {
  background:   '#ffffff',
  border:       '1px solid rgba(0,0,0,0.08)',
  borderRadius: 16,
  boxShadow:    '0 1px 8px rgba(0,0,0,0.06)',
};

export const statusStyle = (status) => {
  const map = {
    approved:      { bg: 'rgba(26,122,74,0.08)',   text: '#1a7a4a', dot: '#1a7a4a' },
    confirmed:     { bg: 'rgba(26,122,74,0.08)',   text: '#1a7a4a', dot: '#34d399' },
    live:          { bg: 'rgba(26,122,74,0.08)',   text: '#1a7a4a', dot: '#1a7a4a' },
    pending:       { bg: 'rgba(180,83,9,0.08)',    text: '#b45309', dot: '#f59e0b' },
    draft:         { bg: 'rgba(0,0,0,0.05)',       text: '#7a7570', dot: '#a8a39d' },
    cancelled:     { bg: 'rgba(192,57,43,0.08)',   text: '#c0392b', dot: '#ef4444' },
    rejected:      { bg: 'rgba(192,57,43,0.08)',   text: '#c0392b', dot: '#ef4444' },
    'under review':{ bg: 'rgba(43,79,216,0.08)',   text: '#2b4fd8', dot: '#6574f8' },
    verified:      { bg: 'rgba(26,122,74,0.08)',   text: '#1a7a4a', dot: '#1a7a4a' },
    unverified:    { bg: 'rgba(180,83,9,0.08)',    text: '#b45309', dot: '#f59e0b' },
  };
  return map[status?.toLowerCase()] || map.pending;
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #ffffff; font-family: 'DM Sans', 'Helvetica Neue', sans-serif; -webkit-font-smoothing: antialiased; color: #111010; }

  /* Page transition */
  .page-fade { animation: pageFade 0.2s ease; }
  @keyframes pageFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  /* Loader bar */
  .loader-bar { width: 100%; height: 3px; background: linear-gradient(90deg, #e06c2a, #f5a66d, #e06c2a); background-size: 200% 100%; animation: loaderAnim 1.2s linear infinite; position: fixed; top: 0; left: 0; z-index: 9999; }
  @keyframes loaderAnim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Cards */
  .card { background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); transition: box-shadow 0.2s ease, transform 0.2s ease; }
  .card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.10); }
  .card-lift:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.12); }

  /* Stat card */
  .stat-card { background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; box-shadow: 0 1px 8px rgba(0,0,0,0.05); transition: all 0.2s ease; }
  .stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-2px); }

  /* Row hover */
  .row-hover { transition: background 0.12s ease; }
  .row-hover:hover { background: rgba(224,108,42,0.03) !important; }

  /* Nav links */
  .nav-link { transition: color 0.15s, background 0.15s; }
  .nav-link:hover { color: #e06c2a !important; background: rgba(224,108,42,0.06) !important; }

  /* Buttons */
  .btn-primary { transition: all 0.15s; }
  .btn-primary:hover { background: #c95d1e !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(224,108,42,0.3); }
  .btn-secondary:hover { background: rgba(0,0,0,0.05) !important; }

  /* Package cards */
  .pkg-card { transition: all 0.2s ease; }
  .pkg-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; border-color: #e06c2a !important; }

  /* Image containers */
  .img-cover { object-fit: cover; width: 100%; height: 100%; }

  /* Notification pulse */
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  .notif-dot { animation: pulse 2s ease-in-out infinite; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }

  /* Input focus */
  input:focus, select:focus, textarea:focus { outline: none; border-color: #e06c2a !important; box-shadow: 0 0 0 3px rgba(224,108,42,0.12) !important; }

  /* Cart badge */
  @keyframes cartBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
  .cart-badge { animation: cartBounce 0.3s ease; }

  /* Quiz */
  .quiz-option { transition: all 0.15s; cursor: pointer; }
  .quiz-option:hover { border-color: #e06c2a !important; background: rgba(224,108,42,0.04) !important; }
  .quiz-option.selected { border-color: #e06c2a !important; background: rgba(224,108,42,0.08) !important; }
`;
