// Custom designed SVG icons for chat — no emoji, no Unicode symbols

const icons = {
  chat: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 17l3-3h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="8.5" r="1" fill="currentColor"/>
      <circle cx="10" cy="8.5" r="1" fill="currentColor"/>
      <circle cx="13" cy="8.5" r="1" fill="currentColor"/>
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="13" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 10v4M13 10v4M7 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  code: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M6 6L2 10l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.5 4l-3 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M11 2L4 11h7l-2 7 9-10h-7l2-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  target: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="1" fill="currentColor"/>
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 4l2 6-6 2 6-2 2 6-2-6 6-2-6 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  circuit: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="4" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="16" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="4" cy="16" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="16" cy="16" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5.5 4h3M11.5 4h3M5.5 16h3M11.5 16h3M4 5.5v3M4 11.5v3M16 5.5v3M16 11.5v3M8 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="14" r="1.5" fill="currentColor"/>
    </svg>
  ),
  key: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10.5 10.5l7 7M14.5 14.5l-2 2M17.5 14.5l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="8" r="1.5" fill="currentColor"/>
    </svg>
  ),
  infinity: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M7 10c0-2 1.5-4 3-4s3 4 5 4 3-4 5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 10c0 2-1.5 4-3 4s-3-4-5-4-3 4-5 4-3-2-3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  hexagon: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 2l7 4v8l-7 4-7-4V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 2v4M3 6l6 4M17 6l-6 4M3 14l6-4M17 14l-6-4M10 18v-4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M3 10h14M13 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  atom: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
      <ellipse cx="10" cy="10" rx="8" ry="3.5" stroke="currentColor" strokeWidth="1.2"/>
      <ellipse cx="10" cy="10" rx="8" ry="3.5" stroke="currentColor" strokeWidth="1.2" transform="rotate(60 10 10)"/>
      <ellipse cx="10" cy="10" rx="8" ry="3.5" stroke="currentColor" strokeWidth="1.2" transform="rotate(120 10 10)"/>
    </svg>
  ),
  dna: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M7 2c3 3 3 6 0 8s-3 5 0 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13 2c-3 3-3 6 0 8s3 5 0 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8.5 6h3M7.5 10h5M8.5 14h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2c-2 3-2 10 0 16M10 2c2 3 2 10 0 16" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2 10h16M3 6h14M3 14h14" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 8l3 2.5L5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12.5 12.5l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 8.5h5M8.5 6v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M5 2h10a1 1 0 011 1v15l-6-4-6 4V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="12" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  music: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M8 16V5l9-2v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="5.5" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="14.5" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  cube: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 2l8 4.5v7L10 18l-8-4.5v-7L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 2v16M2 6.5l8 5 8-5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  triangle: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 2L18 17H2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 7v5M10 14v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  vortex: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 10m-1 0a1 1 0 102 0 1 1 0 10-2 0" fill="currentColor"/>
      <path d="M10 7a3 3 0 013 3 5 5 0 01-5 5 7 7 0 01-7-7 9 9 0 019-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 18c-4 0-6-3-6-6 0-4 4-6 4-10 2 2 2 4 4 4 0-1 0-2 2-3 0 4 4 5 4 9 0 3-4 6-8 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 18c-2 0-3-1.5-3-3 0-2 2-3 2-3 1 2 3 2 3 3 0 1.5-1 3-2 3z" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M2 10c1.5-3 3-4 4.5-4S9 8.5 10 10s2.5 4 4 4 3-2.5 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 14c1.5-1.5 3-2 4.5-2S9 13 10 14s2.5 2 4 2 3-1.5 4-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <path d="M2 6c1.5-1.5 3-2 4.5-2S9 5 10 6s2.5 2 4 2 3-1.5 4-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  gem: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M6 3h8l4 5-8 9-8-9 4-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 8h16M6 3l4 5 4-5M10 8l-8 9M10 8l8 9" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  satellite: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="8" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" transform="rotate(45 10 10)"/>
      <path d="M5 5l-3-3M15 15l3 3M15 5l3-3M5 15l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 10a7 7 0 017-7M10 17a7 7 0 007-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  ),
  flask: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M7 2h6M8 2v6L4 16a2 2 0 002 2h8a2 2 0 002-2L12 8V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 14h4M9 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  antenna: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 10L10 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 10L4 17M10 10L16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 4a7 7 0 0110 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M7.5 6a3 3 0 015 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
}

export const ICON_KEYS = Object.keys(icons)

export default function ChatIcon({ name = 'chat', size = 16, color = 'currentColor' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color, flexShrink: 0 }}>
      {icons[name] ?? icons.chat}
    </span>
  )
}
