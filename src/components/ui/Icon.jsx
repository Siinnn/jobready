// Jeu d'icônes SVG au trait, monochromes (héritent de currentColor).
// Aucune dépendance externe, aucun emoji dans l'interface.

const PATHS = {
  // Documents & CV
  file:      'M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z',
  files:     'M9 3h6l4 4v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM5 7v12a4 4 0 0 0 4 4h8',
  download:  'M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  upload:    'M12 16V4m0 0 4 4m-4-4L8 8M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  copy:      'M9 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4M5 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z',
  trash:     'M4 7h16M9 7V4h6v3m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6',
  plus:      'M12 5v14M5 12h14',
  // Personnes & profil
  user:      'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0',
  briefcase: 'M4 8h16a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1ZM9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M3 13h18',
  cap:       'M12 4 2 9l10 5 10-5-10-5ZM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
  globe:     'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9Z',
  tools:     'M14.5 5.5a3.5 3.5 0 0 0 4.6 4.6L21 12l-9 9-3-3 9-9-1.9-1.9a3.5 3.5 0 0 0-1.6-1.6ZM6 14l4 4-3 3-4-4 3-3Z',
  star:      'M12 4l2.4 5 5.6.8-4 4 .9 5.5L12 16.7 7.1 19.3 8 13.8l-4-4L9.6 9 12 4Z',
  heart:     'M12 20s-7-4.3-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8c0 4.9-7 9.2-7 9.2Z',
  award:     'M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM8.5 13 7 21l5-2.5L17 21l-1.5-8',
  rocket:    'M14 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6-7c-5 0-8.5 2-11 5l-3 .5L4 11l3 1 2 2 1 3 2.5-2 .5-3c3-2.5 5-6 5-11Z',
  // Actions & interface
  search:    'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5.5-1.5L21 21',
  pencil:    'M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4ZM14.5 6.5l3 3',
  wand:      'M15 4V2m0 20v-2m5-8h2M4 12h2m11.7-5.7 1.4-1.4M5 19l9-9M17.7 17.7l1.4 1.4',
  check:     'M4 12.5l5 5L20 6.5',
  checkCircle:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-4-9 3 3 5-5',
  alert:     'M12 8v5m0 3.5v.5M10.3 4.2 2.6 17.5A1.5 1.5 0 0 0 3.9 20h16.2a1.5 1.5 0 0 0 1.3-2.5L13.7 4.2a2 2 0 0 0-3.4 0Z',
  info:      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v.5m0 3v5',
  eye:       'M12 5c5 0 9 7 9 7s-4 7-9 7-9-7-9-7 4-7 9-7Zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  eyeOff:    'M4 4l16 16M9.9 5.3A7.7 7.7 0 0 1 12 5c5 0 9 7 9 7a17 17 0 0 1-2.4 3.2M6.5 8.2A17 17 0 0 0 3 12s4 7 9 7c.9 0 1.7-.1 2.5-.4',
  arrowUp:   'M12 20V4m0 0 6 6m-6-6-6 6',
  arrowDown: 'M12 4v16m0 0 6-6m-6 6-6-6',
  arrowLeft: 'M20 12H4m0 0 6-6m-6 6 6 6',
  arrowRight:'M4 12h16m0 0-6-6m6 6-6 6',
  chevronDown:'M6 9l6 6 6-6',
  chevronRight:'M9 6l6 6-6 6',
  close:     'M6 6l12 12M18 6L6 18',
  mail:      'M3 7l9 6 9-6M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
  target:    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  layout:    'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm5 0v16M3 9h18',
  sliders:   'M4 7h10m4 0h2M4 12h4m4 0h8M4 17h12m4 0h0M14 5v4M8 10v4M16 15v4',
  link:      'M9.5 14.5 14.5 9.5M8 12l-2 2a3 3 0 0 0 4 4l2-2m4-4 2-2a3 3 0 0 0-4-4l-2 2',
  shield:    'M12 3l8 3v6c0 4.5-3.3 8.3-8 9-4.7-.7-8-4.5-8-9V6l8-3Zm-3 9 2.5 2.5L16 10',
  robot:     'M7 8h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Zm5 0V5M9 13v1m6-1v1M9.5 17h5M3 12v3m18-3v3',
  clock:     'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2',
}

export default function Icon({ name, size = 16, className = '', style, title, strokeWidth = 1.7 }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0, ...style }}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  )
}

export const ICON_NAMES = Object.keys(PATHS)
