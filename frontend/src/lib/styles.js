export const colors = {
  orange:      '#D4622A',
  orangeHover: '#b8521f',
  orangeLight: 'rgba(212,98,42,0.08)',
  orangePale:  'rgba(212,98,42,0.15)',
  dark:        '#1a1a1a',
  mid:         '#444',
  muted:       '#777',
  faint:       '#aaa',
  border:      '#eee',
  borderMid:   'rgba(0,0,0,0.1)',
  bg:          '#F7F5F2',
  bgCard:      '#ffffff',
  white:       '#ffffff',
  green:       '#1a7a4a',
  greenLight:  'rgba(26,122,74,0.09)',
  amber:       '#b45309',
  amberLight:  'rgba(180,83,9,0.09)',
  blue:        '#2b4fd8',
  blueLight:   'rgba(43,79,216,0.09)',
  red:         '#c0392b',
  redLight:    'rgba(192,57,43,0.09)',
};

export const font = {
  display: "'Playfair Display', Georgia, serif",
  body:    "'Inter', 'DM Sans', 'Helvetica Neue', sans-serif",
};

export const gradients = {
  travel:       'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  volunteering: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  courses:      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  jobs_abroad:  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  airlines:     'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  accommodation:'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  default:      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};

export const statusStyle = (status) => {
  const map = {
    approved:      { bg: 'rgba(26,122,74,0.09)',  text: '#1a7a4a', dot: '#1a7a4a' },
    confirmed:     { bg: 'rgba(26,122,74,0.09)',  text: '#1a7a4a', dot: '#34d399' },
    live:          { bg: 'rgba(26,122,74,0.09)',  text: '#1a7a4a', dot: '#1a7a4a' },
    pending:       { bg: 'rgba(180,83,9,0.09)',   text: '#b45309', dot: '#f59e0b' },
    draft:         { bg: 'rgba(0,0,0,0.05)',      text: '#777',    dot: '#aaa'    },
    cancelled:     { bg: 'rgba(192,57,43,0.09)',  text: '#c0392b', dot: '#ef4444' },
    rejected:      { bg: 'rgba(192,57,43,0.09)',  text: '#c0392b', dot: '#ef4444' },
    'under review':{ bg: 'rgba(43,79,216,0.09)',  text: '#2b4fd8', dot: '#6574f8' },
    verified:      { bg: 'rgba(26,122,74,0.09)',  text: '#1a7a4a', dot: '#1a7a4a' },
    unverified:    { bg: 'rgba(180,83,9,0.09)',   text: '#b45309', dot: '#f59e0b' },
  };
  return map[status?.toLowerCase()] || map.pending;
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F7F5F2; font-family: 'Inter', 'Helvetica Neue', sans-serif; -webkit-font-smoothing: antialiased; color: #1a1a1a; }

  /* Loader */
  .loader-bar { width: 100%; height: 3px; background: linear-gradient(90deg, #D4622A, #f5a066, #D4622A); background-size: 200% 100%; animation: loaderAnim 1.2s linear infinite; position: fixed; top: 0; left: 0; z-index: 9999; }
  @keyframes loaderAnim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Cards */
  .card { background: #fff; border: 1px solid #eee; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: box-shadow 0.2s ease, transform 0.2s ease; }
  .card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.1); }

  /* Package cards */
  .pkg-card { background: #fff; border: 1px solid #eee; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); cursor: pointer; transition: all 0.22s ease; overflow: hidden; }
  .pkg-card:hover { transform: translateY(-5px); box-shadow: 0 20px 48px rgba(0,0,0,0.13); border-color: #D4622A; }

  /* Stat cards */
  .stat-card { background: #fff; border: 1px solid #eee; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.2s ease; }
  .stat-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09); transform: translateY(-2px); }

  /* Table */
  .table-wrap { background: #fff; border: 1px solid #eee; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; }
  .table-head-row { background: #F7F5F2; }
  .row-hover { transition: background 0.12s; }
  .row-hover:hover { background: #fdf8f5 !important; }

  /* Nav */
  .nav-link { transition: color 0.15s, background 0.15s; }
  .nav-link:hover { color: #D4622A !important; background: rgba(212,98,42,0.06) !important; }

  /* Buttons */
  .btn-p { transition: all 0.15s; }
  .btn-p:hover { background: #b8521f !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(212,98,42,0.35); }
  .btn-s:hover { background: #f0ede9 !important; }

  /* Notification pulse */
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  .notif-dot { animation: pulse 2s ease-in-out infinite; }

  /* Cart bounce */
  @keyframes bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
  .cart-badge { animation: bounce 0.3s ease; }

  /* Quiz */
  .quiz-opt { transition: all 0.15s; cursor: pointer; }
  .quiz-opt:hover { border-color: #D4622A !important; background: rgba(212,98,42,0.04) !important; }
  .quiz-opt.sel { border-color: #D4622A !important; background: rgba(212,98,42,0.08) !important; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }

  input:focus, select:focus, textarea:focus { outline: none; border-color: #D4622A !important; box-shadow: 0 0 0 3px rgba(212,98,42,0.12) !important; }

  /* Page fade */
  .page-fade { animation: pf 0.2s ease; }
  @keyframes pf { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

  /* Category cards */
  .cat-card { cursor: pointer; border-radius: 14px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
  .cat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.14); }
`;
