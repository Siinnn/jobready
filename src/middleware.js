import { NextResponse } from 'next/server'
import { verifyToken, ADMIN_COOKIE } from '@/lib/adminAuth'

// Pages et routes API réservées à l'administrateur.
// Les demandeurs d'emploi n'ont accès qu'aux modules CV et lettres.
const PROTECTED_PAGES = ['/dashboard', '/offer-analyzer', '/admin/offres']
const PROTECTED_APIS  = ['/api/search-jobs', '/api/fetch-offer', '/api/analyze-offer', '/api/adapt-cv']

export async function middleware(req) {
  const { pathname } = req.nextUrl
  const isPage = PROTECTED_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isApi  = PROTECTED_APIS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isPage && !isApi) return NextResponse.next()

  const ok = await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)
  if (ok) return NextResponse.next()

  if (isApi) {
    return NextResponse.json(
      { error: 'Accès réservé à l\'administrateur.' },
      { status: 403 }
    )
  }

  // Page protégée : renvoi vers la connexion admin, en mémorisant la destination
  const url = req.nextUrl.clone()
  url.pathname = '/admin'
  url.search = `?suivant=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/offer-analyzer/:path*',
    '/admin/offres/:path*',
    '/api/search-jobs/:path*',
    '/api/fetch-offer/:path*',
    '/api/analyze-offer/:path*',
    '/api/adapt-cv/:path*',
  ],
}
