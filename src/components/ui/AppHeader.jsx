'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Icon from '@/components/ui/Icon'

// Navigation des demandeurs d'emploi : CV, lettres, guide, offres (France Travail).
// `variant` applique le code couleur de l'univers correspondant.
const NAV = [
  { href: '/mes-cv',      label: 'Mes CV',      icon: 'files',  variant: 'nav-link-cv',
    match: ['/mes-cv', '/creer', '/editeur', '/importer'] },
  { href: '/mes-lettres', label: 'Mes lettres', icon: 'mail',   variant: 'nav-link-letter',
    match: ['/mes-lettres', '/lettres'] },
  { href: '/guide-ats',   label: 'Guide ATS',   icon: 'shield' },
  { href: '/offres',      label: 'Offres',      icon: 'search' },
  { href: '/transfert',   label: 'Transfert',   icon: 'copy' },
]

export default function AppHeader({ actions, compact = false }) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const [isAdmin, setIsAdmin] = useState(false)

  // L'entrée « Administration » n'apparaît que si une session admin est active
  useEffect(() => {
    let alive = true
    fetch('/api/admin/session')
      .then(r => r.json())
      .then(j => { if (alive) setIsAdmin(!!j.authenticated) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const items = isAdmin
    ? [...NAV, { href: '/dashboard', label: 'Administration', icon: 'shield' }]
    : NAV

  return (
    <header className="sticky top-0 z-20 bg-white" style={{ borderBottom: '1px solid var(--c-border)' }}>
      <div className={`${compact ? 'max-w-full px-4' : 'max-w-6xl mx-auto px-6'} h-14 flex items-center justify-between gap-4`}>
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5 shrink-0" title="Accueil">
          <span className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>JR</span>
          <span className="font-semibold text-[15px]" style={{ color: 'var(--c-ink)' }}>JobReady</span>
        </button>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {items.map(item => {
            const active = isActive(item, pathname)
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                className={`nav-link ${item.variant || ''} ${active ? 'nav-link-active' : ''}`}
                aria-current={active ? 'page' : undefined}>
                <Icon name={item.icon} size={15} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {actions ?? (
            <button onClick={() => router.push('/creer')} className="btn-primary">
              <Icon name="plus" size={15} /> Nouveau CV
            </button>
          )}
        </div>
      </div>

      {/* Navigation repliée sur mobile */}
      <nav className="md:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto"
        style={{ borderTop: '1px solid var(--c-border)' }}>
        {items.map(item => {
          const active = isActive(item, pathname)
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`nav-link !px-2.5 !py-1.5 !text-xs whitespace-nowrap ${item.variant || ''} ${active ? 'nav-link-active' : ''}`}>
              <Icon name={item.icon} size={13} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}

// Une entrée reste active sur toutes les pages de son univers
// (ex. « Mes CV » l'est aussi sur /creer, /editeur et /importer).
function isActive(item, pathname) {
  const paths = item.match || [item.href]
  return paths.some(p => pathname === p || pathname.startsWith(p + '/'))
}
