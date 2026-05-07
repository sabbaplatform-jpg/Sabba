export const colors = {
  orange:     '#e06c2a',
  orangeHover:'#c95d1e',
  orangeLight:'#fff5ee',
  orangePale: '#f5e6da',
  dark:       '#1a1612',
  mid:        '#6b6660',
  muted:      '#9e9891',
  faint:      '#b0a99f',
  border:     '#ede9e1',
  bg:         '#f9f8f6',
  bgCard:     '#faf9f7',
  white:      '#ffffff',
  green:      '#2d7a4f',
  greenLight: '#f0faf4',
  amber:      '#b45309',
  amberLight: '#fff8ed',
  blue:       '#3b4fd8',
  blueLight:  '#f0f4ff',
};

export const font = {
  display: "'DM Serif Display', serif",
  body:    "'DM Sans', 'Helvetica Neue', sans-serif",
};

export const statusStyle = (status) => {
  const map = {
    approved:      { bg: '#f0faf4', text: '#2d7a4f', dot: '#2d7a4f' },
    confirmed:     { bg: '#f0faf4', text: '#2d7a4f', dot: '#34d399' },
    live:          { bg: '#f0faf4', text: '#2d7a4f', dot: '#2d7a4f' },
    pending:       { bg: '#fff8ed', text: '#b45309', dot: '#f59e0b' },
    draft:         { bg: '#f4f2ee', text: '#9e9891', dot: '#b0a99f' },
    cancelled:     { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
    'under review':{ bg: '#f0f4ff', text: '#3b4fd8', dot: '#6574f8' },
  };
  return map[status?.toLowerCase()] || map.pending;
};
