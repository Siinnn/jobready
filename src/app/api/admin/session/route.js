import { NextResponse } from 'next/server'
import { checkCode, createToken, verifyToken, ADMIN_COOKIE, cookieOptions, isAdminConfigured } from '@/lib/adminAuth'

// Petite limitation de débit en mémoire : ralentit les tentatives répétées.
const attempts = new Map() // ip -> { count, until }
const MAX_ATTEMPTS = 6
const LOCK_MS = 10 * 60 * 1000

function clientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip') || 'local'
}

// GET : état de la session
export async function GET(req) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value
  const ok = await verifyToken(token)
  return NextResponse.json({
    authenticated: ok,
    configured: isAdminConfigured(),
    name: ok ? (process.env.ADMIN_NAME || 'Administrateur') : null,
  })
}

// POST : connexion
export async function POST(req) {
  if (!isAdminConfigured()) {
    return NextResponse.json({
      error: "L'espace administrateur n'est pas configuré. Renseignez ADMIN_CODE (6 caractères minimum) dans le fichier .env.local, puis relancez le serveur.",
    }, { status: 503 })
  }

  const ip = clientIp(req)
  const rec = attempts.get(ip)
  if (rec?.until && rec.until > Date.now()) {
    const min = Math.ceil((rec.until - Date.now()) / 60000)
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${min} minute${min > 1 ? 's' : ''}.` },
      { status: 429 }
    )
  }

  const { code } = await req.json().catch(() => ({}))

  if (!checkCode(code)) {
    const count = (rec?.count ?? 0) + 1
    attempts.set(ip, count >= MAX_ATTEMPTS
      ? { count: 0, until: Date.now() + LOCK_MS }
      : { count })
    const left = MAX_ATTEMPTS - count
    return NextResponse.json({
      error: left > 0
        ? `Code incorrect. ${left} tentative${left > 1 ? 's' : ''} restante${left > 1 ? 's' : ''}.`
        : 'Code incorrect. Accès bloqué temporairement.',
    }, { status: 401 })
  }

  attempts.delete(ip)
  const token = await createToken()
  const res = NextResponse.json({ ok: true, name: process.env.ADMIN_NAME || 'Administrateur' })
  res.cookies.set(ADMIN_COOKIE, token, cookieOptions)
  return res
}

// DELETE : déconnexion
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { ...cookieOptions, maxAge: 0 })
  return res
}
