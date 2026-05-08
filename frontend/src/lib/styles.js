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
  bg:          '#f0eeeb',       // Apple-like light warm grey
  bgCard:      'rgba(255,255,255,0.72)', // glassmorphism
  bgCardHover: 'rgba(255,255,255,0.88)',
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

export const glass = {
  background:   colors.bgCard,
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border:       `1px solid ${colors.border}`,
  borderRadius: 16,
  boxShadow:    '0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
};

export const glassHover = {
  background:   colors.bgCardHover,
  boxShadow:    '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
};

export const statusStyle = (status) => {
  const map = {
    approved:      { bg: colors.greenLight,  text: colors.green,  dot: colors.green },
    confirmed:     { bg: colors.greenLight,  text: colors.green,  dot: '#34d399' },
    live:          { bg: colors.greenLight,  text: colors.green,  dot: colors.green },
    pending:       { bg: colors.amberLight,  text: colors.amber,  dot: '#f59e0b' },
    draft:         { bg: 'rgba(0,0,0,0.05)', text: colors.muted,  dot: colors.faint },
    cancelled:     { bg: colors.redLight,    text: colors.red,    dot: '#ef4444' },
    rejected:      { bg: colors.redLight,    text: colors.red,    dot: '#ef4444' },
    'under review':{ bg: colors.blueLight,   text: colors.blue,   dot: '#6574f8' },
    verified:      { bg: colors.greenLight,  text: colors.green,  dot: colors.green },
    unverified:    { bg: colors.amberLight,  text: colors.amber,  dot: '#f59e0b' },
  };
  return map[status?.toLowerCase()] || map.pending;
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f0eeeb; font-family: 'DM Sans', 'Helvetica Neue', sans-serif; -webkit-font-smoothing: antialiased; }
  
  /* Page transitions */
  .page-enter { opacity: 0; transform: translateY(8px); }
  .page-enter-active { opacity: 1; transform: translateY(0); transition: opacity 0.2s ease, transform 0.2s ease; }
  
  /* Smooth loader */
  .loader-bar { width: 100%; height: 3px; background: linear-gradient(90deg, #e06c2a, #f5a66d, #e06c2a); background-size: 200% 100%; animation: loader 1.2s linear infinite; position: fixed; top: 0; left: 0; z-index: 9999; }
  @keyframes loader { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  
  /* Glass card hover */
  .glass-card { background: rgba(255,255,255,0.72); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); transition: box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease; }
  .glass-card:hover { background: rgba(255,255,255,0.88); box-shadow: 0 8px 32px rgba(0,0,0,0.10); transform: translateY(-2px); }
  
  /* Stat card */
  .stat-card { background: rgba(255,255,255,0.72); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.2s ease; cursor: default; }
  .stat-card:hover { background: rgba(255,255,255,0.92); box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-3px); }
  
  /* Row hover */
  .row-hover { transition: background 0.15s ease; }
  .row-hover:hover { background: rgba(224,108,42,0.04) !important; }
  
  /* Nav link */
  .nav-link { transition: color 0.15s, background 0.15s; }
  .nav-link:hover { color: #e06c2a !important; background: rgba(224,108,42,0.06) !important; }
  
  /* Button hover */
  .btn-primary:hover { background: #c95d1e !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(224,108,42,0.3); }
  .btn-secondary:hover { background: rgba(0,0,0,0.06) !important; }
  
  /* Notification pulse */
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  .notif-dot { animation: pulse 2s ease-in-out infinite; }
  
  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
  
  /* Input focus */
  input:focus, select:focus, textarea:focus { outline: none; border-color: #e06c2a !important; box-shadow: 0 0 0 3px rgba(224,108,42,0.12) !important; }
`;
